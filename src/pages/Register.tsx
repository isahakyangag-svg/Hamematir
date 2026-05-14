import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Facebook, Chrome, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useBranding } from '../contexts/BrandingContext';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'client' | 'manager'>('client');
  const [storeUrl, setStoreUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || "/profile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const name = `${firstName} ${lastName}`.trim();
      await register(email, password, name, { 
        firstName, 
        lastName, 
        phone, 
        role, 
        storeUrl: role === 'manager' ? storeUrl : '' 
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Social login failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#111111] overflow-hidden">
      {/* Left Side: Immersive Image */}
      <div className="relative hidden w-1/2 lg:block overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1549443545-ad396244f59b?q=80&w=2070&auto=format&fit=crop" 
            alt="Boutique Interior" 
            className="h-full w-full object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-transparent" />
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
              {t('auth:register_hero_start', 'Start your')}<br />
              <span className="text-white/40">{t('auth:register_hero_journey', 'Journey')}</span> {t('auth:register_hero_with_us', 'with us')}
            </motion.h2>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-md text-lg font-medium text-white/60 leading-relaxed"
            >
              {t('auth:register_hero_description', 'Join thousands of professionals and customers in the most advanced ecosystem of Armenia.')}
            </motion.p>
          </div>

          <div className="flex items-center gap-6">
             <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 font-mono text-xs">02</div>
             <div className="flex-1 h-px bg-white/10" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">{branding.logoSubtitle || 'Ecosystem Membership'}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Professional Form */}
      <div className="flex w-full flex-col overflow-y-auto bg-[#151515] p-6 lg:w-1/2">
        <div className="mx-auto w-full max-w-xl py-12 lg:py-24">
          {/* Header */}
          <div className="mb-12 flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic underline decoration-amber-500/50 decoration-8 underline-offset-8">
              {t('auth:register_title', 'Создать аккаунт')}
            </h1>
            <p className="mt-4 text-sm font-bold text-white/30">
              {t('auth:already_have_account', 'Уже есть аккаунт?')} 
              <button 
                onClick={() => navigate('/login')}
                className="ml-2 text-white hover:underline underline-offset-4"
              >
                {t('auth:login_link', 'Войти')}
              </button>
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-12 grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setRole('client')}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border-2 py-6 transition-all active:scale-95",
                role === 'client' ? "border-amber-500 bg-amber-500 text-[#111111] shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)]" : "border-white/5 bg-white/2 bg-transparent text-white/40 hover:border-white/20"
              )}
            >
              <User className={cn(role === 'client' ? "text-[#111111]" : "text-white/20")} size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('auth:role_client', 'Я Клиент')}</span>
              {role === 'client' && (
                <motion.div layoutId="roleMark" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 shadow-xl border-4 border-[#151515]" />
              )}
            </button>
            <button 
              type="button"
              onClick={() => setRole('manager')}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border-2 py-6 transition-all active:scale-95",
                role === 'manager' ? "border-amber-500 bg-amber-500 text-[#111111] shadow-[0_20px_40px_-5px_rgba(245,158,11,0.3)]" : "border-white/5 bg-white/2 bg-transparent text-white/40 hover:border-white/20"
              )}
            >
              <Mail size={24} className={cn(role === 'manager' ? "text-[#111111]" : "text-white/20")} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('auth:role_manager', 'Я Менеджер')}</span>
              {role === 'manager' && (
                <motion.div layoutId="roleMark" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 shadow-xl border-4 border-[#151515]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="group space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:first_name_label', 'Имя')}</label>
                <input 
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                  placeholder={t('auth:first_name_placeholder', 'Иван')}
                />
              </div>
              <div className="group space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:last_name_label', 'Фамилия')}</label>
                <input 
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                  placeholder={t('auth:last_name_placeholder', 'Иванов')}
                />
              </div>
            </div>

            <div className="group space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:email_label', 'Email')}</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                placeholder={t('auth:email_placeholder', 'mail@example.com')}
              />
            </div>

            <div className="group space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:phone_label', 'Номер телефона')}</label>
              <input 
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                placeholder={t('auth:phone_placeholder', '+374 •• ••• •••')}
              />
            </div>

            {role === 'manager' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group space-y-3"
              >
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 ml-1">{t('auth:store_url_label', 'URL Магазина')}</label>
                <input 
                  type="url"
                  required={role === 'manager'}
                  value={storeUrl}
                  onChange={e => setStoreUrl(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-blue-500/20 px-1 py-4 text-lg font-bold text-white transition-all focus:border-blue-500 focus:outline-none placeholder:text-blue-500/10"
                  placeholder={t('auth:store_url_placeholder', 'https://myshop.am')}
                />
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="group space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:password_label', 'Пароль')}</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                  placeholder="********"
                />
              </div>
              <div className="group space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 transition-colors group-focus-within:text-white">{t('auth:confirm_password_label', 'Повтор пароля')}</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/5 px-1 py-4 text-lg font-bold text-white transition-all focus:border-white focus:outline-none placeholder:text-white/10"
                  placeholder="********"
                />
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-500 py-6 text-sm font-black uppercase tracking-widest text-[#111111] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-[0_32px_64px_-16px_rgba(245,158,11,0.2)]"
              >
                {loading ? (
                  <Loader2 className="animate-spin text-black" size={24} />
                ) : (
                  <span className="relative z-10">{t('auth:register_btn', 'Зарегистрироваться')}</span>
                )}
              </button>
            </div>
          </form>

          <div className="relative my-16 flex items-center justify-center">
            <div className="h-px w-full bg-white/5" />
            <span className="absolute bg-[#151515] px-6 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">
              {t('auth:social_register_divider', 'Или через соцсети')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSocialLogin('google')}
              className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 font-black text-xs text-white transition-all hover:bg-white/10 hover:border-white/20 shadow-xl"
            >
              <Chrome size={20} className="text-rose-500" />
              {t('auth:register_google_btn', 'РЕГИСТРАЦИЯ ЧЕРЕЗ GOOGLE')}
            </motion.button>
          </div>

          <p className="mt-12 text-center text-[10px] font-medium text-white/20 leading-relaxed max-w-sm mx-auto">
            {t('auth:privacy_policy_agreement', 'Регистрируясь, вы соглашаетесь с Политикой конфиденциальности и Условиями использования сервиса.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
