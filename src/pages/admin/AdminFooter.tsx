import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  Link as LinkIcon, 
  FileText, 
  ChevronRight,
  Save,
  X,
  PlusCircle,
  Type,
  Palette,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface FooterSection {
  id: string;
  title: string;
  order: number;
  settings?: {
    color?: string;
    fontSize?: string;
  };
}

interface FooterLink {
  id: string;
  sectionId: string;
  label: string;
  url: string;
  order: number;
  type: 'internal' | 'page' | 'external';
  pageId?: string;
}

interface FooterSettings {
  logoUrl: string;
  description: string;
  copyright: string;
}

const AdminFooter: React.FC = () => {
  const { t } = useTranslation();
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [settings, setSettings] = useState<FooterSettings>({
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3649/3649390.png',
    description: 'Самый быстрый способ сравнить цены во всех магазинах Армении.',
    copyright: '© 2026 Сравни всё. Сделано с любовью.'
  });
  
  const [isEditingSection, setIsEditingSection] = useState<string | null>(null);
  const [isEditingLink, setIsEditingLink] = useState<{ sectionId: string, linkId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [sectionForm, setSectionForm] = useState({ title: '', color: '', fontSize: '' });
  const [linkForm, setLinkForm] = useState({ label: '', url: '', type: 'page' as any, pageId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sSnap = await getDocs(query(collection(db, 'footer_sections'), orderBy('order', 'asc')));
      const lSnap = await getDocs(query(collection(db, 'footer_links'), orderBy('order', 'asc')));
      const setSnap = await getDoc(doc(db, 'footer_settings', 'main'));
      
      setSections(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as FooterSection)));
      setLinks(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as FooterLink)));
      if (setSnap.exists()) {
        setSettings(setSnap.data() as FooterSettings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'footer_settings', 'main'), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'footer_settings/main');
    } finally {
      setSavingSettings(false);
    }
  };

  const seedDefaults = async () => {
    if (!window.confirm("Это удалит ТЕКУЩИЙ вид и вернет старый стандартный подвал. Продолжить?")) return;
    setSeedLoading(true);
    try {
      // Clear existing robustly
      const sSnap = await getDocs(collection(db, 'footer_sections'));
      const lSnap = await getDocs(collection(db, 'footer_links'));
      
      await Promise.all([
        ...sSnap.docs.map(d => deleteDoc(d.ref)),
        ...lSnap.docs.map(d => deleteDoc(d.ref))
      ]);

      const defaultSettings = {
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3649/3649390.png',
        description: 'Самый быстрый способ сравнить цены во всех магазинах Армении. Экономьте время и деньги вместе с нами.',
        copyright: '© 2026 СРАВНИ ВСЁ. СДЕЛАНО С ЛЮБОВЬЮ.'
      };
      await setDoc(doc(db, 'footer_settings', 'main'), defaultSettings);
      setSettings(defaultSettings);

      const defaults = [
        { title: 'HOME_TITLE', links: [{ label: 'Главная', url: '/' }, { label: 'О нас', url: 'about-us' }, { label: 'Контакты', url: 'contacts' }] },
        { title: 'БИЗНЕС', links: [{ label: 'Стать партнером', url: '/partnership', internal: true }, { label: 'Реклама', url: '/advertising', internal: true }] },
        { title: 'ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ', links: [{ label: 'Политика конфиденциальности', url: 'privacy' }, { label: 'Условия использования', url: 'terms' }] }
      ];

      for (let i = 0; i < defaults.length; i++) {
        const s = defaults[i];
        const sDoc = await addDoc(collection(db, 'footer_sections'), {
          title: s.title,
          order: i,
          settings: { color: '#C5A059', fontSize: '11px' }
        });

        for (let j = 0; j < s.links.length; j++) {
          const l = s.links[j];
          let type = 'page';
          let url = '/page/' + l.url;
          if ((l as any).internal) {
            type = 'internal';
            url = l.url;
          }

          await addDoc(collection(db, 'footer_links'), {
            sectionId: sDoc.id,
            label: l.label,
            url: url,
            type: type,
            pageId: type === 'page' ? l.url : null,
            order: j
          });

          if (type === 'page') {
             await setDoc(doc(db, 'content_pages', l.url), {
               title: l.label,
               content: `
                 <div class="space-y-6">
                   <h1 class="text-4xl font-black text-white">${l.label}</h1>
                   <p class="text-lg text-slate-400">Добро пожаловать на страницу "${l.label}". Здесь вы найдете всю необходимую информацию.</p>
                   <div class="h-[200px] w-full rounded-3xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                     <p class="font-black text-slate-700 uppercase tracking-widest">Место для вашего контента</p>
                   </div>
                 </div>
               `,
               updatedAt: serverTimestamp()
             });
          }
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSeedLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!sectionForm.title) return;
    try {
      await addDoc(collection(db, 'footer_sections'), {
        title: sectionForm.title,
        order: sections.length,
        settings: {
          color: sectionForm.color || '#C5A059',
          fontSize: sectionForm.fontSize || '14px'
        }
      });
      setSectionForm({ title: '', color: '', fontSize: '' });
      fetchData();
    } catch (err) {
       handleFirestoreError(err, OperationType.CREATE, 'footer_sections');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm("Удалить эту колонку и все её ссылки?")) return;
    try {
      const lSnap = await getDocs(query(collection(db, 'footer_links')));
      const sectionLinks = lSnap.docs.filter(d => d.data().sectionId === id);
      
      await deleteDoc(doc(db, 'footer_sections', id));
      await Promise.all(sectionLinks.map(l => deleteDoc(l.ref)));
      
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'footer_sections');
    }
  };

  const handleUpdateSectionTitle = async (id: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'footer_sections', id), { title: newTitle });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'footer_sections');
    }
  };

  const handleEditLink = (sectionId: string, link: FooterLink) => {
    setIsEditingLink({ sectionId, linkId: link.id });
    setLinkForm({ 
      label: link.label, 
      url: link.url, 
      type: link.type, 
      pageId: link.pageId || '' 
    });
  };

  const handleAddLink = async (sectionId: string) => {
    if (!linkForm.label) return;
    try {
      let finalUrl = linkForm.url;
      let finalPageId = linkForm.pageId;

      if (linkForm.type === 'page' && !finalPageId) {
        const pageId = linkForm.label.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').slice(0, 100);
        await setDoc(doc(db, 'content_pages', pageId), {
          title: linkForm.label,
          content: '<h1 class="text-white">' + linkForm.label + '</h1><p class="text-slate-400">Контент страницы...</p>',
          updatedAt: serverTimestamp()
        });
        finalUrl = '/page/' + pageId;
        finalPageId = pageId;
      }

      if (isEditingLink?.linkId) {
         await updateDoc(doc(db, 'footer_links', isEditingLink.linkId), {
            label: linkForm.label,
            url: finalUrl,
            type: linkForm.type,
            pageId: finalPageId || null
         });
      } else {
        await addDoc(collection(db, 'footer_links'), {
          sectionId,
          label: linkForm.label,
          url: finalUrl,
          type: linkForm.type,
          pageId: finalPageId || null,
          order: links.filter(l => l.sectionId === sectionId).length
        });
      }
      
      setLinkForm({ label: '', url: '', type: 'page', pageId: '' });
      setIsEditingLink(null);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'footer_links');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm("Удалить эту ссылку?")) return;
    try {
      await deleteDoc(doc(db, 'footer_links', id));
      setIsEditingLink(null);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'footer_links');
    }
  };

  const handleEditPage = (pageId: string) => {
    window.open(`/page/${pageId}`, '_blank');
  };

  if (loading) return <div className="p-10 font-bold text-slate-500 bg-[#050816] min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-[#C5A059]" size={40} /></div>;

  return (
    <div className="max-w-6xl pb-20 text-white">
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none italic">Footer Engine</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">Architect the platform structure and global navigation nodes.</p>
        </div>
        <button 
          onClick={seedDefaults}
          disabled={seedLoading}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-white/5 border border-white/10 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 group shadow-xl"
        >
          {seedLoading ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />}
          Reset to Factory Defaults
        </button>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-12 px-2">
        {/* Global Settings Card */}
        <section className="relative overflow-hidden rounded-[48px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
          
          <div className="mb-10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#C5A059] border border-white/10 shadow-inner">
                <Palette size={28} />
              </div>
              <div>
                 <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Base Environment</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Global settings for the footer component.</p>
              </div>
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
            >
              {savingSettings ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Commit Global State
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Vector Logo URI</label>
              <input 
                type="text" 
                value={settings.logoUrl}
                onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-8 py-5 text-sm font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                placeholder="https://assets.cdn.com/logo.svg"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Legal Copyright Node</label>
              <input 
                type="text" 
                value={settings.copyright}
                onChange={e => setSettings({...settings, copyright: e.target.value})}
                className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-8 py-5 text-sm font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                placeholder="© 2026 ARCHIVE..."
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Corporate Narrative Descriptor</label>
              <textarea 
                value={settings.description}
                onChange={e => setSettings({...settings, description: e.target.value})}
                rows={3}
                className="w-full rounded-[32px] bg-[#050816] border border-white/5 px-8 py-6 text-sm font-medium text-slate-400 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner resize-none leading-relaxed"
                placeholder="Core mission statement or platform description..."
              />
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 px-2">
        {sections.map(section => (
          <motion.div 
            layout
            key={section.id}
            className="group relative overflow-hidden rounded-[40px] bg-[#081120] border border-white/5 shadow-2xl transition-all hover:bg-[#0B1220]"
          >
            <div className="flex items-center justify-between border-b border-white/5 bg-[#050816]/30 p-8">
              <div className="flex flex-1 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#C5A059] border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                  <Maximize2 size={18} />
                </div>
                <input 
                  type="text" 
                  defaultValue={section.title}
                  onBlur={(e) => {
                    if (e.target.value !== section.title) {
                      handleUpdateSectionTitle(section.id, e.target.value);
                    }
                  }}
                  className="w-full bg-transparent font-display font-black text-white uppercase tracking-widest focus:outline-none focus:ring-0 text-xs"
                  style={{ color: section.settings?.color }}
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSection(section.id);
                }} 
                className="opacity-0 group-hover:opacity-100 rounded-xl p-2.5 text-slate-600 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="min-h-[250px] p-8">
              <div className="space-y-3">
                {links.filter(l => l.sectionId === section.id).map(link => (
                  <div key={link.id} className="group/link flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/5 border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-slate-800 group-hover/link:bg-[#C5A059] transition-colors shadow-[0_0_10px_currentColor]" />
                      <span className="text-[11px] font-bold text-slate-400 group-hover/link:text-white transition-colors uppercase tracking-widest">{link.label}</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover/link:opacity-100 transition-all scale-90 group-hover/link:scale-100">
                      <button 
                         onClick={() => handleEditLink(section.id, link)}
                         className="rounded-xl p-2 text-slate-600 hover:bg-white/10 hover:text-[#C5A059] transition-all"
                      >
                         <Edit3 size={14} />
                      </button>
                      {link.pageId && (
                        <button 
                          onClick={() => handleEditPage(link.pageId!)}
                          className="rounded-xl p-2 text-slate-600 hover:bg-white/10 hover:text-blue-400 transition-all"
                        >
                          <FileText size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsEditingLink({ sectionId: section.id })}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/5 bg-[#050816]/50 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 transition-all hover:border-[#C5A059]/30 hover:bg-[#C5A059]/5 hover:text-[#F1D28C] group/btn"
              >
                <PlusCircle size={18} className="group-hover/btn:rotate-90 transition-transform" />
                Initialize Link
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add Section Card */}
        <div className="relative overflow-hidden rounded-[40px] border-2 border-dashed border-white/5 bg-[#081120]/30 p-10 text-center transition-all hover:bg-[#081120]/50 hover:border-white/10 group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] opacity-[0.02] blur-[50px] pointer-events-none" />
           
           <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/5 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
             <Plus size={40} className="text-[#C5A059]" />
           </div>
           <h3 className="mb-8 font-display font-black text-white uppercase tracking-tight text-xl">New Column Node</h3>
           
           <div className="space-y-4 text-left">
             <div className="space-y-1.5 px-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Column Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. NAVIGATION" 
                  value={sectionForm.title}
                  onChange={e => setSectionForm({...sectionForm, title: e.target.value})}
                  className="w-full rounded-2xl bg-[#050816] border border-white/5 p-4 text-xs font-black text-white uppercase tracking-widest focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                />
             </div>
             
             <div className="flex gap-4">
                <div className="space-y-1.5 px-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Hue</label>
                   <input 
                      type="color" 
                      value={sectionForm.color || '#C5A059'}
                      onChange={e => setSectionForm({...sectionForm, color: e.target.value})}
                      className="h-14 w-14 overflow-hidden rounded-2xl border-4 border-[#050816] outline-none cursor-pointer shadow-xl"
                   />
                </div>
                <div className="flex-1 space-y-1.5 px-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Scale</label>
                   <select 
                      value={sectionForm.fontSize}
                      onChange={e => setSectionForm({...sectionForm, fontSize: e.target.value})}
                      className="w-full h-14 rounded-2xl bg-[#050816] border border-white/5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest focus:border-[#C5A059]/40 outline-none transition-all appearance-none cursor-pointer"
                   >
                      <option value="12px" className="bg-[#050816]">MIN (12px)</option>
                      <option value="14px" className="bg-[#050816]">STD (14px)</option>
                      <option value="16px" className="bg-[#050816]">MAX (16px)</option>
                   </select>
                </div>
             </div>
             
             <button 
               onClick={handleAddSection}
               className="w-full flex items-center justify-center gap-3 rounded-[24px] bg-white/5 border border-white/10 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-white/10 active:scale-95 shadow-xl mt-6"
             >
               Deploy Column
             </button>
           </div>
        </div>
      </div>

      {/* Add Link Modal */}
      <AnimatePresence>
        {isEditingLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050816]/90 backdrop-blur-xl">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => { setIsEditingLink(null); setLinkForm({ label: '', url: '', type: 'page', pageId: '' }); }}
               className="absolute inset-0"
            />
            
            <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               className="relative w-full max-w-lg rounded-[48px] bg-[#0B1220] p-12 border border-white/10 shadow-[0_50px_150px_rgba(0,0,0,0.8)]"
            >
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                    {isEditingLink.linkId ? 'Edit Node' : 'Initialize Node'}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-1 italic">Protocol V2 Navigation Sequence</p>
                </div>
                <button 
                  onClick={() => {
                    setIsEditingLink(null);
                    setLinkForm({ label: '', url: '', type: 'page', pageId: '' });
                  }} 
                  className="rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-rose-500 hover:text-white transition-all border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Node Directive</label>
                  <input 
                    type="text" 
                    value={linkForm.label}
                    onChange={e => setLinkForm({...linkForm, label: e.target.value})}
                    placeholder="e.g. TERMS & CONDITIONS"
                    className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-8 py-5 text-sm font-black text-white uppercase tracking-widest placeholder:text-slate-800 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Gateway Protocol</label>
                  <div className="p-2 rounded-[28px] bg-[#050816] border border-white/5 flex gap-2">
                    <button 
                      onClick={() => setLinkForm({...linkForm, type: 'page'})}
                      className={cn(
                        "flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all",
                        linkForm.type === 'page' ? "bg-[#C5A059] text-[#050816] shadow-xl" : "text-slate-700 hover:text-slate-400"
                      )}
                    >
                      STATIC PAGE
                    </button>
                    <button 
                       onClick={() => setLinkForm({...linkForm, type: 'internal'})}
                       className={cn(
                        "flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all",
                        linkForm.type === 'internal' ? "bg-[#4F46E5] text-white shadow-xl shadow-indigo-500/20" : "text-slate-700 hover:text-slate-400"
                      )}
                    >
                      IN-APP ROUTE
                    </button>
                  </div>
                </div>

                {linkForm.type !== 'page' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">In-App Destination</label>
                    <input 
                      type="text" 
                      value={linkForm.url}
                      onChange={e => setLinkForm({...linkForm, url: e.target.value})}
                      placeholder="e.g. /partnership"
                      className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-8 py-5 text-sm font-bold text-[#F1D28C] focus:border-[#C5A059]/40 outline-none transition-all shadow-inner font-mono"
                    />
                  </div>
                )}

                <div className="mt-12 flex gap-4">
                  {isEditingLink.linkId && (
                    <button 
                      onClick={() => handleDeleteLink(isEditingLink.linkId!)}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleAddLink(isEditingLink.sectionId)}
                    className="flex flex-1 items-center justify-center gap-4 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] py-6 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.3)] transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isEditingLink.linkId ? <Save size={20} /> : <PlusCircle size={20} />}
                    {isEditingLink.linkId ? 'Finalize Node' : 'Archive Node'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFooter;
