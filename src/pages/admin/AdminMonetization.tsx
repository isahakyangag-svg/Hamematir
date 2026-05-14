import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Save, ShieldCheck, TrendingUp, Megaphone, Handshake, RefreshCw } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion } from 'motion/react';

const AdminMonetization: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState({
    bannerPrice: 25000,
    promoPrice: 5000,
    partnerMonthly: 15000,
    currency: 'AMD'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          setConfig(docSnap.data() as any);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/monetization');
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'monetization'), config);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/monetization');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-12 pb-20 text-white">
       <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:monetization_title', 'Monetization')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:monetization_desc', 'Configure partner fees and advertisement rates')}</p>
        </motion.div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? t('admin:synchronizing', 'Synchronizing...') : t('admin:commit_protocols', 'Commit Protocols')}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 px-2">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-[0.02] blur-[50px] transition-opacity group-hover:opacity-[0.05]" />
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-inner">
               <Megaphone size={32} />
            </div>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{t('admin:banner_ads', 'Banner Advertising')}</h3>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-700">{t('admin:banner_ads_desc', 'Monthly fee for featured home banners')}</p>
            
            <div className="mt-10 relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#C5A059] z-10 opacity-40">֏</div>
               <input 
                 type="number"
                 value={config.bannerPrice}
                 onChange={e => setConfig({...config, bannerPrice: Number(e.target.value)})}
                 className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-14 py-5 text-2xl font-display font-black text-white outline-none focus:border-[#C5A059]/40 shadow-inner transition-all"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  AMD / MO
               </div>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.02] blur-[50px] transition-opacity group-hover:opacity-[0.05]" />
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-inner">
               <TrendingUp size={32} />
            </div>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{t('admin:promo_products', 'Promotion Packages')}</h3>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-700">{t('admin:promo_products_desc', 'Cost per 10 products spotlight')}</p>
            
            <div className="mt-10 relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#C5A059] z-10 opacity-40">֏</div>
               <input 
                 type="number"
                 value={config.promoPrice}
                 onChange={e => setConfig({...config, promoPrice: Number(e.target.value)})}
                 className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-14 py-5 text-2xl font-display font-black text-white outline-none focus:border-[#C5A059]/40 shadow-inner transition-all"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  AMD / PKG
               </div>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-[0.02] blur-[50px] transition-opacity group-hover:opacity-[0.05]" />
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-inner">
               <Handshake size={32} />
            </div>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{t('admin:partner_fee', 'Partner Subscription')}</h3>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-700">{t('admin:partner_fee_desc', 'Recurring fixed partner commission')}</p>
            
            <div className="mt-10 relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#C5A059] z-10 opacity-40">֏</div>
               <input 
                 type="number"
                 value={config.partnerMonthly}
                 onChange={e => setConfig({...config, partnerMonthly: Number(e.target.value)})}
                 className="w-full rounded-[24px] bg-[#050816] border border-white/5 px-14 py-5 text-2xl font-display font-black text-white outline-none focus:border-[#C5A059]/40 shadow-inner transition-all"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  AMD / SUB
               </div>
            </div>
         </motion.div>
      </div>

      <div className="mx-2">
        <div className="rounded-[44px] bg-gradient-to-br from-[#0B1220] to-[#050816] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[#C5A059] opacity-[0.02] blur-[100px]" />
           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
              <div className="h-20 w-20 flex items-center justify-center rounded-[28px] bg-[#C5A059]/10 border border-[#C5A059]/20 shadow-[0_0_30px_rgba(197,160,89,0.1)] group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-[#F1D28C]" size={40} />
              </div>
              <div>
                 <p className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none mb-3">{t('admin:financial_security', 'Bank-Grade Security')}</p>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60 leading-relaxed max-w-2xl">{t('admin:financial_security_desc', 'All pricing data is encrypted and synced with terminal rules. Integrity is verified across distributed nodes.')}</p>
              </div>
              <div className="md:ml-auto">
                 <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="h-12 w-12 rounded-full border-4 border-[#0B1220] bg-[#050816] overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Admin" className="w-full h-full object-cover opacity-60" />
                       </div>
                    ))}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#F1D28C] mt-2 text-center">{t('admin:protocol_v4_active', 'Protocol V4 Active')}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonetization;
