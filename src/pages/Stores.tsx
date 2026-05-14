import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Store as StoreIcon, ExternalLink, Search, MapPin, Globe, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getLocalized } from '../lib/utils';

interface Store {
  id: string;
  name: string;
  nameRu?: string;
  nameAm?: string;
  nameEn?: string;
  logo?: string;
  baseUrl: string;
  website?: string;
  description?: string;
  descRu?: string;
  descEn?: string;
  descAm?: string;
  status: 'active' | 'inactive';
}

const Stores: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'stores'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const storesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        setStores(storesData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stores');
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

  const filteredStores = stores.filter(store => {
    const name = (getLocalized(store, currentLang) || store.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#070B14] py-12 md:py-20 text-white selection:bg-amber-500/30">
      {/* Background Decor */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 mb-8 border border-amber-500/20 shadow-2xl shadow-amber-500/5"
          >
            <StoreIcon size={36} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-7xl leading-[1.05]"
          >
            {t('ui:stores_title', 'Наши Магазины-Партнеры')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-xl font-medium text-white/90 leading-relaxed"
          >
            {t('ui:stores_subtitle', 'Сравнивайте цены в самых популярных магазинах Армении в одном месте.')}
          </motion.p>
        </header>

        {/* Search Bar */}
        <div className="mx-auto max-w-2xl mb-24">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-8 pointer-events-none">
              <Search className="h-5 w-5 text-white/40 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ui:search_stores', 'Поиск по названию магазина...')}
              className="block w-full rounded-[2.5rem] border border-white/5 bg-[#0B1220]/50 backdrop-blur-2xl py-6 pl-16 pr-8 text-lg font-bold text-white shadow-2xl transition-all focus:ring-2 focus:ring-amber-500/30 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-[2.5rem] bg-white/5 border border-white/5 h-80 shadow-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredStores.map((store, idx) => (
                <motion.div
                  key={store.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="group relative flex flex-col rounded-[2.5rem] border border-white/5 bg-[#0B1220]/50 backdrop-blur-xl p-8 transition-all duration-700 hover:border-amber-500/30 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="mb-8 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[#070B14] border border-white/5 p-12 transition-all duration-700 group-hover:scale-105 group-hover:shadow-inner group-hover:-rotate-2 relative z-10">
                    {store.logo ? (
                      <img 
                        src={store.logo} 
                        alt={store.name} 
                        className="h-full w-full object-contain filter drop-shadow-2xl" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <StoreIcon className="h-16 w-16 text-white/5 group-hover:text-amber-500/20 transition-colors" />
                    )}
                  </div>

                  <div className="flex-1 text-center space-y-6 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-amber-500 transition-colors">
                      {getLocalized(store, currentLang) || store.name}
                    </h3>
                    
                    <p className="line-clamp-2 text-sm font-medium text-white/80 leading-relaxed max-w-[220px] mx-auto">
                      {getLocalized(store, currentLang, 'description') || getLocalized(store, currentLang, 'descRu') || 'Ведущий магазин электроники и бытовой техники в Армении.'}
                    </p>

                    <div className="flex flex-col gap-3 pt-6 items-center">
                       <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 border border-amber-500/20 shadow-2xl backdrop-blur-sm">
                         <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                         {t('ui:store_verified', 'Верифицирован')}
                       </span>
                       <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/90 border border-white/5">
                         {t('ui:store_official', 'Официальный')}
                       </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredStores.length === 0 && (
          <div className="py-32 text-center bg-[#0B1220]/40 backdrop-blur-xl rounded-[3rem] border border-white/5">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 text-white/30 mb-8 font-black text-4xl border border-white/5">
              <Search size={48} />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Магазины не найдены</h3>
            <p className="mt-4 font-medium text-white/80 truncate max-w-sm mx-auto">Попробуйте изменить запрос или поискать в категориях.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
