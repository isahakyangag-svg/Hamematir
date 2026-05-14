import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Activity, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search,
  MessageSquare,
  Power,
  MousePointer2,
  Store,
  ChevronLeft,
  Package,
  Image as ImageIcon,
  DollarSign,
  Settings
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Stat {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [parsingReports, setParsingReports] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleQuickAction = async (action: string) => {
    if (action === 'Sync') {
      navigate('/admin/sync');
      return;
    }
    setSyncing(action);
    try {
      const statusRef = doc(db, 'system', 'status');
      if (action === 'Sync Galaxy' || action === 'Cloud Sync') {
        await setDoc(statusRef, { 
          lastSync: serverTimestamp(),
          status: 'active',
          load: Math.floor(Math.random() * 10) + '%'
        }, { merge: true });
      } else if (action === 'Purge Cache' || action === t('admin:purge_cache_ru', 'Очистить кэш')) {
        await setDoc(statusRef, { cacheCleared: serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setSyncing(null), 1000);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'hq_messages'), {
        text: newMessage,
        sender: user?.displayName || user?.email?.split('@')[0] || 'Admin',
        senderId: user?.uid,
        type: 'broadcast',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hq_messages');
    }
  };

  useEffect(() => {
    const statusUnsub = onSnapshot(doc(db, 'system', 'status'), (snap) => {
      if (snap.exists()) setSystemStatus(snap.data());
    });

    const reportsQuery = query(collection(db, 'parsing_reports'), orderBy('timestamp', 'desc'), limit(5));
    const reportsUnsub = onSnapshot(reportsQuery, (snap) => {
      setParsingReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const chatQuery = query(collection(db, 'hq_messages'), orderBy('timestamp', 'desc'), limit(20));
    const chatUnsub = onSnapshot(chatQuery, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchStats = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const storesSnap = await getDocs(collection(db, 'stores'));
        const usersSnap = await getDocs(collection(db, 'users'));

        setStats([
          { label: t('admin:total_products', 'Total Products'), value: productsSnap.size, change: '+12%', trend: 'up', icon: ShoppingCart, color: 'blue' },
          { label: t('admin:active_stores', 'Active Stores'), value: storesSnap.size, change: '+2', trend: 'up', icon: Store, color: 'indigo' },
          { label: t('admin:platform_users', 'Platform Users'), value: usersSnap.size, change: '+85', trend: 'up', icon: Users, color: 'purple' },
          { label: t('admin:store_conversions', 'Store Conversions'), value: '4.2k', change: '-3%', trend: 'down', icon: MousePointer2, color: 'orange' },
        ]);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchStats();
    return () => {
      statusUnsub();
      reportsUnsub();
      chatUnsub();
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const toggleMaintenance = async () => {
    if (!systemStatus && loading) return;
    try {
      await setDoc(doc(db, 'system', 'status'), {
        maintenance: !systemStatus?.maintenance,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'system/status');
    }
  };

  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Page Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
           <div className="h-16 w-16 rounded-[24px] bg-white/5 border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10 transition-transform hover:scale-105">
              <BarChart3 className="text-amber-500" size={30} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-4xl font-display font-black tracking-tight text-white leading-none uppercase">{t('admin:dashboard_overview', 'Dashboard Overview')}</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">{t('admin:dashboard_subtitle', 'Real-time metrics and system health indicators')}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#081120] p-2.5 pl-7 shadow-2xl">
              <div className="flex flex-col items-end">
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t('admin:security_state', 'Security State')}</span>
                 <span className={cn("text-xs font-black tracking-widest", systemStatus?.maintenance ? "text-amber-500" : "text-emerald-500")}>
                    {systemStatus?.maintenance ? t('admin:status_maintenance', 'MAINTENANCE') : t('admin:status_operational', 'OPERATIONAL')}
                 </span>
              </div>
              <button 
                onClick={toggleMaintenance}
                className={cn(
                   "group relative h-12 w-12 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-95 border border-white/10",
                   systemStatus?.maintenance ? "bg-amber-500 text-black shadow-amber-500/20" : "bg-emerald-500 text-black shadow-emerald-500/20"
                )}
              >
                 <Power size={20} strokeWidth={2.5} className="transition-transform group-hover:rotate-12" />
              </button>
              <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                <ChevronLeft size={20} className="-rotate-90" />
              </button>
           </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-[#0B1220] p-8 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className={cn(
              "mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-all group-hover:scale-110 shadow-2xl border border-white/5",
              stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
              stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
              stat.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
              'bg-amber-500/10 text-amber-500'
            )}>
              <stat.icon size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">{stat.label}</h3>
              <div className="flex items-baseline justify-between gap-4">
                 <p className="text-4xl font-display font-black text-white tracking-tighter">{stat.value}</p>
                 <span className={cn(
                    "text-[12px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 border backdrop-blur-md shadow-xl",
                    stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                 )}>
                    {stat.change}
                    <span className="text-[10px] opacity-70 font-medium">{t('admin:vs_last_month', 'vs last month')}</span>
                 </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
           <div className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl">
              <div className="mb-12 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-display font-black tracking-tight text-white uppercase">{t('admin:traffic_allocation', 'Traffic Allocation')}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{t('admin:traffic_subtitle', 'Global traffic performance overview')}</p>
                 </div>
                 <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {['24H', '7D', '30D'].map(p => (
                       <button 
                        key={p} 
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          p === '7D' ? "bg-amber-500 text-black shadow-2xl shadow-amber-500/20" : "text-slate-500 hover:text-white"
                       )}>{p}</button>
                    ))}
                 </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fontWeight: 900, fill: '#64748B', letterSpacing: '0.1em'}} 
                      dy={20} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fontWeight: 900, fill: '#64748B'}} 
                      dx={-20} 
                    />
                    <Tooltip 
                       contentStyle={{ 
                         border: '1px solid rgba(255,255,255,0.1)', 
                         borderRadius: '24px', 
                         boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                         background: '#0B1220', 
                         backdropFilter: 'blur(20px)',
                         padding: '16px'
                       }}
                       itemStyle={{ color: '#F1D28C', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#C5A059" 
                      strokeWidth={5} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl">
              <header className="mb-10 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500 border border-white/5 shadow-xl">
                      <RefreshCcw size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">{t('admin:recent_orders', 'Recent Orders')}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">{t('admin:recent_orders_subtitle', 'Latest transactions across all stores')}</p>
                    </div>
                 </div>
                 <button className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border border-amber-500/20 px-6 py-3 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-xl">
                   {t('admin:view_all_orders', 'View All Orders')}
                </button>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                      <th className="pb-6 text-left pl-4">{t('admin:order_id', 'Order ID')}</th>
                      <th className="pb-6 text-left">{t('admin:customer', 'Customer')}</th>
                      <th className="pb-6 text-left">{t('admin:store', 'Store')}</th>
                      <th className="pb-6 text-left">{t('admin:amount', 'Amount')}</th>
                      <th className="pb-6 text-left">{t('admin:status', 'Status')}</th>
                      <th className="pb-6 text-right pr-4">{t('admin:date', 'Date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { id: '#CL-2024-001', customer: 'John Doe', store: 'Comfort Store', amount: '1,250,000 UZS', status: 'Completed', date: '2 min ago' },
                      { id: '#CL-2024-002', customer: 'Jane Smith', store: 'Luxury Tech', amount: '2,750,000 UZS', status: 'Processing', date: '15 min ago' },
                      { id: '#CL-2024-003', customer: 'Mike Johnson', store: 'Comfort Home', amount: '980,000 UZS', status: 'Pending', date: '1 hour ago' },
                      { id: '#CL-2024-004', customer: 'Sarah Wilson', store: 'Premium Store', amount: '4,200,000 UZS', status: 'Completed', date: '2 hours ago' },
                    ].map((order, i) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="group hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <td className="py-6 pl-4 text-xs font-black text-amber-500/80">{order.id}</td>
                        <td className="py-6 text-sm font-bold text-white transition-colors group-hover:text-amber-400">{order.customer}</td>
                        <td className="py-6 text-xs font-medium text-slate-400">{order.store}</td>
                        <td className="py-6 text-sm font-black text-white">{order.amount}</td>
                        <td className="py-6">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            order.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            order.status === 'Processing' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                             {order.status}
                          </span>
                        </td>
                        <td className="py-6 pr-4 text-right text-[10px] font-bold text-slate-500">{order.date}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="overflow-hidden rounded-[40px] border border-white/5 bg-[#0B1220] shadow-2xl relative">
              <div className="p-10 text-white relative">
                 <div className="flex items-center justify-between mb-10 relative">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500 shadow-xl border border-white/5">
                        <MessageSquare size={20} strokeWidth={2.5} />
                       </div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#F1D28C]">{t('admin:hq_logs', 'HQ Logs')}</h3>
                    </div>
                 </div>
                 
                 <div className="space-y-6 relative">
                    {messages.length > 0 ? (
                      <div className="rounded-[32px] bg-white/5 p-8 border border-white/5 shadow-inner backdrop-blur-2xl">
                        <p className="text-base font-medium opacity-90 leading-relaxed text-slate-300">"{messages[0].text}"</p>
                        <div className="mt-8 flex items-center justify-between">
                          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{messages[0].sender}</p>
                          <span className="text-[9px] font-bold text-slate-600">{t('admin:time_ago', 'just now')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center gap-4 opacity-20">
                        <Activity className="animate-pulse" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">{t('admin:awaiting_pulse', 'Awaiting Pulse')}</p>
                      </div>
                    )}
                 </div>
                 
                 <button 
                  onClick={() => setIsChatOpen(true)}
                  className="mt-10 w-full rounded-2xl bg-white/5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10 hover:bg-white/10 transition-all shadow-2xl hover:text-amber-500 hover:border-amber-500/30"
                 >
                    {t('admin:view_all_logs', 'View All Logs')}
                 </button>
              </div>
           </div>

           <div className="rounded-[40px] border border-white/5 bg-[#081120] p-10 shadow-2xl">
               <div className="flex items-center gap-6 mb-10">
                 <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500 border border-white/5 shadow-xl">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('admin:quick_actions', 'Quick Actions')}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                    { label: t('admin:action_add_product', 'Add Product'), icon: Package, color: 'blue' },
                    { label: t('admin:action_add_store', 'Add Store'), icon: Store, color: 'indigo' },
                    { label: t('admin:action_add_banner', 'Add Banner'), icon: ImageIcon, color: 'purple' },
                    { label: t('admin:action_add_user', 'Add User'), icon: Users, color: 'emerald' },
                    { label: t('admin:action_transactions', 'Transactions'), icon: DollarSign, color: 'orange' },
                    { label: t('admin:action_system_settings', 'System Settings'), icon: Settings, color: 'rose' },
                 ].map(action => (
                    <button 
                      key={action.label} 
                      onClick={() => handleQuickAction(action.label)}
                      className="group flex flex-col items-center justify-center gap-5 rounded-[32px] border border-white/5 bg-white/5 py-8 transition-all hover:bg-[#0B1220] hover:border-amber-500/30 hover:shadow-[0_15px_40px_rgba(197,160,89,0.1)] active:scale-95"
                    >
                       <div className={cn(
                         "h-14 w-14 rounded-2xl bg-[#050816] flex items-center justify-center shadow-2xl border border-white/10 transition-all group-hover:scale-110 group-hover:rotate-6",
                         action.color === 'blue' ? 'text-blue-500' : 
                         action.color === 'indigo' ? 'text-indigo-500' : 
                         action.color === 'purple' ? 'text-purple-500' : 
                         action.color === 'emerald' ? 'text-emerald-500' :
                         action.color === 'orange' ? 'text-orange-500' : 'text-rose-500'
                       )}>
                          <action.icon size={26} strokeWidth={2.5} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-white transition-colors">{action.label}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="rounded-[40px] border border-white/5 bg-[#0B1220] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F1D28C] mb-10 flex items-center gap-3">
                Operations Matrix
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </h3>

              <div className="space-y-8">
                 {[
                    { label: t('admin:system_performance', 'System Performance'), value: 85, color: '#C5A059' },
                    { label: t('admin:user_engagement', 'User Engagement'), value: 72, color: '#4f46e5' },
                    { label: t('admin:store_activity', 'Store Activity'), value: 91, color: '#3b82f6' },
                    { label: t('admin:security_status', 'Security Status'), value: 98, color: '#10b981' },
                 ].map(item => (
                   <div key={item.label} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                        <span className="text-xs font-black text-white">{item.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}44` }}
                        />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-12 flex items-center justify-center">
                 <div className="relative h-40 w-40 flex items-center justify-center">
                    <svg className="h-full w-full rotate-[-90deg]">
                       <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                       <motion.circle 
                          cx="80" cy="80" r="70" 
                          fill="none" stroke="#C5A059" 
                          strokeWidth="12" strokeLinecap="round"
                          strokeDasharray="440"
                          initial={{ strokeDashoffset: 440 }}
                          whileInView={{ strokeDashoffset: 440 - (440 * 0.85) }}
                          transition={{ duration: 2, delay: 0.5 }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-display font-black text-white">85%</span>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('admin:efficiency', 'Efficiency')}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050816]/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-2xl bg-[#0B1220] rounded-[48px] shadow-2xl border border-white/10 overflow-hidden h-[700px] flex flex-col">
              <div className="bg-[#081120] p-10 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-5">
                   <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-2xl shadow-amber-500/20">
                    <MessageSquare size={28} strokeWidth={2.5} />
                   </div>
                   <div>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tight text-white">{t('admin:hq_link_terminal', 'HQ Link Terminal')}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">{t('admin:hq_link_subtitle', 'Secure communication channel')}</p>
                   </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/10 group">
                  <RefreshCcw className="group-hover:rotate-180 transition-transform duration-700" size={20} />
                </button>
              </div>
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {messages.map(msg => (
                  <div key={msg.id} className={cn(
                    "max-w-[80%] p-8 rounded-[40px] text-base font-medium shadow-2xl relative", 
                    msg.senderId === user?.uid 
                      ? "ml-auto bg-amber-500 text-black rounded-br-none border border-amber-500/20" 
                      : "bg-white/5 text-white rounded-bl-none border border-white/10 backdrop-blur-xl"
                  )}>
                    {msg.text}
                    <div className={cn(
                      "mt-4 text-[9px] font-black uppercase tracking-widest opacity-40",
                      msg.senderId === user?.uid ? "text-black" : "text-white"
                    )}>
                      {msg.sender}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-10 border-t border-white/5 bg-[#050816]/50 flex gap-5 backdrop-blur-3xl">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('admin:hq_input_placeholder', 'Enter encrypted signal...')} className="flex-1 h-16 px-8 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 transition-all font-medium text-white shadow-inner" />
                <button type="submit" className="h-16 px-10 bg-gold text-black rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-amber-500/20 hover:scale-105 transition-transform active:scale-95">{t('admin:hq_send_btn', 'Beam Message')}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
