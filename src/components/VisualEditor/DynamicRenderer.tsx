
import React, { useState, useEffect } from 'react';
import { cn, getLocalized } from '../../lib/utils';
import { SectionConfig, SectionType } from '../../types/editor';
import { collection, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useEditor } from './EditorContext';
import { 
  Search, 
  Star, 
  ShoppingBag, 
  PlayCircle, 
  MapPin, 
  Mail, 
  CheckCircle2, 
  MessageSquare, 
  HelpCircle, 
  Users, 
  Layout, 
  Phone,
  ChevronRight,
  Store as StoreIcon,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { Skeleton } from '../Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import SearchSection from '../SearchSection';

interface DynamicRendererProps {
  sections: SectionConfig[];
  renderEditable: (id: string, children: React.ReactNode) => React.ReactNode;
  children?: React.ReactNode;
}

const DynamicRenderer: React.FC<DynamicRendererProps> = ({ sections, renderEditable, children }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { globalSettings } = useEditor();
  const [data, setData] = useState<any>({
    banners: [],
    products: [],
    stores: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerSnap, productSnap, storeSnap, categoriesSnap] = await Promise.all([
          getDocs(query(collection(db, 'banners'), orderBy('order'))),
          getDocs(query(collection(db, 'products'), firestoreLimit(20))),
          getDocs(collection(db, 'stores')),
          getDocs(collection(db, 'categories'))
        ]);

        setData({
          banners: bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          products: productSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), price: (doc.data() as any).price || 0 } as any))
            .filter(p => p.isVisible !== false),
          stores: storeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          categories: categoriesSnap ? categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []
        });
      } catch (err) {
        console.error("Renderer data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderSection = (section: SectionConfig) => {
    if (section.isVisible === false) return null;

    const variant = section.props.variant || 'full';
    const isSmallVariant = variant === 'wide_short' || variant === 'rectangle' || variant === 'wide_long';
    
    // Add custom dimensions from props if present
    const customHeight = section.props.height;
    const customWidth = section.props.width;

    const sectionStyle: React.CSSProperties = {
      backgroundColor: section.props.bgColor,
      backgroundImage: section.props.bgImage ? `url(${section.props.bgImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      paddingTop: `${section.props.pt ?? (isSmallVariant ? 12 : 48)}px`,
      paddingBottom: `${section.props.pb ?? (isSmallVariant ? 12 : 48)}px`,
    };

    if (section.type === 'hero' && customHeight) {
      sectionStyle.height = `${customHeight}px`;
      sectionStyle.minHeight = 'unset';
    }
    
    if (section.type === 'hero' && customWidth) {
      sectionStyle.maxWidth = `${customWidth}px`;
      sectionStyle.marginLeft = 'auto';
      sectionStyle.marginRight = 'auto';
      sectionStyle.width = '100%';
    }

    const titleStyle = {
      color: section.props.titleColor,
      fontSize: section.props.titleSize ? `${section.props.titleSize}px` : undefined,
    };

    const primaryColor = globalSettings?.primaryColor || '#4f46e5';
    const titleEmoji = getLocalized(section.props, currentLang, 'titleEmoji');
    const localizedTitleColor = getLocalized(section.props, currentLang, 'titleColor');

    if (localizedTitleColor) {
      titleStyle.color = localizedTitleColor;
    }

    let content;
    switch (section.type) {
      case 'hero':
        let containerClass = "relative overflow-hidden bg-[#070B14] flex items-center";
        let contentLayout = "container mx-auto px-6 relative z-30";
        let gridClass = "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center";
        
        if (variant === 'full') {
          containerClass = cn(containerClass, "min-h-[90vh]");
        } else if (variant === 'medium') {
          containerClass = cn(containerClass, "min-h-[60vh]");
        } else if (variant === 'compact') {
          containerClass = cn(containerClass, "min-h-[30vh]");
        } else if (variant === 'wide_long') { // 970x250 approx
          containerClass = cn(containerClass, "h-[250px] max-w-[970px] mx-auto rounded-[2rem] my-8");
        } else if (variant === 'wide_short') { // 728x90 approx
          containerClass = cn(containerClass, "h-[90px] max-w-[728px] mx-auto rounded-xl my-4");
        } else if (variant === 'skyscraper') { // 300x600 approx
          containerClass = cn(containerClass, "h-[600px] w-[300px] mx-auto rounded-[2rem] my-8");
          gridClass = "flex flex-col items-center justify-center text-center gap-8";
        } else if (variant === 'rectangle') { // 300x250 approx
          containerClass = cn(containerClass, "h-[250px] w-[300px] mx-auto rounded-[2rem] my-8");
          gridClass = "flex flex-col items-center justify-center text-center gap-4";
        } else if (variant === 'custom') {
          containerClass = cn(containerClass, "mx-auto rounded-[2rem] my-8 shadow-2xl");
          gridClass = "flex flex-col items-center justify-center text-center gap-4 p-6";
        }

        const images = section.props.bgImages || (section.props.bgImage ? [section.props.bgImage] : []);
        // If no specifically defined images, check the banners collection
        const finalImages = images.length > 0 ? images : (data.banners.length > 0 ? data.banners.map((b: any) => b.imageUrl || b.image) : []);
        
        const [currentSlide, setCurrentSlide] = useState(0);

        useEffect(() => {
          if (finalImages.length > 1) {
            const timer = setInterval(() => {
              setCurrentSlide(prev => (prev + 1) % finalImages.length);
            }, 5000);
            return () => clearInterval(timer);
          }
        }, [finalImages.length]);

        content = (
          <section className={containerClass} style={sectionStyle}>
            {/* Slider / Background */}
            <div className="absolute inset-0 z-10">
               <AnimatePresence mode="wait">
                  {finalImages.length > 0 ? (
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={finalImages[currentSlide]} 
                        alt="Slider Image" 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ) : (
                    <div className="h-full w-full bg-[#070B14]" />
                  )}
               </AnimatePresence>
               
               {/* Professional Overlays */}
               {!section.props.hideOverlays && (
                 <>
                   <div className="absolute inset-0 bg-gradient-to-r from-[#070B14] via-[#070B14]/80 to-transparent z-10" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-[#070B14]/30 z-10" />
                 </>
               )}
            </div>

            {/* Slider Controls (Dots) */}
            {finalImages.length > 1 && !section.props.hideControls && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
                {finalImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={cn(
                      "h-1.5 transition-all duration-500 rounded-full",
                      currentSlide === idx ? "w-10 bg-amber-500" : "w-3 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Content Overlay */}
            <div className={contentLayout}>
               <div className={gridClass}>
                  <motion.div 
                    initial={{ opacity: 0, x: variant === 'skyscraper' || variant === 'rectangle' ? 0 : -50, y: variant === 'skyscraper' || variant === 'rectangle' ? 20 : 0 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className={cn("space-y-4 lg:space-y-8", (variant === 'skyscraper' || variant === 'rectangle') ? "max-w-full" : "max-w-xl")}
                  >
                     {!section.props.hideContent && !section.props.hideAllContent && (
                       <>
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            {getLocalized(section.props, currentLang, 'label') || 'PREMIUM COLLECTION 2024'}
                         </div>
                         <h1 className={cn(
                            "font-black tracking-tight text-white leading-[0.95]",
                            variant === 'full' ? "text-6xl sm:text-8xl" : 
                            variant === 'medium' ? "text-4xl sm:text-6xl" :
                            variant === 'compact' ? "text-3xl sm:text-4xl" :
                            variant === 'wide_long' ? "text-3xl" :
                            variant === 'wide_short' ? "text-xl" :
                            "text-3xl"
                          )} style={titleStyle}>
                            {getLocalized(section.props, currentLang, 'title') || data.banners[currentSlide]?.title || 'COMFORT LUXURY'}
                         </h1>
                         
                         {(variant === 'full' || variant === 'medium') && (
                           <p className="text-lg text-white/80 font-medium leading-relaxed max-w-md">
                              {getLocalized(section.props, currentLang, 'description') || t('section_hero:description', 'Техника нового поколения для вашего дома. Откройте для себя совершенство в каждой детали.')}
                           </p>
                         )}
                       </>
                     )}

                     {!section.props.hideButtons && !section.props.hideAllContent && (
                       <div className={cn(
                          "flex flex-wrap items-center gap-4 lg:gap-6 pt-2 lg:pt-4",
                          (variant === 'skyscraper' || variant === 'rectangle') && "justify-center"
                        )}>
                          <button className={cn(
                            "rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95",
                            (variant === 'wide_short' || variant === 'rectangle') ? "h-10 px-6" : "h-14 px-10"
                          )}>
                             {getLocalized(section.props, currentLang, 'primaryBtnText') || t('ui:explore_now', 'Explore Now')}
                          </button>
                          {variant !== 'wide_short' && variant !== 'rectangle' && (
                            <button className="h-14 px-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all hover:bg-white/10 active:scale-95">
                               {getLocalized(section.props, currentLang, 'secondaryBtnText') || t('ui:view_lookbook', 'View Lookbook')}
                            </button>
                          )}
                       </div>
                     )}

                     {(variant === 'full') && !section.props.hideAllContent && (
                       <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5">
                          {[
                            { label: 'High Quality', icon: CheckCircle2 },
                            { label: 'Pro Support', icon: MessageSquare },
                            { label: 'Secure Pay', icon: Star }
                          ].map((item, i) => (
                             <div key={i} className="flex flex-col gap-2 group cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                                   <item.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest group-hover:text-white/60 transition-colors uppercase">{item.label}</span>
                             </div>
                          ))}
                       </div>
                     )}
                  </motion.div>

                  {variant !== 'wide_long' && variant !== 'wide_short' && variant !== 'skyscraper' && variant !== 'rectangle' && !section.props.hideAllContent && (
                    <motion.div 
                      key={`featured-img-${currentSlide}`}
                      initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="relative hidden lg:block"
                    >
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
                       <img 
                          src={finalImages[currentSlide]} 
                          alt="Featured" 
                          className="relative z-10 w-full h-auto drop-shadow-[0_50px_50px_rgba(0,0,0,0.5)] rounded-[3rem]"
                       />
                    </motion.div>
                  )}
               </div>
            </div>
          </section>
        );
        break;

      case 'search':
        content = (
          <div className="relative -mt-16 z-30 container mx-auto px-6">
            <SearchSection products={data.products} categories={data.categories} style={sectionStyle} />
          </div>
        );
        break;

      case 'products':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
            <div className="mb-16 flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">
                        {t('section_products:featured_curation', 'Top Selections')}
                      </span>
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none" style={titleStyle}>
                        {titleEmoji && <span className="mr-2">{titleEmoji}</span>}
                        {getLocalized(section.props, currentLang, 'title') || t('section_products:essential_tech', 'Essential Tech')}
                    </h2>
                </div>
                <Link 
                  to="/search" 
                  className="hidden sm:flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-500 transition-colors group"
                >
                    {t('ui:view_entire_catalog', 'View Entire Catalog')}
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {data.products.slice(0, section.props.limit || 8).map((product: any, i: number) => {
                    const category = data.categories.find((c: any) => c.id === product.categoryId);
                    const typeLabel = category ? getLocalized(category, currentLang) : product.categoryId;
                    return (
                        <ProductCard 
                            key={product.id} 
                            {...product} 
                            name={getLocalized(product, currentLang)} 
                            type={typeLabel}
                            index={i} 
                        />
                    );
                })}
            </div>
          </section>
        );
        break;

      case 'categories':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
              <AnimatePresence mode="popLayout">
                {(section.props.items || data.categories.slice(0, 8)).map((item: any, index: number) => {
                  const localizedName = getLocalized(item, currentLang);
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20 
                      }}
                    >
                      <Link 
                        to={`/search?category=${item.id}`}
                        className="flex flex-col items-center gap-5 group cursor-pointer"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-[#0B1220] border border-white/5 shadow-2xl transition-all group-hover:border-amber-500/30 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10 flex items-center justify-center h-full w-full p-6">
                            {item.icon?.startsWith('http') ? (
                              <img 
                                src={item.icon} 
                                alt="" 
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" 
                              />
                            ) : (
                              <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                                {item.icon || '📦'}
                              </span>
                            )}
                          </div>
                        </motion.div>
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 transition-colors group-hover:text-amber-500">
                            {localizedName}
                          </span>
                          <div className="mt-2 h-[1px] w-0 bg-amber-500 transition-all duration-300 group-hover:w-full" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        );
        break;

      case 'text':
        content = (
          <section className="mx-auto max-w-7xl px-4 text-center" style={sectionStyle}>
             <h2 
                className="text-4xl sm:text-7xl font-black tracking-tight mb-6 text-white"
                style={titleStyle}
             >
                {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                {getLocalized(section.props, currentLang, 'title') || 'Section Title'}
             </h2>
             <p className="text-lg font-medium text-white/40 max-w-2xl mx-auto leading-relaxed">
                {getLocalized(section.props, currentLang, 'subtitle') || 'Add a descriptive subtitle here to engage your users.'}
             </p>
          </section>
        );
        break;

      case 'divider':
        content = (
          <div 
            className="w-full flex items-center justify-center opacity-10" 
            style={{ ...sectionStyle, height: `${section.props.height || 60}px`, paddingTop: 0, paddingBottom: 0 }} 
          >
            <div className="w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
          </div>
        );
        break;

      case 'banners_grid':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(section.props.items || [
                { id: '1', title: 'New Arrival', label: 'Up to 50% Off', bg: 'bg-[#0B1220]' },
                { id: '2', title: 'Summer Collection', label: 'Explore Now', bg: 'bg-[#0B1220]' },
                { id: '3', title: 'Luxury Brands', label: 'Limited Time', bg: 'bg-[#0B1220]' }
              ]).map((item: any) => (
                <div key={item.id} className={cn("relative overflow-hidden rounded-[32px] p-10 h-80 text-white group cursor-pointer border border-white/5 shadow-2xl", item.bg)}>
                  <div className="relative z-10 flex flex-col h-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4">{item.label}</span>
                    <h3 className="text-3xl font-black mb-auto leading-tight">{item.title}</h3>
                    <button className="self-start h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all">
                       Shop Now
                    </button>
                  </div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 scale-150 transition-transform group-hover:scale-[1.7] group-hover:opacity-10 duration-700">
                    <ShoppingBag size={150} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        );
        break;

      case 'reviews':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <h2 className="text-center text-4xl sm:text-6xl font-black mb-16 text-white" style={titleStyle}>
                {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                {getLocalized(section.props, currentLang, 'title') || 'What Our Clients Say'}
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {(section.props.items || [
                 { id: '1', name: 'Alex Johnson', text: 'Amazing service and fast delivery! Highly recommended.', role: 'Verified Buyer', rating: 5 },
                 { id: '2', name: 'Maria Garcia', text: 'The quality of products exceeded my expectations.', role: 'Loyal Customer', rating: 5 },
                 { id: '3', name: 'David Smith', text: 'Best platform for online shopping in the region.', role: 'Power User', rating: 4 }
               ]).map((review: any) => (
                 <div key={review.id} className="rounded-[32px] bg-[#0B1220] p-10 shadow-2xl border border-white/5 flex flex-col gap-6 group hover:border-amber-500/20 transition-all">
                   <div className="flex gap-1">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-white/10"} />
                     ))}
                   </div>
                   <p className="text-lg font-medium text-white/70 italic leading-relaxed">"{review.text}"</p>
                   <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black border border-amber-500/20">{review.name[0]}</div>
                     <div>
                       <h4 className="font-black text-white text-sm tracking-tight">{review.name}</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{review.role}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </section>
        );
        break;

      case 'faq':
        content = (
          <section className="mx-auto max-w-4xl px-6 py-12" style={sectionStyle}>
             <h2 className="text-center text-4xl font-black mb-16 text-white" style={titleStyle}>
                {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                {getLocalized(section.props, currentLang, 'title') || 'Frequently Asked Questions'}
             </h2>
             <div className="space-y-6">
               {(section.props.items || [
                 { q: 'How long does delivery take?', a: 'Typically 1-3 business days depending on your location.' },
                 { q: 'What is your return policy?', a: 'You can return any item within 14 days of purchase.' },
                 { q: 'Do you offer international shipping?', a: 'Yes, we ship to over 50 countries worldwide.' }
               ]).map((item: any, i: number) => (
                 <details key={i} className="group rounded-[2rem] bg-[#0B1220] border border-white/5 p-8 shadow-2xl open:border-amber-500/30 transition-all cursor-pointer">
                   <summary className="flex cursor-pointer items-center justify-between font-black text-white list-none tracking-tight text-lg">
                     {item.q}
                     <span className="transition-transform group-open:rotate-180 text-amber-500">
                        <ChevronRight size={24} className="rotate-90" />
                     </span>
                   </summary>
                   <p className="mt-6 text-base font-medium text-white/40 leading-relaxed border-t border-white/5 pt-6">
                     {item.a}
                   </p>
                 </details>
               ))}
             </div>
          </section>
        );
        break;

      case 'blog':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <div className="flex items-center justify-between mb-16">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] w-8 bg-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Journal</span>
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white" style={titleStyle}>
                    {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                    {getLocalized(section.props, currentLang, 'title') || 'Latest Stories'}
                  </h2>
               </div>
               <Link to="/blog" className="hidden sm:block text-xs font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors">View All</Link>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {(section.props.items || [
                 { id: '1', title: 'Top 10 Gadgets of 2024', category: 'Tech', date: 'May 12, 2024' },
                 { id: '2', title: 'Designing the Perfect Home', category: 'Lifestyle', date: 'May 10, 2024' },
                 { id: '3', title: 'Healthy Eating for Beginners', category: 'Health', date: 'May 08, 2024' }
               ]).map((post: any) => (
                 <div key={post.id} className="group cursor-pointer">
                   <div className="aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-white/5 mb-8 border border-white/5 group-hover:border-amber-500/20 transition-all backdrop-blur-xl">
                      <div className="h-full w-full bg-gradient-to-br from-amber-500/10 to-purple-600/10 opacity-40 group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   <div className="inline-block px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-4 border border-amber-500/20">{post.category}</div>
                   <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors mb-3 leading-tight tracking-tight">{post.title}</h3>
                   <span className="text-xs font-bold text-white/20 uppercase tracking-widest">{post.date}</span>
                 </div>
               ))}
             </div>
          </section>
        );
        break;

      case 'features':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
               {(section.props.items || [
                 { id: '1', title: 'Fast Shipping', desc: 'Secure delivery in 24h', icon: <ShoppingBag /> },
                 { id: '2', title: 'Secure Payment', desc: 'Protected by SSL', icon: <Star /> },
                 { id: '3', title: '24/7 Support', desc: 'We are here for you', icon: <MessageSquare /> },
                 { id: '4', title: 'Easy Returns', desc: '30-day money back', icon: <ChevronRight /> }
               ]).map((feature: any) => (
                  <div key={feature.id} className="p-10 rounded-[3rem] bg-[#0B1220] border border-white/5 hover:border-amber-500/20 transition-all group shadow-2xl">
                    <div className="h-16 w-16 mb-8 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-3xl text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all border border-white/5">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-black text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-sm font-medium text-white/40 leading-relaxed">{feature.desc}</p>
                  </div>
               ))}
             </div>
          </section>
        );
        break;

      case 'gallery':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <h2 className="text-center text-4xl sm:text-6xl font-black mb-16 text-white" style={titleStyle}>
                {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                {getLocalized(section.props, currentLang, 'title') || 'Our Gallery'}
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={cn("aspect-square rounded-[2.5rem] bg-white/5 overflow-hidden group cursor-pointer border border-white/5", i === 1 || i === 6 ? "md:row-span-2" : "")}>
                    <div className="h-full w-full bg-gradient-to-tr from-white/5 to-white/0 group-hover:scale-110 transition-transform duration-700 backdrop-blur-sm" />
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
             </div>
          </section>
        );
        break;

      case 'video':
        content = (
          <section className="mx-auto max-w-5xl px-6 py-12" style={sectionStyle}>
             <div className="aspect-video relative rounded-[3rem] bg-black overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-amber-500/10 transition-all z-10 backdrop-blur-[2px]">
                   <div className="h-24 w-24 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-[0_0_50px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-all ring-8 ring-amber-500/20">
                      <PlayCircle size={48} fill="black" />
                   </div>
                </div>
                {section.props.thumbnail && <img src={section.props.thumbnail} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
             </div>
          </section>
        );
        break;

      case 'team':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12 text-center" style={sectionStyle}>
             <h2 className="text-4xl sm:text-6xl font-black mb-16 text-white" style={titleStyle}>
                {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                {getLocalized(section.props, currentLang, 'title') || 'Meet Our Team'}
             </h2>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-20">
               {(section.props.items || [
                 { id: '1', name: 'John Doe', role: 'Founder & CEO' },
                 { id: '2', name: 'Jane Smith', role: 'Head of Marketing' },
                 { id: '3', name: 'Robert Fox', role: 'Product Manager' },
                 { id: '4', name: 'Sarah Lee', role: 'Senior Designer' }
               ]).map((member: any) => (
                 <div key={member.id} className="group">
                   <div className="aspect-square rounded-[3rem] bg-white/5 mb-8 overflow-hidden relative border border-white/10 shadow-2xl transition-all group-hover:-translate-y-4 group-hover:border-amber-500/30">
                     <div className="h-full w-full bg-gradient-to-b from-white/10 to-transparent" />
                     <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <h3 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors tracking-tight">{member.name}</h3>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{member.role}</span>
                 </div>
               ))}
             </div>
          </section>
        );
        break;

      case 'contacts':
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
               <div className="space-y-12">
                 <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <div className="h-[1px] w-8 bg-amber-500" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Reach Out</span>
                    </div>
                    <h2 className="text-4xl sm:text-7xl font-black tracking-tight text-white leading-none" style={titleStyle}>
                       {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                       {getLocalized(section.props, currentLang, 'title') || 'Contact Us'}
                    </h2>
                    <p className="text-xl font-medium text-white/40 leading-relaxed max-w-md">{section.props.subtitle || 'Always happy to hear from you'}</p>
                 </div>
                 <div className="space-y-6">
                   <div className="group flex items-center gap-8 p-8 rounded-[2.5rem] bg-[#0B1220] border border-white/5 shadow-2xl transition-all hover:border-amber-500/20">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 transition-all group-hover:scale-110 group-hover:bg-amber-500/20"><MapPin size={32} /></div>
                      <div>
                        <h4 className="font-black text-white text-lg tracking-tight">Address</h4>
                        <p className="text-base font-medium text-white/40">123 Street Name, City, Country</p>
                      </div>
                   </div>
                   <div className="group flex items-center gap-8 p-8 rounded-[2.5rem] bg-[#0B1220] border border-white/5 shadow-2xl transition-all hover:border-amber-500/20">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 transition-all group-hover:scale-110 group-hover:bg-blue-500/20"><Mail size={32} /></div>
                      <div>
                        <h4 className="font-black text-white text-lg tracking-tight">Email</h4>
                        <p className="text-base font-medium text-white/40">hello@example.com</p>
                      </div>
                   </div>
                 </div>
               </div>
               <div className="aspect-[4/3] rounded-[4rem] bg-[#0B1220] border border-white/10 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-indigo-500/10 flex items-center justify-center p-20">
                    <div className="text-center space-y-4">
                       <MapPin size={48} className="mx-auto text-amber-500 animate-bounce" />
                       <span className="block text-xs font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-amber-500 transition-colors">Interactive Map Integration</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
               </div>
             </div>
          </section>
        );
        break;

      case 'marquee':
        content = (
          <section className="w-full bg-[#0B1220] border-y border-white/5 py-12 overflow-hidden" style={sectionStyle}>
            <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 text-3xl font-black uppercase tracking-tighter text-white/10 group cursor-default">
                   <div className="h-10 w-10 flex items-center justify-center rounded-full border border-white/5 text-amber-500 group-hover:border-amber-500/30">
                      <ShoppingBag size={20} strokeWidth={2.5} />
                   </div>
                   <span className="group-hover:text-white transition-colors">{section.props.text || 'FLASH SALE 50% OFF'}</span>
                </div>
              ))}
            </div>
          </section>
        );
        break;

      case 'forms':
        content = (
          <section className="mx-auto max-w-3xl px-6 py-12" style={sectionStyle}>
             <div className="rounded-[4rem] bg-[#0B1220] p-12 lg:p-20 shadow-2xl border border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <h2 
                className="text-4xl sm:text-6xl font-black mb-12 text-center text-white tracking-tight relative z-10" 
                style={titleStyle}
               >
                  {titleEmoji && <span className="mr-3">{titleEmoji}</span>}
                  {getLocalized(section.props, currentLang, 'title') || 'Send Message'}
               </h2>
               <div className="space-y-6 relative z-10">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <input placeholder="Name" className="w-full rounded-2xl bg-white/5 border border-white/5 px-8 py-5 font-bold focus:border-amber-500/40 focus:bg-white/10 transition-all outline-none text-white placeholder:text-white/20" />
                   <input placeholder="Phone" className="w-full rounded-2xl bg-white/5 border border-white/5 px-8 py-5 font-bold focus:border-amber-500/40 focus:bg-white/10 transition-all outline-none text-white placeholder:text-white/20" />
                 </div>
                 <input placeholder="Email" className="w-full rounded-2xl bg-white/5 border border-white/5 px-8 py-5 font-bold focus:border-amber-500/40 focus:bg-white/10 transition-all outline-none text-white placeholder:text-white/20" />
                 <textarea rows={5} placeholder="Your message..." className="w-full rounded-[2rem] bg-white/5 border border-white/5 px-8 py-6 font-bold focus:border-amber-500/40 focus:bg-white/10 transition-all outline-none text-white placeholder:text-white/20 resize-none" />
                 <button className="w-full bg-amber-500 text-black font-black py-6 rounded-2xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)] uppercase tracking-[0.2em] text-xs">Send Inquiry</button>
               </div>
             </div>
          </section>
        );
        break;

      case 'product_feature':
        const featured = data.products[0];
        content = (
          <section className="mx-auto max-w-screen-2xl px-6 py-12" style={sectionStyle}>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-[#0B1220] rounded-[4rem] p-12 lg:p-24 shadow-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="relative aspect-square">
                   <div className="absolute inset-0 bg-amber-500/5 rounded-[3rem] rotate-6 border border-amber-500/10" />
                   <div className="absolute inset-0 bg-white/5 rounded-[3rem] flex items-center justify-center overflow-hidden border border-white/10 backdrop-blur-xl">
                      {featured?.image && <img src={featured.image} referrerPolicy="no-referrer" className="h-[80%] w-[80%] object-contain p-8 hover:scale-110 transition-transform duration-1000" />}
                   </div>
                </div>
                <div className="space-y-8 relative z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                      <Zap size={14} className="fill-current" />
                      Limited Spotlight
                   </div>
                   <h2 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[0.95]" style={titleStyle}>{featured ? getLocalized(featured, currentLang) : 'Featured Product'}</h2>
                   <p className="text-xl font-medium text-white/40 leading-relaxed max-w-md">Experience the next generation of performance and design with our flagship featured product of the month.</p>
                   {featured && (
                     <div className="flex items-center gap-10 pt-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-white/30 uppercase tracking-widest mb-1">Exclusive Price</span>
                           <span className="text-4xl font-black text-amber-500 tracking-tight">{featured.price} {t('currency_symbol') || '֏'}</span>
                        </div>
                        <Link to={`/product/${featured.id}`} className="bg-white text-black px-12 py-5 rounded-2xl font-black hover:bg-amber-500 transition-all uppercase text-xs tracking-widest shadow-2xl active:scale-95">Discover</Link>
                     </div>
                   )}
                </div>
             </div>
          </section>
        );
        break;

      case 'native':
        content = (
          <div style={sectionStyle} className="container mx-auto px-6">
            {children}
          </div>
        );
        break;

      case 'sliders':
        content = (
          <section className="w-full py-12" style={sectionStyle}>
             <div className="relative min-h-[600px] bg-[#0B1220] rounded-[4rem] mx-6 overflow-hidden flex items-center justify-center text-white text-center border border-white/5 group">
                <div className="absolute inset-0">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070B14]/60 to-[#070B14] z-10" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent_70%)]" />
                </div>
                <div className="relative z-20 max-w-3xl px-10 space-y-8">
                   <span className="inline-block px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-amber-500/20">Summer Season</span>
                   <h2 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none" style={titleStyle}>ELITE CURATION</h2>
                   <p className="text-xl font-medium text-white/50 leading-relaxed max-w-2xl mx-auto">New patterns and exclusive designs for your perfect luxury look. Expertly crafted for the bold and inspired.</p>
                   <button className="bg-amber-500 text-black h-16 px-16 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all shadow-[0_20px_50px_-10px_rgba(245,158,11,0.4)] active:scale-95">Shop Elite</button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-30 group-hover:opacity-50 transition-all duration-1000" />
             </div>
          </section>
        );
        break;

      default:
        content = <div className="p-10 border border-dashed border-gray-200 rounded-3xl text-center text-gray-400">Section type "{section.type}" not implemented</div>;
    }

    return renderEditable(section.id, content);
  };

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <React.Fragment key={section.id}>
           {renderSection(section)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DynamicRenderer;
