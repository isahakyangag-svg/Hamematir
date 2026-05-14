import React, { useState, useRef } from 'react';
import { 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  CreditCard, 
  Zap, 
  Calendar, 
  Layout, 
  FileVideo, 
  ImageIcon,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const steps = [
  { id: 'upload', title: 'Контент', icon: Upload },
  { id: 'setup', title: 'Настройка', icon: Layout },
  { id: 'duration', title: 'Период', icon: Calendar },
  { id: 'payment', title: 'Оплата', icon: CreditCard },
];

const PartnerOrderBanner: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    link: '',
    duration: 30,
    type: 'image',
    size: 'top',
    price: 5000,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const sizes = [
    { id: 'top', label: 'Топ баннер', desc: 'Главная страница, сразу под меню', price: 5000 },
    { id: 'carousel', label: 'Карусель', desc: 'Основной слайдер на главной', price: 3500 },
    { id: 'sidebar', label: 'Боковая панель', desc: 'На страницах категорий и поиска', price: 2000 },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase text-center">Заказать баннер</h1>
        <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest text-center">Разместите вашу рекламу на главной площадке</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center justify-between px-10 mb-16 relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 -z-10" />
        {steps.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center gap-3 relative">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
              currentStep >= i 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-110" 
                : "bg-slate-900 text-slate-500 border border-white/10"
            )}>
              <step.icon size={20} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              currentStep >= i ? "text-indigo-400" : "text-slate-600"
            )}>
              {step.title}
            </span>
            {currentStep > i && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center border-4 border-[#0B0E14]">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Тип контента</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, type: 'image'})}
                    className={cn(
                      "flex items-center gap-4 p-6 rounded-2xl transition-all border",
                      formData.type === 'image' ? "bg-indigo-600/10 border-indigo-500/40 text-white" : "border-white/5 text-slate-500 hover:bg-white/5"
                    )}
                  >
                    <ImageIcon size={24} />
                    <div className="text-left">
                      <span className="block font-black text-sm">Изображение</span>
                      <span className="text-[10px] font-bold opacity-60">PNG, JPG, WEBP (до 5MB)</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, type: 'video'})}
                    className={cn(
                      "flex items-center gap-4 p-6 rounded-2xl transition-all border",
                      formData.type === 'video' ? "bg-indigo-600/10 border-indigo-500/40 text-white" : "border-white/5 text-slate-500 hover:bg-white/5"
                    )}
                  >
                    <FileVideo size={24} />
                    <div className="text-left">
                      <span className="block font-black text-sm">Видео</span>
                      <span className="text-[10px] font-bold opacity-60">MP4, MOV (до 20MB)</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Файл баннера</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-64 w-full rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 hover:bg-white/[0.02] transition-all overflow-hidden"
                >
                  {preview ? (
                    <div className="absolute inset-0 group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => {e.stopPropagation(); setPreview(null);}}
                          className="h-12 w-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl"
                        >
                          <X size={24} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <Upload size={32} />
                      </div>
                      <span className="text-sm font-black text-white">Перетащите файл или нажмите для загрузки</span>
                      <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Максимальное разрешение 1920x1080</span>
                    </>
                  )}
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Название кампании</label>
                  <input 
                    type="text" 
                    placeholder="Напр. Летняя акция 2024"
                    className="h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-bold text-white placeholder:text-slate-600 border border-white/5 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Категория</label>
                  <select 
                    className="h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-bold text-white border border-white/5 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="" disabled className="bg-slate-900">Выбрать категорию</option>
                    <option value="fashion" className="bg-slate-900">Мода и стиль</option>
                    <option value="auto" className="bg-slate-900">Автомобили</option>
                    <option value="travel" className="bg-slate-900">Путешествия</option>
                    <option value="electronics" className="bg-slate-900">Электроника</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Целевая ссылка</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/promo"
                    className="h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-bold text-white placeholder:text-slate-600 border border-white/5 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    value={formData.link}
                    onChange={e => setFormData({...formData, link: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Место размещения</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sizes.map((size) => (
                    <button 
                      key={size.id}
                      onClick={() => setFormData({...formData, size: size.id, price: size.price})}
                      className={cn(
                        "flex flex-col p-6 rounded-2xl transition-all border text-left",
                        formData.size === size.id ? "bg-indigo-600/10 border-indigo-500/40" : "border-white/5 hover:bg-white/5"
                      )}
                    >
                      <span className={cn("font-black text-sm", formData.size === size.id ? "text-white" : "text-slate-400")}>{size.label}</span>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">{size.desc}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-400">{size.price} ₽</span>
                        {formData.size === size.id && <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center"><CheckCircle2 size={10} className="text-white" /></div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Выберите длительность</h3>
                <p className="text-sm font-bold text-slate-500">Чем больше период, тем больше скидка</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { days: 7, label: '1 неделя', discount: 0 },
                  { days: 30, label: '1 месяц', discount: 10 },
                  { days: 90, label: '3 месяца', discount: 20 },
                  { days: 365, label: '1 год', discount: 40 },
                ].map((p) => (
                  <button 
                    key={p.days}
                    onClick={() => setFormData({...formData, duration: p.days})}
                    className={cn(
                      "p-8 rounded-3xl border transition-all flex flex-col items-center gap-2",
                      formData.duration === p.days ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className="text-3xl font-black">{p.days}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                    {p.discount > 0 && <span className={cn("text-[8px] font-black uppercase py-1 px-2 rounded-lg mt-2", formData.duration === p.days ? "bg-white/20" : "bg-green-500/20 text-green-400")}>-{p.discount}%</span>}
                  </button>
                ))}
              </div>

              <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Итог размещения</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {Math.round(formData.price * (formData.duration / 7) * (1 - (formData.duration > 30 ? 0.2 : formData.duration > 7 ? 0.1 : 0))).toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-indigo-400">₽</span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-400">Будет активно до</span>
                  <span className="text-lg font-black text-white mt-1">12 июня 2024</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-green-500/20 text-green-500 flex items-center justify-center mb-8 shadow-2xl shadow-green-500/10">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight text-center">Все готово к оплате!</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 text-center max-w-md">Ваша заявка будет отправлена на модерацию сразу после подтверждения транзакции</p>
              
              <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-6 rounded-3xl bg-[#635BFF] text-white hover:bg-[#5249FF] transition-all group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <CreditCard size={28} />
                  <div className="text-left relative">
                    <span className="block font-black text-sm lowercase tracking-tighter text-white/60">Pay with</span>
                    <span className="text-xl font-black italic tracking-tighter">Stripe</span>
                  </div>
                </button>
                <button className="flex items-center gap-4 p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 transition-all">
                  <Zap size={28} fill="currentColor" />
                  <div className="text-left">
                    <span className="block font-black text-sm">Crypto Payment</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">BTC, ETH, USDT</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
              currentStep === 0 ? "opacity-0 invisible" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <ChevronLeft size={18} strokeWidth={3} />
            Назад
          </button>

          {currentStep < steps.length - 1 ? (
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/30 group"
            >
              Далее
              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/partner/banners')}
              className="px-10 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
            >
              Готово
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerOrderBanner;
