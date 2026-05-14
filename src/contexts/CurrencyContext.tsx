import React, { createContext, useContext, useState, useEffect } from 'react';

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Currency = 'AMD' | 'RUB' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<Currency, number>;
  convert: (amount: number, from: Currency, to: Currency) => number;
  format: (amount: number, c?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('AMD');
  const [rates, setRates] = useState<Record<Currency, number>>({
    AMD: 1,
    RUB: 5.1,
    USD: 395,
  });

  useEffect(() => {
    // Listen to live settings changes from Admin
    const unsubscribe = onSnapshot(doc(db, 'settings', 'currency'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRates({
          AMD: 1,
          RUB: data.rub_to_amd || 5.1,
          USD: data.usd_to_amd || 395,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const convert = (amount: number, from: Currency, to: Currency) => {
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const inAmd = amount * rateFrom;
    return inAmd / rateTo;
  };

  const format = (amount: number, c: Currency = currency) => {
    const convertedAmount = convert(amount, 'AMD', c);
    
    const symbols = { AMD: '֏', RUB: '₽', USD: '$' };
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
    
    if (c === 'USD') return `$${formatted}`;
    return `${formatted}${symbols[c] || symbols['AMD']}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
