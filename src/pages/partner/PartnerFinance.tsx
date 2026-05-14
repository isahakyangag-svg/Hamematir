import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  Wallet, 
  FileText, 
  ChevronRight, 
  Download,
  Filter,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const PartnerFinance: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const transactions = [
    { id: 'TX12345', type: 'payment', amount: -5000, desc: 'Оплата баннера "Магазин одежды"', date: '12.05.2024, 14:20', status: 'completed' },
    { id: 'TX12346', type: 'deposit', amount: 15000, desc: 'Пополнение баланса (Stripe)', date: '11.05.2024, 09:15', status: 'completed' },
    { id: 'TX12347', type: 'payment', amount: -3500, desc: 'Оплата баннера "Аренда авто"', date: '10.05.2024, 18:45', status: 'completed' },
    { id: 'TX12348', type: 'withdrawal', amount: -2000, desc: 'Вывод средств на карту **** 4492', date: '08.05.2024, 12:00', status: 'pending' },
    { id: 'TX12349', type: 'deposit', amount: 8000, desc: 'Пополнение баланса (Crypto)', date: '05.05.2024, 21:30', status: 'completed' },
    { id: 'TX12350', type: 'payment', amount: -2000, desc: 'Оплата баннера "Travel Promo"', date: '01.05.2024, 11:10', status: 'failed' },
  ];

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'completed': return { label: 'Выполнено', color: 'bg-green-500/10 text-green-400', icon: CheckCircle2 };
      case 'pending': return { label: 'В обработке', color: 'bg-blue-500/10 text-blue-400', icon: Clock };
      case 'failed': return { label: 'Ошибка', color: 'bg-rose-500/10 text-rose-400', icon: XCircle };
      default: return { label: status, color: 'bg-gray-500/10 text-gray-400', icon: Clock };
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Финансы</h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Управление балансом и платежами</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-white text-black px-6 py-3.5 font-black text-xs uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all shadow-xl">
            <Plus size={16} strokeWidth={3} />
            Пополнить
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 text-white border border-white/10 px-6 py-3.5 font-black text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all outline-none">
            Вывести
          </button>
        </div>
      </header>

      {/* Finance Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Balance Card */}
        <div className="xl:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-800 p-10 shadow-2xl group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
            <div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Текущий баланс</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h2 className="text-6xl font-black text-white tracking-tighter">12 450</h2>
                <span className="text-2xl font-bold text-white/60">₽</span>
              </div>
              <div className="mt-8 flex items-center gap-10">
                <div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Доход за месяц</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-black text-white">+45 000 ₽</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                      <ArrowUpRight size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Расходы на рекламу</span>
                  <div className="flex items-center gap-2 mt-1 text-red-500">
                    <span className="text-lg font-black text-white/90">-8 500 ₽</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                      <ArrowDownLeft size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between items-end gap-6 self-stretch">
               <div className="flex items-center gap-3">
                  <div className="h-12 w-20 rounded-xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 italic font-black text-white text-sm tracking-tighter">VISA</div>
                  <div className="h-12 w-20 rounded-xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 italic font-black text-white text-sm tracking-tighter">MASTERCARD</div>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">ID Аккаунта</span>
                  <p className="text-sm font-mono font-bold text-white/80 mt-1 uppercase">P-8039-F7B1</p>
               </div>
            </div>
          </div>
        </div>

        {/* Small Widgets */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <CreditCard size={18} />
              </div>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">История счетов</h4>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Скачивайте PDF инвойсы</p>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <FileText size={18} />
              </div>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Подписки</h4>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Активные тарифные планы</p>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Последние транзакции</h3>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">История всех финансовых операций</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl">
               {['all', 'deposit', 'withdrawal', 'payment'].map(f => (
                 <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-slate-200"
                  )}
                 >
                   {f === 'all' ? 'Все' : f === 'deposit' ? 'Приход' : f === 'withdrawal' ? 'Вывод' : 'Расход'}
                 </button>
               ))}
             </div>
             <button className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
               <Download size={18} />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 pb-4">
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Транзакция</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Описание</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Тип</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Дата</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Сумма</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.filter(t => filter === 'all' || t.type === filter).map((tx, i) => {
                const status = getStatusInfo(tx.status);
                return (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-5">
                      <span className="text-xs font-mono font-bold text-slate-400">{tx.id}</span>
                    </td>
                    <td className="py-5">
                      <span className="text-sm font-bold text-white tracking-tight">{tx.desc}</span>
                    </td>
                    <td className="py-5 pl-2">
                       {tx.type === 'deposit' ? (
                         <div className="flex items-center gap-2 text-green-400 font-black text-[10px] uppercase tracking-tighter">
                           <ArrowDownLeft size={14} strokeWidth={3} /> Deposit
                         </div>
                       ) : tx.type === 'withdrawal' ? (
                         <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-tighter">
                           <ArrowUpRight size={14} strokeWidth={3} /> Withdraw
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-tighter">
                           <CreditCard size={14} strokeWidth={3} /> Payment
                         </div>
                       )}
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-bold text-slate-500">{tx.date}</span>
                    </td>
                    <td className="py-5 text-right font-mono font-black">
                       <span className={cn(
                         "text-sm uppercase",
                         tx.amount > 0 ? "text-green-400" : "text-white"
                       )}>
                         {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} ₽
                       </span>
                    </td>
                    <td className="py-5 text-right pl-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter", status.color)}>
                        <status.icon size={11} strokeWidth={3} />
                        {status.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {transactions.length > 5 && (
          <button className="w-full mt-8 py-3 rounded-xl border border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">
            Загрузить еще
          </button>
        )}
      </div>
    </div>
  );
};

export default PartnerFinance;
