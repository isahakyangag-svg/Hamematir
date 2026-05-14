import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Globe, ChevronDown, User, Wand2, Store, LayoutGrid, Settings, Shield, UserCircle, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useEditor } from './VisualEditor/EditorContext';
import { useBranding } from '../contexts/BrandingContext';
import { cn } from '../lib/utils';
import AILogoGenerator from './AILogoGenerator';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const { user, isAdmin, isPartner, logout } = useAuth();
  const { isEditing, setActiveSectionId } = useEditor();
  const { branding: currentSettings } = useBranding();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [isAILogoModalOpen, setIsAILogoModalOpen] = useState(false);
  const navigate = useNavigate();

  const getGlobalProp = (baseName: string) => {
    if (!currentSettings) return '';
    const langKey = i18n.language.charAt(0).toUpperCase() + i18n.language.slice(1);
    const localizedField = `${baseName}${langKey}`;
    return currentSettings[localizedField] || currentSettings[baseName] || '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const languages = [
    { code: 'am', label: 'Հայերեն', flag: '🇦🇲' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const currencies: { code: Currency, symbol: string, label: string }[] = [
    { code: 'AMD', symbol: '֏', label: 'AMD' },
    { code: 'USD', symbol: '$', label: 'USD' },
    { code: 'RUB', symbol: '₽', label: 'RUB' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-700",
        isEditing && "ring-2 ring-blue-500 ring-inset cursor-pointer"
    )} onClick={() => isEditing && setActiveSectionId('global-settings')}>
      <div className="absolute inset-0 bg-[#050816]/90 backdrop-blur-3xl border-b border-white/5 shadow-2xl -z-10" />
      
      <div className="mx-auto flex h-24 max-w-screen-2xl items-center justify-between px-6 sm:px-10 gap-8">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-5 transition-all duration-500 hover:opacity-90 active:scale-[0.98] shrink-0" onClick={(e) => isEditing && e.preventDefault()}>
          <div className="w-14 h-14 relative flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-[#C5A059] via-[#F1D28C] to-[#8B6E32] shadow-[0_0_30px_rgba(197,160,89,0.3)]">
             <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center overflow-hidden">
                {currentSettings.logoType === 'image' && currentSettings.logoImageUrl ? (
                   <img src={currentSettings.logoImageUrl} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                   <Shield size={24} className="text-[#C5A059] fill-current" />
                )}
             </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              {currentSettings.logoText || 'ComfortLuxury'}<span className="text-amber-500">{currentSettings.logoSuffix || '.uz'}</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mt-1.5">
              {getGlobalProp('logoSubtitle') || t('header:logo_subtitle', 'Premium Comparison')}
            </span>
          </div>
        </Link>

        {/* Global Search Bar Placeholder */}
        <div className="hidden lg:flex flex-1 max-w-xl px-10">
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-4">
          {/* Controls Group */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language */}
            <div className="relative">
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex h-11 items-center gap-3 rounded-2xl bg-[#0B1220]/50 border border-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-white/10 transition-all shadow-xl"
              >
                <div className="w-5 h-3.5 bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden rounded-sm">
                   <div className="w-full h-full text-[8px] flex items-center justify-center opacity-60 font-black">{currentLang.code}</div>
                </div>
                <span>{currentLang.code}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-30", showLanguageMenu && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-48 overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220] p-2 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9)] z-50 backdrop-blur-3xl"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-all",
                          i18n.language === lang.code ? "bg-amber-500 text-black shadow-xl shadow-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                         <span className="text-sm">{lang.flag}</span>
                         <span>{lang.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Currency */}
            <div className="relative">
              <button 
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="flex h-11 items-center gap-3 rounded-2xl bg-[#0B1220]/50 border border-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-white/10 transition-all shadow-xl"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center font-black animate-pulse">{currentCurrency.symbol}</span>
                <span>{currentCurrency.code}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-30", showCurrencyMenu && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {showCurrencyMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-48 overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220] p-2 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9)] z-50 backdrop-blur-3xl"
                  >
                    {currencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => {
                          setCurrency(curr.code);
                          setShowCurrencyMenu(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left font-mono text-[10px] font-black uppercase tracking-widest transition-all",
                          currency === curr.code ? "bg-amber-500 text-black shadow-xl shadow-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                         <span className="text-sm text-amber-500">{curr.symbol}</span>
                         <span>{curr.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />

          {/* Admin Panel */}
          {user && isAdmin && (
            <Link 
              to="/admin"
              className="px-8 flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-500 to-[#8B6E32] text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] hover:scale-105 transition-all duration-500 group"
            >
              <Shield size={16} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              <span>{t('admin_panel', 'Admin Panel')}</span>
            </Link>
          )}

          {/* Profile Section */}
          <Link 
            to={user ? "/profile" : "/login"}
            onClick={(e) => isEditing && e.preventDefault()}
            className={cn(
              "flex h-12 items-center gap-4 rounded-2xl px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl border border-white/5 backdrop-blur-3xl",
              user ? "bg-blue-600 text-white shadow-blue-600/20" : "bg-white/5 text-white/50 border-white/10"
            )}
          >
              <User size={18} strokeWidth={2.5} />
              <span className="hidden xl:inline">{user ? t('user_profile', 'User Profile') : t('login_title', 'Sign In')}</span>
          </Link>

          {/* Logout Button */}
          {user && (
            <button 
              onClick={() => logout()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl group"
              title="Logout"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden px-6 pb-4 pt-1">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('header:search_mobile_placeholder', 'Search products...')}
            className="h-10 w-full rounded-xl bg-white/5 border border-white/10 pl-11 text-xs font-medium text-white placeholder:text-white/30"
          />
        </form>
      </div>

      <AnimatePresence>
        {isAILogoModalOpen && (
          <AILogoGenerator 
            isOpen={isAILogoModalOpen} 
            onClose={() => setIsAILogoModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
