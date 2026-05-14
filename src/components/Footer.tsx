import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn, getLocalized } from '../lib/utils';
import { Phone, Instagram, Facebook, Twitter, Youtube, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useEditor } from './VisualEditor/EditorContext';
import EditableSection from './VisualEditor/EditableSection';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { isAdmin } = useAuth();
  const { branding } = useBranding();
  const { isEditing, setActiveSectionId, footerSettings: contextFooterSettings, setFooterSettings } = useEditor();
  const [sections, setSections] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync with context if available
  const displaySettings = (isEditing && contextFooterSettings) ? contextFooterSettings : settings;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sSnap = await getDocs(query(collection(db, 'footer_sections'), orderBy('order', 'asc')));
        const lSnap = await getDocs(query(collection(db, 'footer_links'), orderBy('order', 'asc')));
        const setSnap = await getDoc(doc(db, 'footer_settings', 'main'));
        
        const sData = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const lData = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        let setData = null;
        if (setSnap.exists()) {
          setData = setSnap.data();
          setSettings(setData);
          if (setFooterSettings) setFooterSettings(setData); // Initialize context if possible
        }
        setSections(sData);
        setLinks(lData);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'footer_sections');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayLogo = displaySettings?.logoUrl || '/logo.png';

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const socialIcons = [
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4C75A3] text-white text-[10px] font-black">VK</div>, url: '#' },
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F58220] text-white font-bold text-xs">OK</div>, url: '#' },
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white"><Facebook size={16} fill="currentColor" /></div>, url: '#' },
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DA1F2] text-white"><Twitter size={16} fill="currentColor" /></div>, url: '#' },
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF0000] text-white"><Youtube size={16} fill="currentColor" /></div>, url: '#' },
    { icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white"><Instagram size={16} /></div>, url: '#' },
  ];

  return (
    <footer className="w-full bg-[#050816] text-white selection:bg-amber-500/30 relative overflow-hidden isolate">
      {/* Premium Background Decoration */}
      <div className="absolute top-0 right-[10%] w-[50rem] h-[50rem] bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-[160px] -z-10 -translate-y-1/2" />
      <div className="absolute bottom-0 left-[10%] w-[50rem] h-[50rem] bg-indigo-500/5 rounded-full blur-[160px] -z-10 translate-y-1/2" />

      {/* Top Border with Glow */}
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-1/4 bg-amber-500/20 blur-[1px]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-8 py-24 relative z-10">
        <div className="flex flex-col gap-24 lg:flex-row lg:justify-between items-start">
          <div className="flex shrink-0 flex-col items-center lg:items-start lg:w-1/3">
            <Link to="/" className="group flex flex-col items-center lg:items-start" onClick={(e) => isEditing && e.preventDefault()}>
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 relative flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-[#C5A059] via-[#F1D28C] to-[#8B6E32] shadow-[0_0_40px_rgba(197,160,89,0.3)] group-hover:scale-105 transition-transform duration-500">
                     <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center">
                        {branding.logoType === 'image' && branding.logoImageUrl ? (
                           <img src={branding.logoImageUrl} alt="Logo" className="w-10 h-10 object-contain brightness-110" />
                        ) : (
                           <Shield size={28} className="text-[#C5A059] fill-current" />
                        )}
                     </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tight text-white leading-none">
                      {branding.logoText || 'ComfortLuxury'}<span className="text-amber-500">{branding.logoSuffix || '.uz'}</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mt-2">
                      {branding.logoSubtitle || 'Premium Comparison'}
                    </span>
                  </div>
               </div>
            </Link>
            <p className="mt-6 max-w-xs text-center text-sm font-medium leading-relaxed tracking-wide text-white/60 lg:text-left">
               {getLocalized(displaySettings, currentLang, 'description') || t('footer:description', 'Самый быстрый способ сравнить цены во всех магазинах Армении. Экономьте время и деньги вместе с нами.')}
            </p>
            
            <div className="mt-12 flex items-center gap-4">
               {socialIcons.map((social, i) => (
                  <a 
                     key={i} 
                     href={social.url} 
                     className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 transition-all hover:scale-110 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-500"
                  >
                     {social.icon}
                  </a>
               ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-12 gap-y-16 sm:grid-cols-3 lg:gap-x-20">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-8">
                <div className="relative">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 inline-block">
                    {getLocalized(section, currentLang, 'title') || section.label}
                  </h3>
                  <div className="h-0.5 w-8 bg-amber-500/30 mt-3" />
                </div>
                <ul className="flex flex-col gap-4">
                  {links
                    .filter((link) => link.sectionId === section.id)
                    .map((link) => (
                      <li key={link.id}>
                        <Link 
                          to={link.url}
                          className="text-xs font-bold text-white/40 transition-all hover:translate-x-1.5 hover:text-white"
                        >
                          {getLocalized(link, currentLang, 'label') || link.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center justify-between gap-12 lg:flex-row">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
             <span className="text-white/40">© {new Date().getFullYear()} {branding.logoText || 'ComfortLuxury'}</span>
             <Link to="/page/privacy" className="hover:text-amber-500 transition-colors">{t('privacy_policy', 'Privacy Policy')}</Link>
             <Link to="/page/terms" className="hover:text-amber-500 transition-colors">{t('terms_of_use', 'Terms of Service')}</Link>
             <Link to="/page/sitemap" className="hover:text-amber-500 transition-colors">{t('sitemap', 'Sitemap')}</Link>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{t('footer_assistance', 'Need assistance?')}</span>
                <button 
                  onClick={() => setIsCallModalOpen(true)}
                  className="group flex items-center gap-3 overflow-hidden rounded-2xl bg-[#0B1220] border border-white/10 px-8 py-4 font-black transition-all hover:border-amber-500/40 hover:bg-white/5 active:scale-95 shadow-xl"
                >
                  <Phone size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{t('order_call')}</span>
                </button>
             </div>
          </div>
        </div>
      </div>
      
      {/* Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
           <div className="w-full max-w-sm rounded-[3rem] bg-[#0B1220] p-12 text-white border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black tracking-tight mb-3">{t('footer:call_modal_title', 'Заказать звонок')}</h3>
              <p className="text-sm font-medium text-white/40 mb-10">{t('footer:call_modal_description', 'Оставьте свой номер, и мы перезвоним вам в течение 15 минут.')}</p>
              <form onSubmit={(e) => { e.preventDefault(); setIsCallModalOpen(false); alert(t('footer:call_success', 'Ваша заявка принята!')); }} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">{t('footer:phone_label', 'Телефон')}</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="+374 (__) ___-___"
                      className="w-full rounded-2xl bg-white/5 border border-white/5 p-5 font-bold outline-none focus:border-amber-500/40 text-white placeholder:text-white/10"
                    />
                 </div>
                 <button 
                    type="submit"
                    className="w-full rounded-2xl bg-amber-500 py-5 font-black text-black hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                 >
                    {t('footer:send_button', 'Отправить')}
                 </button>
                 <button 
                    type="button"
                    onClick={() => setIsCallModalOpen(false)}
                    className="w-full text-[10px] font-black uppercase tracking-[0.25em] text-white/20 hover:text-white transition-colors"
                 >
                    {t('footer:cancel_button', 'Отмена')}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Bottom accent bar */}
      <div className="h-2 w-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />
    </footer>
  );
};

export default Footer;

