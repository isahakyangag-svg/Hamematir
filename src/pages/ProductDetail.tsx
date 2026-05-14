import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ExternalLink, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Star, 
  Bell, 
  TrendingDown, 
  ArrowRight,
  Info,
  CheckCircle2,
  ChevronRight,
  Home,
  ShoppingCart,
  X
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = (process.env as any).GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const getStoreInfo = (url: string) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    if (domain.includes('zigzag')) return { name: 'ZigZag', logo: 'https://www.zigzag.am/static/version1709633857/frontend/Magento/luma/hy_AM/images/logo.svg' };
    if (domain.includes('vega')) return { name: 'VEGA', logo: 'https://vega.am/static/version1709633857/frontend/Magento/luma/hy_AM/images/logo.svg' };
    if (domain.includes('mobilecentre')) return { name: 'Mobile Centre', logo: 'https://www.mobilecentre.am/images/logo.png' };
    if (domain.includes('vlv')) return { name: 'VLV', logo: 'https://vlv.am/skin/frontend/vlv/default/images/logo.png' };
    
    // Capitalize domain as fallback name
    const name = domain.split('.')[0].toUpperCase();
    return { name, logo: null };
  } catch (e) {
    return { name: 'Online Store', logo: null };
  }
};

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [product, setProduct] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stores, setStores] = useState<Record<string, {name: string, logo?: string}>>({});
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({ targetPrice: '', email: '' });
  const [alertStatus, setAlertStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const fetchProduct = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const specifications = data.specifications || {};
        setProduct({
          id: docSnap.id,
          ...data,
          specs: [
            ...Object.entries(specifications).map(([label, value]) => ({ label, value })),
            { label: t('category'), value: data.categoryId || 'General' },
          ]
        });

        // Real-time listener for offers
        const offersUnsubscribe = onSnapshot(
          collection(db, `products/${id}/offers`),
          (snapshot) => {
            const offersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOffers(offersList);
            
            // Auto-sync if any price is missing and not already syncing
            if (!syncing && offersList.some((o: any) => !o.price || o.price === 0)) {
               syncPrices(id);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `products/${id}/offers`);
          }
        );

        // Fetch price history manually (less frequent updates needed)
        const historySnap = await getDocs(
          query(collection(db, `products/${id}/price_history`), orderBy('date', 'asc'), limit(30))
        );
        
        if (!historySnap.empty) {
          setHistoryData(historySnap.docs.map(doc => ({
            ...doc.data(),
            date: new Date(doc.data().date.seconds * 1000).toLocaleDateString('hy-AM', { month: 'short', day: 'numeric' })
          })));
        } else {
          // Generate mock history for visual demo if none exists
          const basePrice = data.mainPrice || 450000;
          const mockHistory = Array.from({ length: 7 }).map((_, i) => ({
            date: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('hy-AM', { month: 'short', day: 'numeric' }),
            minPrice: basePrice * (1 + (Math.random() * 0.1 - 0.05)),
            avgPrice: basePrice * (1 + (Math.random() * 0.05))
          }));
          setHistoryData(mockHistory);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `products/${id}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const snap = await getDocs(collection(db, 'stores'));
        if (!snap.empty) {
          const storeMap: any = {};
          snap.docs.forEach(doc => {
            storeMap[doc.id] = { id: doc.id, ...doc.data() };
          });
          setStores(storeMap);
        }
      } catch (e) {}
    };
    fetchStores();
  }, []);

  useEffect(() => {
    if (!id) return;
    
    let unsubProd: (() => void) | undefined;
    let unsubOffers: (() => void) | undefined;

    const initProduct = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'products', id);
        
        // Listener for the main product document
        unsubProd = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const specifications = data.specifications || {};
            setProduct(prev => ({
              id: docSnap.id,
              ...data,
              specs: [
                ...Object.entries(specifications).map(([label, value]) => ({ label, value })),
                { label: t('category'), value: data.categoryId || 'General' },
              ]
            }));
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `products/${id}`);
          setLoading(false);
        });

        // Listener for offers
        unsubOffers = onSnapshot(
          collection(db, `products/${id}/offers`),
          (snapshot) => {
            const offersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOffers(offersList);
            
            if (offersList.some((o: any) => !o.price || o.price === 0)) {
              syncPrices(id);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `products/${id}/offers`);
          }
        );

        // Fetch history (separate async call)
        getDocs(query(collection(db, `products/${id}/price_history`), orderBy('date', 'asc'), limit(30)))
          .then(historySnap => {
            if (!historySnap.empty) {
              const rawData = historySnap.docs.map(doc => {
                const d = doc.data();
                return {
                  ...d,
                  date: d.date?.seconds 
                    ? new Date(d.date.seconds * 1000).toLocaleDateString('hy-AM', { month: 'short', day: 'numeric' }) 
                    : 'N/A',
                  timestamp: d.date?.seconds || 0
                };
              });
              setHistoryData(rawData);
            }
          })
          .catch(err => console.error("History fetch failed:", err));

      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `products/${id}`);
        setLoading(false);
      }
    };

    initProduct();

    return () => {
      if (unsubProd) unsubProd();
      if (unsubOffers) unsubOffers();
    };
  }, [id, t]);

  const getStoreInfoLocal = (url: string, storeId?: string) => {
    if (storeId && stores[storeId]) {
      return stores[storeId];
    }
    return getStoreInfo(url);
  };

  const syncPrices = async (productId: string) => {
    if (syncing) return;
    setSyncing(true);
    try {
      // 1. Try server-side sync (FAST)
      const response = await fetch(`/api/sync/product/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 2. Refresh local offer data
      const offersSnap = await getDocs(collection(db, `products/${productId}/offers`));
      const freshOffers: any[] = offersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOffers(freshOffers);

      // 3. If any offer still has no price, try AI on frontend (SMART)
      const ai = getAI();
      let updatedAnyOffer = false;
      if (ai) {
        for (const offer of freshOffers.filter((o: any) => !o.price || o.price === 0)) {
          console.log(`🤖 Using AI to extract price for: ${offer.url}`);
          try {
            // Get text via proxy
            const proxyRes = await fetch('/api/proxy/text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: offer.url })
            });
            const data = await proxyRes.json();
            const text = data.text || '';

            // Extract with Gemini
            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Find the current price of the product on this page text.
              Return JSON with key "price" (number). If not found, return {"price": 0}.
              CURRENCY IS AMD unless specified.
              
              TEXT: ${text.slice(0, 5000)}`,
              config: { responseMimeType: "application/json" }
            });

            const aiData = JSON.parse(result.text);
            if (aiData.price > 0) {
              await updateDoc(doc(db, `products/${productId}/offers`, offer.id), {
                price: Number(aiData.price),
                lastUpdated: serverTimestamp()
              });
              updatedAnyOffer = true;
              console.log(`✅ AI found price: ${aiData.price}`);
            }
          } catch (e) {
            console.error('AI Extraction failed on frontend:', e);
          }
        }
      }

      // 4. Fallback: Find lowest price among all available offers and update mainPrice if lower
      let offersToEvaluate = freshOffers;
      if (updatedAnyOffer) {
        const latestSnap = await getDocs(collection(db, `products/${productId}/offers`));
        offersToEvaluate = latestSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOffers(offersToEvaluate);
      }

      const validPrices = offersToEvaluate
        .map((o: any) => Number(o.price))
        .filter(p => !isNaN(p) && p > 0);

      if (validPrices.length > 0) {
        const minObservedPrice = Math.min(...validPrices);
        const currentMainPrice = product?.mainPrice || 0;

        // Update if the observed min price is different from current mainPrice
        if (minObservedPrice > 0 && minObservedPrice !== currentMainPrice) {
          console.log(`📉 Price change detected (${currentMainPrice} -> ${minObservedPrice}), updating product mainPrice...`);
          await updateDoc(doc(db, 'products', productId), {
            mainPrice: minObservedPrice,
            updatedAt: serverTimestamp()
          });
          
          // Also record in price_history if it's a significant change or we don't have recent history
          try {
            await addDoc(collection(db, `products/${productId}/price_history`), {
              minPrice: minObservedPrice,
              avgPrice: validPrices.reduce((a, b) => a + b, 0) / validPrices.length,
              date: serverTimestamp()
            });
          } catch (historyErr) {
            console.error("Failed to append to price history:", historyErr);
          }
        }
      }

      // Final refresh for product data
      const productSnap = await getDoc(doc(db, 'products', productId));
      if (productSnap.exists()) {
        const finalData = productSnap.data();
        setProduct((prev: any) => ({ ...prev, ...finalData }));
      }
    } catch (error) {
      console.error('Failed to sync prices:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubscribeAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    setAlertStatus('submitting');
    try {
      await addDoc(collection(db, 'price_alerts'), {
        productId: id,
        userId: auth.currentUser.uid,
        email: alertForm.email || auth.currentUser.email,
        targetPrice: Number(alertForm.targetPrice),
        currentPrice: product?.mainPrice,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setAlertStatus('success');
      setTimeout(() => {
        setShowAlertModal(false);
        setAlertStatus('idle');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'price_alerts');
      setAlertStatus('idle');
    }
  };

  if (loading) return (
    <div className="space-y-12 pb-24">
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
        <div className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <Skeleton className="h-[400px] w-full rounded-[40px] xl:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-[40px]" />
          <Skeleton className="h-[100px] w-full rounded-[40px]" />
        </div>
      </section>
    </div>
  );
  
  if (!product) return <div className="py-24 text-center font-black">Product Not Found</div>;

  return (
    <div className="bg-[#070B14] min-h-screen text-white selection:bg-amber-500/30">
      {/* Background Decor */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 space-y-16 pb-32">
        {/* breadcrumbs */}
        <nav className="flex items-center gap-3 pt-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
          <Link to="/" className="flex items-center gap-2 transition-all hover:text-amber-500">
            <Home size={12} />
            {t('home')}
          </Link>
          <ChevronRight size={10} className="text-white/30" />
          <Link 
            to={`/search?q=${encodeURIComponent(product.categoryId)}`} 
            className="transition-all hover:text-amber-500"
          >
            {product.categoryId}
          </Link>
          <ChevronRight size={10} className="text-white/30" />
          <span className="text-white/70 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Hero Section */}
        <section className="grid grid-cols-1 gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square overflow-hidden rounded-[3rem] bg-[#0B1220] border border-white/5 shadow-2xl flex items-center justify-center p-12"
            >
              {/* Luxury Lighting */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
              
              {product.image ? (
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  src={product.image} 
                  alt={product.name} 
                  referrerPolicy="no-referrer"
                  className="max-h-full w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
                />
              ) : (
                <ShoppingCart className="text-white/5" size={120} />
              )}

              <div className="absolute top-8 left-8 flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 shadow-2xl">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {t('price_trend')}
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-7 space-y-10">
             <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl leading-[1.05] selection:bg-amber-500 selection:text-black">
                    {product.name}
                  </h1>
                  <p className="mt-8 text-lg leading-relaxed text-white/80 font-medium max-w-2xl">
                    {product.description || t('product:default_description', "Премиальное качество и высокая производительность. Официальная гарантия от производителя и полная поддержка пользователей.")}
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/5 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent" />
                  
                  <div className="flex flex-wrap items-center gap-12 relative z-10">
                    <div className="space-y-2">
                      {product.oldPrice && product.oldPrice > (product.mainPrice || 0) && (
                        <span className="text-2xl font-black text-white/40 line-through decoration-white/20 block tracking-tighter">
                           {format(product.oldPrice)}
                        </span>
                      )}
                      <div className="flex items-baseline gap-3">
                        <span 
                          className={cn(
                            "text-6xl font-black tracking-tighter",
                            product.oldPrice ? "text-amber-500" : "text-white"
                          )}
                        >
                          {format(product.mainPrice || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5 min-w-[240px]">
                      <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-6 py-4 border border-white/5">
                         <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                         <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">{t('available')}</span>
                      </div>
                      <button 
                        onClick={() => setShowAlertModal(true)}
                        className="flex items-center justify-center gap-4 rounded-2xl bg-amber-500 px-8 py-5 font-black text-black hover:bg-amber-400 transition-all shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)] active:scale-95 group/btn"
                      >
                        <Bell size={18} className="group-hover/btn:animate-shake" />
                        <span className="text-[11px] uppercase tracking-[0.2em]">{t('track_price')}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-center gap-5 bg-white/5 rounded-[2rem] p-6 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 group">
                     <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={28} />
                     </div>
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{t('product:warranty_label', 'Warranty')}</p>
                       <p className="text-sm font-black text-white">{t('product:official_warranty', 'Official 12 Months')}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-5 bg-white/5 rounded-[2rem] p-6 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 group">
                     <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Truck size={28} />
                     </div>
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{t('product:shipping_label', 'Delivery')}</p>
                       <p className="text-sm font-black text-white">{t('product:shipping_today', 'Instant Delivery')}</p>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </section>

      {/* Analytics & Insight Cards */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
         {/* Price History Card */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="rounded-[3.5rem] border border-white/5 bg-[#0B1220]/50 backdrop-blur-xl p-10 shadow-2xl overflow-hidden relative group"
         >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                 <h3 className="text-2xl font-black text-white tracking-tight">{t('price_history')}</h3>
                 <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mt-2">{t('price_history_subtitle')}</p>
              </div>
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t('product:min_price', 'Min')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t('product:avg_price', 'Avg')}</span>
                  </div>
              </div>
            </div>
            
            <div className="h-[340px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                   <defs>
                     <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis 
                     dataKey="date" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 9, fontWeight: 900, fill: '#ffffff33' }}
                     dy={20}
                   />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ 
                       background: '#0B1220',
                       borderRadius: '24px', 
                       border: '1px solid rgba(255,255,255,0.1)', 
                       boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                       padding: '20px'
                     }}
                     itemStyle={{ color: '#f59e0b', fontSize: '13px', fontWeight: '900' }}
                     labelStyle={{ fontWeight: 'black', marginBottom: '8px', fontSize: '14px', color: 'white' }}
                     formatter={(value: any) => [format(value), '']}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="minPrice" 
                     stroke="#f59e0b" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorMin)" 
                   />
                   <Line 
                     type="monotone" 
                     dataKey="avgPrice" 
                     stroke="#ffffff10" 
                     strokeWidth={2} 
                     strokeDasharray="10 10" 
                     dot={false}
                   />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </motion.div>

         {/* Subscribe Card */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="rounded-[3.5rem] bg-[#0B1220] p-12 text-white shadow-2xl border border-white/5 relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.07] rounded-full blur-[100px] -mr-64 -mt-64 transition-all duration-1000 group-hover:bg-amber-500/[0.12]" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10">
                 <Bell size={32} className="text-amber-500" />
              </div>
              <h3 className="mt-10 text-4xl font-black tracking-tight leading-tight">{t('subscribe_alert_title')}</h3>
              <p className="mt-6 text-lg font-medium text-white/80 leading-relaxed max-w-sm">
                {t('subscribe_alert_desc')}
              </p>
              
              <div className="mt-auto pt-16 space-y-5">
                <button 
                  onClick={() => setShowAlertModal(true)}
                  className="flex w-full items-center justify-center gap-4 rounded-2xl bg-white text-black py-6 font-black transition-all hover:bg-amber-500 shadow-xl active:scale-[0.98]"
                >
                  <span className="text-sm uppercase tracking-[0.2em]">{t('set_alert_btn')}</span>
                  <ArrowRight size={20} />
                </button>
                <div className="flex items-center justify-center gap-4 bg-white/5 py-5 rounded-2xl border border-white/5 transition-all hover:bg-white/10 cursor-pointer group/tg">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover/tg:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.98-.75 3.84-1.67 6.41-2.77 7.7-3.3 3.66-1.51 4.42-1.77 4.92-1.78.11 0 .36.03.52.16.14.11.18.25.19.38 0 .07.01.21 0 .34z"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 group-hover/tg:text-white transition-colors">{t('telegram_channel')}</span>
                </div>
              </div>
            </div>
         </motion.div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparison">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white mb-3">
              {t('price_comparison')}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-bold text-white/70 text-sm">
                {offers.length > 0 
                  ? t('offers_from_stores', { count: new Set(offers.map(o => getStoreInfoLocal(o.url, o.storeId).name)).size, defaultValue: 'Offers from stores' })
                  : syncing ? t('searching_prices', 'Searching current prices...') : t('no_offers_yet', 'No available offers yet')}
              </p>
              <button 
                onClick={() => id && syncPrices(id)}
                disabled={syncing}
                className={cn(
                  "flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-500 transition-all hover:bg-white/10 hover:border-amber-500/30 active:scale-95 shadow-sm",
                  syncing && "opacity-50"
                )}
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                {syncing ? t('syncing_action', 'Syncing...') : t('refresh_prices', 'Refresh Prices')}
              </button>
            </div>
          </div>
          
          {product.mainPrice > 0 && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative flex items-center gap-6 bg-[#0B1220] px-8 py-5 rounded-2xl border border-amber-500/20 shadow-xl shadow-amber-500/5">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-1">{t('lowest_found')}</p>
                  <p className="text-3xl font-black text-amber-500 tabular-nums">{format(product.mainPrice)}</p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-amber-500 text-black shadow-lg shadow-amber-500/20">
                  <TrendingDown size={20} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-hidden rounded-[3rem] bg-[#0B1220]/40 backdrop-blur-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{t('magazine_store')}</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hidden xl:table-cell">{t('product_status')}</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{t('offer_price')}</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/70"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {offers.length > 0 ? (
                  (() => {
                    const sorted = [...offers].sort((a,b) => (a.price || Infinity) - (b.price || Infinity));
                    const seenStores = new Map<string, any>();
                    const filtered = sorted.filter(offer => {
                      const info = getStoreInfoLocal(offer.url, offer.storeId);
                      // Aggressive normalization: uppercase, remove spaces, remove dots/dashes
                      const normalizedName = (info.name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                      
                      const existing = seenStores.get(normalizedName);
                      if (existing) {
                         // If we already saw this store, but current offer has a real storeId (not auto), swap it if existing is auto
                         if (offer.storeId !== 'auto' && existing.offer.storeId === 'auto') {
                            seenStores.set(normalizedName, { offer, info });
                         }
                         return false;
                      }
                      
                      seenStores.set(normalizedName, { offer, info });
                      return true;
                    });
                    
                    // Convert back to array while preserving sort order (if possible)
                    // Actually we just want to render the map values in the original sorted order
                    const finalOffers = sorted.filter(o => {
                       const info = getStoreInfoLocal(o.url, o.storeId);
                       const normalizedName = (info.name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                       return seenStores.get(normalizedName)?.offer.id === o.id;
                    });
                    
                    return finalOffers.map((offer, idx) => {
                      const storeInfo = getStoreInfoLocal(offer.url, offer.storeId);
                      const isLowest = idx === 0 && offer.price > 0;
                      return (
                        <tr 
                          key={offer.id} 
                          className={cn(
                            "group transition-all duration-300",
                            isLowest ? "bg-amber-500/5" : "hover:bg-white/5"
                          )}
                        >
                          <td className="px-12 py-12">
                            <div className="flex items-center gap-8">
                               <div className="relative shrink-0">
                                 <div className="h-20 w-20 rounded-[2rem] bg-white/5 backdrop-blur-xl shadow-lg border border-white/10 flex items-center justify-center p-3 transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:border-amber-500/30 group-hover:-rotate-3">
                                   {storeInfo.logo ? (
                                     <img 
                                       referrerPolicy="no-referrer"
                                       src={storeInfo.logo} 
                                       alt={storeInfo.name} 
                                       className="h-full w-full object-contain" 
                                     />
                                   ) : (
                                     <div className="h-full w-full rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-white/20">
                                       {storeInfo.name?.substring(0, 2)}
                                     </div>
                                   )}
                                   {isLowest && (
                                     <motion.div 
                                       initial={{ scale: 0 }}
                                       animate={{ scale: 1 }}
                                       className="absolute -top-2 -right-2 rounded-full bg-amber-500 p-1.5 text-black ring-4 ring-[#0B1220] shadow-lg z-10"
                                     >
                                        <Star size={12} fill="currentColor" />
                                     </motion.div>
                                   )}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-1.5">
                                  <span className="text-xl font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{storeInfo.name}</span>
                                  <div className="flex items-center gap-2">
                                     <div className="flex gap-1">
                                       {[1,2,3,4,5].map(s => (
                                         <Star key={s} size={11} fill={s <= 4 ? "#f59e0b" : "none"} className={s <= 4 ? "text-amber-500" : "text-white/10"} />
                                       ))}
                                     </div>
                                     <span className="text-[10px] font-black uppercase tracking-widest pl-1 text-white/60">{t('verified_store', 'Verified Store')}</span>
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-12 py-12 hidden xl:table-cell">
                            <div className="flex flex-col gap-2">
                              {offer.inStock === false ? (
                                <span className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all bg-red-500/10 text-red-400 border border-red-500/20">
                                   {t('out_of_stock', 'Out of Stock')}
                                </span>
                              ) : (
                                <span className={cn(
                                  "inline-flex w-fit items-center gap-2 rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                  (offer.price > 0) ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-white/5 text-white/50"
                                )}>
                                  {(offer.price > 0) ? t('available', 'Available') : t('syncing', 'Syncing...')}
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-white/60 pl-1">{t('updated_recently')}</span>
                            </div>
                          </td>
                          <td className="px-12 py-12">
                            <div className="flex flex-col gap-1.5">
                               <span className={cn(
                                 "text-3xl font-black tabular-nums tracking-tighter transition-colors",
                                 isLowest ? "text-amber-500" : "text-white"
                               )}>
                                 {offer.price > 0 ? format(offer.price) : '---'}
                               </span>
                               {isLowest && (
                                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500/70">
                                     <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                                     {t('lowest_price', 'Лучшая цена')}
                                  </span>
                               )}
                            </div>
                          </td>
                          <td className="px-12 py-12 text-right">
                            <a 
                              href={offer.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={cn(
                                "inline-flex h-16 items-center gap-3 rounded-2xl pl-10 pr-8 text-xs font-black uppercase tracking-[0.2em] text-black shadow-xl transition-all hover:scale-105 active:scale-95",
                                isLowest ? "bg-amber-500 shadow-amber-500/10 hover:bg-amber-400 hover:shadow-amber-500/30" : "bg-white text-black hover:bg-white/90"
                              )}
                            >
                              {t('to_magazine', 'В магазин')}
                              <ChevronRight size={18} />
                            </a>
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan={4} className="px-12 py-32 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 text-white/10 flex border-2 border-dashed border-white/5 italic">
                          <RefreshCw size={40} className={cn(syncing && "animate-spin")} />
                        </div>
                        <p className="text-lg font-black text-white/60 uppercase tracking-widest">
                          {syncing ? 'Сбор актуальных данных от магазинов...' : 'Актуальные предложения еще не обнаружены'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      {(product.specifications && Object.keys(product.specifications).length > 0) && (
        <section>
          <div className="rounded-[4rem] border border-white/5 bg-[#0B1220]/40 backdrop-blur-3xl p-16 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-16 relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                  <Info size={36} />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-white tracking-tight">{t('specifications')}</h3>
                  <p className="text-sm font-black text-white/70 uppercase tracking-[0.2em] mt-2">{t('product:technical_info', 'Technical details & Specifications')}</p>
                </div>
              </div>
              <div className="hidden md:flex flex-col text-right">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">{t('product:category_label', 'Category')}</span>
                 <span className="text-sm font-black text-amber-500 border-r-4 border-amber-500 pr-5 mt-2 inline-block uppercase tracking-widest">{product.categoryId}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-3 relative z-10">
              {Object.entries(product.specifications).map(([label, value]: [string, any], i) => (
                <motion.div 
                  initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  key={label} 
                  className="group flex items-center justify-between py-6 border-b border-white/5 transition-all hover:bg-white/[0.03] hover:px-6 hover:rounded-2xl"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 group-hover:text-white/40 transition-colors">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5 group-hover:border-amber-500/20">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Price Alert Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070B14]/80 backdrop-blur-2xl p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[4rem] bg-[#0B1220] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10"
            >
              {/* Luxury Accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              
              <button 
                onClick={() => setShowAlertModal(false)}
                className="absolute right-10 top-10 rounded-2xl bg-white/5 p-4 text-white/20 transition-all hover:bg-white/10 hover:text-white active:scale-95 border border-white/5"
              >
                <X size={24} />
              </button>

              {alertStatus === 'success' ? (
                <div className="py-16 text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-10 flex h-28 w-28 items-center justify-center rounded-full bg-amber-500 text-black shadow-[0_0_50px_rgba(245,158,11,0.3)]"
                  >
                    <CheckCircle2 size={56} />
                  </motion.div>
                  <h2 className="text-5xl font-black text-white tracking-tight">{t('product:alert_active', 'Active!')}</h2>
                  <p className="mt-6 text-xl font-medium text-white/80">{t('product:alert_active_desc', 'We will notify you instantly.')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-12 text-center">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/5">
                      <Bell size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight">{t('subscribe_alert_title')}</h2>
                    <p className="mt-4 text-white/70 font-medium leading-relaxed max-w-sm mx-auto">{t('subscribe_alert_desc')}</p>
                  </div>

                  <form onSubmit={handleSubscribeAlert} className="space-y-8">
                    <div className="space-y-6">
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 transition-all focus-within:border-amber-500/30">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 ml-2 mb-3 block">{t('target_price')} (AMD)</label>
                        <div className="relative group">
                           <input 
                            required 
                            type="number" 
                            value={alertForm.targetPrice} 
                            onChange={e => setAlertForm({...alertForm, targetPrice: e.target.value})}
                            className="w-full bg-transparent p-0 text-3xl font-black text-white outline-none placeholder:text-white/10"
                            placeholder={`${Math.round(product.mainPrice * 0.9)}`}
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 font-black text-white/10 text-xl tracking-widest">AMD</div>
                        </div>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 transition-all focus-within:border-amber-500/30">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 ml-2 mb-3 block">{t('email_address')}</label>
                        <input 
                          required 
                          type="email" 
                          value={alertForm.email} 
                          onChange={e => setAlertForm({...alertForm, email: e.target.value})}
                          className="w-full bg-transparent p-0 text-xl font-bold text-white outline-none placeholder:text-white/10"
                          placeholder="your.email@premium.com"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        disabled={alertStatus === 'submitting'}
                        className="w-full rounded-[2rem] bg-amber-500 py-6 font-black text-black shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-[0.2em]"
                      >
                        {alertStatus === 'submitting' ? t('ui:processing', 'Processing...') : t('ui:subscribe', 'Set Tracking')}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

const MOCK_COMPARISONS = [
  { id: 'm1', storeName: 'ZigZag', storeLogo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=100', price: 449000, availability: 'In Stock', rating: 4.8 },
  { id: 'm2', storeName: 'VEGA', storeLogo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=100', price: 452000, availability: 'In Stock', rating: 4.5 },
  { id: 'm3', storeName: 'Mobile Centre', storeLogo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=100', price: 455000, availability: 'Call for Info', rating: 4.9 },
  { id: 'm4', storeName: 'Ucom', storeLogo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=100', price: 469000, availability: 'In Stock', rating: 4.2 },
];

export default ProductDetail;
