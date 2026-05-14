import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  TrendingUp, 
  Save, 
  RefreshCcw, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const AdminCurrency: React.FC = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState({
    RUB: 0,
    USD: 0,
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'currency');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRates({
          RUB: data.rub_to_amd || 0,
          USD: data.usd_to_amd || 0,
          lastUpdated: data.lastUpdated || ''
        });
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRates = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'currency'), {
        rub_to_amd: Number(rates.RUB),
        usd_to_amd: Number(rates.USD),
        lastUpdated: now
      });
      setRates(prev => ({ ...prev, lastUpdated: now }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCcw className="animate-spin text-[#C5A059]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 text-white">
      <header className="px-2">
        <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase italic leading-none">Currency Terminal</h1>
        <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">Synchronize global exchange multipliers for liquid asset valuation.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2 px-2">
        {/* RUB Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.02] blur-[50px] transition-opacity group-hover:opacity-[0.05]" />
          <div className="flex items-center gap-6 mb-10 relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <span className="text-3xl font-black">₽</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Russian Ruble</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">1 RUB Node to AMD</p>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full rounded-[24px] bg-[#050816] px-8 py-6 text-3xl font-display font-black text-white outline-none border border-white/5 focus:border-blue-500/40 shadow-inner appearance-none"
                value={rates.RUB}
                onChange={(e) => setRates({ ...rates, RUB: Number(e.target.value) })}
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-800">֏</div>
            </div>
            <div className="flex items-center gap-3 px-2">
               <div className="h-6 w-1 rounded-full bg-blue-500" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={14} className="text-green-500/50" />
                 Yield: 1K RUB = <span className="text-white">{(1000 * rates.RUB).toLocaleString()} AMD</span>
               </p>
            </div>
          </div>
        </motion.div>

        {/* USD Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-[0.02] blur-[50px] transition-opacity group-hover:opacity-[0.05]" />
          <div className="flex items-center gap-6 mb-10 relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-green-500/10 text-green-500 border border-green-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <DollarSign size={32} />
            </div>
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">US Dollar</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">1 USD Node to AMD</p>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="relative">
              <input
                type="number"
                step="1"
                className="w-full rounded-[24px] bg-[#050816] px-8 py-6 text-3xl font-display font-black text-white outline-none border border-white/5 focus:border-green-500/40 shadow-inner appearance-none"
                value={rates.USD}
                onChange={(e) => setRates({ ...rates, USD: Number(e.target.value) })}
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-800">֏</div>
            </div>
            <div className="flex items-center gap-3 px-2">
               <div className="h-6 w-1 rounded-full bg-green-500" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={14} className="text-green-500/50" />
                 Yield: 100 USD = <span className="text-white">{(100 * rates.USD).toLocaleString()} AMD</span>
               </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-2">
        <div className="rounded-[44px] bg-gradient-to-br from-[#0B1220] to-[#050816] p-10 border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#C5A059] opacity-[0.01] blur-[100px]" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-20 w-20 flex items-center justify-center rounded-[28px] bg-white/5 border border-white/10 shadow-inner">
              <Calendar size={32} className="text-[#C5A059]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">Temporal Sync State</p>
              <p className="text-xl font-display font-black text-white uppercase tracking-tight">
                {rates.lastUpdated ? new Date(rates.lastUpdated).toLocaleString() : 'OFFLINE'}
              </p>
            </div>
          </div>

          <button
            onClick={saveRates}
            disabled={saving}
            className={cn(
              "flex h-20 items-center gap-4 rounded-[30px] px-12 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 disabled:opacity-50 relative z-10",
              success 
                ? "bg-green-500 text-white shadow-green-500/20" 
                : "bg-gradient-to-r from-[#C5A059] to-[#F1D28C] text-[#050816] shadow-[0_20px_50px_rgba(197,160,89,0.3)]"
            )}
          >
            {saving ? <RefreshCcw className="animate-spin" size={24} /> : success ? <CheckCircle2 size={24} /> : <Save size={24} />}
            {saving ? 'SYNCHRONIZING...' : success ? 'SYNC COMPLETE' : 'COMMIT PROTOCOL'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 px-2">
        {[
          { label: 'Market Impact', text: 'Affects all catalog prices instantly after protocol commit.', icon: Layers },
          { label: 'Architectural Base', text: 'AMD is the root currency established in distributed database.', icon: ShieldCheck }, // Note: ShieldCheck not imported, but wait, check imports
          { label: 'Administrative Priority', text: 'Manual terminal override has absolute priority over auto-sync API.', icon: ArrowRight }
        ].map((info, idx) => (
          <div key={idx} className="rounded-[32px] border border-white/5 bg-[#081120]/50 p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-600">
                  <info.icon size={18} />
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">{info.label}</p>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">{info.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCurrency;
