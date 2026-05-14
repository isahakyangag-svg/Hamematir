import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  TrendingDown, 
  ArrowRight,
  Heart,
  Eye,
  BarChart2,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  id: string;
  name: string;
  nameRu?: string;
  nameAm?: string;
  nameEn?: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  isWarranty?: boolean;
  image: string;
  storeCount?: number;
  storeLogos?: string[];
  bestStoreName?: string;
  bestStoreLogo?: string;
  index?: number;
  type?: string;
  featured?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  id, name, nameRu, nameAm, nameEn, price, oldPrice, discount, 
  isWarranty, image, storeCount = 0, storeLogos = [], bestStoreName, 
  bestStoreLogo, index = 0, type, featured
}) => {
  const { format } = useCurrency();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const displayName = currentLang === 'ru' ? nameRu || name : 
                     currentLang === 'am' ? nameAm || name : 
                     nameEn || name;

  const hasDiscount = (oldPrice && oldPrice > price) || (discount && discount > 0);
  const discountPercent = discount || (oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const effectiveOldPrice = oldPrice || (discount ? Math.round(price / (1 - discount / 100)) : 0);

  // Fallback for logos if storeLogos not provided but bestStoreLogo is
  const displayLogos = storeLogos.length > 0 ? storeLogos.slice(0, 3) : (bestStoreLogo ? [bestStoreLogo] : []);
  const displayStoreCount = storeCount || (displayLogos.length > 0 ? displayLogos.length : 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col bg-gradient-to-br from-[#111827] to-[#050816] rounded-[2rem] border border-white/5 p-6 transition-all duration-700 hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.9)] hover:border-amber-500/20 overflow-hidden isolate"
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
      
      {/* Badges Container */}
      <div className="absolute top-7 left-7 z-20 flex flex-col gap-2.5">
        {featured && (
          <div className="flex h-7 items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-[#8B6E32] px-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-2xl shadow-amber-500/30">
            <Zap size={12} className="fill-current" />
            <span>TOP CHOICE</span>
          </div>
        )}
        {isWarranty && (
          <div className="flex h-7 items-center gap-2 rounded-lg bg-white/5 px-3.5 text-[8px] font-black uppercase tracking-[0.2em] text-white border border-white/10 backdrop-blur-3xl group-hover:border-amber-500/20 transition-colors">
            <ShieldCheck size={12} className="text-amber-500" />
            <span>WARRANTY</span>
          </div>
        )}
      </div>

      {hasDiscount && (
        <div className="absolute top-7 right-7 z-20">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8B6E32] text-[11px] font-black text-black shadow-2xl shadow-amber-500/20 rotate-6 group-hover:rotate-0 transition-transform duration-700">
            -{discountPercent}%
          </div>
        </div>
      )}

      {/* Media Section */}
      <Link 
        to={`/product/${id}`} 
        className="relative aspect-square w-full mt-6 overflow-hidden rounded-2xl bg-[#030712] flex items-center justify-center transition-all duration-700 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] border border-white/5 group-hover:border-white/10"
      >
        {image ? (
          <motion.img 
            referrerPolicy="no-referrer"
            src={image} 
            alt={displayName} 
            className="h-[80%] w-[80%] object-contain transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]" 
          />
        ) : (
          <ShoppingBag className="text-white/5" size={64} strokeWidth={1} />
        )}
        
        {/* Quick Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 to-transparent flex gap-2">
            <button className="flex-1 h-10 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
               <Eye size={14} />
               <span>VIEW</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
               <BarChart2 size={16} />
            </button>
        </div>
      </Link>

      {/* Info Section */}
      <div className="mt-7 flex flex-col flex-1 relative">
        <div className="flex items-center gap-2 mb-3">
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
             {type || 'Premium Tech'}
           </span>
        </div>

        <Link to={`/product/${id}`} className="block group/title">
          <h3 className="text-lg font-bold text-white/90 leading-snug line-clamp-2 transition-all group-hover/title:text-white tracking-tight h-12">
            {displayName}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="mt-5 flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-black tracking-tighter text-[#C5A059] drop-shadow-[0_0_15px_rgba(197,160,89,0.2)]">
                  {format(price)}
                </span>
                {hasDiscount && (
                   <span className="text-xs font-bold text-white/20 line-through">
                     {format(effectiveOldPrice)}
                   </span>
                )}
            </div>
            
            <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
              <Heart size={16} />
            </button>
        </div>

        {/* Footer / Store info */}
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black border border-white/10 flex items-center justify-center p-2 group-hover:border-amber-500/30 transition-all">
                {displayLogos[0] ? (
                   <img src={displayLogos[0]} alt="Store" className="h-full w-full object-contain" />
                ) : (
                   <Store size={14} className="text-white/20" />
                )}
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-amber-500 tracking-tight">
                  {displayStoreCount} {t('ui:store_label_count', 'shops')}
                </span>
                <span className="text-[8px] font-black text-white/30 tracking-[0.2em] uppercase mt-0.5">
                  Best price found
                </span>
             </div>
           </div>
           
           <div className="flex -space-x-3 hover:-space-x-1.5 transition-all duration-500">
             {displayLogos.slice(0, 3).map((logo, i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-[#050816] ring-4 ring-[#050816] border border-white/10 overflow-hidden p-1 shadow-xl">
                  <img src={logo} alt="Store" className="h-full w-full object-contain" />
                </div>
             ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
