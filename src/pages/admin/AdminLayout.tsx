import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard,
  Store, 
  Package, 
  Image as ImageIcon, 
  Users, 
  Settings, 
  ChevronLeft,
  DollarSign,
  Languages,
  TrendingUp,
  Download,
  ScrollText,
  LifeBuoy,
  LogOut,
  Bell,
  Search,
  MessageSquare,
  Layers,
  Home,
  Paintbrush,
  User as UserIcon,
  ShieldCheck,
  Zap,
  Notebook,
  Code
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import VisualPageEditor from '../../components/VisualEditor/VisualPageEditor';
import { EditorProvider, useEditor } from '../../components/VisualEditor/EditorContext';
import LanguagePanelSwitcher from '../../components/LanguagePanelSwitcher';
import { useBranding } from '../../contexts/BrandingContext';

const EditorResetter: React.FC = () => {
  const { pathname } = useLocation();
  const { setIsEditing, setActiveSectionId, setHoveredSectionId } = useEditor();

  useEffect(() => {
    setIsEditing(false);
    setActiveSectionId(null);
    setHoveredSectionId(null);
  }, [pathname, setIsEditing, setActiveSectionId, setHoveredSectionId]);

  return null;
};

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  // pageId for admin pages
  const pageId = `admin_${pathname.split('/').filter(Boolean).slice(1).join('_') || 'dashboard'}`;

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050816] p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 rounded-full bg-red-500/10 p-8 text-red-500 shadow-2xl shadow-red-500/20 border border-red-500/20"
        >
          <BarChart3 size={64} />
        </motion.div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">{t('access_denied')}</h1>
        <p className="font-bold text-slate-400 max-w-sm mb-10">{t('admin_only_message')}</p>
        <Link to="/" className="rounded-2xl bg-gold px-12 py-5 font-black text-black transition-all hover:scale-105 shadow-[0_20px_40px_-5px_rgba(197,160,89,0.3)]">
           {t('back_home')}
        </Link>
      </div>
    );
  }

  const menuItems = [
    { label: t('admin:dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/admin' },
    { label: t('admin:users', 'Users'), icon: Users, path: '/admin/users' },
    { label: t('admin:stores', 'Stores'), icon: Store, path: '/admin/stores' },
    { label: t('admin:brands', 'Brands'), icon: Zap, path: '/admin/brands' },
    { label: t('admin:categories', 'Categories'), icon: Layers, path: '/admin/categories' },
    { label: t('admin:products', 'Products'), icon: Package, path: '/admin/products' },
    { label: t('admin:appearance', 'Appearance'), icon: Paintbrush, path: '/admin/appearance' },
    { label: t('admin:auth_pages', 'Auth Pages'), icon: ShieldCheck, path: '/admin/auth' },
    { label: t('admin:banners', 'Banners'), icon: ImageIcon, path: '/admin/banners' },
    { label: t('admin:translations', 'Translations'), icon: Languages, path: '/admin/translations' },
    { label: t('admin:monetization', 'Monetization'), icon: DollarSign, path: '/admin/monetization' },
    { label: t('admin:footer_settings', 'Footer'), icon: ScrollText, path: '/admin/footer' },
    { label: t('admin:currency', 'Currency'), icon: TrendingUp, path: '/admin/currency' },
    { label: t('admin:support', 'Support'), icon: MessageSquare, path: '/admin/support' },
    { label: t('admin:notes', 'Notes'), icon: Notebook, path: '/admin/notes' },
    { label: t('admin:my_codes', 'Developer Codes'), icon: Code, path: '/admin/my-codes' },
    { label: t('admin:profile', 'Profile'), icon: UserIcon, path: '/admin/profile' },
  ];

  return (
    <EditorProvider>
      <EditorResetter />
      <div className="flex min-h-screen bg-[#050816] font-sans selection:bg-amber-500/30 text-slate-200">
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 h-full bg-[#081120] border-r border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 overflow-hidden",
          isSidebarExpanded ? "w-72" : "w-24"
        )}>
          {/* Sidebar Background Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -ml-16 -mb-16" />

          <div className="relative flex h-full flex-col p-5">
             {/* Logo Section */}
             <div className="flex items-center gap-4 px-2 mb-10 h-16">
                <div 
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-2xl transition-transform hover:rotate-3 overflow-hidden border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${branding.secondaryColor || '#C5A059'}, ${branding.primaryColor || '#050816'})` }}
                >
                    {branding.logoType === 'image' && branding.logoImageUrl ? (
                      <img src={branding.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{branding.logoEmoji || '👑'}</span>
                    )}
                </div>
                <AnimatePresence mode="wait">
                  {isSidebarExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col overflow-hidden"
                    >
                       <span className="text-lg font-display font-black tracking-tight text-white leading-tight">
                         {branding.logoText || 'ComfortLuxury'}
                       </span>
                       <span className="text-[10px] font-black tracking-[0.2em] text-[#F1D28C] uppercase opacity-80">{branding.logoSubtitle || 'PREMIUM ADMIN PANEL'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Navigation */}
             <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300",
                      pathname === item.path 
                        ? "text-[#F1D28C] shadow-[0_10px_30px_-5px_rgba(197,160,89,0.15)]" 
                        : "text-slate-400 hover:bg-white/5 hover:text-[#F1D28C]/80"
                    )}
                  >
                    <div className={cn(
                      "flex shrink-0 transition-all duration-300 group-hover:scale-110",
                      pathname === item.path ? "text-[#F1D28C] drop-shadow-[0_0_8px_rgba(241,210,140,0.5)]" : "text-inherit"
                    )}>
                      <item.icon size={20} strokeWidth={2.5} />
                    </div>
                    
                    {isSidebarExpanded && (
                      <span className={cn(
                        "text-[13px] font-black tracking-tight whitespace-nowrap uppercase",
                        pathname === item.path ? "text-[#F1D28C]" : "text-inherit"
                      )}>{item.label}</span>
                    )}

                    {pathname === item.path && (
                      <motion.div 
                        layoutId="activeSideBarBg"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent -z-10 border border-amber-500/10" 
                      />
                    )}
                    {pathname === item.path && (
                      <motion.div 
                        layoutId="activeSideBarIndicator"
                        className="absolute left-0 h-6 w-1 rounded-full bg-gold shadow-[0_0_15px_rgba(241,210,140,0.8)]" 
                      />
                    )}
                  </Link>
                ))}
             </nav>

             {/* Bottom Actions */}
             <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
                <button 
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-slate-400 transition-all hover:bg-white/5 hover:text-[#F1D28C]"
                >
                   <ChevronLeft size={20} className={cn("transition-transform duration-700 ease-out", !isSidebarExpanded && "rotate-180")} />
                   {isSidebarExpanded && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{t('admin:collapse_sidebar', 'Collapse Sidebar')}</span>}
                </button>
                
                <button 
                  onClick={() => logout()}
                  className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-rose-500 border border-transparent hover:bg-rose-500/10 hover:border-rose-500/20 shadow-lg transition-all"
                >
                   <LogOut size={20} strokeWidth={2.5} />
                   {isSidebarExpanded && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{t('admin:logout', 'Sign Out')}</span>}
                </button>
             </div>
          </div>
        </aside>

        {/* Header & Main Content */}
        <div className={cn(
          "flex-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isSidebarExpanded ? "ml-72" : "ml-24"
        )}>
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-10 transition-all">
             <div className="absolute inset-0 bg-[#050816]/60 backdrop-blur-2xl border-b border-white/5 -z-10 shadow-2xl" />
             
             <div className="flex items-center gap-8 text-white">
                <LanguagePanelSwitcher variant="admin" />
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-500" size={18} />
                   <input 
                      type="text" 
                      placeholder={t('admin:quick_search', 'Search database...')}
                      className="h-12 w-96 rounded-2xl bg-white/5 pl-12 pr-4 text-sm font-medium placeholder:text-slate-600 border border-white/5 transition-all focus:bg-white/10 focus:border-amber-500/30 outline-none shadow-inner"
                   />
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <Link 
                     to="/" 
                     className="group flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 text-slate-300 transition-all hover:bg-white/10 hover:text-white hover:border-white/20 shadow-xl active:scale-95"
                   >
                      <Home size={18} className="transition-transform group-hover:-translate-y-0.5" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('admin:main_site', 'Main Site')}</span>
                   </Link>

                   <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95 shadow-xl">
                      <Bell size={20} />
                      <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-[#050816] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                   </button>
                </div>
                
                <div className="h-8 w-px bg-white/5 mx-2" />

                <Link to="/admin/profile" className="flex items-center gap-4 group cursor-pointer transition-all">
                   <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-white leading-none tracking-tight group-hover:text-amber-500 transition-colors">{user.displayName || 'Gag Isahakyan'}</span>
                      <span className="mt-1 text-[10px] font-black tracking-widest text-[#F1D28C] uppercase opacity-60">SUPER_ADMIN</span>
                   </div>
                   <div className="relative">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl scale-100 group-hover:scale-105 transition-transform overflow-hidden border border-white/10 ring-2 ring-white/5"
                           style={{ background: `linear-gradient(135deg, ${branding.secondaryColor || '#C5A059'}, ${branding.primaryColor || '#050816'})` }}>
                         {user.email?.[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-[#050816]" />
                   </div>
                </Link>
             </div>
          </header>

          {/* Dynamic Content */}
          <main className="p-10 max-w-[1800px] mx-auto min-h-[calc(100vh-80px)]">
             <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <VisualPageEditor pageId={pageId}>
                  <Outlet />
                </VisualPageEditor>
              </motion.div>
             </AnimatePresence>
          </main>
        </div>
      </div>
    </EditorProvider>
  );
};

export default AdminLayout;
