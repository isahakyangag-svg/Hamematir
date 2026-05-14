import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LanguagePanelSwitcherProps {
  variant?: 'admin' | 'partner';
  className?: string;
}

const LanguagePanelSwitcher: React.FC<LanguagePanelSwitcherProps> = ({ variant = 'admin', className }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'am', label: 'ARM', flag: '🇦🇲' },
    { code: 'ru', label: 'RUS', flag: '🇷🇺' },
    { code: 'en', label: 'ENG', flag: '🇺🇸' },
  ];

  const currentLanguage = i18n.language.split('-')[0];

  return (
    <div className={cn(
      "flex items-center gap-1.5 p-1.5 rounded-2xl border transition-all shadow-inner",
      variant === 'admin' 
        ? "bg-white/5 border-white/5 focus-within:border-amber-500/30" 
        : "bg-[#0B1220]/50 border-white/5 focus-within:ring-2 focus-within:ring-amber-500/40",
      className
    )}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            currentLanguage === lang.code
              ? (variant === 'admin' 
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                  : "bg-amber-500 text-black shadow-lg shadow-amber-500/30")
              : "text-slate-500 hover:text-white"
          )}
        >
          <span className="text-sm leading-none">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguagePanelSwitcher;
