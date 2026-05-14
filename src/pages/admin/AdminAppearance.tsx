import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Paintbrush, 
  Save, 
  RefreshCw, 
  Image as ImageIcon,
  Palette,
  Layout,
  Type,
  Eye
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface SiteDesign {
  primaryColor: string;
  secondaryColor: string;
  logoImageUrl: string;
  faviconUrl: string;
  logoText: string;
  logoSuffix: string;
  logoSubtitle: string;
  fontFamily: string;
  loginPageStyle: 'modern' | 'minimal' | 'glass';
  registrationEnabled: boolean;
}

const AdminAppearance: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [design, setDesign] = useState<SiteDesign>({
    primaryColor: '#4f46e5',
    secondaryColor: '#0f172a',
    logoImageUrl: '',
    faviconUrl: '',
    logoText: 'ZAGZAG',
    logoSuffix: '.AM',
    logoSubtitle: 'Premium Comparison',
    fontFamily: 'Inter',
    loginPageStyle: 'modern',
    registrationEnabled: true
  });

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const docRef = doc(db, 'global_settings', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDesign(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'global_settings/main');
      } finally {
        setLoading(false);
      }
    };
    fetchDesign();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'global_settings', 'main'), {
        ...design,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Design settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'global_settings/main');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:appearance', 'Appearance')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:appearance_desc', 'Global brand identity and visual interface protocols.')}</p>
        </motion.div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
        >
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
          {t('admin:commit_changes', 'Commit Changes')}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 px-2">
        {/* Basic Info */}
        <div className="space-y-10 lg:col-span-2">
          <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
             
             <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#C5A059] border border-white/10 shadow-inner">
                   <Type size={28} />
                </div>
                <div>
                   <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:identity_specs', 'Identity Specs')}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:identity_specs_desc', 'Core logo and typography variables.')}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:logo_primary_text', 'Logo Primary Text')}</label>
                   <input 
                      type="text"
                      value={design.logoText}
                      onChange={e => setDesign({...design, logoText: e.target.value})}
                      className="w-full rounded-[20px] border border-white/5 bg-white/5 px-6 py-4 font-black text-white uppercase tracking-widest focus:outline-none focus:border-[#C5A059]/40 focus:bg-white/10 transition-all shadow-inner"
                      placeholder={t('admin:brand_placeholder', 'BRAND')}
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:logo_suffix', 'Logo Suffix')}</label>
                   <input 
                      type="text"
                      value={design.logoSuffix}
                      onChange={e => setDesign({...design, logoSuffix: e.target.value})}
                      className="w-full rounded-[20px] border border-white/5 bg-white/5 px-6 py-4 font-black text-[#F1D28C] uppercase tracking-widest focus:outline-none focus:border-[#C5A059]/40 focus:bg-white/10 transition-all shadow-inner"
                      placeholder={t('admin:ext_placeholder', '.EXT')}
                   />
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:identity_subtitle', 'Identity Subtitle')}</label>
                   <input 
                      type="text"
                      value={design.logoSubtitle}
                      onChange={e => setDesign({...design, logoSubtitle: e.target.value})}
                      className="w-full rounded-[20px] border border-white/5 bg-white/5 px-6 py-4 font-bold text-white focus:outline-none focus:border-[#C5A059]/40 focus:bg-white/10 transition-all shadow-inner"
                      placeholder={t('admin:tagline_placeholder', 'Tagline or motto...')}
                   />
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:typography_suite', 'Typography Suite')}</label>
                   <div className="relative">
                     <select 
                        value={design.fontFamily}
                        onChange={e => setDesign({...design, fontFamily: e.target.value})}
                        className="w-full h-14 rounded-[20px] border border-white/5 bg-white/5 px-8 font-black text-[11px] uppercase tracking-[0.2em] text-white focus:outline-none focus:border-[#C5A059]/40 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                     >
                        <option value="Inter" className="bg-[#0B1220]">{t('admin:inter_modern', 'INTER (Modern Minimal)')}</option>
                        <option value="Montserrat" className="bg-[#0B1220]">{t('admin:montserrat_heavy', 'MONTSERRAT (Heavy Bold)')}</option>
                        <option value="Roboto" className="bg-[#0B1220]">{t('admin:roboto_industrial', 'ROBOTO (Industrial)')}</option>
                        <option value="Open Sans" className="bg-[#0B1220]">{t('admin:opensans_clean', 'OPEN SANS (Legible Clean)')}</option>
                     </select>
                     <RefreshCw className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" size={16} />
                   </div>
                </div>
             </div>
          </section>

          <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
             
             <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#C5A059] border border-white/10 shadow-inner">
                   <Palette size={28} />
                </div>
                <div>
                   <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:chromatic_engine', 'Chromatic Engine')}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:chromatic_engine_desc', 'Primary and secondary UI color mapping.')}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 block mb-6 text-center">{t('admin:primary_node', 'Primary Node')}</label>
                   <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                        <div className="absolute inset-0 blur-2xl opacity-20 transition-all group-hover:opacity-40" style={{ backgroundColor: design.primaryColor }} />
                        <input 
                           type="color"
                           value={design.primaryColor}
                           onChange={e => setDesign({...design, primaryColor: e.target.value})}
                           className="relative h-24 w-24 cursor-pointer rounded-[32px] border-4 border-[#050816] p-0 overflow-hidden shadow-2xl"
                        />
                      </div>
                      <code className="px-6 py-3 rounded-xl bg-[#050816] text-[11px] font-black text-[#C5A059] uppercase tracking-widest border border-white/5">
                        {design.primaryColor}
                      </code>
                   </div>
                </div>
                <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 block mb-6 text-center">{t('admin:secondary_node', 'Secondary Node')}</label>
                   <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                        <div className="absolute inset-0 blur-2xl opacity-20 transition-all group-hover:opacity-40" style={{ backgroundColor: design.secondaryColor }} />
                        <input 
                           type="color"
                           value={design.secondaryColor}
                           onChange={e => setDesign({...design, secondaryColor: e.target.value})}
                           className="relative h-24 w-24 cursor-pointer rounded-[32px] border-4 border-[#050816] p-0 overflow-hidden shadow-2xl"
                        />
                      </div>
                      <code className="px-6 py-3 rounded-xl bg-[#050816] text-[11px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                        {design.secondaryColor}
                      </code>
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-10">
           <section className="relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />
              
              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-500 border border-white/10 shadow-inner">
                   <Layout size={28} />
                </div>
                <div>
                   <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:auth_matrix', 'Auth Matrix')}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{t('admin:auth_matrix_desc', 'Authentication UI style selection.')}</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                 {['modern', 'minimal', 'glass'].map((style) => (
                    <button
                       key={style}
                       onClick={() => setDesign({...design, loginPageStyle: style as any})}
                       className={cn(
                          "w-full rounded-[24px] border px-6 py-5 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-between group",
                          design.loginPageStyle === style 
                            ? "border-[#C5A059]/50 bg-[#C5A059]/10 text-[#F1D28C] shadow-[0_0_20px_rgba(197,160,89,0.1)]" 
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10"
                       )}
                    >
                       <span>{style} {t('admin:protocol', 'Protocol')}</span>
                       {design.loginPageStyle === style ? (
                         <Eye size={18} className="text-[#C5A059]" />
                       ) : (
                         <div className="h-6 w-6 rounded-full border-2 border-white/10 group-hover:border-white/20 transition-colors" />
                       )}
                    </button>
                 ))}
              </div>
           </section>

           <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#0B1220] to-[#050816] p-10 border border-[#C5A059]/10 shadow-2xl">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#C5A059] blur-[100px] opacity-10" />
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                 <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#C5A059]/10 text-[#F1D28C] border border-[#C5A059]/20 shadow-lg">
                   <ImageIcon size={20} />
                </div>
                <h3 className="font-display font-black text-white uppercase tracking-tight">{t('admin:asset_repository', 'Asset Repository')}</h3>
              </div>
              
              <p className="text-[11px] font-medium text-slate-500 mb-10 leading-relaxed uppercase tracking-widest opacity-80">
                {t('admin:asset_repository_desc', 'Deploy critical visual assets from cloud infrastructure. Ensure high-fidelity vectors for branding consistency.')}
              </p>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">{t('admin:master_logo_url', 'Master Logo URL')}</label>
                  <input 
                    type="text"
                    placeholder="https://assets.cdn.com/logo.svg"
                    value={design.logoImageUrl}
                    onChange={e => setDesign({...design, logoImageUrl: e.target.value})}
                    className="w-full bg-[#050816] border border-white/5 rounded-[20px] px-6 py-4 placeholder:text-slate-800 font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">{t('admin:favicon_vector_url', 'Favicon Vector URL')}</label>
                  <input 
                    type="text"
                    placeholder="https://assets.cdn.com/favicon.png"
                    value={design.faviconUrl}
                    onChange={e => setDesign({...design, faviconUrl: e.target.value})}
                    className="w-full bg-[#050816] border border-white/5 rounded-[20px] px-6 py-4 placeholder:text-slate-800 font-bold text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default AdminAppearance;
