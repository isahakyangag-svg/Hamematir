import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layout, 
  Save, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  Layers,
  Palette,
  Type,
  ImageIcon,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const AdminAuthPages: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'login' | 'register'>('general');
  
  const [authSettings, setAuthSettings] = useState({
    bgSide: '#3D3BF3',
    accentColor: '#6344F5',
    title: 'Добро пожаловать!',
    subtitle: 'Почему стоит присоединиться?',
    avatarSeed: '30',
    bullets: [
      { title: 'Глобальный охват', text: 'охватите тысячи клиентов ежедневно', color: '#6344F5' },
      { title: 'Умная аналитика', text: 'отслеживайте свой рост в реальном времени', color: '#6344F5' },
      { title: 'Доверие к бренду', text: 'станьте надежным продавцом в Армении', color: '#6344F5' }
    ],
    loginTitle: 'С возвращением!',
    loginSub: 'Зарегистрируйте аккаунт',
    registerTitle: 'Присоединяйтесь!',
    registerSub: 'Уже есть аккаунт?',
    signInText: 'ВОЙТИ',
    emailLabel: 'Электронная почта',
    passwordLabel: 'Пароль',
    forgotPasswordText: 'Забыли пароль?',
    loginBtnText: 'Войти',
    registerBtnText: 'Создать аккаунт',
    socialText: 'Войдите через',
    createAccountText: 'Создать аккаунт',
    nameLabel: 'Имя',
    confirmPasswordLabel: 'Подтвердите пароль',
    socialButtons: {
      google: true,
      facebook: true,
      vk: true,
      mailru: true
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const authRef = doc(db, 'settings', 'auth_pages');
        const authSnap = await getDoc(authRef);
        if (authSnap.exists()) {
          setAuthSettings(prev => ({ ...prev, ...authSnap.data() }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/auth_pages');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'auth_pages'), {
        ...authSettings,
        updatedAt: serverTimestamp()
      });
      alert(t('admin:auth_settings_saved', 'Authentication settings saved successfully!'));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/auth_pages');
    } finally {
      setSaving(false);
    }
  };

  const addBullet = () => {
    if (authSettings.bullets.length < 5) {
      setAuthSettings({
        ...authSettings,
        bullets: [...authSettings.bullets, { title: t('admin:new_point', 'New Point'), text: t('admin:point_desc', 'point description here'), color: authSettings.accentColor }]
      });
    }
  };

  const removeBullet = (idx: number) => {
    const newBullets = authSettings.bullets.filter((_, i) => i !== idx);
    setAuthSettings({ ...authSettings, bullets: newBullets });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="animate-spin text-[#C5A059]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:auth_configuration', 'Auth Configuration')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:auth_configuration_desc', 'Authentication protocols and visual gateway identity.')}</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/login')}
             className="hidden md:flex h-14 items-center gap-2 rounded-[24px] bg-white/5 border border-white/10 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
           >
              {t('admin:launch_preview', 'Launch Preview')}
           </button>
           <button 
             onClick={handleSave}
             disabled={saving}
             className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
           >
             {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
             {t('admin:commit_changes', 'Commit Changes')}
           </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-3 p-3 rounded-[32px] bg-[#081120] border border-white/5 w-fit mx-2 shadow-2xl">
         {[
           { id: 'general', label: t('admin:invariants', 'Invariants'), icon: Layers },
           { id: 'login', label: t('admin:gateway_login', 'Gateway: Login'), icon: LogIn },
           { id: 'register', label: t('admin:gateway_join', 'Gateway: Join'), icon: UserPlus }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={cn(
               "flex items-center gap-3 px-8 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] transition-all relative overflow-hidden group",
               activeTab === tab.id 
                ? "bg-[#C5A059] text-[#050816] shadow-[0_10px_30px_rgba(197,160,89,0.2)]" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
             )}
           >
             {activeTab === tab.id && (
               <motion.div 
                 layoutId="activeTabGlow"
                 className="absolute inset-0 bg-white/20 blur-xl opacity-50"
               />
             )}
             <tab.icon size={16} className="relative z-10" />
             <span className="relative z-10">{tab.label}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 px-2">
        <div className="lg:col-span-2 space-y-12">
           <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div 
                   key="general"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-10"
                >
                   {/* Left Panel Customization */}
                   <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
                      
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#C5A059] border border-white/10 shadow-inner">
                            <Palette size={28} />
                         </div>
                         <div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:identity_panel', 'Identity Panel')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:identity_panel_desc', 'Customization of the branding side-panel.')}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                         <div className="space-y-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:ambient_background', 'Ambient Background')}</label>
                               <div className="flex items-center gap-4">
                                  <div className="relative group">
                                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: authSettings.bgSide }} />
                                    <input 
                                       type="color" 
                                       value={authSettings.bgSide}
                                       onChange={e => setAuthSettings({...authSettings, bgSide: e.target.value})}
                                       className="relative h-14 w-14 cursor-pointer rounded-2xl border-2 border-[#050816] p-0 bg-transparent overflow-hidden shadow-xl"
                                    />
                                  </div>
                                  <input 
                                     type="text" 
                                     value={authSettings.bgSide}
                                     onChange={e => setAuthSettings({...authSettings, bgSide: e.target.value})}
                                     className="flex-1 rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 font-mono text-[11px] font-black text-[#C5A059] shadow-inner focus:outline-none focus:border-[#C5A059]/40"
                                  />
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:gateway_title', 'Gateway Title')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.title}
                                  onChange={e => setAuthSettings({...authSettings, title: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 transition-all shadow-inner"
                                  placeholder="SYSTEM ACCESS"
                                />
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:identity_subtext', 'Identity Subtext')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.subtitle}
                                  onChange={e => setAuthSettings({...authSettings, subtitle: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-[#C5A059]/40 transition-all shadow-inner"
                                  placeholder="Encryption verified..."
                               />
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:avatar_seed', 'Avatar Procedural Seed')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.avatarSeed}
                                  onChange={e => setAuthSettings({...authSettings, avatarSeed: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-xs font-mono font-black text-[#F1D28C] focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                               <p className="text-[10px] text-slate-700 font-bold ml-2 uppercase tracking-widest">{t('admin:avatar_seed_tip', 'Update seed to regenerate neural avatars.')}</p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">{t('admin:protocol_points', 'Protocol Points')}</label>
                               <button 
                                 onClick={addBullet}
                                 className="flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest group"
                               >
                                  <Plus size={14} className="group-hover:rotate-90 transition-transform" /> {t('admin:sync_node', 'Sync Node')}
                               </button>
                            </div>
                            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                               {authSettings.bullets.map((bullet, idx) => (
                                  <div key={idx} className="relative group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-2xl transition-all hover:bg-white/[0.04]">
                                     <button 
                                       onClick={() => removeBullet(idx)}
                                       className="absolute top-6 right-6 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                     
                                     <div className="flex items-center gap-4 mb-6">
                                        <input 
                                           type="color" 
                                           value={bullet.color}
                                           onChange={e => {
                                              const b = [...authSettings.bullets];
                                              b[idx].color = e.target.value;
                                              setAuthSettings({...authSettings, bullets: b});
                                           }}
                                           className="h-8 w-8 rounded-full border-2 border-[#050816] p-0 bg-transparent cursor-pointer shadow-lg"
                                        />
                                        <input 
                                           type="text" 
                                           value={bullet.title}
                                           placeholder="Label"
                                           onChange={e => {
                                              const b = [...authSettings.bullets];
                                              b[idx].title = e.target.value;
                                              setAuthSettings({...authSettings, bullets: b});
                                           }}
                                           className="flex-1 bg-transparent border-none p-0 text-[11px] font-black uppercase tracking-widest text-[#F1D28C] focus:ring-0"
                                        />
                                     </div>
                                     
                                     <textarea 
                                        value={bullet.text}
                                        placeholder="Description node..."
                                        onChange={e => {
                                           const b = [...authSettings.bullets];
                                           b[idx].text = e.target.value;
                                           setAuthSettings({...authSettings, bullets: b});
                                        }}
                                        className="w-full bg-transparent border-none p-0 text-xs font-medium text-slate-500 min-h-[50px] focus:ring-0 resize-none leading-relaxed"
                                     />
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </section>

                   <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
                      
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-purple-500 border border-white/10 shadow-inner">
                            <ShieldCheck size={28} />
                         </div>
                         <div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:label_interface', 'Label Interface')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:label_interface_desc', 'Field labels and specialized terminology.')}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                         <div className="space-y-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:email_descriptor', 'Email Descriptor')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.emailLabel}
                                  onChange={e => setAuthSettings({...authSettings, emailLabel: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:password_descriptor', 'Password Descriptor')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.passwordLabel}
                                  onChange={e => setAuthSettings({...authSettings, passwordLabel: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:registry_name_label', 'Registry Name Label')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.nameLabel}
                                  onChange={e => setAuthSettings({...authSettings, nameLabel: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>
                         <div className="space-y-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:cta_accent_vector', 'CTA Accent Vector')}</label>
                               <div className="flex items-center gap-4">
                                  <div className="relative group">
                                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: authSettings.accentColor }} />
                                    <input 
                                       type="color" 
                                       value={authSettings.accentColor}
                                       onChange={e => setAuthSettings({...authSettings, accentColor: e.target.value})}
                                       className="relative h-14 w-14 cursor-pointer rounded-2xl border-2 border-[#050816] p-0 bg-transparent overflow-hidden shadow-xl"
                                    />
                                  </div>
                                  <code className="flex-1 rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 font-mono text-[11px] font-black text-[#F1D28C] uppercase tracking-widest shadow-inner">
                                    {authSettings.accentColor}
                                  </code>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:password_recovery_link', 'Password Recovery Link')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.forgotPasswordText}
                                  onChange={e => setAuthSettings({...authSettings, forgotPasswordText: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:primary_access_label', 'Primary Access Label')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.signInText}
                                  onChange={e => setAuthSettings({...authSettings, signInText: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>
                      </div>
                   </section>
                </motion.div>
              )}

              {activeTab === 'login' && (
                <motion.div 
                   key="login"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-10"
                >
                   <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
                      
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-500 border border-white/10 shadow-inner">
                            <LogIn size={28} />
                         </div>
                         <div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:gateway_parameters', 'Gateway Parameters')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:gateway_parameters_desc', 'Specialized terminology for login sequences.')}</p>
                         </div>
                      </div>

                      <div className="space-y-8 relative z-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:primary_form_heading', 'Primary Form Heading')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.loginTitle}
                                  onChange={e => setAuthSettings({...authSettings, loginTitle: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-lg font-black text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:gateway_link_subtitle', 'Gateway Link Subtitle')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.loginSub}
                                  onChange={e => setAuthSettings({...authSettings, loginSub: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:access_submission_cta', 'Access Submission CTA')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.loginBtnText}
                                  onChange={e => setAuthSettings({...authSettings, loginBtnText: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#F1D28C] focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:new_identity_pointer', 'New Identity Pointer')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.createAccountText}
                                  onChange={e => setAuthSettings({...authSettings, createAccountText: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>

                         <div className="space-y-3 pt-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:external_auth_header', 'External Authentication Header')}</label>
                            <input 
                               type="text" 
                               value={authSettings.socialText}
                               onChange={e => setAuthSettings({...authSettings, socialText: e.target.value})}
                               className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-medium text-slate-500 focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                            />
                         </div>

                         <div className="space-y-6 pt-10 border-t border-white/5">
                             <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block text-center mb-6">{t('admin:active_federated_protocols', 'Active Federated Protocols')}</label>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {Object.keys(authSettings.socialButtons || {}).map((key) => (
                                   <label key={key} className={cn(
                                     "flex items-center justify-between p-6 rounded-[24px] border transition-all cursor-pointer group shadow-xl",
                                     (authSettings.socialButtons as any)[key]
                                      ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#F1D28C] shadow-[0_0_20px_rgba(197,160,89,0.05)]"
                                      : "bg-white/5 border-white/5 text-slate-600 hover:border-white/10"
                                   )}>
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{key}</span>
                                      <div className="relative">
                                        <input 
                                          type="checkbox"
                                          checked={(authSettings.socialButtons as any)[key]}
                                          onChange={e => {
                                             const sb = { ...authSettings.socialButtons };
                                             (sb as any)[key] = e.target.checked;
                                             setAuthSettings({ ...authSettings, socialButtons: sb });
                                          }}
                                          className="peer hidden"
                                        />
                                        <div className="w-6 h-6 rounded-lg border-2 border-slate-700 peer-checked:border-[#C5A059] peer-checked:bg-[#C5A059] transition-all flex items-center justify-center">
                                          {(authSettings.socialButtons as any)[key] && (
                                            <ShieldCheck size={14} className="text-[#050816]" />
                                          )}
                                        </div>
                                      </div>
                                   </label>
                                ))}
                             </div>
                          </div>
                       </div>
                    </section>
                </motion.div>
              )}

              {activeTab === 'register' && (
                <motion.div 
                   key="register"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-10"
                >
                   <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
                      
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-purple-500 border border-white/10 shadow-inner">
                            <UserPlus size={28} />
                         </div>
                         <div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:registry_node', 'Registry Node')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:registry_node_desc', 'Variables for identity creation sequences.')}</p>
                         </div>
                      </div>

                      <div className="space-y-8 relative z-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:registry_primary_header', 'Registry Primary Header')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.registerTitle}
                                  onChange={e => setAuthSettings({...authSettings, registerTitle: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-lg font-black text-white focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:existing_identity_prompt', 'Existing Identity Prompt')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.registerSub}
                                  onChange={e => setAuthSettings({...authSettings, registerSub: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>

                         <div className="space-y-3 pt-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:registry_submission_cta', 'Registry Submission CTA')}</label>
                            <input 
                               type="text" 
                               value={authSettings.registerBtnText}
                               onChange={e => setAuthSettings({...authSettings, registerBtnText: e.target.value})}
                               className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#F1D28C] focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                            />
                         </div>

                         <div className="grid grid-cols-1 gap-6 pt-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:verification_vector_descriptor', 'Verification Vector Descriptor')}</label>
                               <input 
                                  type="text" 
                                  value={authSettings.confirmPasswordLabel}
                                  onChange={e => setAuthSettings({...authSettings, confirmPasswordLabel: e.target.value})}
                                  className="w-full rounded-[20px] bg-white/5 border border-white/5 px-6 py-4 text-xs font-bold text-slate-400 focus:outline-none focus:border-[#C5A059]/40 shadow-inner"
                               />
                            </div>
                         </div>
                      </div>
                   </section>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Sidebar Info & Guidance */}
        <div className="space-y-12">
           <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#0B1220] to-[#050816] p-10 border border-[#C5A059]/10 shadow-2xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#C5A059] blur-[100px] opacity-10" />
              
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-10">
                   <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#C5A059]/10 text-[#F1D28C] border border-[#C5A059]/20">
                     <ShieldCheck size={20} />
                   </div>
                   <h3 className="font-display font-black text-white uppercase tracking-tight">{t('admin:security_intel', 'Security Intel')}</h3>
                 </div>
                 
                 <p className="text-[11px] font-medium text-slate-500 mb-10 leading-relaxed uppercase tracking-widest opacity-80">
                    {t('admin:security_intel_desc', 'Propagate authentication variables across all platform gateways. Ensure encryption terminology aligns with brand security posture.')}
                 </p>
                 
                 <div className="space-y-6">
                    {[
                      { num: "01", text: t('admin:intel_step1', 'Deploy high-saturation accent vectors for optimized conversion paths.') },
                      { num: "02", text: t('admin:intel_step2', 'Regenerate neural avatar seeds to vary gateway aesthetic impact.') },
                      { num: "03", text: t('admin:intel_step3', 'Define value descriptors via bullet nodes to establish initial trust.') }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                         <span className="text-[10px] font-black text-[#C5A059] opacity-40 group-hover:opacity-100 transition-opacity">{step.num}</span>
                         <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{step.text}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </section>

           <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl group">
              <h3 className="font-display font-black text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 {t('admin:holographic_link', 'Holographic Link')}
              </h3>
              
              <div className="aspect-[4/3] rounded-[32px] bg-[#050816] border border-white/5 overflow-hidden relative mb-8 shadow-inner">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.1)_0,transparent_70%)]" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 blur-xl bg-[#C5A059] opacity-20" />
                      <ImageIcon size={40} className="text-[#C5A059] mb-4 relative z-10" />
                    </div>
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">{t('admin:projection_node', 'Projection Node')}</span>
                 </div>
                 <motion.div 
                   whileHover={{ scale: 1.05 }}
                   className="absolute inset-0 bg-[#C5A059]/0 hover:bg-[#C5A059]/10 transition-all flex items-center justify-center opacity-0 hover:opacity-100 backdrop-blur-[2px]"
                 >
                    <button 
                      onClick={() => navigate('/login')}
                      className="bg-[#C5A059] text-[#050816] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transform transition-transform"
                    >
                      {t('admin:initialize', 'Initialize')}
                    </button>
                 </motion.div>
              </div>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-between text-slate-500 hover:text-[#F1D28C] transition-colors group/link"
              >
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] relative overflow-hidden pb-1">
                   {t('admin:interface_preview', 'Interface Preview')}
                   <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#C5A059] transform -translate-x-full group-hover/link:translate-x-0 transition-transform duration-500" />
                 </span>
                 <ChevronRight size={18} className="transform group-hover/link:translate-x-2 transition-transform" />
              </button>
           </section>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPages;
