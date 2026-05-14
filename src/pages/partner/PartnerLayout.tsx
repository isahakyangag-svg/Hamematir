import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Send, 
  Layers, 
  BarChart3, 
  DollarSign, 
  MessageSquare, 
  Headphones, 
  Bell, 
  Calendar, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  Search,
  User as UserIcon,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import LanguagePanelSwitcher from '../../components/LanguagePanelSwitcher';

const PartnerLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, isPartner, isAdmin, logout } = useAuth();
  const { branding } = useBranding();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPartner && !isAdmin) {
      navigate('/login');
    }
  }, [isPartner, isAdmin, navigate]);

  const menuItems = [
    { label: t('partner:nav_dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/partner' },
    { label: t('partner:nav_banners', 'My Banners'), icon: ImageIcon, path: '/partner/banners' },
    { label: t('partner:nav_order_banner', 'Order Banner'), icon: Send, path: '/partner/banners/order' },
    { label: t('partner:nav_suggestions', 'Categories & Offers'), icon: Layers, path: '/partner/suggestions' },
    { label: t('partner:nav_finance', 'Finance'), icon: DollarSign, path: '/partner/finance' },
    { label: t('partner:nav_analytics', 'Analytics'), icon: BarChart3, path: '/partner/analytics' },
    { label: t('partner:nav_support', 'Support Chat'), icon: MessageSquare, path: '/partner/messages', badge: 1 },
    { label: t('partner:nav_settings', 'Settings'), icon: Settings, path: '/partner/settings' },
    { label: t('partner:nav_help', 'Help & FAQ'), icon: HelpCircle, path: '/partner/help' },
  ];

  if (!isPartner && !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#050816] text-[#A0A2B1] font-sans selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-[#0B1220]/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.4,1)] z-40 hidden lg:block",
        isSidebarExpanded ? "w-72" : "w-24"
      )}>
        <div className="flex h-full flex-col p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-12 h-14 relative group">
             <Link to="/partner" className="flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-[#C5A059] via-[#F1D28C] to-[#8B6E32] shadow-[0_0_20px_rgba(197,160,89,0.2)] group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full bg-[#0B1220] rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-[#C5A059] fill-current" />
                </div>
              </div>
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col"
                  >
                    <span className="text-xl font-black tracking-tight text-white leading-none">
                      Partner<span className="text-amber-500">Panel</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">
                      Premium Partner
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-500",
                    isActive 
                      ? "text-black overflow-hidden" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {/* Background Glow for Active */}
                  {isActive && (
                    <motion.div 
                      layoutId="partnerSidebarActive"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500 via-[#F1D28C] to-[#8B6E32] shadow-[0_15px_30px_-5px_rgba(197,160,89,0.3)] z-0" 
                    >
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  )}

                  <div className={cn(
                    "relative z-10 flex shrink-0 transition-transform duration-500 group-hover:scale-110",
                    isActive ? "text-black" : "text-white/40 group-hover:text-[#C5A059]"
                  )}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {isSidebarExpanded && (
                    <span className={cn(
                      "relative z-10 text-[13px] font-black tracking-tight whitespace-nowrap",
                      isActive ? "text-black" : ""
                    )}>
                      {item.label}
                    </span>
                  )}

                  {item.badge && isSidebarExpanded && (
                    <span className={cn(
                      "relative z-10 ml-auto flex h-5 w-5 items-center justify-center rounded-lg text-[10px] font-black shadow-lg",
                      isActive ? "bg-black text-[#C5A059]" : "bg-amber-500 text-black"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-3 pt-8 border-t border-white/5">
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-white/30 transition-all hover:bg-white/5 hover:text-white group"
            >
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 group-hover:border-[#C5A059]/30 transition-all">
                <div className={cn("transition-transform duration-700", !isSidebarExpanded && "rotate-180")}>
                  <ChevronLeft size={20} />
                </div>
              </div>
              {isSidebarExpanded && <span className="text-[11px] font-black uppercase tracking-widest">{t('partner:collapse', 'Collapse')}</span>}
            </button>
            
            <button 
              onClick={logout}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-red-500/60 transition-all hover:bg-red-500/10 hover:text-red-500 group"
            >
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-all shadow-xl shadow-red-500/10">
                <LogOut size={18} />
              </div>
              {isSidebarExpanded && <span className="text-[11px] font-black uppercase tracking-widest">{t('partner:logout', 'Sign Out')}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={cn(
        "flex-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.4,1)] min-h-screen flex flex-col",
        isSidebarExpanded ? "lg:ml-72" : "lg:ml-24"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between px-8 lg:px-12">
          <div className="absolute inset-0 bg-[#050816]/60 backdrop-blur-2xl border-b border-white/5 -z-10 shadow-2xl" />
          
          <div className="flex items-center gap-6 lg:gap-12">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden h-12 w-12 flex items-center justify-center rounded-2xl bg-[#0B1220] border border-white/10 text-white/60 hover:text-white transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('partner:header_title', 'Partner Dashboard')}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]" />
                 <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('partner:header_welcome', 'Welcome back to your professional partner panel')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <LanguagePanelSwitcher variant="partner" className="hidden lg:flex" />
            {/* Quick Actions Header */}
            <div className="hidden xl:flex items-center gap-3">
               <Link 
                 to="/" 
                 className="h-12 px-8 flex items-center gap-3 rounded-2xl bg-[#0B1220] border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all shadow-xl group"
               >
                 <Layers size={14} className="group-hover:rotate-12 transition-transform text-[#C5A059]" />
                 <span>Main Site</span>
               </Link>
            </div>

            {/* Search - Desktop */}
            <div className="hidden md:relative md:flex group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-amber-500 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder={t('partner:search_placeholder', 'Search panel...')}
                className="h-12 w-80 rounded-2xl bg-[#0B1220]/50 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/20 border-none ring-1 ring-white/5 focus:ring-2 focus:ring-amber-500/40 transition-all focus:bg-[#0B1220] shadow-inner"
              />
            </div>

            <button className="relative group flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1220] border border-white/10 text-white/40 transition-all hover:bg-amber-500/10 hover:text-amber-500 shadow-xl overflow-hidden">
               <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Bell size={20} className="relative z-10" />
               <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-amber-500 ring-4 ring-[#0B1220] shadow-[0_0_10px_rgba(245,158,11,0.5)] z-20" />
            </button>
            
            <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />
            
            <Link to="/partner/settings" className="flex items-center gap-4 pl-2 group">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[11px] font-black text-white leading-none uppercase tracking-widest group-hover:text-amber-500 transition-colors">{user?.displayName || 'Партнёр'}</span>
                <span className="mt-1.5 text-[9px] font-black tracking-[0.3em] text-[#C5A059] uppercase opacity-60">Verified Partner</span>
              </div>
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-[#0B1220] border border-white/10 flex items-center justify-center p-0.5 group-hover:border-amber-500/40 transition-all shadow-xl">
                   <div className="w-full h-full bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] rounded-xl flex items-center justify-center text-black font-black text-sm uppercase">
                      {user?.email?.[0].toUpperCase()}
                   </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-4 border-[#050816] shadow-lg" />
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-6 lg:p-12 max-w-[1700px] mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-80 bg-[#0B1220] p-8 shadow-[20px_0_50px_rgba(0,0,0,0.5)] border-r border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-amber-500 to-[#8B6E32]">
                   <div className="w-full h-full bg-[#0B1220] rounded-xl flex items-center justify-center">
                      <Zap size={20} className="text-amber-500 fill-current" />
                   </div>
                </div>
                <span className="text-xl font-black tracking-tight text-white uppercase">Partner<span className="text-amber-500">Panel</span></span>
              </div>

              <div className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-5 rounded-2xl px-6 py-4 transition-all duration-300",
                        isActive ? "bg-amber-500 text-black shadow-xl shadow-amber-500/20" : "text-white/40 hover:bg-white/5 active:scale-95"
                      )}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[13px] font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerLayout;
