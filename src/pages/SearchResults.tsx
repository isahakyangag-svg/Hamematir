import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Filter, 
  Grid3X3, 
  List as ListIcon, 
  X, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  LayoutGrid,
  List,
  Store,
  Tag,
  ArrowUpDown,
  Circle,
  Zap,
  CheckCircle2,
  Phone,
  Shield,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getLocalized } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  const brandParam = searchParams.get('brand');
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // State
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'categories' | 'deals' | 'stores'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Category Icons mapping
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'smartphone': <Zap size={18} />,
      'laptop': <Grid3X3 size={18} />,
      'tv': <LayoutGrid size={18} />,
      'gaming': <Zap size={18} />,
      'kitchen': <Store size={18} />,
      'home': <Tag size={18} />,
      'watch': <Circle size={18} />,
      'default': <Tag size={18} />
    };
    return icons[iconName?.toLowerCase()] || icons['default'];
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catSnap, storeSnap, brandSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'stores')),
          getDocs(collection(db, 'brands'))
        ]);
        setAllCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAllStores(storeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAllBrands(brandSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Meta fetch error:", error);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    const fetchResultsAction = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        let filtered = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(p => p.isVisible !== false);
        
        if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(p => 
            (p.nameRu?.toLowerCase().includes(lower)) ||
            (p.nameAm?.toLowerCase().includes(lower)) ||
            (p.nameEn?.toLowerCase().includes(lower)) ||
            (p.name?.toLowerCase().includes(lower))
          );
        }

        if (selectedCategory) {
          filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }

        if (selectedStores.length > 0) {
          filtered = filtered.filter(p => selectedStores.includes(p.storeId));
        }

        if (selectedBrands.length > 0) {
          filtered = filtered.filter(p => selectedBrands.includes(p.brandId));
        }

        // Apply price range
        filtered = filtered.filter(p => {
          const pr = p.price || p.mainPrice || 0;
          return pr >= priceRange[0] && pr <= priceRange[1];
        });

        // Filter by tab type
        if (activeTab === 'deals') {
          filtered = filtered.filter(p => p.discount && p.discount > 0);
        }

        // Sorting
        if (sortBy === 'price_asc') {
          filtered.sort((a, b) => (a.price || a.mainPrice || 0) - (b.price || b.mainPrice || 0));
        } else if (sortBy === 'price_desc') {
          filtered.sort((a, b) => (b.price || b.mainPrice || 0) - (a.price || a.mainPrice || 0));
        } else if (sortBy === 'newest') {
          filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        
        setProducts(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };

    fetchResultsAction();
  }, [searchTerm, selectedCategory, selectedStores, selectedBrands, sortBy, priceRange, activeTab]);

  const toggleStore = (id: string) => {
    setSelectedStores(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleBrand = (id: string) => {
    setSelectedBrands(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedStores([]);
    setSelectedBrands([]);
    setPriceRange([0, 5000000]);
    searchParams.delete('category');
    searchParams.delete('brand');
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-[#050816] min-h-screen pb-24 text-white selection:bg-amber-500/30 selection:text-black">
      {/* Dynamic Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0B1220] to-transparent -z-10" />
      <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[160px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-10">
        
        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="flex items-center justify-between py-10 border-b border-white/5 mb-8">
           <nav className="flex items-center gap-2">
              {(['categories', 'deals', 'stores'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 rounded-xl",
                    activeTab === tab ? "text-amber-500 bg-amber-500/5" : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="relative z-10">
                    {tab === 'categories' ? t('ui:categories', 'Categories') : tab === 'deals' ? t('ui:deals', 'Deals') : t('ui:stores', 'Stores')}
                  </span>
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="searchTabGlow"
                      className="absolute inset-0 rounded-xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                    />
                  )}
                </button>
              ))}
           </nav>

           <div className="flex items-center gap-8">
              {/* Layout Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-500", 
                    viewMode === 'grid' ? "bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)]" : "text-white/30 hover:text-white"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-500", 
                    viewMode === 'list' ? "bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)]" : "text-white/30 hover:text-white"
                  )}
                >
                  <ListIcon size={18} />
                </button>
              </div>

              {/* Advanced Sorting */}
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-14 w-52 rounded-2xl bg-[#0B1220] pl-8 pr-12 text-[10px] font-black uppercase tracking-[0.25em] border border-white/10 appearance-none focus:outline-none focus:border-amber-500/30 cursor-pointer text-white shadow-2xl transition-all"
                >
                  <option value="newest" className="bg-[#0B1220]">{t('ui:latest', 'Latest')}</option>
                  <option value="price_asc" className="bg-[#0B1220]">{t('ui:cheapest', 'Cheapest')}</option>
                  <option value="price_desc" className="bg-[#0B1220]">{t('ui:premium', 'Premium')}</option>
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none group-focus-within:rotate-180 transition-transform duration-500" />
              </div>
           </div>
        </div>

        {/* PAGE GRID (3 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-10">
          
          {/* LEFT SIDEBAR */}
          <aside className="space-y-10 hidden lg:block">
            {/* Categories */}
            <div className="bg-[#0B1220]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-[0.03] blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
               
               <div className="flex items-center justify-between mb-8 opacity-40">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Категории</h3>
                  <ChevronRight size={14} className="transform rotate-90" />
               </div>

               <div className="space-y-2">
                  {allCategories.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                        className={cn(
                          "w-full group flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all duration-700 text-left border relative overflow-hidden",
                          isSelected 
                            ? "bg-gradient-to-br from-amber-500 to-[#C5A059] border-transparent shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)]" 
                            : "bg-white/[0.02] border-transparent hover:bg-white/[0.04] hover:border-white/5"
                        )}
                      >
                        <div className="flex items-center gap-5 relative z-10">
                           <div className={cn(
                             "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-700",
                             isSelected ? "bg-black/10 text-black" : "bg-white/5 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black"
                           )}>
                             {cat.icon ? getCategoryIcon(cat.icon) : <Tag size={18} />}
                           </div>
                           <span className={cn(
                             "text-[12px] font-black uppercase tracking-tight",
                             isSelected ? "text-black" : "text-white/60 group-hover:text-white"
                           )}>
                             {getLocalized(cat, currentLang)}
                           </span>
                        </div>
                        <ChevronRight size={16} className={cn(
                          "transition-all duration-700 relative z-10 opacity-20",
                          isSelected ? "text-black opacity-100 translate-x-0" : "group-hover:text-amber-500 group-hover:opacity-100 group-hover:translate-x-1"
                        )} />
                      </button>
                    );
                  })}
               </div>
            </div>

            {/* Popular Brands Grid */}
            <div className="bg-[#0B1220]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8">Бренды</h3>
               <div className="grid grid-cols-2 gap-4">
                  {allBrands.slice(0, 6).map(brand => {
                    const isSelected = selectedBrands.includes(brand.id);
                    return (
                      <button
                        key={brand.id}
                        onClick={() => toggleBrand(brand.id)}
                        className={cn(
                          "group h-28 flex flex-col items-center justify-center gap-4 rounded-3xl border transition-all duration-700 bg-white/[0.02] relative overflow-hidden",
                          isSelected 
                            ? "border-amber-500/50 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]" 
                            : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="w-12 h-12 flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-700">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain filter brightness-90 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 group-hover:brightness-110 transition-all" />
                          ) : (
                            <Tag size={18} className="text-white/10" />
                          )}
                        </div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">{brand.productCount || 0} ITEMS</div>
                      </button>
                    );
                  })}
               </div>
               <button className="w-full mt-8 py-5 rounded-[1.5rem] border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-amber-500 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all">
                  Все бренды
               </button>
            </div>
          </aside>

          {/* CENTER PANEL */}
          <main className="flex-1 space-y-10">
            {/* HERO BANNER */}
            <div className="relative h-[420px] rounded-[3.5rem] overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/10">
               <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#050816] to-[#0B1220]" />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,_rgba(197,160,89,0.1)_0%,_transparent_60%)]" />
               <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:60px_60px]" />

               {/* Right Overlay Graphic */}
               <div className="absolute top-1/2 right-16 lg:right-28 -translate-y-1/2 z-10 w-80 h-80 lg:w-[450px] lg:h-[450px] opacity-40">
                 <div className="absolute inset-0 bg-amber-500/30 blur-[140px] rounded-full animate-pulse" />
                 <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="relative flex items-center justify-center w-full h-full"
                 >
                    <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-[spin_30s_linear_infinite]" />
                    <div className="absolute inset-8 border border-white/5 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                    <div className="flex items-center justify-center w-40 h-40 lg:w-56 lg:h-56 bg-gradient-to-br from-[#C5A059] via-[#F1D28C] to-[#8B6E32] rounded-[3.5rem] shadow-[0_0_80px_rgba(197,160,89,0.4)] transform -rotate-12 border border-white/20">
                       <Shield size={64} className="text-black fill-current lg:w-28 lg:h-28" />
                    </div>
                 </motion.div>
               </div>

               {/* Content */}
               <div className="relative h-full z-20 flex flex-col justify-center px-16 lg:px-24">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="space-y-6"
                  >
                     <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Live Marketplace Pro
                     </div>
                     <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] tracking-tight">
                        {selectedCategory ? getLocalized(allCategories.find(c => c.id === selectedCategory), currentLang) : "Премиальный<br/>выбор"}
                     </h2>
                     <p className="text-base lg:text-lg font-medium text-white/40 max-w-lg leading-relaxed pt-2">
                        Лучшие предложения от проверенных магазинов. Гарантия качества, лучшие цены и быстрая доставка.
                     </p>
                     
                     <div className="flex items-center gap-12 pt-12 border-t border-white/5">
                        <div className="flex flex-col gap-2">
                           <span className="text-3xl font-black text-white tracking-widest leading-none">{products.length}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Товаров</span>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="text-3xl font-black text-white tracking-widest leading-none">{allStores.length}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Магазинов</span>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="text-3xl font-black text-amber-500 tracking-widest leading-none">4.9</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Рейтинг</span>
                        </div>
                     </div>
                  </motion.div>
               </div>
            </div>

            {/* SEARCH INPUT BAR */}
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 flex items-center pl-10 pointer-events-none z-10">
                  <Search size={26} className="text-white/20 group-focus-within:text-amber-500 transition-colors duration-700" />
               </div>
               <input 
                  type="text" 
                  value={searchTerm}
                  readOnly
                  placeholder={t('header:search_placeholder', 'Поиск по товарам...')}
                  className="h-24 w-full rounded-[2rem] bg-[#0B1220]/50 backdrop-blur-3xl border border-white/5 pl-24 pr-10 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 shadow-2xl transition-all duration-700"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-4">
                  <span className="h-10 w-px bg-white/5" />
                  <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                     Smart Filters Active
                  </div>
               </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="relative">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-[#0B1220]/20 rounded-[4rem] border border-white/5 p-40 text-center backdrop-blur-3xl">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-12 text-white/10 group hover:border-amber-500/20 transition-all duration-700">
                    <Search size={64} className="group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-6">Nothing Found</h2>
                  <p className="text-white/30 text-lg font-medium max-w-sm mx-auto leading-relaxed">Попробуйте изменить запрос или поискать в других категориях.</p>
                </div>
              ) : (
                <div className={cn(
                  "grid gap-8",
                  viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 x2l:grid-cols-3" : "grid-cols-1"
                )}>
                  {products.map((product, idx) => (
                    <ProductCard 
                      key={product.id}
                      index={idx}
                      {...product}
                      price={product.price || product.mainPrice || 0}
                      bestStoreName={allStores.find(s => s.id === product.storeId)?.name}
                      bestStoreLogo={allStores.find(s => s.id === product.storeId)?.logo}
                      type={getLocalized(allCategories.find(c => c.id === product.categoryId), currentLang)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR: Filters */}
          <aside className="w-full space-y-8 hidden xl:block">
             <div className="bg-[#0B1220]/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 shadow-2xl sticky top-32">
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic">Параметры</h3>
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                      <SlidersHorizontal size={16} />
                   </div>
                </div>

                <div className="space-y-12">
                   {/* Price Segment */}
                   <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] flex items-center gap-3">
                         <span className="w-4 h-[1px] bg-amber-500" />
                         Ценовой диапазон
                      </h4>
                      <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Mин</span>
                            <input 
                              type="number" 
                              value={priceRange[0]}
                              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                              className="h-14 w-full bg-black/40 border border-white/5 rounded-2xl px-5 text-sm font-black text-white focus:border-amber-500/40 transition-all outline-none"
                            />
                         </div>
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Mакс</span>
                            <input 
                              type="number" 
                              value={priceRange[1]}
                              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                              className="h-14 w-full bg-black/40 border border-white/5 rounded-2xl px-5 text-sm font-black text-white focus:border-amber-500/40 transition-all outline-none"
                            />
                         </div>
                      </div>
                      
                      {/* Premium Custom Range Slider */}
                      <div className="relative h-1 w-full bg-white/5 rounded-full mt-10">
                         <div className="absolute top-0 bottom-0 left-[20%] right-[40%] bg-gradient-to-r from-amber-500 to-[#C5A059] rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                         <div className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-500 border-[6px] border-[#0B1220] shadow-xl cursor-pointer" />
                         <div className="absolute top-1/2 right-[40%] translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-500 border-[6px] border-[#0B1220] shadow-xl cursor-pointer" />
                      </div>
                      
                      <button 
                        onClick={clearFilters}
                        className="w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-amber-500 transition-all border border-transparent hover:border-amber-500/10 rounded-2xl bg-white/[0.01]"
                      >
                         Сбросить все
                      </button>
                   </div>

                   {/* Dynamic Categories / Brands Group */}
                   <div className="space-y-10">
                      {/* Brands List */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] flex items-center gap-3">
                           <span className="w-4 h-[1px] bg-amber-500" />
                           Бренды
                        </h4>
                        <div className="space-y-4">
                           {['Samsung', 'LG', 'Bosch', 'Premium Pro', 'Elite Tech'].map(bn => (
                             <label key={bn} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                   <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-amber-500/40">
                                      <div className="w-3 h-3 rounded-md bg-amber-500 opacity-0 group-hover:opacity-10 scale-50 group-hover:scale-100 transition-all duration-500" />
                                   </div>
                                   <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors uppercase tracking-tight">{bn}</span>
                                </div>
                                <span className="text-[10px] font-black text-white/10 tracking-widest">({Math.floor(Math.random() * 500)})</span>
                             </label>
                           ))}
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] flex items-center gap-3">
                           <span className="w-4 h-[1px] bg-amber-500" />
                           Рейтинг Elite
                        </h4>
                        <div className="space-y-4">
                           {[5, 4, 3].map(star => (
                             <label key={star} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                   <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-lg transition-all group-hover:border-amber-500/40" />
                                   <div className="flex gap-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Zap key={i} size={14} className={cn(i < star ? "text-amber-500 fill-current" : "text-white/5")} />
                                      ))}
                                   </div>
                                </div>
                                <span className="text-[10px] font-black text-white/5">({Math.floor(Math.random() * 200)})</span>
                             </label>
                           ))}
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="space-y-6 pt-10 border-t border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] flex items-center gap-3">
                           <span className="w-4 h-[1px] bg-amber-500" />
                           Доступность
                        </h4>
                        <div className="space-y-5">
                           {['В наличии', 'Под заказ', 'Экспресс доставка'].map(item => (
                             <label key={item} className="flex items-center gap-5 group cursor-pointer">
                                <div className="relative w-12 h-7 bg-white/5 rounded-full transition-all group-hover:bg-amber-500/10 p-1">
                                   <div className={cn(
                                      "w-5 h-5 rounded-full transition-all duration-500 shadow-xl",
                                      item === 'В наличии' ? "translate-x-5 bg-amber-500" : "translate-x-0 bg-white/20"
                                   )} />
                                </div>
                                <span className={cn(
                                   "text-[12px] font-black uppercase tracking-tight transition-colors",
                                   item === 'В наличии' ? "text-amber-500" : "text-white/40 group-hover:text-white"
                                )}>{item}</span>
                             </label>
                           ))}
                        </div>
                      </div>
                   </div>

                   {/* Support Elite Card */}
                   <div className="bg-gradient-to-br from-[#111827] to-[#050816] rounded-3xl p-10 relative overflow-hidden group/support shadow-2xl border border-white/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[60px] transform translate-x-12 -translate-y-12" />
                      <div className="relative z-10">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 backdrop-blur-3xl flex items-center justify-center border border-amber-500/20">
                               <Phone size={24} className="text-amber-500" />
                            </div>
                            <h4 className="text-lg font-black text-white italic leading-tight uppercase tracking-tighter">Elite<br/>Support</h4>
                         </div>
                         <p className="text-[11px] font-medium text-white/40 mb-8 leading-relaxed">Наши эксперты помогут вам с выбором премиальной техники 24/7.</p>
                         <button className="w-full py-5 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)] hover:scale-[1.03] active:scale-95 transition-all duration-500">
                            Связаться
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </aside>
        </div>


        {/* BOTTOM SECTION: PREMIUM CATEGORIES FOOTER NAVIGATION */}
        <div className="mt-32 pt-24 border-t border-white/5">
           <div className="flex items-center justify-between mb-16 px-4">
              <div className="space-y-2">
                 <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-amber-500 italic">Навигация по разделам</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Премиальный доступ к лучшим категориям</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10 hover:text-amber-500 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all duration-500">
                    <ChevronRight size={22} className="rotate-180" />
                 </button>
                 <button className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10 hover:text-amber-500 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all duration-500">
                    <ChevronRight size={22} />
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
              {allCategories.slice(0, 8).map((cat, i) => (
                <Link 
                  key={cat.id}
                  to={`/search?category=${cat.id}`}
                  className="group flex flex-col items-center justify-center gap-8 p-10 rounded-[3rem] bg-white/[0.01] border border-transparent transition-all duration-700 hover:bg-[#0B1220] hover:border-white/10 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
                >
                  <div className="w-20 h-20 rounded-[2rem] bg-[#070B14] flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl border border-white/5 group-hover:border-amber-500/40 relative">
                     <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-[0.05] rounded-[2rem] transition-opacity" />
                     {cat.icon ? getCategoryIcon(cat.icon) : <LayoutGrid size={32} strokeWidth={1.5} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center leading-relaxed h-10 flex items-center group-hover:text-amber-500 transition-colors duration-700">
                     {getLocalized(cat, currentLang)}
                  </span>
                </Link>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
