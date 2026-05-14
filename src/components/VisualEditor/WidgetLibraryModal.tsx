
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layout, 
  Image as ImageIcon, 
  Search, 
  ShoppingBag, 
  Package, 
  Type, 
  Minus,
  Grid,
  Layers,
  Star,
  HelpCircle,
  Newspaper,
  CheckCircle2,
  Image as GalleryIcon,
  PlayCircle,
  Users,
  MapPin
} from 'lucide-react';
import { SectionType } from '../../types/editor';
import { cn } from '../../lib/utils';

interface WidgetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SectionType, initialProps?: any) => void;
}

const widgets: { type: SectionType; label: string; description: string; icon: any; color: string }[] = [
  { type: 'hero', label: 'Hero Banner', description: 'Large sliding banner section', icon: ImageIcon, color: 'text-purple-600' },
  { type: 'search', label: 'Search Bar', description: 'Professional search input', icon: Search, color: 'text-green-600' },
  { type: 'products', label: 'Product Grid', description: 'Display products by filter', icon: Package, color: 'text-blue-600' },
  { type: 'categories', label: 'Categories', description: 'Circular category browser', icon: Grid, color: 'text-pink-600' },
  { type: 'banners_grid', label: 'Banners Grid', description: 'Multiple smaller promo banners', icon: Layers, color: 'text-cyan-600' },
  { type: 'text', label: 'Text Section', description: 'Custom heading and subtext', icon: Type, color: 'text-gray-600' },
  { type: 'reviews', label: 'Reviews', description: 'Show customer testimonials', icon: Star, color: 'text-yellow-500' },
  { type: 'faq', label: 'FAQ / Accordion', description: 'Expandable question section', icon: HelpCircle, color: 'text-indigo-600' },
  { type: 'blog', label: 'Blog Posts', description: 'Latest news and articles', icon: Newspaper, color: 'text-red-500' },
  { type: 'features', label: 'Key Features', description: 'Product advantages grid', icon: CheckCircle2, color: 'text-emerald-500' },
  { type: 'gallery', label: 'Image Gallery', description: 'Beautiful photo grid', icon: GalleryIcon, color: 'text-amber-500' },
  { type: 'video', label: 'Video Player', description: 'Embed a promo video', icon: PlayCircle, color: 'text-rose-600' },
  { type: 'team', label: 'Our Team', description: 'Employee profiles section', icon: Users, color: 'text-blue-400' },
  { type: 'contacts', label: 'Contact Info', description: 'Address, map and phones', icon: MapPin, color: 'text-slate-600' },
  { type: 'divider', label: 'Spacer / Line', description: 'Empty space or divider line', icon: Minus, color: 'text-slate-400' },
];

const HERO_VARIANTS = [
  { id: 'full', label: 'Full Page Hero', size: 'Full View (90vh)', icon: Layout },
  { id: 'medium', label: 'Medium Banner', size: 'Medium (60vh)', icon: Layout },
  { id: 'compact', label: 'Compact Banner', size: 'Small (30vh)', icon: Layout },
  { id: 'wide_long', label: 'Leaderboard', size: '970 x 250', icon: Minus },
  { id: 'wide_short', label: 'Horizontal Ad', size: '728 x 90', icon: Minus },
  { id: 'skyscraper', label: 'Skyscraper', size: '300 x 600', icon: Layers },
  { id: 'rectangle', label: 'Large Rectangle', size: '300 x 250', icon: Grid },
];

const WidgetLibraryModal: React.FC<WidgetLibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [view, setView] = React.useState<'main' | 'hero_variants'>('main');
  const [customWidth, setCustomWidth] = React.useState('');
  const [customHeight, setCustomHeight] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setView('main');
      setCustomWidth('');
      setCustomHeight('');
    }
  }, [isOpen]);

  const handleCustomAdd = () => {
    const w = parseInt(customWidth);
    const h = parseInt(customHeight);
    if (!isNaN(h)) {
      onSelect('hero', { 
        variant: 'custom', 
        height: h, 
        width: isNaN(w) ? undefined : w 
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[1200] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3rem] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('main')}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-all",
                    view !== 'main' ? "hover:bg-blue-100 cursor-pointer" : "cursor-default"
                  )}
                >
                  <Layout size={24} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    {view === 'main' ? 'Widget Library' : 'Choose Hero Variant'}
                  </h2>
                  <p className="text-sm font-bold text-gray-400">
                    {view === 'main' ? 'Add a new section to your page' : 'Select banner dimensions and layout'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 shadow-sm active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {view === 'main' ? (
                  <motion.div 
                    key="main"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {widgets.map((widget) => (
                      <button
                        key={widget.type}
                        onClick={() => {
                          if (widget.type === 'hero') setView('hero_variants');
                          else onSelect(widget.type);
                        }}
                        className="flex items-start gap-5 rounded-3xl border border-gray-100 bg-gray-50/50 p-6 text-left transition-all hover:border-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-600/5 group"
                      >
                        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110", widget.color)}>
                          <widget.icon size={28} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 group-hover:text-blue-600">{widget.label}</h3>
                          <p className="mt-1 text-xs font-bold text-gray-400 leading-relaxed">{widget.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="hero_variants"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-12"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {HERO_VARIANTS.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => onSelect('hero', { variant: variant.id })}
                          className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-100 bg-gray-50/50 p-6 text-center transition-all hover:border-amber-500 hover:bg-white hover:shadow-xl hover:shadow-amber-500/10"
                        >
                          <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:border-amber-200 transition-all overflow-hidden relative">
                             <div className={cn(
                               "bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center",
                               variant.id === 'full' ? "w-full h-full" :
                               variant.id === 'medium' ? "w-full h-[60%]" :
                               variant.id === 'compact' ? "w-full h-[30%]" :
                               variant.id === 'wide_long' ? "w-[90%] h-[25%]" :
                               variant.id === 'wide_short' ? "w-[80%] h-[15%]" :
                               variant.id === 'skyscraper' ? "w-[30%] h-full" :
                               "w-[40%] h-[30%]"
                             )}>
                                <variant.icon size={16} className="text-amber-500/40" />
                             </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 group-hover:text-amber-600">{variant.label}</h3>
                            <span className="mt-1 block text-[9px] font-black uppercase tracking-widest text-amber-500 italic">{variant.size}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="h-8 w-1 bg-amber-500 rounded-full" />
                         <h3 className="text-lg font-black text-gray-900 tracking-tight">Custom Dimensions</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="flex-1 min-w-[150px] space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Width (px)</label>
                           <input 
                             type="number"
                             value={customWidth}
                             onChange={(e) => setCustomWidth(e.target.value)}
                             placeholder="Auto (Full Width)"
                             className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                           />
                        </div>
                        <div className="flex-1 min-w-[150px] space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Height (px)</label>
                           <input 
                             type="number"
                             value={customHeight}
                             onChange={(e) => setCustomHeight(e.target.value)}
                             placeholder="e.g. 400"
                             className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                           />
                        </div>
                        <div className="pt-6">
                           <button 
                             onClick={handleCustomAdd}
                             disabled={!customHeight}
                             className="h-14 px-10 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-gray-900/10 hover:bg-amber-500 hover:text-black hover:shadow-amber-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                           >
                             Add Custom Banner
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="bg-gray-50 p-8 text-center flex justify-center gap-8">
                {view !== 'main' && (
                  <button 
                    onClick={() => setView('main')}
                    className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    ← Back to all widgets
                  </button>
                )}
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">More layouts coming soon</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetLibraryModal;
