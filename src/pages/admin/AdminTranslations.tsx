import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, 
  Search, 
  Save, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Filter,
  Download,
  Upload,
  BarChart3,
  Globe2,
  SearchIcon,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import i18n from '../../i18n';

interface TranslationEntry {
  id: string;
  key: string;
  category: string;
  am: string;
  ru: string;
  en: string;
  autoDetected?: boolean;
}

const CATEGORIES = [
  'common', 'auth', 'admin', 'ui', 'footer', 'header', 'forms', 
  'notifications', 'errors', 'catalog', 'products', 'stores', 'brands', 'pages', 'other'
];

const AdminTranslations: React.FC = () => {
  const { t } = useTranslation();
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'am' | 'ru' | 'en'>('ru');
  const [syncing, setSyncing] = useState(false);
  const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false);

  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [missingKeys, setMissingKeys] = useState<TranslationEntry[]>([]);

  useEffect(() => {
    fetchTranslations();
  }, []);

  useEffect(() => {
    // Audit for duplicates and missing keys
    const keyMap = new Map<string, number>();
    const dupes: string[] = [];
    const missing: TranslationEntry[] = [];

    translations.forEach(t => {
      keyMap.set(t.key, (keyMap.get(t.key) || 0) + 1);
      if (t.autoDetected || !t.am || !t.ru || !t.en) {
        missing.push(t);
      }
    });

    keyMap.forEach((count, key) => {
      if (count > 1) dupes.push(key);
    });

    setDuplicates(dupes);
    setMissingKeys(missing);
  }, [translations]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'translations'), orderBy('key', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TranslationEntry));
      setTranslations(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'translations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    setTranslations(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const saveEntry = async (entry: TranslationEntry) => {
    setSaving(entry.id);
    try {
      await setDoc(doc(db, 'translations', entry.id), {
        key: entry.key,
        category: entry.category || 'other',
        am: entry.am || '',
        ru: entry.ru || '',
        en: entry.en || '',
        autoDetected: false // Mark as manual once saved
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `translations/${entry.id}`);
    } finally {
      setTimeout(() => setSaving(null), 1000);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Delete this translation key?')) return;
    try {
      await deleteDoc(doc(db, 'translations', id));
      setTranslations(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `translations/${id}`);
    }
  };

  const exportTranslations = () => {
    const dataStr = JSON.stringify(translations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `zigzag_translations_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTranslations = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as TranslationEntry[];
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        
        setSyncing(true);
        for (const item of imported) {
          const docId = item.id || 't_' + item.key.replace(/[^a-zA-Z0-9]/g, '_');
          await setDoc(doc(db, 'translations', docId), {
            key: item.key,
            category: item.category || 'other',
            am: item.am || '',
            ru: item.ru || '',
            en: item.en || ''
          }, { merge: true });
        }
        await fetchTranslations();
        alert('Imported successfully!');
      } catch (err) {
        alert('Failed to import: ' + (err instanceof Error ? err.message : 'Invalid JSON'));
      } finally {
        setSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const syncFromCode = async () => {
    setSyncing(true);
    try {
      const resources = (i18n as any).options.resources || {};
      const languages = ['en', 'am', 'ru'];
      const keys = new Set<string>();

      languages.forEach(lang => {
        if (resources[lang]?.translation) {
          Object.keys(resources[lang].translation).forEach(k => keys.add(k));
        }
      });

      for (const k of Array.from(keys)) {
        const docId = 't_' + k.replace(/[^a-zA-Z0-9]/g, '_');
        
        let category = 'ui';
        if (k.startsWith('admin_')) category = 'admin';
        else if (k.startsWith('login_') || k.startsWith('register_') || k.startsWith('forgot_')) category = 'auth';
        else if (k.startsWith('error_')) category = 'errors';
        else if (k.startsWith('success_')) category = 'notifications';
        else if (k.includes('footer')) category = 'footer';
        else if (k.includes('header')) category = 'header';
        else if (k.includes('catalog') || k.includes('filter')) category = 'catalog';
        else if (k.includes('product')) category = 'products';

        await setDoc(doc(db, 'translations', docId), {
          key: k,
          category,
          en: resources.en?.translation?.[k] || '',
          am: resources.am?.translation?.[k] || '',
          ru: resources.ru?.translation?.[k] || ''
        }, { merge: true });
      }

      await fetchTranslations();
      alert('Sync completed! All system strings have been mapped.');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const addNew = () => {
    const freshEntry: TranslationEntry = {
      id: `new_${Date.now()}`,
      key: '',
      category: 'ui',
      am: '',
      ru: '',
      en: ''
    };
    setTranslations([freshEntry, ...translations]);
  };

  const filtered = translations.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      t.key.toLowerCase().includes(term) ||
      t.ru.toLowerCase().includes(term) ||
      t.en.toLowerCase().includes(term) ||
      t.am.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const isUntranslated = !t[activeTab];
    const untranslatedMatch = !showUntranslatedOnly || isUntranslated;
    
    return matchesSearch && matchesCategory && untranslatedMatch;
  });

  const getCompletionStats = (lang: 'am' | 'ru' | 'en') => {
    const total = translations.length;
    if (total === 0) return 0;
    const completed = translations.filter(t => !!t[lang]).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-12 pb-40 text-white">
      {/* Header Section */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
           <div className="flex items-center gap-4 mb-3">
             <div className="p-3 bg-[#C5A059]/10 rounded-2xl border border-[#C5A059]/30 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                <Globe2 size={28} className="text-[#F1D28C]" />
             </div>
             <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:linguistics', 'Linguistics')}</h1>
           </div>
           <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] opacity-60 ml-1">{t('admin:linguistics_desc', 'Advanced localization engine with real-time neural mapping.')}</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex rounded-2xl border border-white/5 bg-[#081120] p-1 shadow-inner">
              <button 
                onClick={exportTranslations}
                className="p-3 text-slate-500 hover:text-[#F1D28C] hover:bg-white/5 rounded-xl transition-all"
                title="Export Logic"
              >
                <Download size={20} />
              </button>
              <label className="p-3 text-slate-500 hover:text-[#F1D28C] hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                <Upload size={20} />
                <input type="file" className="hidden" accept=".json" onChange={importTranslations} />
              </label>
           </div>
           
           <button 
            onClick={syncFromCode}
            disabled={syncing}
            className="flex items-center gap-3 rounded-[20px] border border-white/5 bg-[#081120] px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-[#0B1220] hover:text-white disabled:opacity-50 shadow-xl"
          >
            <RefreshCcw size={16} className={cn("text-[#C5A059]", syncing ? "animate-spin" : "")} />
            {syncing ? t('admin:mapping_infra', 'Mapping Infrastructure...') : t('admin:neural_auto_sync', 'Neural Auto-Sync')}
          </button>
          
          <button 
            onClick={addNew}
            className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            {t('admin:inject_new_key', 'Inject New Key')}
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 px-2">
        <div className="rounded-[40px] border border-white/5 bg-[#081120] p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-[0.02] blur-[50px]" />
           <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">{t('admin:health_issues', 'Health Issues')}</span>
              <AlertCircle size={18} className="text-rose-500 opacity-50" />
           </div>
           <div className="text-4xl font-display font-black text-rose-500">{missingKeys.length + duplicates.length}</div>
           <div className="flex flex-col gap-1 mt-4">
              <span className="text-[9px] font-black uppercase text-rose-500/60 tracking-wider">• {missingKeys.length} {t('admin:untranslated_new', 'Untranslated/New')}</span>
              <span className="text-[9px] font-black uppercase text-rose-500/60 tracking-wider">• {duplicates.length} {t('admin:duplicates', 'Duplicates')}</span>
           </div>
        </div>
        {(['am', 'ru', 'en'] as const).map(lang => {
          const stats = getCompletionStats(lang);
          return (
            <div key={lang} className="relative overflow-hidden rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl group transition-all hover:bg-[#0B1220]">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                  {lang === 'am' ? t('admin:lang_armenian', 'ARMENIAN') : lang === 'ru' ? t('admin:lang_russian', 'RUSSIAN') : t('admin:lang_english', 'ENGLISH')}
                </span>
                <span className={cn(
                  "text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest leading-none border shadow-inner",
                  stats === 100 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-[#C5A059]/10 text-[#F1D28C] border-[#C5A059]/20"
                )}>{stats}%</span>
              </div>
              <div className="flex items-end justify-between gap-6">
                 <div className="flex-1 space-y-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#050816] shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats}%` }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full shadow-[0_0_15px_rgba(197,160,89,0.3)]",
                          stats === 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-[#C5A059] to-[#F1D28C]"
                        )} 
                      />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">{t('admin:saturation_depth', 'Linguistic saturation depth')}</p>
                 </div>
                 <div className="text-4xl font-display font-black text-white/5 transition-all group-hover:text-[#C5A059]/10 group-hover:scale-110 uppercase leading-none">
                    {lang}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Filter Suite */}
      <div className="sticky top-8 z-40 mx-2">
        <div className="rounded-[44px] border border-white/5 bg-[#0B1220]/80 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#C5A059] transition-all" size={24} />
              <input
                type="text"
                placeholder={t('admin:search_translations_placeholder', 'Query neural network (key, value, intent)...')}
                className="w-full rounded-[28px] border border-white/5 bg-[#050816]/50 py-6 pl-16 pr-10 text-[15px] font-bold text-white placeholder:text-slate-800 focus:border-[#C5A059]/30 outline-none shadow-inner transition-all hover:bg-[#050816]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-7 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-all">
                  <X size={18} className="text-slate-500" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
               <button
                 onClick={() => setShowUntranslatedOnly(!showUntranslatedOnly)}
                 className={cn(
                   "flex h-20 items-center justify-center gap-4 px-10 rounded-[30px] text-[11px] font-black uppercase tracking-[0.3em] transition-all border",
                   showUntranslatedOnly 
                    ? "bg-rose-500 text-white border-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.3)] scale-105" 
                    : "bg-[#050816]/50 border-white/5 text-slate-600 hover:text-white hover:border-white/10"
                 )}
               >
                 <AlertCircle size={20} className={showUntranslatedOnly ? "animate-pulse" : ""} />
                 Orphaned Only
               </button>

               <div className="h-14 w-[1px] bg-white/5 mx-4 hidden lg:block" />

               <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide max-w-[450px] p-2 bg-[#050816]/30 rounded-[30px] border border-white/5 shadow-inner">
                  {['all', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "whitespace-nowrap px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                        selectedCategory === cat 
                          ? "bg-[#C5A059] text-[#050816] shadow-xl" 
                          : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 mt-8 pt-8 px-4">
             <div className="flex gap-2 rounded-[28px] bg-[#050816]/50 p-2 border border-white/5 shadow-inner">
               {(['am', 'ru', 'en'] as const).map(lang => (
                 <button
                   key={lang}
                   onClick={() => setActiveTab(lang)}
                   className={cn(
                     "flex h-14 items-center gap-4 px-8 rounded-[22px] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                     activeTab === lang 
                       ? "bg-[#0B1220] text-[#F1D28C] border border-[#C5A059]/30 shadow-2xl" 
                       : "text-slate-600 hover:text-slate-400"
                   )}
                 >
                   <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">
                     {lang === 'am' ? '🇦🇲' : lang === 'ru' ? '🇷🇺' : '🇺🇸'}
                   </span>
                   {lang === 'am' ? 'Armenian' : lang === 'ru' ? 'Russian' : 'English'}
                   {activeTab === lang && (
                     <motion.div 
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A059]/5 to-transparent animate-pulse" 
                     />
                   )}
                 </button>
               ))}
             </div>
             
             <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
                <span className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
                  {filtered.length} Indexed
                </span>
                <span className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  {getCompletionStats(activeTab)}% Accuracy
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Editor Grid - List Layout for high productivity */}
      <div className="space-y-8 px-2 mt-12">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
               <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="mb-10 p-8 rounded-[40px] bg-[#C5A059]/5 border border-[#C5A059]/20"
               >
                <RefreshCcw size={64} className="text-[#C5A059]/40" />
               </motion.div>
               <h3 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Syncing Cloud Node</h3>
               <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-700">Initializing real-time stream encryption...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col items-center justify-center py-40 rounded-[50px] border border-white/5 bg-[#081120]/50"
            >
              <div className="rounded-[40px] bg-[#050816] p-12 shadow-inner border border-white/5 mb-10 group relative">
                 <div className="absolute inset-0 bg-[#C5A059] opacity-[0.03] blur-[40px]" />
                 <SearchIcon size={80} className="text-slate-800 relative z-10 transition-all group-hover:scale-110 group-hover:text-[#C5A059]/20" />
              </div>
              <h3 className="text-3xl font-display font-black text-white mb-3 uppercase tracking-tight">No segments detected</h3>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest max-w-sm text-center leading-relaxed">System scan returned zero matching linguistic patterns. Adjust protocols or initialize new key.</p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('all'); setShowUntranslatedOnly(false);}}
                className="mt-10 px-10 py-5 rounded-[24px] bg-[#050816] border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white hover:border-[#C5A059]/30 transition-all shadow-xl"
              >
                Reset Search Algorithms
              </button>
            </motion.div>
          ) : (
            filtered.map((entry, idx) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.01, ease: "circOut" }}
                className={cn(
                  "group relative overflow-hidden rounded-[44px] border transition-all hover:bg-[#0B1220]/80 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)]",
                  !entry[activeTab] 
                    ? "border-rose-500/30 bg-rose-500/[0.02]" 
                    : "border-white/5 bg-[#081120] hover:border-[#C5A059]/20"
                )}
              >
                <div className="flex flex-col lg:flex-row items-stretch min-h-[180px]">
                   {/* Metadata & Key */}
                   <div className="lg:w-[400px] p-10 bg-[#050816]/50 border-r border-white/5 group-hover:bg-[#05101F]/30 transition-all">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F1D28C] bg-[#C5A059]/10 border border-[#C5A059]/20 px-4 py-1.5 rounded-full leading-none">KEY INTERFACE</span>
                            {entry.autoDetected && (
                               <div className="group/auto relative">
                                  <span className="flex items-center gap-2 text-[9px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest leading-none">
                                     <Sparkles size={10} className="animate-pulse" /> Neural
                                  </span>
                               </div>
                            )}
                         </div>
                         {!entry[activeTab] && (
                            <span className="flex items-center gap-2 text-[9px] font-black text-rose-500 animate-pulse border border-rose-500/20 bg-rose-500/5 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] leading-none">
                               <AlertCircle size={14} /> ORPHAN
                            </span>
                         )}
                      </div>
                      
                      <input
                        type="text"
                        spellCheck={false}
                        className="w-full bg-transparent p-0 text-2xl font-display font-black text-white outline-none placeholder:text-slate-900 selection:bg-[#C5A059]/30 tracking-tight leading-none"
                        placeholder="translation_protocol_id"
                        value={entry.key}
                        onChange={(e) => handleUpdate(entry.id, 'key', e.target.value)}
                      />
                      
                      <div className="mt-10">
                         <div className="flex items-center gap-3 mb-3 px-1">
                           <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]/40" />
                           <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 block">Category Pod</label>
                         </div>
                         <div className="relative group/sel">
                            <select 
                              className="w-full rounded-[22px] bg-[#050816] border border-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-[#C5A059]/30 shadow-inner appearance-none cursor-pointer hover:text-white transition-all"
                              value={entry.category}
                              onChange={(e) => handleUpdate(entry.id, 'category', e.target.value)}
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <RefreshCw size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none group-hover/sel:text-[#C5A059]/50 transition-colors" />
                         </div>
                      </div>
                   </div>

                   {/* Main Editor */}
                   <div className="flex-1 p-10 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059] opacity-[0.01] blur-[80px]" />
                      
                      <div className="mb-6 flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-3">
                           <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 leading-none">Content Stream</label>
                         </div>
                         <div className="flex gap-3 p-2 bg-[#050816]/50 rounded-full border border-white/5 shadow-inner">
                            {(['am', 'ru', 'en'] as const).map(l => (
                               <div key={l} className={cn(
                                  "h-3 w-3 rounded-full transition-all duration-700 relative",
                                  entry[l] ? (l === activeTab ? "bg-[#C5A059] scale-125" : "bg-emerald-500/40") : "bg-white/5",
                                  l === activeTab && "shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                               )}>
                                  {l === activeTab && <div className="absolute inset-0 bg-[#C5A059] rounded-full animate-ping opacity-40" />}
                               </div>
                            ))}
                         </div>
                      </div>
                      
                      <textarea
                        rows={3}
                        className="w-full flex-1 rounded-3xl border-none bg-transparent p-0 font-medium text-slate-100 outline-none text-2xl leading-[1.6] placeholder:text-slate-900 group-hover:placeholder:text-slate-800 transition-all resize-none relative z-10 selection:bg-[#C5A059]/30"
                        placeholder={`Initialize content protocol for ${activeTab.toUpperCase()} stream...`}
                        value={entry[activeTab] || ''}
                        onChange={(e) => handleUpdate(entry.id, activeTab, e.target.value)}
                      />
                   </div>

                   {/* Interaction Terminal */}
                   <div className="p-10 lg:w-[180px] flex lg:flex-col items-center justify-center gap-6 bg-[#050816]/20 border-l border-white/5">
                      <button
                        onClick={() => saveEntry(entry)}
                        disabled={saving === entry.id}
                        className={cn(
                          "relative group/save flex h-20 w-20 items-center justify-center rounded-[30px] transition-all duration-500 shadow-2xl active:scale-90 overflow-hidden",
                          saving === entry.id 
                            ? "bg-emerald-500 text-white animate-bounce" 
                            : "bg-[#050816] border border-white/10 text-slate-500 hover:bg-[#C5A059] hover:text-[#050816] hover:border-[#C5A059] hover:shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:-translate-y-2"
                        )}
                        title="Commit Logic"
                      >
                        {saving === entry.id ? (
                           <CheckCircle2 size={32} />
                        ) : (
                           <Save size={28} className="transition-transform group-hover/save:scale-110" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="flex h-16 w-16 items-center justify-center rounded-[26px] bg-rose-500/5 border border-white/5 text-slate-800 transition-all hover:bg-rose-500 hover:text-white hover:border-rose-400 hover:shadow-2xl hover:scale-110 active:scale-95"
                        title="Purge Node"
                      >
                        <Trash2 size={24} />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Cloud Sync Status Indicator */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-8 rounded-[50px] bg-[#0B1220]/90 px-12 py-8 text-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl border border-white/10 group"
        >
          <div className="relative">
             <div className="absolute inset-0 bg-[#C5A059] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
             <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#C5A059] to-[#F1D28C] text-[#050816] shadow-2xl overflow-hidden group-hover:animate-pulse">
                <RefreshCcw size={28} className={cn(syncing ? "animate-spin" : "transition-transform group-hover:rotate-180 duration-700")} />
             </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#F1D28C]">Cognitive Neural Link Active</p>
            </div>
            <p className="text-lg font-medium mt-1.5 text-slate-300">Propagating data clusters globally indexed in <span className="text-white font-black">~320ms</span>.</p>
          </div>
          <div className="ml-12 border-l border-white/10 pl-12 hidden lg:block">
             <div className="flex items-center gap-10">
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 mb-2">ARM</p>
                   <p className="text-xl font-display font-black text-[#F1D28C]">{getCompletionStats('am')}%</p>
                </div>
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 mb-2">RUS</p>
                   <p className="text-xl font-display font-black text-emerald-500">{getCompletionStats('ru')}%</p>
                </div>
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 mb-2">ENG</p>
                   <p className="text-xl font-display font-black text-orange-500">{getCompletionStats('en')}%</p>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminTranslations;
