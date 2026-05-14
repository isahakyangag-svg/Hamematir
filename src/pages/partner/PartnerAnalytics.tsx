import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer2, 
  Target, 
  Globe, 
  Smartphone, 
  Chrome,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '../../lib/utils';

const timelineData = [
  { name: '01.05', impressions: 4000, clicks: 240, ctr: 6.0 },
  { name: '05.05', impressions: 3000, clicks: 139, ctr: 4.6 },
  { name: '10.05', impressions: 5000, clicks: 380, ctr: 7.6 },
  { name: '15.05', impressions: 4780, clicks: 390, ctr: 8.1 },
  { name: '20.05', impressions: 6890, clicks: 480, ctr: 6.9 },
  { name: '25.05', impressions: 5390, clicks: 380, ctr: 7.0 },
  { name: '30.05', impressions: 8490, clicks: 730, ctr: 8.5 },
];

const geoData = [
  { name: 'Ереван', value: 45 },
  { name: 'Москва', value: 30 },
  { name: 'Гюмри', value: 15 },
  { name: 'Другие', value: 10 },
];

const COLORS = ['#F59E0B', '#F1D28C', '#C5A059', '#8B6E32'];

const MetricCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="bg-[#0B1220]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors duration-700" />
    
    <div className="flex items-start justify-between relative z-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 text-amber-500 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500 shadow-xl">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className={cn(
        "flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest border transition-all duration-500",
        trend === 'up' 
          ? "bg-green-500/10 text-green-500 border-green-500/20 group-hover:bg-green-500 group-hover:text-black" 
          : "bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-black"
      )}>
        {trend === 'up' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
        {change}%
      </div>
    </div>
    <div className="mt-10 relative z-10">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{title}</span>
      <h3 className="text-4xl font-black text-white mt-3 tracking-tighter group-hover:text-amber-500 transition-colors uppercase leading-none">{value}</h3>
    </div>
  </div>
);

const PartnerAnalytics: React.FC = () => {
  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
           <div className="flex items-center gap-4 mb-3">
              <div className="h-2 w-12 bg-gradient-to-r from-amber-500 to-[#8B6E32] rounded-full" />
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Comprehensive Analytics</p>
           </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Аналитика</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-4 bg-[#0B1220]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
             <Calendar size={18} className="text-amber-500" />
             <span className="text-[11px] font-black text-white uppercase tracking-widest">May 1, 2024 — May 31, 2024</span>
          </div>
          <button className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#0B1220] text-white/40 hover:text-white hover:border-white/20 transition-all border border-white/10 shadow-2xl">
            <Filter size={20} />
          </button>
          <button className="flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] text-black px-8 h-14 text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-5px_rgba(197,160,89,0.3)]">
            <Download size={18} strokeWidth={3} />
            <span>Экспорт данных</span>
          </button>
        </div>
      </header>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <MetricCard title="Просмотры" value="124.5K" change="14.2" trend="up" icon={Eye} />
        <MetricCard title="Клики" value="8,542" change="8.1" trend="up" icon={MousePointer2} />
        <MetricCard title="Средний CTR" value="6.86%" change="2.4" trend="down" icon={Target} />
        <MetricCard title="Повторные" value="12.4%" change="5.7" trend="up" icon={Users} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Main Performance Chart */}
        <div className="xl:col-span-2 bg-[#0B1220]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
             <div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Динамика эффективности</h3>
               <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">Views & Click-Through performance timeline</p>
             </div>
             <div className="flex items-center gap-8 bg-black/20 px-6 py-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Просмотры</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-white/40" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Клики</span>
                </div>
             </div>
          </div>

          <div className="h-[450px] w-full -ml-8">
            <ResponsiveContainer width="105%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="impGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '900', letterSpacing: '0.1em' }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '900' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '2rem', 
                    background: '#0B1220', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff',
                    padding: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="impressions" stroke="#F59E0B" strokeWidth={4} fillOpacity={1} fill="url(#impGradient)" />
                <Area type="monotone" dataKey="clicks" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#clickGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geo Distribution */}
        <div className="bg-[#0B1220]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-10 relative z-10">География</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <div className="h-[280px] w-full transform group-hover:scale-105 transition-transform duration-700">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={geoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '1.5rem', background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: '900' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <Globe size={40} className="text-white/10" />
                 <span className="text-[10px] font-black text-amber-500 uppercase mt-2 tracking-widest">Global</span>
              </div>
            </div>
            
            <div className="w-full space-y-5 mt-12 bg-black/20 p-8 rounded-[2rem] border border-white/5">
               {geoData.map((item, i) => (
                 <div key={item.name} className="flex items-center justify-between group/item cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="h-3 w-3 rounded-full shadow-lg transition-transform group-hover/item:scale-150" style={{ backgroundColor: COLORS[i], boxShadow: `0 0 10px ${COLORS[i]}44` }} />
                       <span className="text-[11px] font-black text-white/50 uppercase tracking-widest group-hover/item:text-white transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-black text-white group-hover/item:text-amber-500 transition-colors">{item.value}%</span>
                       <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${item.value}%` }} />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#0B1220]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12">
             <Smartphone size={32} className="text-white/5 group-hover:text-amber-500/20 transition-colors duration-700" />
           </div>
          
          <div className="mb-12">
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Типы устройств</h3>
             <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">Traffic distribution by hardware</p>
          </div>
          
          <div className="space-y-10">
             {[
               { name: 'Mobile', value: 72, icon: Smartphone, color: 'from-amber-500 to-[#8B6E32]', glow: 'rgba(245,158,11,0.4)' },
               { name: 'Desktop', value: 24, icon: Globe, color: 'from-white/20 to-white/5', glow: 'rgba(255,255,255,0.1)' },
               { name: 'Tablet', value: 4, icon: Shield, color: 'from-white/10 to-transparent', glow: 'rgba(255,255,255,0.05)' },
             ].map((device) => (
               <div key={device.name} className="space-y-4 group/dev">
                 <div className="flex justify-between items-center px-2">
                   <div className="flex items-center gap-4">
                      <device.icon size={18} className="text-white/20 group-hover/dev:text-white transition-colors" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/dev:text-white transition-colors">{device.name}</span>
                   </div>
                   <span className="text-lg font-black text-white tracking-tighter">{device.value}%</span>
                 </div>
                 <div className="h-3 w-full bg-black/40 rounded-full p-0.5 border border-white/5 overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${device.value}%` }}
                    transition={{ duration: 1.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className={cn("h-full rounded-full bg-gradient-to-r", device.color)}
                    style={{ boxShadow: `0 0 15px ${device.glow}` }}
                   />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-[#0B1220]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12">
             <Chrome size={32} className="text-white/5 group-hover:text-amber-500/20 transition-colors duration-700" />
           </div>

          <div className="mb-12">
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Браузеры</h3>
             <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">Client software segment analysis</p>
          </div>
          
          <div className="space-y-10">
             {[
               { name: 'Google Chrome', value: 58, color: 'from-amber-600 to-amber-400' },
               { name: 'Apple Safari', value: 32, color: 'from-white/40 to-white/10' },
               { name: 'Mozilla Firefox', value: 10, color: 'from-white/10 to-transparent' },
             ].map((browser) => (
               <div key={browser.name} className="space-y-4 group/br">
                 <div className="flex justify-between items-center px-2">
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/br:text-white transition-colors">{browser.name}</span>
                   <span className="text-lg font-black text-white tracking-tighter">{browser.value}%</span>
                 </div>
                 <div className="relative h-6 w-full flex items-center">
                    <div className="absolute inset-0 bg-black/40 rounded-xl border border-white/5" />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${browser.value}%` }}
                      transition={{ duration: 1.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className={cn("absolute left-0 h-full rounded-xl bg-gradient-to-r shadow-xl", browser.color)} 
                    />
                    <div className="relative w-full flex justify-end px-4">
                       <div className="h-1 w-1 rounded-full bg-white/20" />
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerAnalytics;
