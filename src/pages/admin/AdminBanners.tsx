import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Layout, 
  Type, 
  MousePointer2, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize2,
  Minimize2,
  Eye,
  Save,
  PlusCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  link: string;
  textColor?: string;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  textAlign?: 'left' | 'center' | 'right';
  theme?: 'light' | 'dark';
  buttonText?: string;
  buttonUrl?: string;
  hasDetailsPage?: boolean;
  detailsContent?: string;
  order: number;
}

const AdminBanners: React.FC = () => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    link: '',
    textColor: '#ffffff',
    textSize: 'md',
    textAlign: 'center',
    theme: 'dark',
    buttonText: 'Learn More',
    buttonUrl: '',
    hasDetailsPage: false,
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    try {
      await addDoc(collection(db, 'banners'), {
        ...newBanner,
        order: banners.length
      });
      setNewBanner({
        imageUrl: '',
        title: '',
        subtitle: '',
        link: '',
        textColor: '#ffffff',
        textSize: 'md',
        textAlign: 'center',
        theme: 'dark',
        buttonText: 'Learn More',
        buttonUrl: '',
        hasDetailsPage: false,
        order: 0
      });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banners');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Banner>) => {
    try {
      const { id: _, ...rest } = data as any;
      await updateDoc(doc(db, 'banners', id), rest);
      setEditingBanner(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banners/${id}`);
    }
  };

  return (
    <div className="space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:campaign_banners', 'Campaign Banners')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:campaign_banners_subtitle', 'High-fidelity visual narratives for global deployment.')}</p>
        </motion.div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          {t('admin:deploy_new_banner', 'Deploy New Banner')}
        </button>
      </header>

      {/* Grid of Banners */}
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 px-2">
        {loading ? (
          <div className="col-span-full py-40 text-center">
            <RefreshCw size={64} className="mx-auto animate-spin text-[#C5A059] opacity-20" />
            <p className="mt-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">{t('admin:synchronizing_assets', 'Synchronizing Visual Assets...')}</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {banners.map((banner) => (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-[40px] bg-[#081120] border border-white/5 shadow-2xl transition-all hover:bg-[#0B1220]"
              >
                {/* Preview */}
                <div className="relative aspect-[16/9] overflow-hidden bg-[#050816]">
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" />
                  <div className={cn(
                    "absolute inset-0 flex flex-col p-10 transition-all duration-500",
                    banner.textAlign === 'center' ? 'items-center justify-center text-center' : banner.textAlign === 'right' ? 'items-end justify-center text-right' : 'items-start justify-center text-left'
                  )} style={{ color: banner.textColor || '#ffffff' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    <div className="relative z-10 transform transition-transform group-hover:-translate-y-2">
                        <h3 className={cn(
                          "font-display font-black leading-tight uppercase tracking-tight",
                          banner.textSize === 'xl' ? 'text-3xl' : banner.textSize === 'lg' ? 'text-2xl' : banner.textSize === 'md' ? 'text-xl' : 'text-lg'
                        )}>{banner.title}</h3>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 leading-relaxed max-w-[200px] mx-auto">{banner.subtitle}</p>
                        
                        {banner.buttonText && (
                          <div className="mt-6 inline-flex rounded-full bg-[#C5A059]/10 px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#F1D28C] backdrop-blur-md border border-[#C5A059]/20 shadow-lg">
                            {banner.buttonText}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between p-8 bg-gradient-to-b from-transparent to-[#050816]/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 border border-white/10 group-hover:text-[#C5A059] group-hover:border-[#C5A059]/30 transition-all shadow-inner">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C]">
                           {t('admin:deployed', 'Deployed')}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-700 mt-0.5">
                            SIG: {banner.id.slice(0, 8)}
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setEditingBanner(banner)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white border border-white/5 transition-all shadow-xl"
                    >
                        <Layout size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(banner.id)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {(isAdding || editingBanner) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#050816]/90 backdrop-blur-xl"
              onClick={() => { setIsAdding(false); setEditingBanner(null); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[48px] bg-[#0B1220] border border-white/10 shadow-[0_50px_200px_rgba(0,0,0,0.8)]"
            >
               <div className="flex h-full flex-col lg:flex-row">
                  {/* Left: Preview Area */}
                  <div className="relative flex-1 bg-[#050816] p-12 flex items-center justify-center overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.05)_0,transparent_70%)]" />
                     
                     <div className="relative aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 group/preview">
                        <img 
                          src={(editingBanner?.imageUrl || newBanner.imageUrl) || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
                          className="h-full w-full object-cover opacity-80" 
                          alt=""
                        />
                        <div className={cn(
                          "absolute inset-0 flex flex-col p-16",
                          (editingBanner?.textAlign || newBanner.textAlign) === 'center' ? 'items-center justify-center text-center' : (editingBanner?.textAlign || newBanner.textAlign) === 'right' ? 'items-end justify-center text-right' : 'items-start justify-center text-left'
                        )} style={{ color: (editingBanner?.textColor || newBanner.textColor) }}>
                           <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent opacity-60" />
                           <div className="relative z-10">
                             <motion.h3 
                               layoutId="bannerTitle"
                               className={cn(
                                  "font-display font-black leading-none uppercase tracking-tight max-w-2xl",
                                  (editingBanner?.textSize || newBanner.textSize) === 'xl' ? 'text-7xl' : (editingBanner?.textSize || newBanner.textSize) === 'lg' ? 'text-5xl' : (editingBanner?.textSize || newBanner.textSize) === 'md' ? 'text-4xl' : 'text-2xl'
                               )}
                             >
                               {(editingBanner?.title || newBanner.title) || 'PRIMARY HEADING'}
                             </motion.h3>
                             <p className="mt-8 text-xl font-medium text-white/70 max-w-lg leading-relaxed">{(editingBanner?.subtitle || newBanner.subtitle) || 'Add a compelling description to engage users through premium storytelling.'}</p>
                             {(editingBanner?.buttonText || newBanner.buttonText) && (
                                <button className="mt-12 rounded-full bg-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-2xl transition-transform hover:scale-105 active:scale-95">
                                   {(editingBanner?.buttonText || newBanner.buttonText)}
                                </button>
                             )}
                           </div>
                        </div>
                     </div>

                     <div className="absolute top-12 left-12 flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#F1D28C] backdrop-blur-md">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        {t('admin:rendering_engine_active', 'Rendering Engine Active')}
                     </div>
                  </div>

                  {/* Right: Controls Area */}
                  <div className="w-full lg:w-[450px] overflow-y-auto p-12 bg-[#081120] border-l border-white/10 custom-scrollbar">
                     <div className="mb-12 flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">{t('admin:architect', 'Architect')}</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-1">{t('admin:banner_config_pod', 'Banner configuration pod.')}</p>
                        </div>
                        <button 
                          onClick={() => { setIsAdding(false); setEditingBanner(null); }}
                          className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                        >
                           <X size={20} />
                        </button>
                     </div>

                     <div className="space-y-12">
                        {/* Section: Base Data */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
                              <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
                              {t('admin:infrastructure', 'Infrastructure')}
                           </div>
                           <div className="space-y-4">
                             <input 
                                type="text" 
                                placeholder="Asset URL (Unsplash/CDN)"
                                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-6 py-4 text-sm font-bold text-white placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                                value={editingBanner?.imageUrl || newBanner.imageUrl}
                                onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, imageUrl: e.target.value}) : setNewBanner({...newBanner, imageUrl: e.target.value})}
                             />
                             <input 
                                type="text" 
                                placeholder="Primary Heading"
                                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-6 py-4 text-sm font-black text-white uppercase tracking-widest placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                                value={editingBanner?.title || newBanner.title}
                                onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, title: e.target.value}) : setNewBanner({...newBanner, title: e.target.value})}
                             />
                             <textarea 
                                placeholder="Sub-narrative descriptor..."
                                rows={3}
                                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner resize-none leading-relaxed"
                                value={editingBanner?.subtitle || newBanner.subtitle}
                                onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, subtitle: e.target.value}) : setNewBanner({...newBanner, subtitle: e.target.value})}
                             />
                           </div>
                        </div>

                        {/* Section: Typography Styling */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
                              <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
                              {t('admin:aesthetics', 'Aesthetics')}
                           </div>
                           <div className="bg-[#050816] p-2 rounded-[28px] border border-white/5 flex gap-2">
                              {['left', 'center', 'right'].map((align) => (
                                 <button
                                    key={align}
                                    onClick={() => editingBanner ? setEditingBanner({...editingBanner, textAlign: align as any}) : setNewBanner({...newBanner, textAlign: align as any})}
                                    className={cn(
                                       "flex-1 flex h-14 items-center justify-center rounded-[22px] transition-all relative overflow-hidden",
                                       (editingBanner?.textAlign || newBanner.textAlign) === align 
                                          ? "bg-[#C5A059] text-[#050816] shadow-[0_5px_15px_rgba(197,160,89,0.2)]" 
                                          : "text-slate-700 hover:text-slate-400"
                                    )}
                                 >
                                    {align === 'left' ? <AlignLeft size={20}/> : align === 'center' ? <AlignCenter size={20}/> : <AlignRight size={20}/>}
                                 </button>
                              ))}
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">{t('admin:scale', 'Scale')}</label>
                                 <div className="relative">
                                   <select 
                                      className="w-full h-14 rounded-[24px] bg-[#050816] border border-white/5 px-6 text-[10px] font-black uppercase tracking-widest text-[#F1D28C] outline-none appearance-none cursor-pointer"
                                      value={editingBanner?.textSize || newBanner.textSize}
                                      onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, textSize: e.target.value as any}) : setNewBanner({...newBanner, textSize: e.target.value as any})}
                                   >
                                      <option value="sm">{t('admin:small_ui', 'Small (UI)')}</option>
                                      <option value="md">{t('admin:medium_std', 'Medium (STD)')}</option>
                                      <option value="lg">{t('admin:large_hdr', 'Large (HDR)')}</option>
                                      <option value="xl">{t('admin:display_max', 'Display (MAX)')}</option>
                                   </select>
                                   <RefreshCw className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none" size={14} />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">{t('admin:node_color', 'Node Color')}</label>
                                 <div className="flex items-center gap-4">
                                    <div className="relative group">
                                      <div className="absolute inset-0 blur-xl opacity-20" style={{ backgroundColor: (editingBanner?.textColor || newBanner.textColor) }} />
                                      <input 
                                         type="color"
                                         className="relative h-14 w-14 rounded-[20px] bg-transparent p-0 outline-none border-4 border-[#050816] cursor-pointer overflow-hidden shadow-2xl"
                                         value={editingBanner?.textColor || newBanner.textColor}
                                         onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, textColor: e.target.value}) : setNewBanner({...newBanner, textColor: e.target.value})}
                                      />
                                    </div>
                                    <code className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                       {(editingBanner?.textColor || newBanner.textColor || '#FFFFFF').toUpperCase()}
                                    </code>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Section: Interaction */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
                              <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
                              {t('admin:protocols', 'Protocols')}
                           </div>
                           <div className="space-y-4">
                             <input 
                                type="text" 
                                placeholder="CTA Directive (e.g. SHOP NOW)"
                                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-6 py-4 text-sm font-black text-white uppercase tracking-[0.2em] placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                                value={editingBanner?.buttonText || newBanner.buttonText}
                                onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, buttonText: e.target.value}) : setNewBanner({...newBanner, buttonText: e.target.value})}
                             />
                             <input 
                                type="text" 
                                placeholder="Gateway Link Path"
                                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                                value={editingBanner?.buttonUrl || newBanner.buttonUrl}
                                onChange={(e) => editingBanner ? setEditingBanner({...editingBanner, buttonUrl: e.target.value}) : setNewBanner({...newBanner, buttonUrl: e.target.value})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between rounded-[32px] bg-[#050816] p-6 border border-white/5 shadow-inner">
                              <div>
                                 <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{t('admin:deep_link_interface', 'Deep Link Interface')}</p>
                                 <p className="text-[10px] font-medium text-slate-600 mt-1 uppercase tracking-tight">{t('admin:init_dedicated_node', 'Initialize dedicated landing node')}</p>
                              </div>
                              <button 
                                onClick={() => editingBanner ? setEditingBanner({...editingBanner, hasDetailsPage: !editingBanner.hasDetailsPage}) : setNewBanner({...newBanner, hasDetailsPage: !newBanner.hasDetailsPage})}
                                className={cn(
                                   "h-8 w-14 rounded-full p-1 transition-all",
                                   (editingBanner?.hasDetailsPage || newBanner.hasDetailsPage) ? "bg-[#C5A059]" : "bg-white/5"
                                )}
                              >
                                 <div className={cn(
                                    "h-6 w-6 rounded-full transition-all shadow-xl",
                                    (editingBanner?.hasDetailsPage || newBanner.hasDetailsPage) ? "translate-x-6 bg-[#050816]" : "translate-x-0 bg-slate-800"
                                 )} />
                              </button>
                           </div>
                        </div>

                        <div className="pt-10">
                           <button 
                             onClick={editingBanner ? () => handleUpdate(editingBanner.id, editingBanner) : handleAdd}
                             className="flex w-full items-center justify-center gap-4 rounded-[32px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] py-6 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.3)] transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                           >
                              <Save size={20} />
                              {t('admin:archive_asset', 'Archive Asset')}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBanners;

