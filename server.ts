import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import admin from 'firebase-admin';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import { 
  getFirestore as getFirestoreClient, 
  collection as collectionClient, 
  getDocs as getDocsClient, 
  doc as docClient, 
  updateDoc as updateDocClient, 
  getDoc as getDocClient,
  query as queryClient,
  where as whereClient,
  serverTimestamp as firestoreTimestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Client for server-side use (using API Key)
const clientApp = initializeApp(firebaseConfig);
const db = getFirestoreClient(clientApp, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Admin for background tasks (bypasses security rules)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}
const dbAdmin = getFirestoreAdmin(admin.app(), firebaseConfig.firestoreDatabaseId);

console.log('📡 Firebase Client & Admin initialized for project:', firebaseConfig.projectId);

// Initialize Gemini with validation (DEPRECATED ON SERVER PER SKILL)
const getAI = () => {
  return null; // AI extraction moved to frontend
};

const ai = getAI();

async function scrapeProductData(url: string) {
  try {
    const host = new URL(url).hostname;
    const response = await axios.get(url, {
      timeout: 45000,
      maxRedirects: 10,
      validateStatus: () => true, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'hy-AM,hy;q=0.9,en-US;q=0.8',
        'Referer': host.includes('viva') ? 'https://www.google.com/' : `https://${host}/`,
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1'
      }
    });

    if (response.status >= 400) {
      console.warn(`Scraper encountered status ${response.status} for ${url}`);
      // If it's a 4xx/5xx but we have body, we try to parse it anyway (some sites incorrectly return 500)
    }

    const $ = cheerio.load(response.data);
    
    // 1. Try JSON-LD
    let ldData: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const json = JSON.parse(content);
          const items = Array.isArray(json) ? json : [json];
          for (const item of items) {
             const type = item['@type'];
             if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
               ldData = item;
               break;
             }
          }
        }
      } catch (e) {}
    });

    if (ldData) {
      const offers = Array.isArray(ldData.offers) ? ldData.offers[0] : ldData.offers;
      const price = parseFloat(offers?.price) || 0;
      
      // Extract specs from JSON-LD if available
      const specs: Record<string, string> = {};
      if (ldData.additionalProperty) {
         const props = Array.isArray(ldData.additionalProperty) ? ldData.additionalProperty : [ldData.additionalProperty];
         props.forEach((p: any) => {
            if (p.name && p.value) specs[p.name] = String(p.value);
         });
      }

      if (price > 0) {
        return {
          name: ldData.name || $('title').text(),
          price: price,
          currency: offers?.priceCurrency || 'AMD',
          image: Array.isArray(ldData.image) ? ldData.image[0] : (ldData.image?.url || ldData.image || ''),
          description: ldData.description || '',
          specifications: specs
        };
      }
    }

    // 1.2 Table/List Specs Extraction
    const specifications: Record<string, string> = {};
    const skipKeys = ['фото', 'описание', 'цена', 'отзывы', 'характеристики', 'նկարագրություն', 'գին', 'description', 'price', 'reviews'];
    
    $('table tr, .product-info-main .additional-attributes tr, .spec-table tr').each((_, el) => {
       let key = $(el).find('th, td:first-child, [data-th]').attr('data-th') || 
                   $(el).find('th, td:first-child').text().trim().replace(/:$/, '');
       let value = $(el).find('td:last-child, .col.data').text().trim();
       
       if (key && value && key !== value && key.length < 100 && value.length < 1000) {
          const lowerKey = key.toLowerCase();
          if (!skipKeys.some(sk => lowerKey.includes(sk))) {
            specifications[key] = value;
          }
       }
    });

    if (Object.keys(specifications).length === 0) {
       $('.product-features-list li, .characteristics-list li, .attributes-list li, .spec-item').each((_, el) => {
          const text = $(el).text().trim();
          if (text.includes(':')) {
             const [k, v] = text.split(':');
             if (k && v && k.length < 50) specifications[k.trim()] = v.trim();
          } else {
             const k = $(el).find('.label, .name').text().trim();
             const v = $(el).find('.value').text().trim();
             if (k && v) specifications[k] = v;
          }
       });
    }

    // 1.5. Improved Heuristics for Armenian Stores
    const hostname = new URL(url).hostname;
    let priceText = '';
    
    if (hostname.includes('zigzag.am')) {
      priceText = $('[data-price-type="finalPrice"] .price, .final-price .price').first().text();
    } else if (hostname.includes('vega.am')) {
      priceText = $('.price-wrapper .price, .final-price, .special-price .price').first().text();
    } else if (hostname.includes('vlv.am')) {
      priceText = $('.regular-price .price, .special-price .price').first().text();
    } else if (hostname.includes('mobilecentre.am')) {
      priceText = $('.price, .current-price, .item_price').first().text();
    } else if (hostname.includes('ideal.am')) {
      priceText = $('.product-price .price').first().text();
    } else if (hostname.includes('yerevan-mobile.am')) {
      priceText = $('.price-block .price').first().text();
    } else if (hostname.includes('eldorado.am')) {
      priceText = $('.price__current, .product-price').first().text();
    } else if (hostname.includes('vivaelectronics.am')) {
      // In Viva, special price is the current one, regular is old
      const specialPrice = $('.product-info-main .special-price .price').first().text() || 
                           $('.product-info-main [data-price-type="finalPrice"] .price').first().text() ||
                           $('[data-price-amount]').first().text();
      
      if (specialPrice) {
        priceText = specialPrice;
      } else {
        priceText = $('.product-info-main .price-wrapper .price, [data-price-type="finalPrice"]').first().text();
      }
    } else if (hostname.includes('globing.com')) {
      priceText = $('.price-value, .item-price').first().text();
    }

    if (!priceText) {
      // UNIVERSAL FALLBACKS: Meta tags, Microdata, and common classes for all niches
      priceText = $('[property="product:price:amount"]').attr('content') || 
                  $('[itemprop="price"]').attr('content') ||
                  $('meta[name="twitter:data1"]').attr('content') || 
                  $('[data-price-amount]').first().attr('data-price-amount') ||
                  $('[data-price-amount]').first().text() ||
                  $('.price, .current-price, .product-price, .amount, .final-price, .special-price, .price-new, .price-item, .price-container').first().text();
    }

    // 1.8 Availability Detection
    const outOfStockKeywords = [
      'нет в наличии', 'закончился', 'ожидается', 'сообщить о поступлении', 'out of stock',
      'առկա չէ', 'վերջացել է', 'չկա', 'պատվերով', 'outstock', 'sold out', 'not available',
      'զամբյուղում չկա', 'ժամանակավորապես բացակայում է'
    ];
    
    const bodyText = (response.data as string).toLowerCase();
    const availabilityText = $('.availability, .stock, .in-stock, .out-of-stock, .product-info-stock-sku, .inventory_status, .status-label, .product-availability').text().toLowerCase();
    
    let isOutOfStock = false;
    
    // Check specific availability element first
    if (availabilityText) {
      if (outOfStockKeywords.some(k => availabilityText.includes(k))) {
        isOutOfStock = true;
      }
    }
    
    // Check globally if no specific element is found or clear
    if (!isOutOfStock) {
       // Look for checkout button absence or disabled state
       const cartButton = $('button#product-addtocart-button, .add-to-cart, #add-to-cart, .buy-now, [class*="add-to-cart"], .order-btn');
       if (cartButton.length === 0 || cartButton.prop('disabled') || cartButton.hasClass('disabled') || cartButton.text().toLowerCase().includes('ожидается')) {
            isOutOfStock = true;
       }
    }

    if (priceText) {
      // Extract Old Price if present (Discount)
      let oldPriceText = '';
      if (hostname.includes('vivaelectronics.am')) {
        oldPriceText = $('.product-info-main .old-price .price').first().text() || 
                       $('.product-info-main [data-price-type="oldPrice"] .price').first().text() ||
                       $('.product-info-main .price-strike').text() ||
                       $('[data-price-type="oldPrice"]').text();
      } else if (hostname.includes('zigzag.am')) {
        oldPriceText = $('.old-price .price, .price-strike').first().text();
      } else if (hostname.includes('vega.am')) {
        oldPriceText = $('.old-price, .price-strike, .regular-price').first().text();
      } else if (hostname.includes('mobilecentre.am')) {
        oldPriceText = $('.old-price, .strike-price').first().text();
      } else if (hostname.includes('eldorado.am')) {
        oldPriceText = $('.old-price, .price-strike, .regular-price:not(.final)').first().text();
      } else if (hostname.includes('vlv.am')) {
        oldPriceText = $('.old-price, .price-strike').first().text();
      }
      
      if (!oldPriceText) {
        oldPriceText = $('[itemprop="highPrice"]').attr('content') || 
                       $('.old-price, .strike, .regular-price:not(.final), .price-old, .base-price').first().text();
      }

      // Clean up price: handle standard Armenian formatting
      const parsePrice = (txt: string) => {
        if (!txt) return 0;
        // Remove known currency symbols and typical junk
        let clean = txt.trim().replace(/[֏₽$€AMDդրամ\s]/g, '');
        
        // Handle Armenian/Russian standard formats like "19.900" or "19 900" or "19,900"
        // If there is exactly one separator (. or ,) followed by 3 digits, it's a thousand separator
        if (/^\d+[.,]\d{3}$/.test(clean)) {
          clean = clean.replace(/[.,]/g, '');
        } else if (/^\d+ \d{3}$/.test(clean)) {
          clean = clean.replace(/ /g, '');
        }
        
        // General cleaning: keep only digits, and maybe a single dot for decimals if it looks like it
        const match = clean.match(/(\d+[\d\s.,]*)/);
        if (!match) return 0;
        
        let digitsOnly = match[1].replace(/\s/g, '');
        
        // If it's a large number with dots/commas, highly likely these are thousand separators in AMD context
        if (digitsOnly.includes('.') || digitsOnly.includes(',')) {
          // If the last separator has 3 digits after it, it's definitely a thousand separator
          const lastSep = Math.max(digitsOnly.lastIndexOf('.'), digitsOnly.lastIndexOf(','));
          const afterSep = digitsOnly.substring(lastSep + 1);
          if (afterSep.length === 3) {
            digitsOnly = digitsOnly.replace(/[.,]/g, '');
          } else {
            // Otherwise, replace commas with dots and try to parse as float
            digitsOnly = digitsOnly.replace(/,/g, '.');
          }
        }
        
        return Math.floor(parseFloat(digitsOnly)) || 0;
      };

      const price = parsePrice(priceText);
      const oldPrice = parsePrice(oldPriceText);

      if (price > 0) {
        // Try to identify model/type from specifications
        let model = '';
        let type = '';
        
        Object.entries(specifications).forEach(([k, v]) => {
           const lowK = k.toLowerCase();
           if (lowK.includes('модель') || lowK.includes('model') || lowK.includes('մոդել')) model = v;
           if (lowK.includes('тип') || lowK.includes('type') || lowK.includes('տեսակ')) type = v;
        });

        return {
          name: $('h1').first().text() || $('meta[property="og:title"]').attr('content') || $('title').text(),
          model: model,
          type: type,
          price: price,
          oldPrice: oldPrice > price ? oldPrice : 0,
          currency: 'AMD',
          inStock: !isOutOfStock,
          image: $('meta[property="og:image"]').attr('content') || 
                 $('meta[name="twitter:image"]').attr('content') ||
                 $('[itemprop="image"]').attr('src') ||
                 $('[itemprop="image"]').attr('content') ||
                 $('.gallery-placeholder__image, .product-image-photo, .product-main-image img, #main-image, [data-gallery-role="main-canvas"] img, .fotorama__img').first().attr('src') ||
                 $('.images img, .main-image img, .product-image img, .gallery-image').first().attr('src') || '',
          description: $('.product-info-main .short-description').text().trim() || 
                       $('#description, .product.attribute.description').text().trim() ||
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || '',
          specifications: specifications
        };
      }
    }
    
    // 2. Last Resort: Heuristic Scrape (No AI on server)
    const title = $('h1').first().text() || $('title').text();
    const ogImage = $('meta[property="og:image"]').attr('content');
    
    return {
      name: title,
      price: 0, 
      inStock: !isOutOfStock,
      image: ogImage || '',
      description: $('meta[name="description"]').attr('content') || '',
      specifications: specifications
    };
  } catch (error) {
    console.error('Scraping error details:', error);
    throw error;
  }
}

// Background sync loop
let syncInterval: NodeJS.Timeout | null = null;

async function runSync() {
  console.log('🔄 Starting scheduled price sync (Client Mode)...');
  try {
    const settingsSnap = await getDocClient(docClient(db, 'settings', 'sync'));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { frequency: 180 };
    
    // Fetch all stores once for logo lookup
    const storesSnap = await getDocsClient(collectionClient(db, 'stores'));
    const storeMap: Record<string, any> = {};
    storesSnap.docs.forEach(doc => {
      storeMap[doc.id] = doc.data();
    });

    const productsSnap = await getDocsClient(collectionClient(db, 'products'));
    
    for (const productDoc of productsSnap.docs) {
      try {
        const productId = productDoc.id;
        
        // Skip reserved/invalid IDs
        if (productId.includes('___') || productId.length > 100) continue;

        const offersSnap = await getDocsClient(collectionClient(db, `products/${productId}/offers`));
        const existingData = productDoc.data();
        let offersData: any[] = offersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 1. Fresh scraping
        for (const offerData of offersData) {
          if (offerData.url) {
            try {
              const scraped = await scrapeProductData(offerData.url);
              if (scraped && (scraped.price > 0)) {
                const currentPrice = Number(scraped.price);
                const isInStock = scraped.inStock !== false;
                await updateDocClient(docClient(db, `products/${productId}/offers`, offerData.id), {
                  price: currentPrice,
                  inStock: isInStock,
                  lastUpdated: firestoreTimestamp()
                });
                offerData.price = currentPrice;
                offerData.inStock = isInStock;
              }
            } catch (e) {
              console.log(`⚠️ Sync failed for ${offerData.id}`);
            }
          }
        }

        // 2. Calculate min price and prepare update
        let minPriceFound = Infinity;
        let validOffers = [];
        for (const offer of offersData) {
          const p = Number(offer.price);
          if (p > 0 && offer.inStock !== false) {
            validOffers.push(offer);
            if (p < minPriceFound) minPriceFound = p;
          }
        }

        if (minPriceFound !== Infinity) {
          const updates: any = { 
            mainPrice: minPriceFound,
            price: minPriceFound,
            storeCount: validOffers.length,
            storeLogos: validOffers
              .map(o => {
                if (o.storeLogo) return o.storeLogo;
                if (o.storeId && storeMap[o.storeId]) return storeMap[o.storeId].logo;
                return null;
              })
              .filter(l => l)
              .slice(0, 3),
            updatedAt: firestoreTimestamp()
          };

          if (existingData.mainPrice && (existingData.mainPrice > minPriceFound)) {
            updates.oldPrice = existingData.mainPrice;
          } else if (existingData.oldPrice && existingData.oldPrice <= minPriceFound) {
            updates.oldPrice = 0;
          }

          await updateDocClient(docClient(db, 'products', productId), updates);

          // Check for price alerts using Client SDK (allowed by modified rules)
          const qAlerts = queryClient(
            collectionClient(db, 'price_alerts'), 
            whereClient('productId', '==', productId),
            whereClient('isActive', '==', true)
          );
          const alertsSnap = await getDocsClient(qAlerts);
          
          for (const alertDoc of alertsSnap.docs) {
            const alertData = alertDoc.data();
            if (minPriceFound <= alertData.targetPrice) {
              console.log(`🔔 ALERT TRIGGERED for ${alertData.email}: ${productId} is now ${minPriceFound} (Target: ${alertData.targetPrice})`);
              await updateDocClient(docClient(db, 'price_alerts', alertDoc.id), {
                isActive: false,
                triggeredAt: firestoreTimestamp(),
                lastKnownPrice: minPriceFound
              });
            }
          }
        }
      } catch (err: any) {
        console.error(`❌ Sync error for product ${productDoc.id}:`, err.message);
        // Continue to next product
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Run sync every 3 minutes as requested
setInterval(runSync, 3 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  
  // GitHub OAuth Routes
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GitHub Client ID not configured' });
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user repo',
      state: Math.random().toString(36).substring(7)
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('Missing required OAuth parameters');
    }

    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('No access token received from GitHub');
      }

      // Fetch user data to get username
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken}` }
      });

      const githubUser = userResponse.data;

      // Send success message to parent window and close popup
      // We pass the token and user info to the client
      res.send(`
        <html>
          <body style="background: #050816; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center;">
              <h2 style="color: #C5A059;">Authentication Successful</h2>
              <p>Closing window and synchronizing...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'GITHUB_AUTH_SUCCESS', 
                    accessToken: '${accessToken}',
                    user: ${JSON.stringify({ login: githubUser.login, avatar_url: githubUser.avatar_url })}
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/admin/my-codes';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('GitHub OAuth error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  app.post('/api/admin/scrape-store-categories', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    try {
      const host = new URL(url).hostname;
      const origin = new URL(url).origin;

      const response = await axios.get(url, {
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
      });

      const $ = cheerio.load(response.data);
      const categories = new Set<any>();

      $('a').each((_, el) => {
        let href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href || text.length < 2) return;

        // Clean href
        href = href.split('#')[0].split('?')[0];
        if (!href || href === url || href === url + '/') return;

        if (href.startsWith('/')) {
          href = origin + href;
        } else if (!href.startsWith('http')) {
          return;
        }

        try {
          if (new URL(href).hostname !== host) return;
        } catch (e) { return; }

        const lower = href.toLowerCase();
        const lowerText = text.toLowerCase();
        
        // Broad Armenian keywords for all sectors
        const amKeywords = [
          'հեռախոս', 'համակարգիչ', 'պլանշետ', 'հեռուստացույց', 'տեխնիկա', 'կենցաղային', 
          'դեղատուն', 'դեղորայք', 'խնամք', 'հագուստ', 'կոշիկ', 'նորույթ', 'ակցիա', 'սնունդ',
          'գեղեցկություն'
        ];
        // Russian/English keywords for deep discovery
        const geoKeywords = [
          'kotigor', 'catalog', 'category', '/c/', 'telefon', 'smart', 'apteka', 'lek', 'odejda',
          'applianc', 'laptop', 'fashion', 'beauty', 'health', 'food'
        ];

        const isAmCat = amKeywords.some(k => lowerText.includes(k));
        const isGeoCat = geoKeywords.some(k => lower.includes(k) || lowerText.includes(k));
        const isCatPath = ['category', 'catalog', '/c/', '/category/'].some(p => lower.includes(p));
        const isCommonCat = ['menu', 'nav', 'list'].some(p => lower.includes(p));

        // If it's in a list or nav, and text is short, it's likely a category
        const isInNav = $(el).closest('nav, header, aside, .menu, .nav, .navigation, .categories, .sidebar').length > 0;
        const shortText = text.length > 2 && text.length < 40;

        // Magento specific Category patterns:
        const isMagentoCat = $(el).hasClass('level-top') || $(el).closest('.nav-item').length > 0;
        const isNopCommerceCat = $(el).closest('.category-navigation').length > 0 || $(el).closest('.top-menu').length > 0;
        const isVivaCat = $(el).closest('.megamenu').length > 0 || $(el).closest('.category-item').length > 0;

        if (isCatPath || isCommonCat || isAmCat || isGeoCat || (isInNav && shortText) || isMagentoCat || isNopCommerceCat || isVivaCat) {
          categories.add(JSON.stringify({ name: text, url: href }));
        }
      });

      const catList = Array.from(categories).map(s => JSON.parse(s));
      res.json({ categories: catList.slice(0, 50) });
    } catch (error) {
      console.error('Store category finder error:', error);
      res.status(500).json({ error: 'Failed to scan site for categories' });
    }
  });

  // Category Scraper API: Finds product links on a page
  app.post('/api/admin/scrape-category', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    try {
      const host = new URL(url).hostname;
      const origin = new URL(url).origin;

      const response = await axios.get(url, {
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Referer': origin
        }
      });

      const $ = cheerio.load(response.data);
      const items: any[] = [];
      const seenUrls = new Set<string>();

      // Better heuristic: look for product containers
      const containers = $('.product-item, .item, .product, [class*="product-card"], [class*="product-item"], .product-inner, .product-layout');
      
      if (containers.length > 0) {
        containers.each((_, el) => {
          const $el = $(el);
          let link = $el.find('a').attr('href');
          if (!link) return;

          link = link.split('#')[0].split('?')[0];
          if (link.startsWith('/')) link = origin + link;
          if (!link.startsWith('http') || new URL(link).hostname !== host || seenUrls.has(link)) return;

          const name = $el.find('.product-name, .name, [class*="name"], .product-item-link, h2, h3').first().text().trim();
          const price = $el.find('.price, [class*="price"], .final-price').first().text().trim();
          const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');

          if (name && link.length > 5) {
            seenUrls.add(link);
            items.push({ 
              name, 
              url: link, 
              price: price || '0', 
              image: image?.startsWith('/') ? origin + image : image 
            });
          }
        });
      }

      // Fallback for non-container layouts
      if (items.length < 5) {
        $('a').each((_, el) => {
          let href = $(el).attr('href');
          if (!href) return;

          href = href.split('#')[0].split('?')[0];
          if (!href || href.length < 5 || href === url) return;

          if (href.startsWith('/')) {
            href = origin + href;
          } else if (!href.startsWith('http')) {
            return;
          }

          if (new URL(href).hostname !== host || seenUrls.has(href)) return;

          const lower = href.toLowerCase();
          if (lower.includes('contact') || lower.includes('about') || lower.includes('login') || 
              lower.includes('cart') || lower.includes('checkout') || lower.includes('category') ||
              lower.includes('search') || lower.includes('policy') || lower.includes('terms')) return;

          const path = new URL(href).pathname;
          const segments = path.split('/').filter(Boolean);
          
          if (segments.length >= 2 || lower.includes('product') || lower.includes('item') || lower.includes('/p/')) {
            const text = $(el).text().trim();
            if (text.length > 10) {
              seenUrls.add(href);
              items.push({ name: text, url: href, price: '0' });
            }
          }
        });
      }

      res.json({ links: items.slice(0, 150) }); 
    } catch (error) {
      console.error('Category scraping error:', error);
      res.status(500).json({ error: 'Failed to scan category page' });
    }
  });

  // Real Scraper API
  app.post('/api/admin/scrape-product', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    try {
      const data = await scrapeProductData(url);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to scrape product data' });
    }
  });

  // Targeted Sync API (Admin)
  app.post('/api/admin/sync-product', async (req, res) => {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });
    
    try {
      const productRef = docClient(db, 'products', productId);
      const productSnap = await getDocClient(productRef);
      if (!productSnap.exists()) return res.status(404).json({ error: 'Product not found' });
      const existingData = productSnap.data();

      // Fetch all stores once for logo lookup
      const storesSnap = await getDocsClient(collectionClient(db, 'stores'));
      const storeMap: Record<string, any> = {};
      storesSnap.docs.forEach(doc => {
        storeMap[doc.id] = doc.data();
      });

      const offersSnap = await getDocsClient(collectionClient(db, `products/${productId}/offers`));
      let offersData: any[] = offersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      for (const offerData of offersData) {
        if (offerData.url) {
          try {
            const scraped = await scrapeProductData(offerData.url);
            if (scraped && scraped.price > 0) {
              const currentPrice = Number(scraped.price);
              const isInStock = scraped.inStock !== false;
              await updateDocClient(docClient(db, `products/${productId}/offers`, offerData.id), {
                price: currentPrice,
                inStock: isInStock,
                lastUpdated: firestoreTimestamp()
              });
              offerData.price = currentPrice;
              offerData.inStock = isInStock;
            }
          } catch (e) {
            console.error(`Error syncing offer ${offerData.id}:`, e);
          }
        }
      }

      let minPriceFound = Infinity;
      let validOffers = [];
      for (const offer of offersData) {
        const p = Number(offer.price);
        if (p > 0 && offer.inStock !== false) {
          validOffers.push(offer);
          if (p < minPriceFound) minPriceFound = p;
        }
      }

      if (minPriceFound !== Infinity) {
        const updates: any = { 
          mainPrice: minPriceFound,
          price: minPriceFound,
          storeCount: validOffers.length,
          storeLogos: validOffers
            .map(o => {
              if (o.storeLogo) return o.storeLogo;
              if (o.storeId && storeMap[o.storeId]) return storeMap[o.storeId].logo;
              return null;
            })
            .filter(l => l)
            .slice(0, 3),
          updatedAt: firestoreTimestamp()
        };

        if (existingData.mainPrice && (existingData.mainPrice > minPriceFound)) {
          updates.oldPrice = existingData.mainPrice;
        } else if (existingData.oldPrice && existingData.oldPrice <= minPriceFound) {
          updates.oldPrice = 0;
        }

        await updateDocClient(productRef, updates);
      }

      res.json({ success: true, message: `Product ${productId} synced`, minPrice: minPriceFound });
    } catch (error) {
      console.error('Admin Sync API failed:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Targeted Sync API (Public/Legacy)
  app.post('/api/sync/product/:id', async (req, res) => {
    const productId = req.params.id;
    console.log('🔄 Checking sync for product:', productId);
    console.log('🔑 Target Project:', firebaseConfig.projectId);
    
    try {
      const productRef = docClient(db, 'products', productId);
      const productSnap = await getDocClient(productRef);
      if (!productSnap.exists()) return res.status(404).json({ error: 'Product not found' });

      const offersSnap = await getDocsClient(collectionClient(db, `products/${productId}/offers`));
      let bestPrice = Infinity;

      for (const offerDoc of offersSnap.docs) {
        const offerData = offerDoc.data();
        if (offerData.url) {
          try {
            const scraped = await scrapeProductData(offerData.url);
            if (scraped && scraped.price > 0) {
              await updateDocClient(docClient(db, `products/${productId}/offers`, offerDoc.id), {
                price: Number(scraped.price),
                lastUpdated: firestoreTimestamp()
              });
              if (Number(scraped.price) < bestPrice) bestPrice = Number(scraped.price);
            }
          } catch (e) {
            console.error(`Error syncing offer ${offerDoc.id}:`, e);
          }
        }
      }

      if (bestPrice !== Infinity) {
        await updateDocClient(productRef, { mainPrice: bestPrice });
      }

      res.json({ success: true, message: 'Product prices synced' });
    } catch (error) {
      console.error('API Sync failed:', error);
      res.status(500).json({ error: 'Failed to sync product prices' });
    }
  });

  // Manual Sync trigger
  app.post('/api/admin/sync-now', async (req, res) => {
    runSync(); // Run in background
    res.json({ message: 'Sync started' });
  });

  // Mock Currency API
  app.get('/api/currency/rates', (req, res) => {
    res.json({
      AMD: 1,
      RUB: 5.12,
      USD: 394.50,
      timestamp: Date.now()
    });
  });

  // Text Proxy for client-side AI extraction
  app.post('/api/proxy/text', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    try {
      const response = await axios.get(url, {
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'hy-AM,hy;q=0.9,en-US;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });
      const $ = cheerio.load(response.data);
      
      // Preserve breadcrumbs as they often contain the real product name
      const breadcrumbsText = $('.breadcrumbs, .breadcrumb, .b-breadcrumbs').text().trim();
      
      $('script, style, iframe, svg, noscript, .social-links, .navigation-bar, footer').remove();
      
      // Try to find the main content block
      const mainContent = $('.main, main, #main, .product-info, .product-detail, #content, .product-view, .product-essential, .item-details, .product-single').first();
      
      let bodyText = '';
      if (mainContent.length > 0) {
        bodyText = mainContent.text();
      } else {
        // If no main content found, remove obvious clutter and take body
        $('nav, header, aside, .header, .footer, .menu').remove();
        bodyText = $('body').text();
      }
      
      const finalResult = (breadcrumbsText ? `BREADCRUMBS: ${breadcrumbsText}\n\n` : '') + bodyText;
      const cleanedText = finalResult.replace(/\s+/g, ' ').trim().slice(0, 25000);
      
      res.json({ text: cleanedText });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', syncActive: true, uptime: process.uptime() });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
