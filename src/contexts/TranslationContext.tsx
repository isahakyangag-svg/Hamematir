import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TranslationContextType {
  loading: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: string[];
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem('i18nextLng') || 'ru');
  const availableLanguages = ['am', 'ru', 'en'];

  useEffect(() => {
    // Sync with Firestore in real-time
    const unsubscribe = onSnapshot(collection(db, 'translations'), (snapshot) => {
      const resources: any = {
        am: { translation: {} },
        ru: { translation: {} },
        en: { translation: {} }
      };

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = data.key;
        if (key) {
          if (data.am) resources.am.translation[key] = data.am;
          if (data.ru) resources.ru.translation[key] = data.ru;
          if (data.en) resources.en.translation[key] = data.en;
        }
      });

      // Update i18next resources
      Object.keys(resources).forEach((lang) => {
        i18n.addResourceBundle(lang, 'translation', resources[lang].translation, true, true);
      });

      if (loading) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <TranslationContext.Provider value={{ 
      loading, 
      language, 
      setLanguage: handleSetLanguage,
      availableLanguages 
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationSystem = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationSystem must be used within a TranslationProvider');
  }
  return context;
};
