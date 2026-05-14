import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Edit3, 
  Save, 
  X, 
  Type, 
  CheckCircle2,
  Globe,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Palette,
  Undo,
  Redo,
  CornerUpLeft,
  CornerUpRight,
  Layout,
  LayoutGrid,
  Video,
  FileText,
  Play,
  Monitor,
  MousePointer,
  BarChart,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import ImageResizer from 'tiptap-extension-resize-image';
import LinkExtension from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Youtube from '@tiptap/extension-youtube';
import { Node } from '@tiptap/core';

const Div = Node.create({
  name: 'div',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      class: { default: null },
      style: { default: null },
    };
  },
});

type Language = 'am' | 'ru' | 'en';

const CustomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'ru';
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState<Language>('ru');
  
  // Multilingual data
  const [titles, setTitles] = useState<Record<Language, string>>({ am: '', ru: '', en: '' });
  const [contents, setContents] = useState<Record<Language, string>>({ am: '', ru: '', en: '' });
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Template Library
  const templates = useMemo(() => [
    {
      id: 'video-block',
      name: 'Видео Блок',
      icon: Play,
      description: 'Центрированное видео с заголовком',
      html: `
        <div class="py-12 space-y-8 text-center">
          <h2 class="text-4xl font-black text-gray-900 tracking-tight">Посмотрите, как это работает</h2>
          <div class="aspect-video w-full max-w-4xl mx-auto rounded-[48px] overflow-hidden shadow-2xl border-8 border-white bg-gray-100">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <p class="text-gray-500 font-bold">Узнайте о всех преимуществах нашей платформы за 2 минуты</p>
        </div>
      `
    },
    {
      id: 'animated-hero',
      name: 'Анимированный Заголовок',
      icon: Monitor,
      description: 'Блок с пульсирующей анимацией и акцентом',
      html: `
        <div class="relative py-24 overflow-hidden rounded-[60px] bg-gradient-to-br from-blue-600 to-indigo-900 text-white p-12 mb-16 shadow-2xl shadow-blue-200">
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div class="relative z-10 text-center space-y-8">
            <div class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest animate-bounce">
              <span class="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
              Новое предложение
            </div>
            <h1 class="text-6xl font-black tracking-tighter leading-tight max-w-3xl mx-auto">
              Будущее ритейла в <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Армении</span> уже здесь
            </h1>
            <p class="text-xl text-blue-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
              Мы создали экосистему, которая объединяет покупателей и продавцов с помощью технологий завтрашнего дня.
            </p>
            <div class="pt-6">
               <button class="bg-white text-blue-600 px-12 py-5 rounded-[24px] font-black text-lg shadow-xl hover:scale-105 transition-all">Начать сейчас</button>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'pricing-grid',
      name: 'Таблица Тарифов',
      icon: LayoutGrid,
      description: '3 колонки с ценами и кнопками',
      html: `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          <div class="p-10 bg-white border border-gray-100 rounded-[48px] shadow-sm hover:shadow-xl transition-all flex flex-col">
             <h3 class="text-xl font-black text-gray-500 uppercase tracking-widest mb-2">Старт</h3>
             <div class="text-4xl font-black text-gray-900 mb-6">Бесплатно</div>
             <ul class="space-y-4 mb-10 flex-1">
                <li class="flex items-center gap-2 font-bold text-gray-600"><span class="text-green-500">✓</span> До 100 товаров</li>
                <li class="flex items-center gap-2 font-bold text-gray-600"><span class="text-green-500">✓</span> Базовая аналитика</li>
             </ul>
             <button class="w-full py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-900 hover:bg-gray-50 transition-all">Выбрать</button>
          </div>
          <div class="p-10 bg-blue-600 border border-blue-500 rounded-[48px] shadow-2xl shadow-blue-200 text-white flex flex-col scale-110 relative z-10">
             <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Популярно</div>
             <h3 class="text-xl font-black text-blue-100 uppercase tracking-widest mb-2">Бизнес</h3>
             <div class="text-4xl font-black mb-6">֏ 15,000 <span class="text-sm opacity-60">/мес</span></div>
             <ul class="space-y-4 mb-10 flex-1">
                <li class="flex items-center gap-2 font-bold text-blue-50"><span class="text-orange-400">✓</span> Безлимит товаров</li>
                <li class="flex items-center gap-2 font-bold text-blue-50"><span class="text-orange-400">✓</span> Pro Аналитика</li>
                <li class="flex items-center gap-2 font-bold text-blue-50"><span class="text-orange-400">✓</span> Поддержка 24/7</li>
             </ul>
             <button class="w-full py-4 rounded-2xl bg-white text-blue-600 font-black shadow-xl hover:scale-105 transition-all">Выбрать</button>
          </div>
          <div class="p-10 bg-white border border-gray-100 rounded-[48px] shadow-sm hover:shadow-xl transition-all flex flex-col">
             <h3 class="text-xl font-black text-gray-500 uppercase tracking-widest mb-2">Корпорация</h3>
             <div class="text-4xl font-black text-gray-900 mb-6">Custom</div>
             <ul class="space-y-4 mb-10 flex-1">
                <li class="flex items-center gap-2 font-bold text-gray-600"><span class="text-green-500">✓</span> API интеграция</li>
                <li class="flex items-center gap-2 font-bold text-gray-600"><span class="text-green-500">✓</span> Персональный менеджер</li>
             </ul>
             <button class="w-full py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-900 hover:bg-gray-50 transition-all">Связаться</button>
          </div>
        </div>
      `
    },
    {
       id: 'faq-block',
       name: 'Блок Вопросов (FAQ)',
       icon: FileText,
       description: 'Раздел с часто задаваемыми вопросами',
       html: `
         <div class="py-16 bg-slate-50 rounded-[48px] px-12 my-12">
            <div class="max-w-3xl mx-auto space-y-12">
               <div class="text-center">
                  <h2 class="text-4xl font-black text-slate-900 tracking-tighter">Часто задаваемые вопросы</h2>
                  <p class="text-slate-500 font-bold mt-2">Все, что вы хотели знать о партнерстве</p>
               </div>
               <div class="space-y-6">
                  <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                     <h4 class="text-xl font-black text-slate-900 mb-3">Как долго длится модерация?</h4>
                     <p class="text-slate-500 font-bold leading-relaxed">Обычно мы проверяем вашу заявку в течение 24 часов в рабочие дни. Наша команда изучает ваш каталог и связывается с вами.</p>
                  </div>
                  <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                     <h4 class="text-xl font-black text-slate-900 mb-3">Какие документы необходимы?</h4>
                     <p class="text-slate-500 font-bold leading-relaxed">Для начала работы достаточно ИНН и свидетельства о регистрации компании или ИП в Армении. Мы работаем только с официально зарегистрированным бизнесом.</p>
                  </div>
               </div>
            </div>
         </div>
       `
    },
    {
       id: 'stats-counter',
       name: 'Счетчики Статистики',
       icon: BarChart,
       description: 'Блок с крупными цифрами',
       html: `
         <div class="flex flex-wrap items-center justify-center gap-16 py-20 text-center">
            <div class="space-y-3 group hover:scale-110 transition-transform">
               <div class="text-7xl font-black text-blue-600 tracking-tighter shadow-sm">150+</div>
               <div class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Активных магазинов</div>
            </div>
            <div class="space-y-3 group hover:scale-110 transition-transform">
               <div class="text-7xl font-black text-indigo-600 tracking-tighter shadow-sm">50K+</div>
               <div class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Товаров в каталоге</div>
            </div>
            <div class="space-y-3 group hover:scale-110 transition-transform">
               <div class="text-7xl font-black text-orange-500 tracking-tighter shadow-sm">10K+</div>
               <div class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Посетителей в день</div>
            </div>
         </div>
       `
    },
    {
      id: 'video-text-split',
      name: 'Видео + Текст',
      icon: Monitor,
      description: 'Видео слева, описание справа',
      html: `
        <div class="flex flex-col lg:flex-row items-center gap-12 py-16">
          <div class="flex-1 aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group w-full">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="flex-1 space-y-6 text-left">
            <h3 class="text-4xl font-black text-slate-900 leading-tight tracking-tighter">Ваш бизнес в видео-формате</h3>
            <p class="text-lg text-slate-500 font-bold leading-relaxed">Интегрируйте видео-презентации прямо на ваши страницы, чтобы повысить доверие клиентов и увеличить конверсию в 2 раза.</p>
            <div class="pt-4">
               <a href="#" class="no-underline inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">Смотреть демо</a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'cta-primary',
      name: 'Основная Кнопка',
      icon: Zap,
      description: 'Центрированная кнопка действия в стиле Армении',
      html: `
        <div class="flex justify-center py-8">
          <a href="/partnership" class="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-blue-200 hover:scale-105 transition-all no-underline">
            Присоединиться к программе
          </a>
        </div>
      `
    },
    {
      id: 'feature-grid',
      name: 'Сетка Преимуществ',
      icon: LayoutGrid,
      description: '3 колонки с иконками и описанием',
      html: `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <div class="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
             <div class="h-14 w-14 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.71-2.13.09-3.05a3.91 3.91 0 0 0-3.09-1.45Z"/><path d="M18.41 2C13.84 2 10 5.84 10 10.41c0 .4.07.8.19 1.19l-7.39 7.45.13 1.13 1.13.14 7.46-7.39c.39.13.79.2 1.2.2a8.41 8.41 0 0 0 7.08-12.87Z"/><path d="M16 8c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2Z"/></svg>
             </div>
             <h3 class="text-xl font-black text-gray-900 mb-2">Рост Видимости</h3>
             <p class="text-gray-500 font-bold leading-relaxed">Покажите ваши товары тысячам ежедневных посетителей нашего портала.</p>
          </div>
          <div class="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
             <div class="h-14 w-14 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
             </div>
             <h3 class="text-xl font-black text-gray-900 mb-2">Аналитика в Режиме Реального Времени</h3>
             <p class="text-gray-500 font-bold leading-relaxed">Отслеживайте эффективность ваших продаж и конкурентоспособность цен.</p>
          </div>
          <div class="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
             <div class="h-14 w-14 bg-purple-50 text-purple-600 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
             </div>
             <h3 class="text-xl font-black text-gray-900 mb-2">Расширение Охвата</h3>
             <p class="text-gray-500 font-bold leading-relaxed">Привлекайте клиентов из всех регионов Армении и за её пределами.</p>
          </div>
        </div>
      `
    },
    {
      id: 'dark-cta-form',
      name: 'Блок Запроса (Темный)',
      icon: FileText,
      description: 'Нижний блок с призывом и полем ввода',
      html: `
        <div class="bg-gray-900 rounded-[48px] p-12 text-white my-16 shadow-3xl shadow-blue-900/20">
          <div class="flex flex-col md:flex-row items-center justify-between gap-12">
            <div class="max-w-xl">
              <h2 class="text-4xl font-black mb-4 tracking-tighter">Готовы к масштабированию?</h2>
              <p class="text-gray-400 text-lg font-medium">Заполните форму партнерства, и наша команда свяжется с вами в течение 24 часов.</p>
            </div>
            <div class="w-full md:max-w-md bg-white/5 p-8 rounded-[32px] border border-white/10 backdrop-blur-sm">
              <div class="space-y-4">
                <input type="email" placeholder="Ваш Email" class="w-full bg-white/10 border-none rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95">Отправить запрос</button>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'info-card-left',
      name: 'Карточка с текстом (Слева)',
      icon: AlignLeft,
      description: 'Текст слева, место под фото/акцент справа',
      html: `
        <div class="flex flex-col md:flex-row items-center gap-12 py-12">
          <div class="flex-1 space-y-6">
            <div class="inline-flex bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">Премиум статус</div>
            <h2 class="text-4xl font-black text-gray-900 leading-tight">Система управления, которая работает на вас</h2>
            <p class="text-lg text-gray-600 font-medium leading-relaxed">Мы автоматизировали все процессы сбора данных, чтобы вы могли сосредоточиться на главном — на развитии своего бизнеса.</p>
            <ul class="space-y-4">
              <li class="flex items-center gap-3 font-bold text-gray-700">
                <div class="h-6 w-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                Автоматическое обновление остатков
              </li>
              <li class="flex items-center gap-3 font-bold text-gray-700">
                <div class="h-6 w-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                Мониторинг цен конкурентов 24/7
              </li>
            </ul>
          </div>
          <div class="flex-1 w-full h-[400px] bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200 flex items-center justify-center group overflow-hidden">
             <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
        </div>
      `
    }
  ], []);

  // Tiptap Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          HTMLAttributes: {
             class: 'font-black tracking-tight',
          },
        },
        paragraph: {
          HTMLAttributes: {
             class: 'leading-relaxed',
          },
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        allowFullscreen: true,
        HTMLAttributes: {
          class: 'aspect-video w-full rounded-[48px] shadow-2xl my-10 border-8 border-white',
        },
      }),
      Div,
      Underline,
      TextStyle,
      Color,
      ImageResizer.configure({
        HTMLAttributes: {
          class: 'rounded-[40px] shadow-2xl my-10 max-w-full transition-all duration-300',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 transition-colors',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      BubbleMenuExtension.configure({
        pluginKey: 'imageBubbleMenu',
      }),
    ],
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
           // Handle file drops if needed later
           return false;
        }
        return false;
      },
    },
    content: contents[activeTab],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContents(prev => ({ ...prev, [activeTab]: html }));
    },
  });

  // Sync editor content when switching tabs
  useEffect(() => {
    if (editor && isEditing) {
      editor.commands.setContent(contents[activeTab] || '');
    }
  }, [activeTab, isEditing, editor]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const pSnap = await getDoc(doc(db, 'content_pages', id));
        if (pSnap.exists()) {
          const data = pSnap.data();
          setPage(data);
          
          const initialTitles = {
            am: data.title_am || data.title || '',
            ru: data.title_ru || data.title || '',
            en: data.title_en || data.title || ''
          };
          
          const initialContents = {
            am: data.content_am || data.content || '',
            ru: data.content_ru || data.content || '',
            en: data.content_en || data.content || ''
          };

          setTitles(initialTitles);
          setContents(initialContents);
          
          if (editor) {
            editor.commands.setContent(initialContents[activeTab] || '');
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `content_pages/${id}`);
      }
      setLoading(false);
    };
    fetchPage();
    window.scrollTo(0, 0);
  }, [id, editor]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updates = {
        title_am: titles.am,
        title_ru: titles.ru,
        title_en: titles.en,
        content_am: contents.am,
        content_ru: contents.ru,
        content_en: contents.en,
        title: titles.ru || titles.am || titles.en,
        content: contents.ru || contents.am || contents.en,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'content_pages', id), updates);
      setPage({ ...page, ...updates, updatedAt: { toDate: () => new Date() } });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `content_pages/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-black text-gray-900">Страница не найдена</h1>
        <p className="mt-4 text-gray-500">К сожалению, такой страницы не существует.</p>
        <Link to="/" className="mt-8 inline-block rounded-xl bg-blue-600 px-8 py-4 font-black text-white">Вернуться на главную</Link>
      </div>
    );
  }

  const currentTitle = titles[currentLang as Language] || titles.ru || titles.am || titles.en || page.title;
  const currentContent = contents[currentLang as Language] || contents.ru || contents.am || contents.en || page.content;

  const MenuBar = () => {
    if (!editor) return null;

    const addVideo = (e: React.MouseEvent) => {
      e.preventDefault();
      const url = window.prompt("Введите URL видео (YouTube):", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      if (url) {
        editor.commands.setYoutubeVideo({
          src: url,
          width: 640,
          height: 480,
        });
      }
    };

    const addImage = (e: React.MouseEvent) => {
      e.preventDefault();
      const url = window.prompt("Введите URL изображения:", "https://images.unsplash.com/photo-1542291026-7eec264c27ff");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    };

    const addLink = (e: React.MouseEvent) => {
      e.preventDefault();
      const url = window.prompt("Введите URL ссылки:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    const CommandButton = ({ onClick, icon: Icon, active = false, label = "" }: any) => (
      <button
        type="button"
        onMouseDown={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-500 hover:bg-gray-100 hover:text-blue-600 shadow-sm bg-white"
        )}
        title={label}
      >
        <Icon size={18} />
      </button>
    );

    return (
      <div className="sticky top-24 z-40 flex flex-wrap items-center gap-1.5 rounded-2xl border border-gray-200 bg-white/80 p-2 backdrop-blur-md shadow-lg">
        <div className="flex gap-1 border-r pr-2">
          <CommandButton onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} active={editor.isActive('bold')} label="Жирный" />
          <CommandButton onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} active={editor.isActive('italic')} label="Курсив" />
          <CommandButton onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} active={editor.isActive('underline')} label="Подчеркнутый" />
        </div>
        
        <div className="flex gap-1 border-r px-2">
          <CommandButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} active={editor.isActive('heading', { level: 1 })} label="Заголовок 1" />
          <CommandButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} active={editor.isActive('heading', { level: 2 })} label="Заголовок 2" />
          <CommandButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} active={editor.isActive('heading', { level: 3 })} label="Заголовок 3" />
        </div>

        <div className="flex gap-1 border-r px-2">
          <CommandButton onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} active={editor.isActive('bulletList')} label="Список" />
          <CommandButton onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} active={editor.isActive('orderedList')} label="Нумерованный список" />
        </div>

        <div className="flex gap-1 border-r px-2">
          <CommandButton onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} label="По левому краю" />
          <CommandButton onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} label="По центру" />
          <CommandButton onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} label="По правому краю" />
        </div>

        <div className="flex gap-1 border-r px-2">
          <CommandButton onClick={addLink} icon={LinkIcon} active={editor.isActive('link')} label="Вставить ссылку" />
          <CommandButton onClick={addImage} icon={ImageIcon} label="Вставить фото" />
          <CommandButton onClick={addVideo} icon={Video} label="Вставить видео" />
        </div>

        <div className="flex gap-1 px-2">
          <CommandButton onClick={() => editor.chain().focus().undo().run()} icon={CornerUpLeft} label="Назад" />
          <CommandButton onClick={() => editor.chain().focus().redo().run()} icon={CornerUpRight} label="Вперед" />
        </div>

        <div className="flex gap-1 border-l px-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
          >
            <Layout size={16} />
            Блоки
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 px-2">
            <div className="flex h-10 items-center gap-2 rounded-xl bg-white px-3 shadow-inner border border-gray-100">
                <Palette size={16} className="text-gray-400" />
                <input 
                    type="color" 
                    onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
                    className="h-6 w-6 cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0"
                    title="Цвет текста"
                />
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Admin Floating Bar */}
      {isAdmin && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-100 bg-white/95 p-4 backdrop-blur-xl shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <Globe size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Система управления контентом</span>
              <h4 className="text-sm font-black text-gray-900">Мультиязычный редактор Professional</h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '...' : (
                    <>
                      <Save size={16} />
                      Сохранить всё
                    </>
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-black text-white transition-all hover:bg-black"
              >
                <Edit3 size={16} />
                Редактировать
              </button>
            )}
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-5xl px-4 py-16"
      >
        {!isEditing && (
          <Link to="/" className="mb-10 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-blue-600">
            <ChevronLeft size={16} />
            Назад на главную
          </Link>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-12">
            {/* Language Tabs - Fixed Position */}
            <div className="flex items-center justify-center gap-1 self-center rounded-2xl bg-gray-100 p-1.5 shadow-inner">
              {[
                { id: 'am', label: 'Հայերեն', flag: 'AM' },
                { id: 'ru', label: 'Русский', flag: 'RU' },
                { id: 'en', label: 'English', flag: 'US' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveTab(lang.id as Language)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all",
                    activeTab === lang.id 
                      ? "bg-white text-blue-600 shadow-md" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span className="text-[10px] opacity-40">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              <div>
                <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 opacity-60">Заголовок страницы ({activeTab.toUpperCase()})</label>
                <input 
                  type="text" 
                  value={titles[activeTab]}
                  onChange={(e) => setTitles({ ...titles, [activeTab]: e.target.value })}
                  className="w-full rounded-3xl bg-gray-50 p-8 text-5xl font-black leading-tight tracking-tighter text-gray-900 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-50 transition-all border border-gray-100"
                  placeholder={`Введите заголовок на ${activeTab}...`}
                />
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 opacity-60">Контент ({activeTab.toUpperCase()})</label>
                <MenuBar />
                <div className="min-h-[700px] overflow-hidden rounded-[40px] border border-gray-100 bg-white p-12 shadow-2xl shadow-blue-900/5 ring-1 ring-gray-100">
                  {editor && (
                    <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive('image')}>
                      <div className="flex items-center gap-1 overflow-hidden rounded-xl bg-white p-1 shadow-2xl ring-1 ring-gray-100">
                         <button 
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={cn("p-2 rounded-lg transition-colors", editor.isActive({ textAlign: 'left' }) ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500")}
                         >
                            <AlignLeft size={16} />
                         </button>
                         <button 
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={cn("p-2 rounded-lg transition-colors", editor.isActive({ textAlign: 'center' }) ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500")}
                         >
                            <AlignCenter size={16} />
                         </button>
                         <button 
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={cn("p-2 rounded-lg transition-colors", editor.isActive({ textAlign: 'right' }) ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500")}
                         >
                            <AlignRight size={16} />
                         </button>
                      </div>
                    </BubbleMenu>
                  )}
                  <EditorContent editor={editor} className="prose prose-lg prose-blue max-w-none focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-16">
              <h1 className="text-5xl font-black leading-tight tracking-tighter text-gray-900 md:text-7xl">
                {currentTitle}
              </h1>
              
              <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-gray-100 pb-8 text-xs font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  <span>Обновлено: {page.updatedAt?.toDate ? new Intl.DateTimeFormat('ru-RU').format(page.updatedAt.toDate()) : 'Недавно'}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Globe size={14} />
                  <span>Доступно на 3 языках</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span>Официальная страница</span>
                </div>
              </div>
            </header>

            <article 
              className="prose prose-lg prose-blue max-w-none 
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900
                prose-p:leading-relaxed prose-p:text-gray-600
                prose-img:rounded-[40px] prose-img:shadow-2xl prose-img:shadow-blue-100"
              dangerouslySetInnerHTML={{ __html: currentContent }} 
            />
          </>
        )}
      </motion.div>
      
      {/* Template Library Modal */}
      <AnimatePresence>
        {showTemplates && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[3rem] bg-white shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Библиотека Блоков Professional</h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Выберите готовый блок для вставки на страницу</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTemplates(false)}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:shadow-md transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      editor?.chain().focus().insertContent(template.html).run();
                      setShowTemplates(false);
                    }}
                    className="group flex items-start gap-5 rounded-[2.5rem] border border-gray-100 bg-white p-6 text-left transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50"
                  >
                    <div className="h-16 w-16 shrink-0 bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                      <template.icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm font-bold text-gray-500 mb-4">{template.description}</p>
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-60">
                        Нажмите чтобы вставить
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-8 border-t border-gray-100 text-center bg-gray-50/30">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Блоки используют Tailwind CSS для идеального отображения на всех устройствах.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-2xl z-[100]"
          >
            <CheckCircle2 className="animate-bounce" />
            Успешно сохранено!
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ProseMirror {
          min-height: 600px;
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img {
            transition: all 0.3s ease;
            cursor: pointer;
            display: inline-block; /* Allow alignment to work on parent or self */
        }
        .ProseMirror img.ProseMirror-selectednode {
            outline: 6px solid #2563eb;
            box-shadow: 0 0 0 12px rgba(37, 99, 235, 0.1);
        }
        /* Handle alignment for images in editor and rendered content */
        .prose img[style*="text-align: center"],
        .prose [style*="text-align: center"] img,
        .ProseMirror img[style*="text-align: center"],
        .ProseMirror [style*="text-align: center"] img {
          margin-left: auto !important;
          margin-right: auto !important;
          display: block !important;
        }
        .prose img[style*="text-align: right"],
        .prose [style*="text-align: right"] img,
        .ProseMirror img[style*="text-align: right"],
        .ProseMirror [style*="text-align: right"] img {
          margin-left: auto !important;
          margin-right: 0 !important;
          display: block !important;
        }
        .prose img[style*="text-align: left"],
        .prose [style*="text-align: left"] img,
        .ProseMirror img[style*="text-align: left"],
        .ProseMirror [style*="text-align: left"] img {
          margin-left: 0 !important;
          margin-right: auto !important;
          display: block !important;
        }
        /* Image resizing handles */
        .ProseMirror .image-resizer {
            position: relative;
            display: inline-block;
            line-height: 0;
        }
        .ProseMirror h1 { font-size: 3.75rem; font-weight: 900; margin-top: 3rem; margin-bottom: 2rem; letter-spacing: -0.05em; }
        .ProseMirror h2 { font-size: 2.25rem; font-weight: 900; margin-top: 2.5rem; margin-bottom: 1.5rem; letter-spacing: -0.025em; }
        .ProseMirror h3 { font-size: 1.5rem; font-weight: 900; margin-top: 2rem; margin-bottom: 1rem; }
        .ProseMirror p { line-height: 1.8; color: #4b5563; margin-bottom: 1.5rem; }
      `}</style>
    </div>
  );
};

export default CustomPage;

