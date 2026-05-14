
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, TrendingUp, History, LayoutGrid, ChevronDown, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn, getLocalized } from '../lib/utils';

interface SearchSectionProps {
  products: any[];
  categories: any[];
  style?: React.CSSProperties;
}

const SearchSection: React.FC<SearchSectionProps> = ({ products, categories, style }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = products.filter(p => {
        const name = getLocalized(p, currentLang).toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || brand.includes(q);
      }).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, products, currentLang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Save to history
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
    
    setIsFocused(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const removeHistory = (e: React.MouseEvent, h: string) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item !== h);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  return (
    <div ref={containerRef} className="relative mx-auto max-w-6xl px-4 z-40" style={style}>
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        {/* Navigation Buttons Row */}
        <div className="flex items-center gap-4">
          {/* Stores Button */}
          <button
            onClick={() => navigate('/stores')}
            className="flex h-[72px] items-center gap-4 rounded-[32px] bg-[#081120] px-8 transition-all duration-500 shadow-2xl hover:scale-[1.02] border border-white/5 group grow md:grow-0"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5A059]/10 text-[#C5A059] transition-all duration-500 group-hover:bg-[#C5A059] group-hover:text-[#050816] shadow-sm ring-1 ring-[#C5A059]/20">
              <Store size={22} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
              {t('ui:stores', 'Магазины')}
            </span>
          </button>

          {/* Categories Button */}
          <div className="relative grow md:grow-0">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={cn(
                "flex h-[72px] w-full md:w-auto items-center gap-4 rounded-[32px] bg-[#081120] px-8 transition-all duration-500 shadow-2xl border border-white/5 group hover:scale-[1.02]",
                isCategoryOpen && "ring-2 ring-[#C5A059]/50"
              )}
            >
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 shadow-sm ring-1 ring-white/5",
                isCategoryOpen ? "bg-[#C5A059] text-[#050816]" : "bg-white/5 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#050816]"
              )}>
                <LayoutGrid size={22} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
                {t('categories') || 'Категории'}
              </span>
              <motion.div
                animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                className="text-white/40 ml-2"
              >
                <ChevronDown size={20} />
              </motion.div>
            </button>

          <AnimatePresence>
            {isCategoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 mt-4 w-[320px] md:w-[600px] lg:w-[800px] overflow-hidden rounded-[32px] border border-white/5 bg-[#081120] p-6 shadow-2xl z-50 backdrop-blur-3xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] opacity-80">Все категории</h4>
                  <button onClick={() => setIsCategoryOpen(false)} className="text-white/40 hover:text-white"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.filter(c => !c.parentId).map((cat) => {
                    const subCats = categories.filter(sc => sc.parentId === cat.id);
                    return (
                      <div key={cat.id} className="space-y-3">
                        <button
                          onClick={() => {
                            setIsCategoryOpen(false);
                            navigate(`/search?category=${cat.id}`);
                          }}
                          className="group flex items-center gap-3 w-full text-left p-2 rounded-2xl hover:bg-white/5 transition-all"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-sm border border-white/5 overflow-hidden transition-transform group-hover:scale-110">
                            {cat.icon?.startsWith('http') ? (
                              <img src={cat.icon} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-2xl">{cat.icon || '📦'}</span>
                            )}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-white line-clamp-1 group-hover:text-[#C5A059]">
                            {getLocalized(cat, currentLang)}
                          </span>
                        </button>

                        {subCats.length > 0 && (
                          <div className="pl-14 space-y-1">
                            {subCats.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setIsCategoryOpen(false);
                                  navigate(`/search?category=${sub.id}`);
                                }}
                                className="block w-full text-left text-[10px] font-bold text-white/80 hover:text-[#C5A059] truncate transition-colors"
                              >
                                • {getLocalized(sub, currentLang)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Bar Container */}
        <motion.div 
          animate={{ 
            scale: isFocused ? 1.01 : 1,
          }}
          className={cn(
            "relative flex-1 flex items-center overflow-hidden rounded-[32px] bg-[#081120] p-2.5 transition-all duration-500 border border-white/5 h-[72px] shadow-2xl",
            isFocused ? "ring-2 ring-[#C5A059]/20" : ""
          )}
        >
        <div className="flex h-14 w-14 items-center justify-center text-white/40 pl-4">
          <Search size={24} className={cn("transition-colors duration-500", isFocused && "text-[#C5A059]")} />
        </div>
        
        <input 
          type="text" 
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(query);
          }}
          placeholder={t('search_placeholder') || 'Ищите товары, бренды или модели...'}
          className="h-14 w-full border-none bg-transparent px-4 text-base font-bold text-white placeholder:text-white/30 focus:outline-none"
        />

        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setQuery('')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 hover:bg-white/5 mr-2"
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        <button 
          onClick={() => handleSearch(query)}
          className="group relative flex h-14 items-center gap-3 rounded-[24px] bg-gold px-10 text-[#050816] shadow-xl shadow-[#C5A059]/20 transition-all duration-500 hover:scale-[1.02] active:scale-95"
        >
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            {t('search') || 'Поиск'}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 translate-y-1 bg-[#C5A059]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </motion.div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute left-4 right-4 mt-3 overflow-hidden rounded-[32px] border border-white/5 bg-[#081120] p-4 shadow-2xl backdrop-blur-3xl z-50 md:left-auto md:w-[800px] md:right-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
              {/* Left Side: Popular / Recent */}
              <div className="space-y-6">
                {history.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F1D28C] opacity-80 mb-4">
                      <History size={14} />
                      {t('recent_searches') || 'Недавние запросы'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {history.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(h)}
                          className="group flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 hover:text-white"
                        >
                          {h}
                          <span onClick={(e) => removeHistory(e, h)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded-full">
                            <X size={12} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F1D28C] opacity-80 mb-4">
                    <TrendingUp size={14} />
                    {t('trending_now') || 'Популярное сейчас'}
                  </h4>
                  <div className="space-y-1">
                    {['iPhone 15 Pro', 'PlayStation 5', 'Nike Air Max', 'MacBook Air M3'].map((trend, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(trend)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-bold text-white transition-all hover:bg-white/5 hover:pl-5"
                      >
                        <Search size={14} className="text-white/40" />
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Products Suggestions */}
              <div className="border-l border-white/5 pl-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] opacity-80 mb-4">
                  {query ? t('product_matches') || 'Совпадения товаров' : t('suggested_products') || 'Рекомендуемые товары'}
                </h4>
                <div className="space-y-4">
                  {(query ? suggestions : products.slice(0, 4)).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setIsFocused(false);
                        navigate(`/product/${product.id}`);
                      }}
                      className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all hover:bg-white/5 group"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/5 group-hover:scale-105 transition-transform">
                        {product.image && (
                          <img src={product.image} alt="" className="h-full w-full object-contain p-2" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-white line-clamp-1">{getLocalized(product, currentLang)}</h5>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs font-black text-[#C5A059]">
                            {product.price} {t('currency_symbol') || '֏'}
                          </span>
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{product.brand}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {query && suggestions.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm font-bold text-white/40">{t('no_results_found') || 'Нет результатов'}</p>
                    </div>
                  )}
                  
                  {query && suggestions.length > 0 && (
                    <button 
                      onClick={() => handleSearch(query)}
                      className="w-full text-center py-3 text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:underline"
                    >
                      {t('view_all_results') || 'Смотреть все результаты'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchSection;
