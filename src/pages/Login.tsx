import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Facebook, Chrome, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useBranding } from '../contexts/BrandingContext';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const { login, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login');
  const [message, setMessage] = useState('');

  const from = (location.state as any)?.from?.pathname || "/profile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await resetPassword(email);
        setMessage(t('reset_link_sent'));
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    try {
      if (provider === 'google') await signInWithGoogle();
      // Add other providers if configured
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Social login failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#111111] overflow-hidden">
      {/* Left Side: Immersive Image (Coffee Shop Vibes per Screen 2) */}
      <div className="relative hidden w-1/2 lg:block overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop" 
            alt="Atmospheric Interior" 
            className="h-full w-full object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent" />
        </motion.div>

        {/* Branding Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white backdrop-blur-xl transition-all group-hover:rotate-12 group-hover:scale-110 overflow-hidden"
              style={{ backgroundColor: branding.secondaryColor || '#0f172a', border: '1px solid rgba(255,255,255,0.2)' }}
            >
               {branding.logoType === 'image' && branding.logoImageUrl ? (
                 <img src={branding.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl">{branding.logoEmoji || '🛍️'}</span>
               )}
            </div>
            <span className="text-2xl font-display font-black tracking-tighter text-white">
              {branding.logoText || 'ZIGZAG'}<span style={{ color: branding.primaryColor || '#4f46e5' }}>{branding.logoSuffix || '.AM'}</span>
            </span>
          </Link>

          <div className="space-y-6">
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-6xl font-black leading-[0.9] tracking-tighter text-white uppercase"
            >
              {t('auth:hero_title_start', 'START YOUR')}<br />
              <span className="text-white/40">{t('auth:hero_title_journey', 'JOURNEY')}</span> {t('auth:hero_title_with_us', 'WITH US')}
            </motion.h2>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-md text-lg font-medium text-white/60 leading-relaxed"
            >
              {t('auth:hero_description', 'Experience the future of local commerce with the most professional marketplace platform in Armenia.')}
            </motion.p>
          </div>

          <div className="flex items-center gap-6">
             <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 font-mono text-xs">01</div>
             <div className="flex-1 h-px bg-white/10" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">{branding.logoSubtitle || 'Secure Auth Architecture'}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Professional Form */}
      <div className="flex w-full flex-col overflow-y-auto bg-[#151515] p-8 sm:p-20 lg:w-1/2 lg:justify-center">
        <div className="mx-auto w-full max-w-md">
          {/* Tabs for Login/Register */}
          <div className="mb-12 flex items-center gap-8 border-b border-white/5 pb-2">
            <button 
              onClick={() => navigate('/login')}
              className={cn(
                "relative pb-4 text-2xl font-black tracking-tight transition-colors",
                mode === 'login' ? "text-white" : "text-white/20 hover:text-white/40"
              )}
            >
              {t('auth:login_tab', 'Вход')}
              {mode === 'login' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                />
              )}
            </button>
            <button 
              onClick={() => navigate('/register')}
              className={cn(
                "relative pb-4 text-2xl font-black tracking-tight transition-colors",
                "text-white/20 hover:text-white/40"
              )}
            >
              {t('auth:register_tab', 'Регистрация')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400">
                  {error}
                </div>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-400">
                  {message}
                </div>
              </motion.div>
            )}

            <div className="group space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:email_label', 'Email')}</label>
              <div className="relative">
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                  placeholder={t('auth:email_placeholder', 'name@example.com')}
                />
                <Mail className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white/40 transition-colors" size={20} />
              </div>
            </div>

            {mode === 'login' && (
              <div className="group space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors group-focus-within:text-white">{t('auth:password_label', 'Password')}</label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                  >
                    {t('auth:forgot_password', 'Забыли пароль?')}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-500 py-5 text-sm font-black uppercase tracking-widest text-[#111111] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <span className="relative z-10">{mode === 'login' ? t('auth:login_btn', 'Войти') : t('auth:send_link_btn', 'Send Reset Link')}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 transition-opacity" />
              </button>
            </div>
          </form>

          {mode === 'login' && (
            <>
              <div className="relative my-12 flex items-center justify-center">
                <div className="h-px w-full bg-white/5" />
                <span className="absolute bg-[#151515] px-6 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">
                  {t('auth:social_login_divider', 'Или войти через соцсети')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSocialLogin('google')}
                  className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 font-black text-xs text-white transition-all hover:bg-white/10 hover:border-white/20 shadow-xl"
                >
                  <Chrome size={20} className="text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                  GOOGLE
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20 font-black text-xs text-[#1877F2] transition-all hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40 shadow-xl"
                >
                  <Facebook size={20} fill="currentColor" />
                  FACEBOOK
                </motion.button>
              </div>
            </>
          )}

          <p className="mt-12 text-center text-xs font-bold text-white/20">
            {mode === 'login' ? t('auth:no_account', 'Нет аккаунта?') : t('auth:remember_password', 'Вспомнили пароль?')}
            <button 
              onClick={() => mode === 'login' ? navigate('/register') : setMode('login')}
              className="ml-2 text-white hover:underline underline-offset-4"
            >
              {mode === 'login' ? t('auth:register_btn_link', 'Зарегистрироваться') : t('auth:return_login', 'Вернуться ко входу')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
