import React, { useEffect, useState } from 'react';
import { Megaphone, Target, MousePointer2, PieChart, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Advertising: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const currentLang = i18n.language || 'ru';
  const [customContent, setCustomContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'content_pages', 'advertising'));
        if (docSnap.exists()) {
          setCustomContent(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching advertising content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) return null;

  if (customContent) {
    const title = customContent[`title_${currentLang}`] || customContent.title;
    const content = customContent[`content_${currentLang}`] || customContent.content;

    return (
      <div className="relative min-h-screen bg-white">
        {isAdmin && (
          <div className="sticky top-20 z-40 bg-orange-600 p-3 text-center">
            <Link 
              to="/page/advertising?edit=true" 
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-sm font-black text-orange-600 hover:bg-orange-50 transition-all shadow-xl"
            >
              <Edit3 size={16} />
              Редактировать в Professional Editor
            </Link>
          </div>
        )}
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <h1 className="text-6xl font-black tracking-tighter text-gray-900 mb-12 md:text-7xl leading-tight">
            {title}
          </h1>
          <article 
            className="prose prose-lg prose-orange max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900
              prose-p:leading-relaxed prose-p:text-gray-600
              prose-img:rounded-[40px] prose-img:shadow-2xl"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isAdmin && (
        <div className="sticky top-20 z-40 bg-orange-600 p-3 text-center">
          <Link 
            to="/page/advertising?edit=true" 
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-sm font-black text-orange-600 hover:bg-orange-50 transition-all shadow-xl"
          >
            <Edit3 size={16} />
            Создать кастомную версию страницы
          </Link>
        </div>
      )}
      <div className="space-y-16 py-12">

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
         <div className="rounded-3xl border border-gray-100 bg-white p-10">
            <h3 className="text-2xl font-black text-gray-900">Banner Ads</h3>
            <p className="mt-4 text-gray-500">Premium placement on our home page and search results. High visibility for new launches or sales.</p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <Target className="text-orange-600" size={18} />
                Strategic placement
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <MousePointer2 className="text-orange-600" size={18} />
                High Click-Through Rate
              </li>
            </ul>
            <div className="mt-10 rounded-2xl bg-orange-50 p-6">
               <p className="text-xs font-black uppercase tracking-widest text-orange-600">Starting from</p>
               <p className="mt-1 text-3xl font-black text-gray-900">֏ 25,000 <span className="text-sm font-bold text-gray-400">/ week</span></p>
            </div>
         </div>

         <div className="rounded-3xl border border-gray-100 bg-white p-10">
            <h3 className="text-2xl font-black text-gray-900">Promoted Products</h3>
            <p className="mt-4 text-gray-500">Boost your products to the top of search results. Pay only for actual performance and conversions.</p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <Target className="text-orange-600" size={18} />
                Search result priority
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <PieChart className="text-orange-600" size={18} />
                Detailed ROI reports
              </li>
            </ul>
            <div className="mt-10 rounded-2xl bg-orange-50 p-6">
               <p className="text-xs font-black uppercase tracking-widest text-orange-600">Starting from</p>
               <p className="mt-1 text-3xl font-black text-gray-900">֏ 5,000 <span className="text-sm font-bold text-gray-400">/ campaign</span></p>
            </div>
         </div>
      </div>
      </div>
    </div>
  );
};

export default Advertising;
