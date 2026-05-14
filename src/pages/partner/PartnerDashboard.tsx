import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  Eye, 
  MousePointer2, 
  ArrowUpRight,
  MessageSquare,
  Bell,
  ExternalLink,
  ChevronRight,
  Plus,
  Calendar,
  Image as ImageIcon,
  Layers,
  User as UserIcon,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../../lib/utils';

const data = [
  { name: '01.05', views: 400 },
  { name: '05.05', views: 300 },
  { name: '10.05', views: 500 },
  { name: '15.05', views: 450 },
  { name: '20.05', views: 700 },
  { name: '25.05', views: 600 },
  { name: '30.05', views: 900 },
];

const statsChartData = [
  { value: 40 }, { value: 30 }, { value: 60 }, { value: 45 }, { value: 80 }, { value: 55 }, { value: 90 },
];

const StatCard = ({ title, value, subtitle, icon: Icon, color, glowColor, chartColor }: any) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.02 }}
    className="relative overflow-hidden rounded-[2.5rem] bg-[#0B1220]/80 backdrop-blur-2xl border border-white/5 p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 group"
  >
    {/* Dynamic Glow Background */}
    <div className={cn("absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-10 rounded-full -mr-20 -mt-20 transition-opacity duration-700 group-hover:opacity-30", glowColor)} />
    
    <div className="flex items-start justify-between relative z-10">
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-[1.25rem] text-white shadow-2xl transition-transform duration-500 group-hover:rotate-6", color)}>
        <Icon size={24} fill="currentColor" opacity={0.2} strokeWidth={2.5} />
      </div>
    </div>

    <div className="mt-8 relative z-10">
      <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</h3>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{value}</span>
        {title === 'Баланс' && <span className="text-xl font-black text-[#C5A059]">₽</span>}
      </div>
      <p className="mt-2 text-[10px] font-black text-white/20 uppercase tracking-widest">{subtitle}</p>
    </div>

    {/* Mini Chart Integration */}
    <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700">
       <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={statsChartData}>
             <defs>
               <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                 <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
               </linearGradient>
             </defs>
             <Area 
               type="monotone" 
               dataKey="value" 
               stroke={chartColor} 
               strokeWidth={2} 
               fill={`url(#grad-${title})`} 
               isAnimationActive={true}
             />
          </AreaChart>
       </ResponsiveContainer>
    </div>
  </motion.div>
);

const PartnerDashboard: React.FC = () => {
  return (
    <div className="space-y-12 pb-20">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard 
          title="Активных баннеров" 
          value="3" 
          subtitle="Общий баннеров: 5" 
          icon={ImageIcon} 
          color="bg-purple-600 shadow-purple-500/20" 
          glowColor="bg-purple-500"
          chartColor="#a855f7"
        />
        <StatCard 
          title="Истекают скоро" 
          value="1" 
          subtitle="Заканчиваются в течении 3 дней" 
          icon={Clock} 
          color="bg-blue-600 shadow-blue-500/20" 
          glowColor="bg-blue-500"
          chartColor="#3b82f6"
        />
        <StatCard 
          title="Активно дней" 
          value="27" 
          subtitle="Средняя длительность" 
          icon={Zap} 
          color="bg-green-600 shadow-green-500/20" 
          glowColor="bg-green-500"
          chartColor="#22c55e"
        />
        <StatCard 
          title="Баланс" 
          value="12 450" 
          subtitle="Доступно для вывода" 
          icon={CreditCard} 
          color="bg-orange-600 shadow-orange-500/20" 
          glowColor="bg-orange-500"
          chartColor="#f97316"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Banner Table */}
        <div className="xl:col-span-2 space-y-10">
          <div className="bg-[#0B1220]/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Мои баннеры</h2>
                <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">Последние размещения</p>
              </div>
              <button className="h-10 px-6 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-2 group">
                Посмотреть все <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-6 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Баннер</th>
                    <th className="pb-6 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Категория</th>
                    <th className="pb-6 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Дата окончания</th>
                    <th className="pb-6 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Статус</th>
                    <th className="pb-6"></th>
                  </tr>
                </thead>
                <tbody className="">
                  {[
                    { name: 'Магазин одежды', cat: 'Мода и стиль', date: '01.06.2024', status: 'Активен', statusType: 'active' },
                    { name: 'Аренда авто', cat: 'Авто', date: '10.06.2024', status: 'Активен', statusType: 'active' },
                    { name: 'Туристические услуги', cat: 'Путешествия', date: '15.06.2024', status: 'Истекает', statusType: 'expiring' },
                  ].map((banner, i) => (
                    <tr key={i} className="group transition-all hover:bg-white/[0.04]">
                      <td className="py-6 pr-4">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-20 rounded-xl bg-black border border-white/5 overflow-hidden shrink-0 shadow-lg group-hover:border-amber-500/30 transition-all duration-500">
                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                              <ImageIcon size={18} className="text-white/20" />
                            </div>
                          </div>
                          <div>
                            <span className="block text-[14px] font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{banner.name}</span>
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 block">Главная страница</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-[11px] font-black text-white/40 uppercase tracking-widest">{banner.cat}</td>
                      <td className="py-6 text-[11px] font-black text-white/40 uppercase tracking-widest">{banner.date}</td>
                      <td className="py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-lg",
                          banner.statusType === 'active' 
                            ? "bg-green-500/10 text-green-500 shadow-green-500/5 ring-1 ring-green-500/20" 
                            : "bg-amber-500/10 text-amber-500 shadow-amber-500/5 ring-1 ring-amber-500/20"
                        )}>
                          {banner.status}
                        </span>
                      </td>
                      <td className="py-6 text-right">
                         <button className="h-10 w-10 flex items-center justify-center rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all">
                            <ChevronRight size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Large Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-[#0B1220] to-[#050816] border border-white/5 rounded-[3rem] p-10 group relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full -z-0" />
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-[#8B6E32] flex items-center justify-center text-black shadow-[0_10px_30px_rgba(197,160,89,0.3)]">
                  <Plus size={32} strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase relative z-10">Заказать баннер</h3>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mt-3 relative z-10">Разместите новый рекламный баннер</p>
              
              <button className="mt-8 h-12 px-8 rounded-2xl bg-[#0B1220] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all flex items-center gap-3 w-max group/btn">
                 Создать баннер 
                 <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-[#0B1220] to-[#050816] border border-white/5 rounded-[3rem] p-10 group relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full -z-0" />
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                  <Layers size={28} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase relative z-10">Предложить категорию</h3>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mt-3 relative z-10">Добавьте новую категорию для товаров</p>
              
              <button className="mt-8 h-12 px-8 rounded-2xl bg-[#0B1220] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all flex items-center gap-3 w-max group/btn">
                 Предложить 
                 <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-10">
          {/* Main Chart Widget */}
          <div className="bg-[#0B1220]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/5 blur-[100px] rounded-full -z-10" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tight uppercase">СТАТИСТИКА ПРОСМОТРОВ</h3>
              <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 shadow-lg shadow-green-500/5 tracking-widest">+12%</span>
            </div>
            <div className="mb-10">
              <span className="text-4xl font-black text-white tracking-tighter">9 854</span>
              <span className="ml-3 text-[10px] font-black text-white/30 uppercase tracking-widest">Просмотры</span>
            </div>
            <div className="h-[260px] w-full -ml-8">
              <ResponsiveContainer width="115%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#C5A059', fontWeight: '900', fontSize: '12px' }}
                    cursor={{ stroke: '#C5A059', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#C5A059" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorMain)" 
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-[#0B1220] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-black text-white tracking-tight uppercase">ПОСЛЕДНИЕ СООБЩЕНИЯ</h3>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 text-white/20">
                <MessageSquare size={20} />
              </div>
            </div>
            <div className="space-y-8">
              {[
                { from: 'Администрация', text: 'Ваш баннер успешно активирован', time: '10:30', unread: true },
                { from: 'Тех. поддержка', text: 'Спасибо! Мы обновили информацию.', time: 'Вчера', unread: true },
                { from: 'Администрация', text: 'Проверка завершена', time: '2 дня назад', unread: true },
              ].map((msg, i) => (
                <div key={i} className="flex gap-5 group cursor-pointer relative">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-amber-500/30 transition-all transform group-hover:scale-110">
                    <UserIcon size={20} className="text-white/40 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[14px] font-black text-white group-hover:text-amber-500 transition-colors">{msg.from}</h4>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{msg.time}</span>
                    </div>
                    <p className="text-[11px] font-black text-white/30 truncate mt-1">{msg.text}</p>
                  </div>
                  {msg.unread && (
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(245,158,11,1)]" />
                  )}
                </div>
              ))}
            </div>
            <button className="w-full mt-12 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-white/30 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 group">
              ВСЕ СООБЩЕНИЯ
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-amber-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
