import React, { useState } from 'react';
import { 
  Filter, 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  MousePointer2, 
  BarChart3,
  Image as ImageIcon,
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const PartnerBanners: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const banners = [
    { 
      id: '1', 
      name: 'Магазин одежды - Лето 2024', 
      category: 'Мода и стиль', 
      startDate: '01.05.2024', 
      endDate: '01.06.2024', 
      status: 'active',
      views: 12450,
      clicks: 856,
      ctr: '6.8%',
      position: 'Главная страница (Топ)',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'
    },
    { 
      id: '2', 
      name: 'Аренда авто - Премиум', 
      category: 'Авто', 
      startDate: '10.05.2024', 
      endDate: '10.06.2024', 
      status: 'active',
      views: 8900,
      clicks: 432,
      ctr: '4.8%',
      position: 'Главная страница (Слайдер)',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'
    },
    { 
      id: '3', 
      name: 'Туристические услуги - Скидки', 
      category: 'Путешествия', 
      startDate: '15.05.2024', 
      endDate: '15.06.2024', 
      status: 'expiring',
      views: 5600,
      clicks: 210,
      ctr: '3.7%',
      position: 'Боковая панель',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'
    },
    { 
      id: '4', 
      name: 'Зимняя распродажа', 
      category: 'Разное', 
      startDate: '01.01.2024', 
      endDate: '01.02.2024', 
      status: 'expired',
      views: 45000,
      clicks: 3200,
      ctr: '7.1%',
      position: 'Главная страница (Топ)',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'
    },
    { 
      id: '5', 
      name: 'Новый бренд обуви', 
      category: 'Мода', 
      startDate: '-', 
      endDate: '-', 
      status: 'pending',
      views: 0,
      clicks: 0,
      ctr: '0%',
      position: 'Ожидает выбора',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
    }
  ];

  const filteredBanners = banners.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'active': return { label: 'Активен', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 };
      case 'expiring': return { label: 'Истекает', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock };
      case 'expired': return { label: 'Завершен', color: 'bg-white/10 text-white/40 border-white/10', icon: XCircle };
      case 'pending': return { label: 'На проверке', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: AlertCircle };
      default: return { label: status, color: 'bg-white/10 text-white/40 border-white/10', icon: AlertCircle };
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
           <div className="flex items-center gap-4 mb-3">
              <div className="h-2 w-12 bg-gradient-to-r from-amber-500 to-[#8B6E32] rounded-full" />
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Advertising Management</p>
           </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Мои баннеры</h1>
        </div>
        <Link 
          to="/partner/banners/order"
          className="flex items-center justify-center gap-4 rounded-[1.5rem] bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-[0_20px_40px_-5px_rgba(197,160,89,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <Plus size={20} strokeWidth={4} />
          <span>Заказать баннер</span>
        </Link>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row items-center gap-6">
        <div className="relative flex-1 group w-full">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Поиск по названию кампании..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-14 w-full rounded-2xl bg-[#0B1220]/50 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/20 border-none ring-1 ring-white/5 focus:ring-2 focus:ring-amber-500/40 transition-all focus:bg-[#0B1220] shadow-inner"
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-[#0B1220]/80 backdrop-blur-xl rounded-[1.25rem] border border-white/5 w-full xl:w-auto shadow-2xl">
          {['all', 'active', 'pending', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 xl:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                filter === f 
                  ? "bg-gradient-to-br from-amber-500 to-[#8B6E32] text-black shadow-lg" 
                  : "text-white/30 hover:text-white hover:bg-white/5"
              )}
            >
              {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : f === 'pending' ? 'В ожидании' : 'Архив'}
            </button>
          ))}
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredBanners.map((banner, idx) => {
            const status = getStatusInfo(banner.status);
            return (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="group relative flex flex-col p-8 rounded-[3rem] bg-[#0B1220]/80 backdrop-blur-3xl border border-white/5 shadow-2xl overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:opacity-100 opacity-50 transition-opacity duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full -ml-20 -mb-20 transition-opacity duration-700" />

                <div className="relative aspect-[16/10] rounded-[2rem] bg-black border border-white/10 overflow-hidden mb-8 shadow-2xl group-hover:border-amber-500/40 transition-all duration-700">
                  <img src={banner.image} alt={banner.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-5 right-5 flex gap-2">
                    <button className="h-10 w-10 rounded-xl bg-black/60 backdrop-blur-xl text-white/60 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all shadow-2xl">
                      <ExternalLink size={18} />
                    </button>
                    <button className="h-10 w-10 rounded-xl bg-black/60 backdrop-blur-xl text-white/60 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-2xl">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border shadow-lg", status.color)}>
                      <status.icon size={12} strokeWidth={3} />
                      {status.label}
                    </span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{banner.category}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white tracking-tight line-clamp-1 mb-2 group-hover:text-amber-500 transition-colors uppercase leading-none">{banner.name}</h3>
                  <div className="flex items-center gap-3">
                     <div className="h-1 w-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]" />
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{banner.position}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-8 p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col items-center">
                      <span className="text-[16px] font-black text-white tracking-tight">{banner.views.toLocaleString()}</span>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">Views</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/5 px-2">
                      <span className="text-[16px] font-black text-white tracking-tight">{banner.clicks}</span>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">Clicks</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[16px] font-black text-amber-500 tracking-tight glow-text">{banner.ctr}</span>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">CTR</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Campaign Period</span>
                      <span className="text-[11px] font-black text-white/60 mt-1 uppercase tracking-widest">{banner.startDate} — {banner.endDate}</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1220] border border-white/10 text-[#C5A059] shadow-2xl hover:border-amber-500 hover:bg-amber-500 hover:text-black transition-all"
                    >
                      <BarChart3 size={20} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredBanners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center relative overflow-hidden rounded-[3rem] border border-white/5 bg-[#0B1220]/30">
          <div className="absolute inset-0 bg-amber-500/5 blur-[120px] rounded-full" />
          <div className="h-32 w-32 rounded-[3.5rem] bg-white/5 flex items-center justify-center text-white/10 mb-10 border border-white/5 relative z-10 shadow-2xl">
            <ImageIcon size={64} strokeWidth={1} />
          </div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tight relative z-10">Баннеры не найдены</h3>
          <p className="text-sm font-black text-white/30 mt-4 uppercase tracking-widest relative z-10">Попробуйте изменить параметры поиска или фильтры</p>
          <button 
            onClick={() => {setSearch(''); setFilter('all');}}
            className="mt-12 h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/10 transition-all relative z-10"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}
    </div>
  );
};

export default PartnerBanners;
