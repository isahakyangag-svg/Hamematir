import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, BarChart, Rocket, Globe, Edit3 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Partnership: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const currentLang = i18n.language || 'ru';
  const [customContent, setCustomContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'content_pages', 'partnership'));
        if (docSnap.exists()) {
          setCustomContent(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching partnership content:", err);
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
          <div className="sticky top-20 z-40 bg-indigo-600 p-3 text-center">
            <Link 
              to="/page/partnership?edit=true" 
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-all shadow-xl"
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
            className="prose prose-lg prose-blue max-w-none 
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
        <div className="sticky top-20 z-40 bg-indigo-600 p-3 text-center">
          <Link 
            to="/page/partnership?edit=true" 
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-all shadow-xl"
          >
            <Edit3 size={16} />
            Создать кастомную версию страницы
          </Link>
        </div>
      )}
      <div className="space-y-16 py-12">
      <section className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-gray-900 md:text-6xl">
          Grow your sales with <span className="text-blue-600">Համեմատիր</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500">
          Join Armenia's leading price comparison platform and get your products seen by thousands of ready-to-buy customers.
        </p>
        <button className="mt-10 rounded-2xl bg-blue-600 px-10 py-4 text-lg font-black text-white shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95">
          Join Partner Program
        </button>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {[
          { icon: Rocket, title: 'Boost Visibility', desc: 'Get your products in front of thousands of daily visitors.' },
          { icon: BarChart, title: 'Real-time Analytics', desc: 'Track your performance and price competitiveness.' },
          { icon: Globe, title: 'Expanded Reach', desc: 'Reach customers across all regions of Armenia and beyond.' },
        ].map((feat, i) => (
          <div key={i} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <feat.icon size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900">{feat.title}</h3>
            <p className="mt-2 font-bold text-gray-500">{feat.desc}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl bg-gray-900 p-12 text-white">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="max-w-xl">
             <h2 className="text-3xl font-black">Ready to scale?</h2>
             <p className="mt-2 text-gray-400">Fill out our partnership form and our team will contact you within 24 hours.</p>
          </div>
          <form className="flex w-full flex-col gap-4 md:max-w-xs">
            <input placeholder="Email" className="rounded-xl bg-white/10 border-none px-4 py-3 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500" />
            <button className="rounded-xl bg-blue-600 py-3 font-black transition-colors hover:bg-blue-700">Submit Inquiry</button>
          </form>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Partnership;
