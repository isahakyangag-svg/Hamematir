import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit,
  Package,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  Wand2,
  Download,
  Upload,
  X,
  PlusCircle,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  ChevronDown,
  Brain,
  Check
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  nameRu?: string;
  nameAm?: string;
  nameEn?: string;
  model?: string;
  type?: string;
  description: string;
  descRu?: string;
  descAm?: string;
  descEn?: string;
  brandId?: string;
  storeId?: string;
  categoryId: string;
  image: string;
  mainPrice?: number;
  price?: number;
  oldPrice?: number;
  discount?: number;
  isWarranty?: boolean;
  sourceUrl?: string;
  searchKeywords: string[];
  specifications?: Record<string, string>;
  isVisible?: boolean;
}

const getAI = () => {
  const apiKey = (process.env as any).GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const AdminProducts: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isMagicAdding, setIsMagicAdding] = useState(false);
  const [isMagicCatAdding, setIsMagicCatAdding] = useState(false);
  const [magicUrl, setMagicUrl] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [isFullSiteMode, setIsFullSiteMode] = useState(false);
  const [magicCatProgress, setMagicCatProgress] = useState({ current: 0, total: 0, status: '' });
  const [magicCatLog, setMagicCatLog] = useState<string[]>([]);
  const [magicCatFound, setMagicCatFound] = useState<{name: string, url: string}[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-now', { method: 'POST' });
      if (response.ok) {
        alert('Global Price Synchronization Initiated (Running in background)');
      } else {
        alert('Failed to initiate sync');
      }
    } catch (e) {
      alert('Error: ' + e);
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        isVisible: !currentStatus,
        updatedAt: serverTimestamp()
      });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isVisible: !currentStatus } : p));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    nameRu: string;
    nameAm: string;
    nameEn: string;
    description: string;
    descRu: string;
    descAm: string;
    descEn: string;
    model: string;
    type: string;
    brandId: string;
    storeId: string;
    categoryId: string;
    newCategoryName: string;
    isNewCategory: boolean;
    image: string;
    price: string;
    oldPrice: string;
    sourceUrl: string;
    searchKeywords: string;
    additionalUrls: { url: string; storeId: string }[];
    specifications: { key: string; value: string }[];
    isVisible: boolean;
    isWarranty: boolean;
    discount: string;
  }>({
    name: '',
    nameRu: '',
    nameAm: '',
    nameEn: '',
    description: '',
    descRu: '',
    descAm: '',
    descEn: '',
    model: '',
    type: '',
    brandId: '',
    storeId: '',
    categoryId: 'телефоны',
    newCategoryName: '',
    isNewCategory: false,
    image: '',
    price: '',
    oldPrice: '',
    sourceUrl: '',
    searchKeywords: '',
    additionalUrls: [],
    specifications: [],
    isVisible: true,
    isWarranty: false,
    discount: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('name'));
      const productSnap = await getDocs(q);
      const productList = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productList);

      const catSnap = await getDocs(collection(db, 'categories'));
      if (!catSnap.empty) {
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }

      const brandSnap = await getDocs(collection(db, 'brands'));
      if (!brandSnap.empty) {
        setBrands(brandSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      }

      const storeSnap = await getDocs(collection(db, 'stores'));
      if (!storeSnap.empty) {
        setStores(storeSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products_data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = async (product: Product) => {
    setLoading(true);
    try {
      // Fetch offers for this product
      const offersSnap = await getDocs(collection(db, 'products', product.id, 'offers'));
      const offersList = offersSnap.docs.map(doc => ({
        url: doc.data().url || '',
        storeId: doc.data().storeId || 'auto'
      }));
      
      setFormData({
        name: product.name,
        nameRu: product.nameRu || product.name,
        nameAm: product.nameAm || '',
        nameEn: product.nameEn || '',
        description: product.description,
        descRu: product.descRu || product.description,
        descAm: product.descAm || '',
        descEn: product.descEn || '',
        model: product.model || '',
        type: product.type || '',
        brandId: product.brandId || '',
        storeId: product.storeId || '',
        categoryId: product.categoryId,
        newCategoryName: '',
        isNewCategory: false,
        image: product.image,
        price: (product.price || product.mainPrice)?.toString() || '',
        oldPrice: product.oldPrice?.toString() || '',
        sourceUrl: product.sourceUrl || '',
        searchKeywords: Array.isArray(product.searchKeywords) ? product.searchKeywords.join(', ') : '',
        additionalUrls: offersList.filter(o => o.url !== product.sourceUrl),
        specifications: product.specifications 
          ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
          : [],
        isVisible: product.isVisible !== false,
        isWarranty: product.isWarranty || false,
        discount: product.discount?.toString() || ''
      });
      setEditingId(product.id);
      setIsAdding(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `products/${product.id}/offers`);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0531-\u058F\u0561-\u0587]+/g, '-') 
      .replace(/^-+|-+$/g, '') || 'product-' + Math.random().toString(36).substring(2, 7);
  };

  const findExistingProduct = (name: string, model?: string) => {
    const slug = createSlug(name);
    // 1. Direct slug match
    let match = products.find(p => p.id === slug);
    if (match) return match;

    // 2. Name normalized match (Russian, Armenian, English and main)
    const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яա-ֆ0-9]/gi, '');
    const normName = norm(name);
    
    match = products.find(p => {
      if (norm(p.name) === normName) return true;
      if (p.nameRu && norm(p.nameRu) === normName) return true;
      if (p.nameAm && norm(p.nameAm) === normName) return true;
      if (p.nameEn && norm(p.nameEn) === normName) return true;
      return false;
    });
    if (match) return match;

    // 3. Model match if available (extremely important for uniqueness)
    if (model && model.length > 2) {
      const normModel = norm(model);
      match = products.find(p => p.model && norm(p.model) === normModel);
      if (match) return match;
    }

    return null;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCategoryId = formData.categoryId;

      if (formData.isNewCategory && formData.newCategoryName.trim()) {
        const catName = formData.newCategoryName.trim();
        const catRef = await addDoc(collection(db, 'categories'), {
          name: catName,
          nameRu: catName,
          createdAt: serverTimestamp()
        });
        finalCategoryId = catRef.id;
      }

      const existingProduct = !editingId ? findExistingProduct(formData.name, formData.model) : null;
      const productId = editingId || (existingProduct ? existingProduct.id : createSlug(formData.name));

      const specificationsMap: Record<string, string> = {};
      formData.specifications.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsMap[spec.key.trim()] = spec.value.trim();
        }
      });

      const productData = {
        name: formData.name,
        nameRu: formData.nameRu,
        nameAm: formData.nameAm,
        nameEn: formData.nameEn,
        description: formData.description,
        descRu: formData.descRu,
        descAm: formData.descAm,
        descEn: formData.descEn,
        model: formData.model,
        type: formData.type,
        brandId: formData.brandId,
        storeId: formData.storeId,
        categoryId: finalCategoryId,
        image: formData.image,
        sourceUrl: formData.sourceUrl,
        price: Number(formData.price) || 0,
        mainPrice: Number(formData.price) || 0,
        oldPrice: Number(formData.oldPrice) || 0,
        discount: Number(formData.discount) || 0,
        isWarranty: formData.isWarranty,
        searchKeywords: formData.searchKeywords.split(',').map(k => k.trim()).filter(k => k),
        specifications: specificationsMap,
        isVisible: formData.isVisible,
        updatedAt: serverTimestamp()
      };

      const productRef = doc(db, 'products', productId);
      await setDoc(productRef, {
        ...productData,
        createdAt: serverTimestamp()
      }, { merge: true });

      // Add offers with deduplication by domain
      const primaryOffer = { url: formData.sourceUrl, storeId: formData.storeId || 'auto' };
      const allOffers = [primaryOffer, ...formData.additionalUrls].filter(o => o.url);
      const seenDomains = new Set<string>();
      
      for (const offer of allOffers) {
        try {
          const domain = new URL(offer.url).hostname;
          if (seenDomains.has(domain)) continue;
          seenDomains.add(domain);
          
          const offerId = btoa(offer.url).replace(/=/g, '').substring(0, 50); // Sanitize ID
          await setDoc(doc(db, 'products', productId, 'offers', offerId), {
            storeId: offer.storeId || 'auto',
            price: Number(formData.price) || 0,
            currency: 'AMD',
            url: offer.url,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Invalid URL in offer:", offer.url);
        }
      }

      if (existingProduct && !editingId) {
        alert(`Found existing product "${existingProduct.name}". Added new stores to it.`);
      }

      resetForm();
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      nameRu: '',
      nameAm: '',
      nameEn: '',
      description: '', 
      descRu: '',
      descAm: '',
      descEn: '',
      model: '', 
      type: '', 
      brandId: '',
      storeId: '',
      categoryId: categories[0]?.id || 'телефоны', 
      newCategoryName: '',
      isNewCategory: false,
      image: '', 
      price: '', 
      oldPrice: '',
      sourceUrl: '', 
      searchKeywords: '',
      additionalUrls: [],
      specifications: [],
      isVisible: true,
      isWarranty: false,
      discount: ''
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const [magicDiscoveryMode, setMagicDiscoveryMode] = useState<'categories' | 'products' | 'none'>('none');
  const [useDeepAI, setUseDeepAI] = useState(true);

  const handleMagicCatDiscover = async () => {
    if (!magicUrl) return;
    setMagicLoading(true);
    setMagicCatLog(['🔍 Initiating site discovery...']);
    setMagicCatFound([]);
    setMagicDiscoveryMode('none');
    
    try {
      // 1. Try to see if it's a category page first (Discovery of products)
      const catRes = await fetch('/api/admin/scrape-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: magicUrl })
      });
      const catData = await catRes.json();
      
      if (catData.links && catData.links.length > 5) {
        // It's definitely a category page or has many products
        setMagicCatFound(catData.links);
        setSelectedCats(catData.links.map((c: any) => c.url));
        setMagicDiscoveryMode('products');
        setMagicCatLog([`✅ Found ${catData.links.length} products on this page. Select products to import.`]);
      } else {
        // 2. Otherwise try to find categories (Discovery of site structure)
        const res = await fetch('/api/admin/scrape-store-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: magicUrl })
        });
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setMagicCatFound(data.categories);
          setSelectedCats(data.categories.map((c: any) => c.url));
          setMagicDiscoveryMode('categories');
          setMagicCatLog([`✅ Found ${data.categories.length} categories. Select sections to scan.`]);
        } else {
           setMagicCatLog(['❌ Could not find categories or products. Try a different URL.']);
        }
      }
    } catch (e) {
      setMagicCatLog(['❌ Discovery failed. Try again with home URL.']);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleMagicCatImport = async () => {
    if (selectedCats.length === 0) return;
    setIsImporting(true);
    setMagicCatLog(['🚀 Starting bulk import...']);
    
    let tasks: {name: string, url: string, categoryName?: string}[] = [];
    
    if (magicDiscoveryMode === 'categories') {
       // We have categories, we need to find products in them
       const catsToScan = magicCatFound.filter(c => selectedCats.includes(c.url));
       setMagicCatProgress({ current: 0, total: catsToScan.length, status: 'Scanning Categories...' });
       
       for (const cat of catsToScan) {
          setMagicCatLog(prev => [...prev, `📂 Scanning Category: ${cat.name}...`]);
          try {
            const res = await fetch('/api/admin/scrape-category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: cat.url })
            });
            const data = await res.json();
            if (data.links) {
               tasks.push(...data.links.map((l: any) => ({ 
                 name: l.name, 
                 url: l.url, 
                 categoryName: cat.name 
               })));
            }
          } catch (e) {}
       }
    } else {
       // We already have products selected
       tasks = magicCatFound.filter((c: any) => selectedCats.includes(c.url)).map((c: any) => ({
          name: c.name,
          url: c.url,
          categoryName: 'Imported'
       }));
    }

    if (tasks.length === 0) {
       setMagicCatLog(prev => [...prev, '❌ No products found to import.']);
       setIsImporting(false);
       return;
    }

    setMagicCatProgress({ current: 0, total: tasks.length, status: 'Importing Products...' });
    setMagicCatLog(prev => [...prev, `📦 Prepared ${tasks.length} products for import.`]);

    let processedCount = 0;
    const ai = getAI();
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (const task of tasks) {
      processedCount++;
      setMagicCatProgress(prev => ({ 
        ...prev, 
        current: processedCount, 
        status: `Product ${processedCount}/${tasks.length}: ${task.name}` 
      }));
      
      try {
        let data: any = null;
        
        if (useDeepAI && ai) {
           // Deep AI Extraction (PROFESSIONAL)
           setMagicCatLog(prev => [...prev, `✨ Deep Extracting: ${task.name}...`]);
           
           // 1. Get raw text
           const proxyRes = await fetch('/api/proxy/text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: task.url })
           });
           const proxyData = await proxyRes.json();
           const text = proxyData.text || '';
           
           // 2. Gemini extraction with RETRY LOGIC
           const categoriesList = categories.map(c => c.name).join(', ');
           const prompt = `Extract e-commerce data from this product page text. Return JSON only.
           Fields: nameRu, nameAm, nameEn, model, type, description (pro Russian), descAm, descEn, price (AMD), oldPrice, brandName, suggestedCategory, specifications (object).
           URL: ${task.url}
           Available Categories: [${categoriesList}]
           Text: ${text.slice(0, 15000)}`;

           let attempts = 0;
           const maxAttempts = 3;
           while (attempts < maxAttempts) {
             try {
               const result = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: [{ role: 'user', parts: [{ text: prompt }] }],
                  config: { responseMimeType: "application/json" }
               });
               data = JSON.parse(result.text.replace(/```json|```/g, ""));
               break; // Success!
             } catch (aiErr: any) {
               attempts++;
               const isRetryable = aiErr?.message?.includes('503') || aiErr?.message?.includes('429');
               if (isRetryable && attempts < maxAttempts) {
                 const waitTime = attempts * 2000;
                 setMagicCatLog(prev => [...prev, `⏳ AI busy (503), retrying in ${waitTime/1000}s...`]);
                 await delay(waitTime);
               } else {
                 setMagicCatLog(prev => [...prev, `⚠️ AI failed, falling back to basic scraper.`]);
                 break; // Give up and use basic scraper
               }
             }
           }
           
           // Merging with basic scraper to get image (AI text extraction doesn't have image binary/good URL usually)
           const basicRes = await fetch('/api/admin/scrape-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: task.url })
           });
           const basicData = await basicRes.json();
           
           if (data) {
             data.image = basicData.image;
             if (!data.price || data.price === 0) data.price = basicData.price;
             if (!data.specifications || Object.keys(data.specifications).length === 0) data.specifications = basicData.specifications;
           } else {
             data = basicData; // Fallback
           }
        } else {
           // Basic Scraper
           const productRes = await fetch('/api/admin/scrape-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: task.url })
           });
           data = await productRes.json();
        }
        
        if (data && (data.name || data.nameRu)) {
          const name = data.name || data.nameRu || task.name;
          const priceVal = Number(data.price) || 0;
          const existingMatch = findExistingProduct(name, data.model || '');
          const productId = existingMatch ? existingMatch.id : createSlug(name);
          const productRef = doc(db, 'products', productId);
          
          let catId = categories.find(c => c.name.toLowerCase() === (data.suggestedCategory || '').toLowerCase())?.id;
          if (!catId) {
             const lowerTaskCat = task.categoryName?.toLowerCase();
             catId = categories.find(c => c.name.toLowerCase() === lowerTaskCat)?.id;
          }
          if (!catId) catId = categories[0]?.id;

          if (existingMatch) {
            await updateDoc(productRef, {
              mainPrice: priceVal > 0 ? Math.min(existingMatch.mainPrice || Infinity, priceVal) : existingMatch.mainPrice,
              price: priceVal > 0 ? Math.min(existingMatch.price || Infinity, priceVal) : existingMatch.price,
              specifications: { ...(existingMatch.specifications || {}), ...(data.specifications || {}) },
              updatedAt: serverTimestamp()
            });
            setMagicCatLog(prev => [...prev, `♻️ Merged: ${name.substring(0, 30)}...`]);
          } else {
            const productData: any = {
              name: name,
              nameRu: data.nameRu || name,
              nameAm: data.nameAm || '',
              nameEn: data.nameEn || '',
              model: data.model || '',
              type: data.type || '',
              description: data.description || '',
              descRu: data.description || '',
              descAm: data.descAm || '',
              descEn: data.descEn || '',
              categoryId: catId,
              image: data.image || '',
              sourceUrl: task.url,
              price: priceVal,
              mainPrice: priceVal,
              oldPrice: Number(data.oldPrice) || 0,
              searchKeywords: [name.toLowerCase(), data.model?.toLowerCase()].filter(Boolean),
              specifications: data.specifications || {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            // Enhanced matching for Brand and Store
            const brandId = brands.find(b => b.name?.toLowerCase() === data.brandName?.toLowerCase())?.id;
            if (brandId) productData.brandId = brandId;
            
            const domain = new URL(task.url).hostname;
            const storeId = stores.find(s => domain.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(domain.split('.')[0]))?.id;
            if (storeId) productData.storeId = storeId;

            await setDoc(productRef, productData);
            setMagicCatLog(prev => [...prev, `✅ Added: ${name.substring(0, 30)}...`]);
          }
          
          const domainForOffer = new URL(task.url).hostname;
          const matchedStoreId = stores.find(s => domainForOffer.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(domainForOffer.split('.')[0]))?.id || 'auto';
          
          const offerId = btoa(task.url).replace(/=/g, '').substring(0, 50);
          await setDoc(doc(db, 'products', productId, 'offers', offerId), {
            storeId: matchedStoreId,
            price: priceVal,
            inStock: data.inStock ?? true,
            currency: 'AMD',
            url: task.url,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }

        // Small delay to respect rate limits
        await delay(1000);
      } catch (e) {
        console.error('Magic Import Error:', e);
        setMagicCatLog(prev => [...prev, `❌ Error: ${task.name}`]);
      }
    }

    setMagicCatLog(prev => [...prev, '🏁 BULK IMPORT COMPLETED!']);
    setMagicCatProgress(prev => ({ ...prev, current: tasks.length, status: 'Completed' }));
    setIsImporting(false);
    fetchData();
  };

  const deleteAllProducts = async () => {
    if (!isAdmin) {
      alert("Access Denied: You must be an administrator to perform this action.");
      return;
    }

    if (!window.confirm("ARE YOU SURE? THIS WILL DELETE ALL PRODUCTS PERMANENTLY! This operation might take time if you have many items.")) return;
    setDeletingAll(true);
    
    try {
      // Fetch all products
      console.log("Fetching all products for deletion...");
      const snap = await getDocs(collection(db, 'products'));
      const docs = snap.docs;
      
      if (docs.length === 0) {
        alert("No items found to delete.");
        setDeletingAll(false);
        return;
      }

      console.log(`Starting mass deletion of ${docs.length} products...`);
      
      // Delete in batches of 50 to be safe
      const batchSize = 50; 
      let deletedCount = 0;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batchDocs = docs.slice(i, i + batchSize);
        const batch = writeBatch(db);
        
        batchDocs.forEach(d => {
          batch.delete(d.ref);
          // Note: Subcollections like 'offers' won't be deleted automatically
          // but we prioritize cleaning up the main list first.
        });
        
        await batch.commit();
        deletedCount += batchDocs.length;
        console.log(`Deleted ${deletedCount}/${docs.length} products...`);
      }

      alert(`Successfully deleted ${deletedCount} products.`);
      setProducts([]);
    } catch (err: any) {
      console.error("Mass delete error:", err);
      // Detailed error reporting for the user
      if (err.message?.includes('permission')) {
        alert("Permission Error: Your account does not have sufficient rights to delete these items. Please contact the system owner.");
      } else {
        alert("Error during mass deletion: " + (err.message || String(err)));
      }
      handleFirestoreError(err, OperationType.DELETE, 'products_mass_delete');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleMagicAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicUrl) return;
    setMagicLoading(true);
    try {
      // 1. Get raw text via our text proxy
      const proxyRes = await fetch('/api/proxy/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: magicUrl })
      });
      const data = await proxyRes.json();
      const text = data.text || '';
      
      if (!text && !getAI()) {
        throw new Error("No text content found at this URL.");
      }
      
      const ai = getAI();
      if (!ai) {
        // Fallback to basic scraper if AI not available
        const response = await fetch('/api/admin/scrape-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: magicUrl })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setFormData({
          ...formData,
          name: data.name || '',
          description: data.description || '',
          image: data.image || '',
          price: data.price?.toString() || '',
          sourceUrl: magicUrl,
          specifications: data.specifications 
            ? Object.entries(data.specifications).map(([key, value]) => ({ key, value: String(value) }))
            : [],
        });
      } else {
        const categoriesList = categories.map(c => c.name).join(', ');
        const brandsList = brands.map(b => b.name).join(', ');
        const storesList = stores.map(s => s.name).join(', ');

        const prompt = `You are a professional e-commerce data analyst. Your task is to extract product information from the provided text from a store page.
        
        CRITICAL RULES:
        1. Identify the ACTUAL product name. Ignore navigation menus, site headers (like "Stores", "Cart", "Login"), and generic page titles.
        2. Look at the BREADCRUMBS section (if present) - the last item is usually the product name.
        3. Extract the CURRENT price (the smaller one if there's a discount) and the ORIGINAL price (the larger/crossed out one).
        4. Extract ALL technical specifications from tables or lists.
        5. Identify the BRAND (e.g. Samsung, Apple, Philips).
        6. Return a professional marketing description in 3-5 sentences.
        
        JSON Structure to return:
        {
          "nameRu": "Full name in Russian",
          "nameAm": "Full name in Armenian",
          "nameEn": "Full name in English",
          "model": "Technical model number/id",
          "type": "Product category/type",
          "description": "Professional 3-5 sentence description in Russian",
          "descAm": "Same description in Armenian",
          "descEn": "Same description in English",
          "price": 19900,
          "oldPrice": 30900,
          "discount": 35,
          "isWarranty": true,
          "brandName": "Brand Name",
          "suggestedCategory": "Category Name",
          "specifications": { "Key": "Value", ... }
        }
        
        Context: URL is ${magicUrl}
        Available Categories: [${categoriesList}]
        Available Brands: [${brandsList}]
        
        TEXT TO ANALYZE:
        ${text.slice(0, 20000)}`;

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        
        const aiData = JSON.parse(result.text.replace(/```json|```/g, ""));

        // Clean name from navigation noise
        const noise = ['ԽԱՆՈՒԹՆԵՐ', 'Զամբյուղ', 'Մուտք', 'Գրանցվել', 'Stores', 'Cart', 'Login', 'Register', 'Меню', 'Корзина'];
        const cleanName = (n: string) => {
          if (!n) return '';
          let temp = n.trim();
          if (noise.some(noiseItem => temp.toLowerCase() === noiseItem.toLowerCase())) return '';
          if (temp.includes(' / ')) temp = temp.split(' / ').pop() || temp;
          return temp;
        };

        const finalNameRu = cleanName(aiData.nameRu);
        const finalNameAm = cleanName(aiData.nameAm);
        const finalNameEn = cleanName(aiData.nameEn);

        // Match category suggested by AI
        let catId = formData.categoryId;
        let isNewCat = false;
        let newCatName = '';
        
        if (aiData.suggestedCategory) {
          const matchedCat = categories.find(c => c.name.toLowerCase() === aiData.suggestedCategory.toLowerCase());
          if (matchedCat) {
            catId = matchedCat.id;
          } else {
            isNewCat = true;
            newCatName = aiData.suggestedCategory;
          }
        }

        setFormData({
          ...formData,
          name: finalNameRu || finalNameAm || finalNameEn || '',
          nameRu: finalNameRu || '',
          nameAm: finalNameAm || '',
          nameEn: finalNameEn || '',
          descRu: aiData.description || aiData.descRu || '',
          descAm: aiData.descAm || '',
          descEn: aiData.descEn || '',
          description: aiData.description || aiData.descRu || '',
          model: aiData.model || '',
          type: aiData.type || '',
          categoryId: catId,
          isNewCategory: isNewCat,
          newCategoryName: newCatName,
          brandId: aiData.brandId || brands.find(b => b.name?.toLowerCase() === aiData.brandName?.toLowerCase())?.id || '',
          storeId: aiData.storeId || stores.find(s => s.name?.toLowerCase() === aiData.storeName?.toLowerCase())?.id || '',
          price: aiData.price?.toString() || '',
          oldPrice: aiData.oldPrice?.toString() || '',
          isWarranty: aiData.isWarranty || false,
          discount: aiData.discount?.toString() || '',
          sourceUrl: magicUrl,
          searchKeywords: `${finalNameRu}, ${aiData.model}, ${aiData.type}`,
          specifications: aiData.specifications && typeof aiData.specifications === 'object'
            ? Object.entries(aiData.specifications).map(([key, value]) => ({ key, value: String(value) }))
            : [],
        });

        // Try to get more data from standard scraper as fallback/bonus
        try {
          const skipAIRes = await fetch('/api/admin/scrape-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: magicUrl })
          });
          const sc = await skipAIRes.json();
          
          setFormData(prev => {
            const mergedSpecs = [...prev.specifications];
            if (sc.specifications) {
              Object.entries(sc.specifications).forEach(([key, value]) => {
                if (!mergedSpecs.find(s => s.key === key)) {
                  mergedSpecs.push({ key, value: String(value) });
                }
              });
            }

            const finalPrice = prev.price && Number(prev.price) > 0 ? prev.price : (sc.price?.toString() || '');
            const finalOldPrice = prev.oldPrice && Number(prev.oldPrice) > 0 ? prev.oldPrice : (sc.oldPrice?.toString() || '');
            
            // Manual discount calculation if missing
            let calculatedDiscount = prev.discount;
            if (!calculatedDiscount && Number(finalPrice) > 0 && Number(finalOldPrice) > Number(finalPrice)) {
              calculatedDiscount = Math.round(((Number(finalOldPrice) - Number(finalPrice)) / Number(finalOldPrice)) * 100).toString();
            }

            return {
              ...prev,
              image: sc.image || prev.image,
              name: (prev.name && prev.name.length > 5) ? prev.name : (sc.name || prev.name),
              nameRu: (prev.nameRu && prev.nameRu.length > 5) ? prev.nameRu : (sc.name || prev.nameRu),
              description: prev.description || sc.description || '',
              descRu: prev.descRu || sc.description || '',
              price: finalPrice,
              oldPrice: finalOldPrice,
              discount: calculatedDiscount,
              model: prev.model || sc.model || '',
              type: prev.type || sc.type || '',
              specifications: mergedSpecs
            };
          });
        } catch (e) {}
      }
      
      setIsMagicAdding(false);
      setIsAdding(true);
      setMagicUrl('');
    } catch (error) {
      console.error("Magic Add Error:", error);
      alert("Failed to extract data professionally. Using basic extraction as fallback...");
      // Try basic extraction
      try {
        const response = await fetch('/api/admin/scrape-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: magicUrl })
        });
        const data = await response.json();
        setFormData({
          ...formData,
          name: data.name || '',
          image: data.image || '',
          price: data.price?.toString() || '',
          sourceUrl: magicUrl,
        });
        setIsMagicAdding(false);
        setIsAdding(true);
      } catch (e) {
        alert("Extraction failed completely.");
      }
    } finally {
      setMagicLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Model', 'Type', 'Web URL', 'Photo URL', 'Price', 'Description'];
    const rows = products.map(p => [
      p.name, 
      p.model || '', 
      p.type || '', 
      p.sourceUrl || '', 
      p.image, 
      p.mainPrice || 0, 
      p.description.replace(/,/g, ';')
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Model', 'Type', 'Web URL', 'Photo URL', 'Price', 'Description'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const batch = writeBatch(db);
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const data: any = {
          name: values[0],
          model: values[1],
          type: values[2],
          sourceUrl: values[3],
          image: values[4],
          mainPrice: Number(values[5]) || 0,
          description: values[6]?.replace(/;/g, ',') || '',
          categoryId: 'телефоны', // Default
          createdAt: serverTimestamp()
        };
        const newRef = doc(collection(db, 'products'));
        batch.set(newRef, data);
      }
      
      await batch.commit();
      fetchData();
      alert("Import successful!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products_csv_import');
    }
  };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:inventory', 'Inventory')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:inventory_subtitle', 'Global catalog distribution and real-time price synchronization.')}</p>
        </motion.div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex rounded-[20px] bg-white/5 border border-white/10 p-1">
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              title={t('admin:download_template', 'Download Template')}
            >
              <Download size={18} />
              <span className="hidden sm:inline">{t('admin:schema', 'Schema')}</span>
            </button>
            
            <div className="w-[1px] bg-white/10 my-2" />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              title={t('admin:import_data', 'Import Data')}
            >
              <Upload size={18} />
              <span className="hidden sm:inline">{t('admin:import', 'Import')}</span>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />

          <button 
            onClick={exportToCSV}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-white/5 border border-white/10 px-8 text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 group"
          >
            <Save size={18} className="text-[#F1D28C] group-hover:scale-110 transition-transform" />
            {t('admin:backup', 'Backup')}
          </button>

          <button 
            onClick={deleteAllProducts}
            disabled={deletingAll}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-rose-500/10 border border-rose-500/20 px-8 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {deletingAll ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
            {t('admin:purge_all', 'Purge All')}
          </button>

          <button 
            onClick={() => setIsMagicCatAdding(true)}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-indigo-600 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_15px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 transition-all group"
          >
            <Zap size={20} className="group-hover:animate-pulse" />
            {t('admin:magic_scan', 'Magic Scan')}
          </button>

          <button 
            onClick={() => setIsMagicAdding(true)}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-orange-600 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_15px_40px_rgba(234,88,12,0.3)] hover:bg-orange-700 active:scale-95 transition-all group"
          >
            <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
            {t('admin:magic_add', 'Magic Add')}
          </button>

          <button 
            onClick={() => setIsAdding(true)}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-8 text-[11px] font-black uppercase tracking-widest text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            {t('admin:create_node', 'Create Node')}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center px-2">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-sm group-focus-within:bg-[#C5A059]/10 transition-all duration-500" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#F1D28C] transition-colors" size={20} />
          <input 
            type="text"
            placeholder={t('admin:search_catalog_placeholder', 'Search catalog matrix...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full rounded-[24px] border border-white/5 bg-white/5 pl-14 pr-6 h-14 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C5A059]/30 focus:bg-white/10 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{t('admin:classification', 'Classification')}:</span>
          <div className="relative">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none h-14 min-w-[200px] rounded-[24px] border border-white/5 bg-white/5 px-8 pr-12 font-black text-[11px] uppercase tracking-widest text-white outline-none focus:border-[#C5A059]/30 focus:bg-white/10 transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#0B1220]">{t('admin:all_categories', 'All Categories') || t('all_categories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0B1220]">{cat.name}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-8">
            <button 
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-3 h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 disabled:opacity-50 transition-all active:scale-95"
            >
              <RefreshCw size={16} className={cn("text-[#C5A059]", syncing && "animate-spin")} />
              {syncing ? t('admin:synchronizing', 'Synchronizing...') : t('admin:sync_prices', 'Sync Prices')}
            </button>
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t('admin:total_capacity', 'Total Capacity')}</span>
             <span className="text-lg font-display font-black text-white">{filteredProducts.length}</span>
           </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {filteredProducts.map((product, i) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "group relative rounded-[40px] border bg-[#081120] p-6 transition-all duration-500 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)] hover:-translate-y-2",
              product.isVisible === false ? "opacity-50 border-white/5 grayscale" : "border-white/5 hover:border-[#C5A059]/30"
            )}
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.05)_0,transparent_50%)] pointer-events-none rounded-[40px]" />

             <div className="aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-[#050816] flex items-center justify-center relative shadow-inner border border-white/5 group-hover:scale-[1.02] transition-transform duration-700">
                {product.image ? (
                  <img 
                    referrerPolicy="no-referrer"
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-contain p-6 brightness-110" 
                  />
                ) : (
                  <Package className="text-slate-800" size={64} />
                )}
                
                <div className="absolute top-4 right-4 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                  {product.sourceUrl && (
                    <a 
                      href={product.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="h-10 w-10 flex items-center justify-center rounded-2xl bg-black/60 text-white backdrop-blur-xl border border-white/10 hover:bg-[#C5A059] hover:text-black transition-all shadow-2xl"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button 
                    onClick={() => toggleVisibility(product.id, product.isVisible !== false)}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-2xl backdrop-blur-xl border border-white/10 transition-all shadow-2xl",
                      product.isVisible !== false ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                    )}
                  >
                    {product.isVisible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-2xl">
                  <Tag size={12} className="text-[#C5A059]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    {product.type || categories.find(c => c.id === product.categoryId)?.name || t('admin:unclassified', 'UNCLASSIFIED')}
                  </span>
                </div>
             </div>
             
             <div className="mt-8 px-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[#F1D28C] transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] line-clamp-1">{product.model || t('admin:generic_model', 'GENERIC MODEL')}</span>
                    <div className="h-[2px] w-4 bg-white/5 rounded-full" />
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      product.isVisible !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-700"
                    )} />
                  </div>
                </div>
                
                <div className="mt-8 flex items-end justify-between">
                   <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t('admin:pricing_matrix', 'Pricing Matrix')}</span>
                     <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-display font-black text-white">
                         {(product.price || product.mainPrice || 0).toLocaleString()}
                       </span>
                       <span className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest">AMD</span>
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                      {confirmDeleteId === product.id ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/40 p-1">
                           <button 
                             onClick={() => handleDelete(product.id)}
                             disabled={isDeleting === product.id}
                             className="h-10 px-6 rounded-xl bg-rose-500 text-[10px] font-black text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                           >
                             {isDeleting === product.id ? <RefreshCw size={14} className="animate-spin" /> : t('admin:confirm', 'CONFIRM')}
                           </button>
                           <button 
                             onClick={() => setConfirmDeleteId(null)}
                             disabled={isDeleting === product.id}
                             className="h-10 w-10 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-all"
                           >
                             <X size={18} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleEditClick(product)}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-[#C5A059]/10 hover:text-[#F1D28C] border border-white/5 transition-all"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Magic Category Add Modal */}
      <AnimatePresence>
        {isMagicCatAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!magicLoading && !isImporting) {
                  setIsMagicCatAdding(false);
                  setMagicCatFound([]);
                  setSelectedCats([]);
                }
              }}
              className="absolute inset-0 bg-[#050816]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[40px] bg-[#0B1220] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.05)_0,transparent_50%)] pointer-events-none" />

              <div className="p-10 pb-6 flex items-center justify-between border-b border-white/5 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C5A059]/10 text-[#F1D28C] border border-[#C5A059]/20 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase">{t('admin:neural_scanner', 'Neural Scanner')}</h2>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mt-1">{t('admin:neural_scanner_subtitle', 'Advanced multi-node web extraction protocol.')}</p>
                  </div>
                </div>
                <button 
                  disabled={magicLoading || isImporting}
                  onClick={() => {
                     setIsMagicCatAdding(false);
                     setMagicCatFound([]);
                     setSelectedCats([]);
                  }} 
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 custom-scrollbar relative z-10">
                {!magicCatFound.length && !magicLoading ? (
                  <div className="space-y-8 max-w-2xl mx-auto py-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] ml-2 block">{t('admin:source_target_url', 'Source Target URL')}</label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-[#C5A059]/5 rounded-[24px] blur-md group-focus-within:bg-[#C5A059]/10 transition-all" />
                        <input 
                          required 
                          type="url"
                          value={magicUrl} 
                          onChange={e => setMagicUrl(e.target.value)} 
                          placeholder="https://vivaelectronics.am/TV-LED"
                          className="relative w-full rounded-[24px] border border-white/10 bg-white/5 px-8 py-5 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C5A059]/40 focus:bg-white/10 transition-all text-lg shadow-inner"
                        />
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 text-center uppercase tracking-widest leading-relaxed">{t('admin:neural_scanner_tip', 'System supports broad domain indexing and deep product mapping.')}</p>
                    </div>

                    <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <Brain size={20} />
                         </div>
                         <div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-[#F1D28C]">{t('admin:ai_cognitive_extraction', 'AI Cognitive Extraction')}</h4>
                           <p className="text-[10px] text-slate-500 font-medium mt-1">{t('admin:ai_extraction_tip', 'Leverage Gemini 3.1 for high-fidelity technical mapping.')}</p>
                         </div>
                       </div>
                       <button
                          type="button"
                          onClick={() => setUseDeepAI(!useDeepAI)}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none",
                            useDeepAI ? "bg-[#C5A059]" : "bg-white/10"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-300 ease-in-out mt-0.5",
                            useDeepAI ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                    </div>

                    <button 
                      onClick={handleMagicCatDiscover}
                      className="group flex w-full items-center justify-center gap-4 rounded-[24px] bg-white text-[#050816] py-6 font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Search size={18} />
                      {t('admin:initialize_scan', 'Initialize Scan Sequence')}
                    </button>
                  </div>
                ) : null}

                {magicLoading && !magicCatFound.length && (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-10 scale-150">
                      <div className="absolute inset-0 bg-[#C5A059]/20 blur-3xl animate-pulse rounded-full" />
                      <RefreshCw size={80} className="text-white/5 animate-[spin_3s_linear_infinite]" />
                      <Search size={32} className="absolute inset-0 m-auto text-[#F1D28C] animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider">Indexing Matrix...</h3>
                    <p className="text-slate-500 font-medium text-sm mt-4 uppercase tracking-[0.2em]">Interpreting DOM structure and extracting product nodes.</p>
                  </div>
                )}

                {magicCatFound.length > 0 && !isImporting && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20">
                          <div className="h-2 w-2 rounded-full bg-[#F1D28C] animate-pulse" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C]">
                            Found {magicCatFound.length} {magicDiscoveryMode === 'products' ? 'Entities' : 'Classifications'}
                          </h4>
                        </div>
                        <button 
                          onClick={() => {
                            setMagicCatFound([]);
                            setMagicUrl('');
                            setMagicDiscoveryMode('none');
                            setMagicCatLog([]);
                          }}
                          className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors ml-4"
                        >
                          <RefreshCw size={14} />
                          Reset Scan
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedCats(magicCatFound.map(c => c.url))}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D28C] hover:opacity-70 transition-opacity"
                        >
                          Select Global
                        </button>
                        <button 
                          onClick={() => setSelectedCats([])}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {magicCatFound.map((item: any, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setSelectedCats(prev => 
                              prev.includes(item.url) 
                                ? prev.filter(u => u !== item.url) 
                                : [...prev, item.url]
                            );
                          }}
                          className={cn(
                            "flex items-center gap-4 rounded-[28px] border p-5 text-left transition-all duration-300",
                            selectedCats.includes(item.url) 
                              ? "border-[#C5A059]/50 bg-[#C5A059]/10 shadow-[inner_0_0_20px_rgba(197,160,89,0.1)]" 
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                          )}
                        >
                          <div className={cn(
                            "flex h-6 w-6 rounded-lg border-2 items-center justify-center transition-all shrink-0",
                            selectedCats.includes(item.url) ? "bg-[#C5A059] border-[#C5A059]" : "bg-transparent border-white/20"
                          )}>
                            {selectedCats.includes(item.url) && <Check size={14} className="text-[#050816]" />}
                          </div>
                          
                          {magicDiscoveryMode === 'products' && item.image && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                               <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                             <p className={cn(
                               "text-[11px] font-black uppercase tracking-widest truncate",
                               selectedCats.includes(item.url) ? "text-[#F1D28C]" : "text-slate-300"
                             )}>
                               {item.name}
                             </p>
                             {item.price && item.price !== '0' && (
                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{item.price}</p>
                             )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleMagicCatImport}
                      disabled={selectedCats.length === 0}
                      className="flex w-full items-center justify-center gap-4 rounded-[24px] bg-[#C5A059] py-6 font-black uppercase tracking-[0.2em] text-[11px] text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                    >
                      <Download size={18} />
                      Import {selectedCats.length} Selected Nodes
                    </button>
                  </div>
                )}

                {isImporting && (
                  <div className="space-y-10 py-6">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] px-2">
                      <span className="flex items-center gap-3">
                        <RefreshCw size={14} className="animate-spin" />
                        Synchronizing Matrix...
                      </span>
                      <span className="text-white text-xl font-display">{Math.round((magicCatProgress.current / (magicCatProgress.total || 1)) * 100)}%</span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-white/5 p-1 border border-white/10 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(magicCatProgress.current / (magicCatProgress.total || 1)) * 100}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#F1D28C] shadow-[0_0_15px_rgba(197,160,89,0.4)]"
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      />
                    </div>
                    <div className="rounded-[32px] bg-black/60 p-8 font-mono text-[10px] text-emerald-400/80 h-72 overflow-y-auto custom-scrollbar border border-white/5 shadow-2xl">
                      {magicCatLog.map((log, i) => (
                        <div key={i} className="mb-3 flex gap-4 border-b border-white/[0.03] pb-2 last:border-0">
                          <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          <span className={cn(
                            log.includes('✅') ? "text-emerald-400" : 
                            log.includes('❌') ? "text-rose-400" : 
                            log.includes('⚠️') ? "text-amber-400" : "text-slate-400"
                          )}>{log}</span>
                        </div>
                      ))}
                      <div id="log-bottom" />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Processing Neural Nodes</span>
                       <div className="flex gap-2">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="h-1 w-1 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>
              
              {isImporting && magicCatProgress.current === magicCatProgress.total && magicCatProgress.total > 0 && (
                <div className="p-10 pt-0 relative z-10">
                  <button 
                    onClick={() => {
                      setIsMagicCatAdding(false);
                      setMagicCatFound([]);
                      setSelectedCats([]);
                      setIsImporting(false);
                      setMagicCatLog([]);
                      setMagicCatProgress({ current: 0, total: 0, status: '' });
                      fetchData();
                    }}
                    className="w-full rounded-[24px] bg-emerald-600 py-6 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Close & Initialise Inventory
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Magic Add Modal */}
      <AnimatePresence>
        {isMagicAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMagicAdding(false)}
              className="absolute inset-0 bg-[#050816]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[40px] bg-[#0B1220] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.05)_0,transparent_50%)] pointer-events-none" />

              <div className="absolute right-8 top-8">
                <button onClick={() => setIsMagicAdding(false)} className="rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_20px_rgba(234,88,12,0.1)] mb-8">
                 <Wand2 size={32} />
              </div>

              <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase">Phantom Addition</h2>
              <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">Insert product URL below. Neural engine will synthesize image, price and technical specs automatically.</p>

              <form onSubmit={handleMagicAdd} className="mt-10 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 ml-2">Extraction Target</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500/5 rounded-[24px] blur-md group-focus-within:bg-orange-500/10 transition-all shadow-inner" />
                    <input 
                      required 
                      type="url"
                      value={magicUrl} 
                      onChange={e => setMagicUrl(e.target.value)} 
                      placeholder="https://zigzag.am/product/..."
                      className="relative w-full rounded-[24px] border border-white/10 bg-white/5 px-8 py-5 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/40 focus:bg-white/10 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    disabled={magicLoading}
                    type="submit" 
                    className="flex w-full items-center justify-center gap-4 rounded-[24px] bg-orange-600 py-6 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-[0_20px_50px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                  >
                    {magicLoading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin text-white" />
                        Analyzing Neural Waves...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={20} />
                        Execute Extraction
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-[1px] flex-1 bg-white/[0.03]" />
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
                      Powered by Gemini 3.1 Neural Flux
                    </p>
                    <div className="h-[1px] flex-1 bg-white/[0.03]" />
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-[#050816]/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-5xl overflow-y-auto max-h-[90vh] rounded-[40px] bg-[#0B1220] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />

              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059]">
                    <Plus size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">{editingId ? 'Edit Configuration' : 'Network Induction'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Manual node specification protocol.</p>
                  </div>
                </div>
                <button onClick={resetForm} className="h-12 w-12 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-white/5 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-white/[0.02] rounded-[32px] border border-white/5 shadow-inner">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Brand Identity</label>
                       <div className="relative">
                         <select 
                           value={formData.brandId}
                           onChange={e => setFormData({...formData, brandId: e.target.value})}
                           className="w-full h-14 rounded-2xl bg-[#050816] border border-white/10 px-6 font-bold text-white outline-none focus:border-[#C5A059]/40 transition-all appearance-none cursor-pointer"
                         >
                           <option value="" className="bg-[#0B1220]">Generic / OEM</option>
                           {brands.map(brand => (
                             <option key={brand.id} value={brand.id} className="bg-[#0B1220]">{brand.name}</option>
                           ))}
                         </select>
                         <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Registry Store</label>
                       <div className="relative">
                         <select 
                           value={formData.storeId}
                           onChange={e => setFormData({...formData, storeId: e.target.value})}
                           className="w-full h-14 rounded-2xl bg-[#050816] border border-white/10 px-6 font-bold text-white outline-none focus:border-[#C5A059]/40 transition-all appearance-none cursor-pointer"
                         >
                           <option value="" className="bg-[#0B1220]">Select Authority</option>
                           {stores.map(store => (
                             <option key={store.id} value={store.id} className="bg-[#0B1220]">{store.name}</option>
                           ))}
                         </select>
                         <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                       </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-white/[0.02] rounded-[32px] p-8 border border-white/5 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 block text-center">Warranty Protocol</label>
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, isWarranty: !formData.isWarranty})}
                            className={cn(
                              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none",
                              formData.isWarranty ? "bg-emerald-500" : "bg-white/10"
                            )}
                          >
                            <span className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-300 ease-in-out mt-0.5",
                              formData.isWarranty ? "translate-x-5" : "translate-x-0.5"
                            )} />
                          </button>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formData.isWarranty ? 'SECURED' : 'UNSECURED'}</span>
                        </div>
                     </div>
                     <div className="bg-white/[0.02] rounded-[32px] p-8 border border-white/5 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 block text-center">Disc. Variable</label>
                        <div className="relative group">
                          <input 
                            type="number"
                            value={formData.discount}
                            onChange={e => setFormData({...formData, discount: e.target.value})}
                            className="w-full rounded-2xl bg-[#050816] border border-white/10 px-5 py-4 font-black text-center text-white focus:border-orange-500/40 transition-all outline-none" 
                            placeholder="0"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 font-black text-xs">%</span>
                        </div>
                     </div>
                     <div className="bg-white/[0.02] rounded-[32px] p-8 border border-white/5 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 block text-center">Node Visibility</label>
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}
                            className={cn(
                              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none",
                              formData.isVisible ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          >
                            <span className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-300 ease-in-out mt-0.5",
                              formData.isVisible ? "translate-x-5" : "translate-x-0.5"
                            )} />
                          </button>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formData.isVisible ? 'ACTIVE' : 'OFFLINE'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Product Designation</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-[24px] bg-white/5 border border-white/10 px-8 py-5 font-black text-white focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-700 text-xl shadow-inner" placeholder="Enter full designation name..." />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Model</label>
                    <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full rounded-[24px] bg-white/5 border border-white/10 px-8 py-5 font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-700 shadow-inner" placeholder="ALPHA-X99" />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Entity Type</label>
                    <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-[24px] bg-white/5 border border-white/10 px-8 py-5 font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-700 shadow-inner" placeholder="Computing Node" />
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Technical Dossier</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-[32px] bg-white/5 border border-white/10 px-8 py-6 font-medium text-white focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-700 resize-none shadow-inner leading-relaxed" placeholder="Detailed technical logs and descriptions..." />
                  </div>

                  <div className="md:col-span-2 p-10 bg-white/[0.02] rounded-[40px] border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white border-l-4 border-[#C5A059] pl-4">Cognitive Specs</h3>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-widest">Multi-dimensional property mapping</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({
                          ...formData, 
                          specifications: [...formData.specifications, { key: '', value: '' }]
                        })}
                        className="flex items-center gap-3 h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D28C] hover:bg-white/10 active:scale-95 transition-all shadow-xl"
                      >
                        <Plus size={14} />
                        Add Node
                      </button>
                    </div>

                    {formData.specifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 bg-black/40 rounded-[32px] border border-dashed border-white/10 group">
                        <Zap size={32} className="text-slate-800 mb-4 group-hover:text-[#C5A059] transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Storage Empty</span>
                        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-widest">Initialise properties or use Auto-Sync</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {formData.specifications.map((spec, index) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              key={index} 
                              className="group flex gap-3 items-center bg-black/40 p-3 rounded-[24px] border border-white/5 transition-all hover:border-[#C5A059]/20 shadow-inner"
                            >
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <input 
                                  placeholder="Property" 
                                  value={spec.key} 
                                  onChange={e => {
                                    const newSpecs = [...formData.specifications];
                                    newSpecs[index].key = e.target.value;
                                    setFormData({...formData, specifications: newSpecs});
                                  }} 
                                  className="w-full rounded-xl bg-[#050816] border border-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#F1D28C] focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-800"
                                />
                                <input 
                                  placeholder="Scalar" 
                                  value={spec.value} 
                                  onChange={e => {
                                    const newSpecs = [...formData.specifications];
                                    newSpecs[index].value = e.target.value;
                                    setFormData({...formData, specifications: newSpecs});
                                  }} 
                                  className="w-full rounded-xl bg-[#050816] border border-white/5 px-4 py-3 text-[10px] font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all placeholder:text-slate-800"
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newSpecs = formData.specifications.filter((_, i) => i !== index);
                                  setFormData({...formData, specifications: newSpecs});
                                }}
                                className="h-10 w-10 flex items-center justify-center rounded-xl text-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={18} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-8">
                    <div className="bg-white/[0.02] rounded-[40px] p-10 border border-white/5 shadow-inner">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Classification Path</label>
                      <div className="flex gap-4 mt-6">
                        <div className="flex-1 relative">
                          <select 
                            disabled={formData.isNewCategory}
                            value={formData.categoryId} 
                            onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                            className="w-full h-16 rounded-[24px] bg-[#050816] border border-white/10 px-8 font-black text-[11px] uppercase tracking-widest text-[#F1D28C] disabled:opacity-30 outline-none focus:border-[#C5A059]/40 transition-all appearance-none cursor-pointer"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id} className="bg-[#0B1220]">{cat.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, isNewCategory: !formData.isNewCategory})}
                          className={cn(
                            "h-16 px-10 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] transition-all",
                            formData.isNewCategory ? "bg-rose-500/20 text-rose-500 border border-rose-500/40" : "bg-white text-[#050816] hover:scale-[1.02] active:scale-[0.98]"
                          )}
                        >
                          {formData.isNewCategory ? 'Cancel Path' : 'New Classification'}
                        </button>
                      </div>
                      {formData.isNewCategory && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6"
                        >
                          <input 
                            required 
                            autoFocus
                            value={formData.newCategoryName} 
                            onChange={e => setFormData({...formData, newCategoryName: e.target.value})}
                            className="w-full rounded-[24px] bg-[#050816] border border-[#C5A059]/40 px-8 py-5 font-black text-white outline-none shadow-[0_0_30px_rgba(197,160,89,0.1)] placeholder:text-slate-800"
                            placeholder="Designate New Classification Name..."
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 bg-white/[0.02] rounded-[40px] p-10 border border-white/5 shadow-inner">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Market Valuation (AMD)</label>
                        <div className="relative">
                          <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full h-16 rounded-[24px] bg-[#050816] border border-white/10 px-8 font-display font-black text-2xl text-[#F1D28C] focus:border-[#C5A059] outline-none transition-all shadow-inner" placeholder="0" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Prior Valuation</label>
                        <div className="relative">
                          <input type="number" value={formData.oldPrice} onChange={e => setFormData({...formData, oldPrice: e.target.value})} className="w-full h-16 rounded-[24px] bg-[#050816] border border-white/10 px-8 font-display font-black text-xl text-slate-700 line-through focus:border-white/20 outline-none transition-all shadow-inner" placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Optic Array (Source URL)</label>
                    <div className="flex gap-6 items-center bg-white/[0.02] p-6 rounded-[32px] border border-white/5">
                      <div className="flex-1">
                        <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full h-14 rounded-2xl bg-[#050816] border border-white/10 px-6 font-medium text-white focus:border-[#C5A059]/40 outline-none transition-all" placeholder="https://..." />
                      </div>
                      {formData.image ? (
                        <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          <img 
                            referrerPolicy="no-referrer"
                            src={formData.image} 
                            alt="Preview" 
                            className="h-full w-full object-contain p-2 bg-[#050816]" 
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 flex items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5">
                           <ImageIcon size={24} className="text-slate-800" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Cross-Node Indexing</label>
                        <p className="text-[9px] text-slate-700 font-bold mt-1 uppercase tracking-widest">Global store distribution mapping</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, additionalUrls: [...formData.additionalUrls, { url: '', storeId: '' }]})}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-[#050816] text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                      >
                        <PlusCircle size={14} />
                        Append Node
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.additionalUrls.length === 0 && (
                        <div className="flex items-center justify-center py-12 rounded-[32px] border border-dashed border-white/10 bg-black/20">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 italic">No Satellite Nodes Configured</span>
                        </div>
                      )}
                      
                      {formData.additionalUrls.map((item, index) => (
                        <div key={index} className="flex gap-4 group bg-white/[0.02] p-5 rounded-[32px] border border-white/5 shadow-inner hover:border-white/10 transition-all">
                          <div className="flex-1 flex flex-col gap-4">
                            <input 
                              value={item.url} 
                              onChange={e => {
                                const newUrls = [...formData.additionalUrls];
                                newUrls[index].url = e.target.value;
                                setFormData({...formData, additionalUrls: newUrls});
                              }}
                              className="w-full h-12 rounded-xl bg-[#050816] border border-white/5 px-6 font-medium text-[11px] text-white focus:border-[#C5A059]/40 outline-none transition-all" 
                              placeholder="Peripheral Store URL..." 
                            />
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                <Tag size={16} className="text-slate-500" />
                              </div>
                              <div className="flex-1 relative">
                                <select 
                                  value={item.storeId}
                                  onChange={e => {
                                    const newUrls = [...formData.additionalUrls];
                                    newUrls[index].storeId = e.target.value;
                                    setFormData({...formData, additionalUrls: newUrls});
                                  }}
                                  className="w-full h-12 rounded-xl bg-[#050816] border border-white/5 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 focus:border-[#C5A059]/40 outline-none transition-all appearance-none cursor-pointer"
                                >
                                  <option value="" className="bg-[#0B1220]">Auto-Detect Authority</option>
                                  {stores.map(store => (
                                    <option key={store.id} value={store.id} className="bg-[#0B1220]">{store.name}</option>
                                  ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              const newUrls = formData.additionalUrls.filter((_, i) => i !== index);
                              setFormData({...formData, additionalUrls: newUrls});
                            }}
                            className="w-16 flex items-center justify-center rounded-[24px] bg-rose-500/10 text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all shadow-xl group/del"
                          >
                            <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-10">
                  <button type="submit" className="flex-1 h-18 rounded-[24px] bg-[#C5A059] font-black text-[11px] uppercase tracking-[0.3em] text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">Archive Data Node</button>
                  <button type="button" onClick={resetForm} className="h-18 px-12 rounded-[24px] bg-white/5 border border-white/10 font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:bg-white/10 hover:text-white transition-all">{t('cancel')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
