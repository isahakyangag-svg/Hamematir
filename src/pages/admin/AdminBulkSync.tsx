import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RefreshCcw, 
  RefreshCw,
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings2, 
  FileText,
  BarChart3,
  Calendar,
  Zap,
  Globe
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface SyncStatus {
  total: number;
  processed: number;
  errors: number;
  running: boolean;
  startTime?: any;
  endTime?: any;
  currentProduct?: string;
}

const AdminBulkSync: React.FC = () => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ total: 0, processed: 0, errors: 0, running: false });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('03:00'); // Default 3 AM
  const [scheduleDay, setScheduleDay] = useState('daily');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSyncStatus(prev => ({ ...prev, total: snap.size }));
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const startBulkSync = async () => {
    if (syncStatus.running) return;
    
    setSyncStatus(prev => ({ ...prev, running: true, processed: 0, errors: 0, startTime: new Date() }));
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setSyncStatus(prev => ({ ...prev, currentProduct: product.nameRu || product.name }));
      
      try {
        // Call the server API for each product to perform scraper logic
        const response = await fetch('/api/admin/sync-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id })
        });
        
        if (!response.ok) throw new Error('Sync failed');
        
        setSyncStatus(prev => ({ ...prev, processed: prev.processed + 1 }));
      } catch (error) {
        setSyncStatus(prev => ({ ...prev, errors: prev.errors + 1 }));
      }
      
      // Delay to avoid overwhelming the server or causing rate limits if many products
      await new Promise(r => setTimeout(r, 500));
    }
    
    setSyncStatus(prev => ({ ...prev, running: false, endTime: new Date() }));
  };

  const [savingSettings, setSavingSettings] = useState(false);

  const saveSchedule = async () => {
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, 'settings', 'sync'), {
        scheduleTime,
        scheduleDay,
        updatedAt: serverTimestamp()
      });
      alert(t('admin:config_saved_core', 'Configuration saved successfully to Core Registry'));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/sync');
    } finally {
      setSavingSettings(false);
    }
  };

  const progress = syncStatus.total > 0 ? Math.round((syncStatus.processed / syncStatus.total) * 100) : 0;

  return (
    <div className="space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:system_architecture', 'System Architecture')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:system_architecture_desc', 'Full Database Matrix Sync engine active.')}</p>
        </motion.div>

        <button 
          onClick={startBulkSync}
          disabled={syncStatus.running}
          className={cn(
            "flex h-16 items-center gap-4 rounded-[28px] px-10 text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 disabled:opacity-50 group",
            syncStatus.running 
              ? "bg-white/5 border border-white/5 text-slate-500" 
              : "bg-gradient-to-r from-[#C5A059] to-[#F1D28C] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105"
          )}
        >
          {syncStatus.running ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Play size={20} className="group-hover:rotate-12 transition-transform" />
          ) }
          {syncStatus.running ? t('admin:protocol_running', 'Protocol Running...') : t('admin:execute_core_sync', 'Execute Core Sync')}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 px-2">
        {/* Progress Card */}
        <div className="rounded-[48px] bg-[#081120] p-12 border border-white/5 shadow-2xl relative overflow-hidden group">
           {/* Background Mesh */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059] blur-[120px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 blur-[120px] opacity-[0.02]" />

           <div className="relative space-y-12">
              <div className="flex justify-between items-end">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{t('admin:matrix_saturation', 'Matrix saturation')}</p>
                    <div className="flex items-baseline gap-3">
                       <h2 className="text-7xl font-display font-black text-white">{progress}</h2>
                       <span className="text-2xl font-black text-[#C5A059]/40">%</span>
                    </div>
                 </div>
                 <div className="text-right space-y-1">
                    <div className={cn(
                      "flex items-center gap-3 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      syncStatus.running 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse" 
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    )}>
                       <div className={cn("h-1.5 w-1.5 rounded-full", syncStatus.running ? "bg-amber-500" : "bg-emerald-500")} />
                       {syncStatus.running ? t('admin:live_processing', 'Live Processing') : t('admin:operational', 'Operational')}
                    </div>
                 </div>
              </div>

              {/* Major Progress Bar */}
              <div className="space-y-6">
                 <div className="h-4 w-full bg-[#050816] rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-[#C5A059] to-[#F1D28C] rounded-full shadow-[0_0_20px_rgba(197,160,89,0.3)]" 
                    />
                 </div>
                 <div className="flex justify-between text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
                    <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" /> {syncStatus.processed} {t('admin:processed', 'Processed')}</span>
                    <span>{syncStatus.total} {t('admin:total_units', 'Total Units')}</span>
                 </div>
              </div>

              {syncStatus.running && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/[0.02] rounded-[32px] p-8 border border-white/5 flex items-center gap-6 shadow-inner"
                >
                   <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
                      <Zap size={24} className="text-[#C5A059] animate-pulse" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 mb-1">{t('admin:target_identifier', 'Target Identifier')}</p>
                      <p className="text-lg font-display font-black truncate text-white uppercase tracking-tight">{syncStatus.currentProduct || t('admin:initializing', 'INITIALIZING...')}</p>
                   </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-8">
                 <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 hover:border-rose-500/20 transition-colors group/error">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 mb-3 group-hover:text-rose-500 transition-colors">{t('admin:exceptions', 'Exceptions')}</p>
                    <p className="text-4xl font-display font-black text-white">{syncStatus.errors}</p>
                 </div>
                 <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 hover:border-emerald-500/20 transition-colors group/success">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 mb-3 group-hover:text-emerald-500 transition-colors">{t('admin:yield_rate', 'Yield Rate')}</p>
                    <p className="text-4xl font-display font-black text-white">
                      {syncStatus.processed > 0 ? Math.round(((syncStatus.processed - syncStatus.errors) / syncStatus.processed) * 100) : 100}%
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Scheduler Card */}
        <div className="rounded-[48px] bg-[#081120] p-12 border border-white/5 shadow-2xl space-y-12 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full" />
           
           <div className="relative flex items-center gap-6">
              <div className="h-16 w-16 rounded-[24px] bg-[#C5A059]/10 text-[#F1D28C] flex items-center justify-center border border-[#C5A059]/20 shadow-[0_0_30px_rgba(197,160,89,0.1)]">
                 <Calendar size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Sync Scheduler</h3>
                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1">Autonomous orchestration console.</p>
              </div>
           </div>

           <div className="relative space-y-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 pl-4">{t('admin:frequency_protocol', 'Frequency Protocol')}</label>
                 <div className="flex gap-4 p-2 bg-[#050816] rounded-full border border-white/5 shadow-inner">
                    {['daily', 'weekly', 'bi-weekly'].map(f => (
                       <button
                         key={f}
                         onClick={() => setScheduleDay(f)}
                         className={cn(
                           "flex-1 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden",
                           scheduleDay === f 
                             ? "bg-[#C5A059] text-[#050816] shadow-xl" 
                             : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                         )}
                       >
                         {f}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 pl-4">{t('admin:temporal_window', 'Temporal Window (GMT+4)')}</label>
                 <div className="relative group">
                    <Clock size={24} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-[#C5A059] transition-all" />
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full h-20 rounded-[32px] bg-[#050816] border border-white/5 pl-20 pr-8 text-3xl font-display font-black tracking-widest text-white transition-all focus:border-[#C5A059]/40 outline-none shadow-inner" 
                    />
                 </div>
              </div>

              <div className="p-10 rounded-[40px] bg-[#C5A059]/5 border border-[#C5A059]/10 relative overflow-hidden group/intel">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] blur-[60px] opacity-[0.05]" />
                 <div className="flex gap-6 relative z-10">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#C5A059]/10 text-[#F1D28C] border border-[#C5A059]/20 flex items-center justify-center">
                       <CheckCircle2 size={24} />
                    </div>
                    <div>
                       <p className="text-sm font-black text-white uppercase tracking-tight mb-2">{t('admin:registry_confirmation', 'Registry Confirmation')}</p>
                       <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest opacity-80">
                          {t('admin:sync_registry_desc_p1', 'Primary database nodes will be globally updated every') + ' ' + scheduleDay}. 
                          {t('admin:sync_registry_desc_p2', 'Execution starts at {{time}}. Logs will be stored in HQ encrypted registry.', { time: scheduleTime })}
                       </p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={saveSchedule}
                disabled={savingSettings}
                className="w-full py-6 rounded-[32px] bg-white hover:bg-slate-100 text-black font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                 {savingSettings ? t('admin:committing', 'Committing...') : t('admin:save_configuration', 'Save Configuration')}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBulkSync;
