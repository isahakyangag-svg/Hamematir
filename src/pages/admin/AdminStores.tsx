import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Store as StoreIcon,
  Wand2,
  Download,
  Edit,
  Clock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { simulateScrape } from '../../services/geminiService';

interface Store {
  id: string;
  name: string;
  nameRu?: string;
  nameAm?: string;
  nameEn?: string;
  slug?: string;
  logo?: string;
  baseUrl: string;
  searchUrl?: string;
  website?: string;
  description?: string;
  descRu?: string;
  descEn?: string;
  descAm?: string;
  status: 'active' | 'inactive';
  lastParsed?: any;
}

const AdminStores: React.FC = () => {
  const { t } = useTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<string | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'ru' | 'en' | 'am'>('ru');
  const [parsingProgress, setParsingProgress] = useState<Record<string, number>>({});
  const [parsingStatus, setParsingStatus] = useState<Record<string, string>>({});
  const [newStore, setNewStore] = useState({ 
    name: '', 
    nameRu: '', 
    nameAm: '', 
    nameEn: '', 
    slug: '',
    baseUrl: '', 
    searchUrl: '', 
    logo: '',
    descRu: '',
    descAm: '',
    descEn: ''
  });
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    nameRu: '', 
    nameAm: '', 
    nameEn: '', 
    slug: '',
    baseUrl: '', 
    searchUrl: '', 
    logo: '',
    descRu: '',
    descAm: '',
    descEn: ''
  });

  // Magic Site States
  const [isMagicAdding, setIsMagicAdding] = useState(false);
  const [magicUrl, setMagicUrl] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicLog, setMagicLog] = useState<string[]>([]);
  const [magicProgress, setMagicProgress] = useState({ current: 0, total: 0, status: '' });

  const fetchStores = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'stores'));
      setStores(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'stores');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const isValidUrl = (url: string) => {
    if (!url) return true; // Optional fields
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(newStore.baseUrl)) {
      alert("Invalid Store URL");
      return;
    }
    
    try {
      const slug = newStore.slug.trim() || createSlug(newStore.nameRu || newStore.name);
      const storeData = { 
        ...newStore, 
        slug,
        name: newStore.nameRu || newStore.name,
        description: newStore.descRu,
        status: 'active',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'stores'), storeData);
      setNewStore({ 
        name: '', nameRu: '', nameAm: '', nameEn: '', 
        slug: '', baseUrl: '', searchUrl: '', logo: '',
        descRu: '', descAm: '', descEn: ''
      });
      setIsAdding(false);
      fetchStores();
      
      // Auto-trigger parsing immediately for the new store
      runParser(docRef.id, storeData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stores');
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const slug = editFormData.slug.trim() || createSlug(editFormData.nameRu || editFormData.name);
      await updateDoc(doc(db, 'stores', editingId), {
        ...editFormData,
        slug,
        name: editFormData.nameRu || editFormData.name,
        description: editFormData.descRu,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      fetchStores();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${editingId}`);
    }
  };

  const startEditing = (store: Store) => {
    setEditFormData({
      name: store.name || '',
      nameRu: store.nameRu || store.name || '',
      nameAm: store.nameAm || '',
      nameEn: store.nameEn || '',
      slug: store.slug || '',
      baseUrl: store.baseUrl || '',
      searchUrl: store.searchUrl || '',
      logo: store.logo || '',
      descRu: store.descRu || store.description || '',
      descAm: store.descAm || '',
      descEn: store.descEn || ''
    });
    setEditingId(store.id);
  };

  const handleDelete = async (id: string) => {
    setDeletingStoreId(id);
    try {
      await deleteDoc(doc(db, 'stores', id));
      setStores(prev => prev.filter(s => s.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${id}`);
    } finally {
      setDeletingStoreId(null);
    }
  };

  const deleteAllStores = async () => {
    if (!window.confirm("DANGER: This will delete ALL stores. Continue?")) return;
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This cannot be undone.")) return;
    
    setDeletingAll(true);
    try {
      const snap = await getDocs(collection(db, 'stores'));
      if (snap.empty) return;
      
      const batchSize = 500;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batchDocs = docs.slice(i, i + batchSize);
        const batch = writeBatch(db);
        batchDocs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      
      alert(`Deleted ${snap.size} stores.`);
      fetchStores();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'stores_mass_delete');
      alert("Error deleting stores");
    } finally {
      setDeletingAll(false);
    }
  };

  const createSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0531-\u058F\u0561-\u0587]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product-' + Math.random().toString(36).substring(2, 7);
  };

  const handleMagicSiteImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicUrl) return;
    setMagicLoading(true);
    setMagicLog(['🚀 Starting magic site discovery...']);
    setMagicProgress({ current: 0, total: 0, status: 'Scanning architecture...' });

    try {
      const hostname = new URL(magicUrl).hostname.replace('www.', '');
      const storeName = hostname.split('.')[0].toUpperCase();
      
      // Step 0: Ensure Store Record Exists
      let storeId = '';
      const existingStoresSnapshot = await getDocs(query(collection(db, 'stores'), where('baseUrl', '==', magicUrl)));
      if (!existingStoresSnapshot.empty) {
        storeId = existingStoresSnapshot.docs[0].id;
      } else {
        setMagicLog(prev => [...prev, `📝 Creating store record for ${storeName}...`]);
        const newStoreDoc = await addDoc(collection(db, 'stores'), {
          name: storeName,
          baseUrl: magicUrl,
          status: 'active',
          createdAt: serverTimestamp(),
          lastParsed: serverTimestamp()
        });
        storeId = newStoreDoc.id;
      }

      // Fetch categories first to use for matching
      const catSnap = await getDocs(collection(db, 'categories'));
      const activeCategories = catSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
      const localCreatedCats: Record<string, string> = {}; 

      const catResp = await fetch('/api/admin/scrape-store-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: magicUrl })
      });
      const catData = await catResp.json();
      const foundCats = catData.categories;

      if (!foundCats || foundCats.length === 0) {
        setMagicLog(prev => [...prev, '⚠️ No categories found. Adding as generic...']);
        // Fallback to direct home scan
        const linksResp = await fetch('/api/admin/scrape-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: magicUrl })
        });
        const { links } = await linksResp.json();
        if (links && links.length > 0) {
           await processProductBatch(links, 'General', storeId, activeCategories, localCreatedCats);
        }
      } else {
        setMagicLog(prev => [...prev, `📂 Found ${foundCats.length} major categories.`]);
        setMagicProgress({ current: 0, total: foundCats.length, status: `Crawling...` });

        for (let i = 0; i < foundCats.length; i++) {
          const cat = foundCats[i];
          setMagicLog(prev => [...prev, `🔍 Scanning category: ${cat.name}`]);
          setMagicProgress(prev => ({ ...prev, current: i + 1, status: `Category ${i+1}/${foundCats.length}` }));
          
          try {
            const linksResp = await fetch('/api/admin/scrape-category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: cat.url })
            });
            const { links } = await linksResp.json();
            if (links && links.length > 0) {
              await processProductBatch(links, cat.name, storeId, activeCategories, localCreatedCats);
            }
          } catch (e) {}
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setMagicLog(prev => [...prev, `✨ SUCCESS: Full Site Import Completed!`, 'Refreshed catalog and stores list.']);
      setMagicProgress(prev => ({ ...prev, status: 'COMPLETE' }));
      fetchStores();
    } catch (err: any) {
      setMagicLog(prev => [...prev, `❌ ERROR: ${err.message}`]);
    } finally {
      setMagicLoading(false);
      fetchStores();
    }
  };

  const processProductBatch = async (links: string[], categoryName: string, storeId: string, activeCategories: any[], localCreatedCats: Record<string, string>) => {
    // Limit per category to keep it fast
    const batch = links.slice(0, 15); 
    for (const link of batch) {
      try {
        const scrapResp = await fetch('/api/admin/scrape-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: link })
        });
        const data = await scrapResp.json();

        if (data && data.name && data.price) {
          const priceVal = Number(data.price);
          const productId = createSlug(data.name);
          
          // Category matching logic
          let catId = '';
          const normName = categoryName.toLowerCase().trim();
          const existing = activeCategories.find(c => c.name.toLowerCase().trim() === normName);
          
          if (existing) {
            catId = existing.id;
          } else if (localCreatedCats[normName]) {
            catId = localCreatedCats[normName];
          } else {
            const newCat = await addDoc(collection(db, 'categories'), { name: categoryName, createdAt: serverTimestamp() });
            catId = newCat.id;
            localCreatedCats[normName] = catId;
          }

          const productRef = doc(db, 'products', productId);
          await setDoc(productRef, {
            name: data.name,
            model: data.model || '',
            description: data.description || '',
            categoryId: catId,
            image: data.image || '',
            sourceUrl: link,
            price: priceVal,
            mainPrice: priceVal,
            searchKeywords: [data.name.toLowerCase(), categoryName.toLowerCase()].filter(Boolean),
            updatedAt: serverTimestamp()
          }, { merge: true });

          const offerId = btoa(link).replace(/=/g, '').substring(0, 50);
          await setDoc(doc(db, 'products', productId, 'offers', offerId), {
            storeId: storeId,
            price: priceVal,
            currency: 'AMD',
            url: link,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const runParser = async (id: string, storeToParse?: { name: string; baseUrl: string; logo?: string }) => {
     // Triggering the REAL magic import using the store URL
     const store = storeToParse || stores.find(s => s.id === id);
     if (!store) return;
     
     setMagicUrl(store.baseUrl);
     setIsMagicAdding(true);
     alert(`Magic Site Import initialized for ${store.name || 'Store'}. Click "Start Full Site Crawl" to begin.`);
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:market_intelligence', 'Market Intelligence')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:market_intelligence_subtitle', 'Manage store nodes and automated price synchronization.')}</p>
        </motion.div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={deleteAllStores}
            disabled={deletingAll || !!isParsing}
            className="flex h-14 items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-6 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-rose-500/5 group"
          >
            {deletingAll ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} className="group-hover:scale-110 transition-transform" />}
            {t('admin:purge_all_nodes', 'Purge All nodes')}
          </button>
          
          <button 
            onClick={() => setIsMagicAdding(true)}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-8 text-[11px] font-black uppercase tracking-widest text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] transition-all hover:scale-105 active:scale-95 group"
          >
            <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
            {t('admin:visonary_import', 'Visonary Import')}
          </button>

          <button 
            disabled={!!isParsing}
            onClick={() => setIsAdding(true)}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-white/5 border border-white/10 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 disabled:opacity-50"
          >
            <Plus size={20} />
            {t('add_store')}
          </button>
        </div>
      </header>

      {/* Magic Store Import Modal */}
      <AnimatePresence>
        {isMagicAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !magicLoading && setIsMagicAdding(false)}
              className="absolute inset-0 bg-[#050816]/80 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-[#0B1220] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5"
            >
              <div className="absolute right-8 top-8">
                <button onClick={() => !magicLoading && setIsMagicAdding(false)} className="rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-gradient-to-br from-[#C5A059] to-[#F1D28C] text-[#050816] mb-8 font-black shadow-[0_0_40px_rgba(197,160,89,0.4)]">
                 <Wand2 size={36} />
              </div>

              <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase">{t('admin:visionary_import', 'Visionary Import')}</h2>
              <p className="mt-3 text-sm font-medium text-slate-500">{t('admin:visionary_import_subtitle', 'Autonomous directory extraction. Automated category discovery and inventory mapping.')}</p>

              <form onSubmit={handleMagicSiteImport} className="mt-10 space-y-8 text-left">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:store_execution_endpoint', 'Store Execution Endpoint')}</label>
                  <input 
                    required 
                    type="url"
                    disabled={magicLoading}
                    value={magicUrl} 
                    onChange={e => setMagicUrl(e.target.value)} 
                    placeholder="https://www.zigzag.am"
                    className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none shadow-inner"
                  />
                </div>

                {magicLoading || magicLog.length > 0 ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-[#F1D28C]">{magicProgress.status}</span>
                      {magicProgress.total > 0 && (
                        <span className="text-white">{Math.round((magicProgress.current / magicProgress.total) * 100)}%</span>
                      )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(magicProgress.current / (magicProgress.total || 1)) * 100}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-[#F1D28C] rounded-full shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-[32px] bg-black/40 border border-white/5 p-6 font-mono text-[10px] text-amber-500/80 custom-scrollbar">
                      {magicLog.map((log, i) => (
                        <div key={i} className="mb-2 leading-relaxed flex gap-3">
                          <span className="opacity-30">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!magicLoading && magicLog.length === 0 && (
                  <button 
                    type="submit" 
                    className="flex w-full h-16 items-center justify-center gap-4 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] font-black text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.3)] transition-all hover:scale-[1.02] active:scale-95 text-[11px] uppercase tracking-widest"
                  >
                    <Download size={20} />
                    {t('admin:deploy_site_crawler', 'Deploy Site Crawler')}
                  </button>
                )}

                {magicLog.length > 0 && !magicLoading && (
                   <button 
                    type="button"
                    onClick={() => {
                      setIsMagicAdding(false);
                      setMagicLog([]);
                      setMagicProgress({ current: 0, total: 0, status: '' });
                      setMagicUrl('');
                      fetchStores(); // Ensure UI is updated
                    }}
                    className="flex w-full h-16 items-center justify-center gap-4 rounded-[28px] bg-white text-black font-black hover:bg-slate-100 transition-all shadow-2xl active:scale-95 text-[11px] uppercase tracking-widest"
                  >
                    {t('admin:finalize_results', 'Finalize & View Results')}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/80 backdrop-blur-3xl p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-3xl rounded-[48px] bg-[#0B1220] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5 relative my-auto"
          >
            <button onClick={() => setIsAdding(false)} className="absolute right-8 top-8 rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/10">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase">{t('admin:initialize_node', 'Initialize Node')}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{t('admin:initialize_node_subtitle', 'Configure aggregation parameters for new market data source.')}</p>

            <form onSubmit={handleAddStore} className="mt-10 space-y-8">
              {/* Language Tabs */}
              <div className="flex gap-2 rounded-[24px] bg-white/5 p-1.5 border border-white/5 max-w-xs">
                {(['ru', 'am', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLangTab(lang)}
                    className={cn(
                      "flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                      activeLangTab === lang ? "bg-[#C5A059] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {lang === 'ru' ? 'RU' : lang === 'am' ? 'AM' : 'EN'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Name (RU)</label>
                    <input 
                      required
                      value={newStore.nameRu}
                      onChange={e => setNewStore({...newStore, nameRu: e.target.value})}
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none" 
                      placeholder="Напр. ZigZag"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Slug Identifier</label>
                    <input 
                      value={newStore.slug}
                      onChange={e => setNewStore({...newStore, slug: e.target.value})}
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none" 
                      placeholder="zigzag"
                    />
                 </div>
              </div>

              <div className="space-y-3 text-left">
                {activeLangTab === 'ru' && (
                  <>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Data Profile (RU)</label>
                    <textarea 
                      rows={3}
                      value={newStore.descRu}
                      onChange={e => setNewStore({...newStore, descRu: e.target.value})}
                      className="w-full rounded-3xl bg-white/5 border border-white/10 px-6 py-5 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none resize-none"
                    />
                  </>
                )}
                {/* AM/EN logic handled similarly in logic, we just style categories here */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Endpoint</label>
                  <input 
                    required
                    type="url"
                    value={newStore.baseUrl}
                    onChange={e => setNewStore({...newStore, baseUrl: e.target.value})}
                    className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white outline-none" 
                    placeholder="https://www.zigzag.am"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Corporate Asset (Logo)</label>
                  <input 
                    type="url"
                    value={newStore.logo}
                    onChange={e => setNewStore({...newStore, logo: e.target.value})}
                    className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white outline-none" 
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="flex gap-5 pt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-[28px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">Abort</button>
                <button type="submit" className="flex-[2] h-16 rounded-[28px] bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-2xl">Execute Creation</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

       {/* Edit Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingId(null)}
              className="absolute inset-0 bg-[#050816]/80 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-[#0B1220] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5 my-auto"
            >
               <button onClick={() => setEditingId(null)} className="absolute right-8 top-8 rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                <X size={24} />
              </button>

              <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase">Calibrate Node</h2>
              <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">Fine-tune node architecture and endpoint metrics.</p>
              
              <form onSubmit={handleUpdateStore} className="mt-10 space-y-8">
                {/* Language Tabs */}
                <div className="flex gap-2 rounded-[24px] bg-white/5 p-1.5 border border-white/5 max-w-xs mx-auto md:mx-0">
                  {(['ru', 'am', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLangTab(lang)}
                      className={cn(
                        "flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        activeLangTab === lang ? "bg-[#C5A059] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {lang === 'ru' ? 'RU' : lang === 'am' ? 'AM' : 'EN'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Alias (RU)</label>
                      <input 
                        required
                        value={editFormData.nameRu}
                        onChange={e => setEditFormData({...editFormData, nameRu: e.target.value})}
                        className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none" 
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Slug Identifier</label>
                      <input 
                        value={editFormData.slug}
                        onChange={e => setEditFormData({...editFormData, slug: e.target.value})}
                        className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none" 
                      />
                   </div>
                </div>

                {activeLangTab === 'ru' && (
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Intelligence Profile (RU)</label>
                    <textarea 
                      rows={3}
                      value={editFormData.descRu}
                      onChange={e => setEditFormData({...editFormData, descRu: e.target.value})}
                      className="w-full rounded-3xl bg-white/5 border border-white/10 px-6 py-5 font-bold text-white transition-all focus:border-amber-500/30 focus:bg-white/10 outline-none resize-none" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node URL</label>
                    <input 
                      required
                      type="url"
                      value={editFormData.baseUrl}
                      onChange={e => setEditFormData({...editFormData, baseUrl: e.target.value})}
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white outline-none" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Corporate Asset URL</label>
                    <input 
                      type="url"
                      value={editFormData.logo}
                      onChange={e => setEditFormData({...editFormData, logo: e.target.value})}
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/10 px-6 font-bold text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="flex gap-5 pt-6">
                   <button type="button" onClick={() => setEditingId(null)} className="flex-1 h-16 rounded-[28px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">Deactivate</button>
                   <button type="submit" className="flex-[2] h-16 rounded-[28px] bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-2xl">Commit Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stores List */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3">
        {stores.map((store, i) => (
          <motion.div 
            key={store.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative flex flex-col rounded-[48px] border border-white/5 bg-[#081120] p-8 shadow-2xl transition-all hover:bg-white/5 hover:border-amber-500/20 active:scale-[0.98]"
          >
            {/* Holographic Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.05)_0,transparent_50%)] pointer-events-none" />

            <div className="mb-10 flex items-start justify-between relative z-10">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] bg-white/5 p-4 shadow-2xl group-hover:bg-white/10 transition-all border border-white/10">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="h-full w-full object-contain brightness-110" />
                ) : (
                  <StoreIcon className="text-slate-600 group-hover:text-[#F1D28C] group-hover:scale-110 transition-all" size={32} />
                )}
              </div>
              <div className="flex gap-3">
                  <button 
                   onClick={() => startEditing(store)}
                   title={t('edit')}
                   className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 transition-all hover:bg-white/10 hover:text-white border border-white/10"
                  >
                    <Edit size={20} />
                  </button>
                  
                  <button 
                   disabled={isParsing === store.id || deletingStoreId === store.id}
                   onClick={() => runParser(store.id)}
                   title={t('start_parsing')}
                   className={cn(
                     "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 transition-all hover:bg-amber-500/10 hover:text-amber-500 border border-white/10",
                     isParsing === store.id && "animate-spin text-amber-500"
                   )}
                  >
                    <RefreshCw size={20} />
                  </button>
                  
                  {confirmDeleteId === store.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(store.id)}
                        disabled={deletingStoreId === store.id}
                        className="flex h-12 px-5 items-center justify-center rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-600 shadow-xl shadow-rose-500/20"
                      >
                        {deletingStoreId === store.id ? <RefreshCw size={16} className="animate-spin" /> : 'CONFIRM'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-white/10 transition-all border border-white/10"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <button 
                     disabled={isParsing === store.id || deletingStoreId === store.id}
                     onClick={() => setConfirmDeleteId(store.id)}
                     title={t('delete')}
                     className={cn(
                       "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 transition-all hover:bg-rose-500/20 hover:text-rose-500 border border-white/10 disabled:opacity-50",
                       deletingStoreId === store.id && "animate-pulse"
                     )}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
               </div>
            </div>

            <div className="flex flex-col flex-1 relative z-10">
              <h3 className="text-2xl font-display font-black tracking-tight text-white uppercase group-hover:text-amber-500 transition-colors">{store.name}</h3>
              <div className="mt-4 space-y-2.5">
                <a href={store.baseUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F1D28C]/60 hover:text-[#F1D28C] transition-colors group/link p-2 rounded-xl hover:bg-white/5">
                   <div className="h-1 w-4 bg-amber-500/30 rounded-full group-hover/link:w-6 transition-all" />
                   <span className="truncate max-w-[200px]">{new URL(store.baseUrl).hostname}</span>
                   <ExternalLink size={12} className="opacity-40" />
                </a>
                {store.searchUrl && (
                  <a href={store.searchUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-300 transition-colors group/link p-2 rounded-xl hover:bg-white/5">
                     <div className="h-1 w-4 bg-slate-800 rounded-full group-hover/link:w-6 transition-all" />
                     <span>Search Gateway</span>
                     <ExternalLink size={12} className="opacity-40" />
                  </a>
                )}
              </div>

              <div className="mt-auto pt-8 flex flex-col gap-6">
                {isParsing === store.id && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-amber-500 animate-pulse">{parsingStatus[store.id] || `Syncing Matrix...`}</span>
                      <span className="text-white">{parsingProgress[store.id] || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(parsingProgress[store.id] || 0)}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-[#F1D28C] rounded-full shadow-[0_0_10px_rgba(197,160,89,0.5)]" 
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      isParsing === store.id ? "bg-amber-500 animate-ping" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {isParsing === store.id ? 'Aggregating Data' : 'Active Node'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-700">
                    <Clock size={12} className="opacity-40" />
                    <span>{store.lastParsed ? new Date(store.lastParsed.seconds * 1000).toLocaleDateString() : 'LIFETIME'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminStores;
