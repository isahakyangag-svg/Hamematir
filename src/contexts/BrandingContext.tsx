import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BrandingSettings {
  logoText: string;
  logoSuffix: string;
  logoSubtitle: string;
  logoEmoji: string;
  logoType: 'emoji' | 'image';
  logoImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  [key: string]: any;
}

interface BrandingContextType {
  branding: BrandingSettings;
  loading: boolean;
}

const defaultBranding: BrandingSettings = {
  logoText: 'ZAGZAG',
  logoSuffix: '.AM',
  logoSubtitle: 'Premium Comparison',
  logoEmoji: '🛍️',
  logoType: 'emoji',
  logoImageUrl: '',
  primaryColor: '#4f46e5',
  secondaryColor: '#0f172a',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We use onSnapshot for "real-time" updates across the site as requested
    const unsub = onSnapshot(doc(db, 'global_settings', 'main'), (snap) => {
      if (snap.exists()) {
        setBranding({ ...defaultBranding, ...snap.data() } as BrandingSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Branding fetch error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    // If used outside provider, return defaults (e.g. during initial loads)
    return { branding: defaultBranding, loading: false };
  }
  return context;
};
