'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import tr from './locales/tr.json';
import en from './locales/en.json';

type Language = 'tr' | 'en';

type Translations = Record<string, any>;

const translations: Record<Language, Translations> = {
  tr,
  en,
};

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('tr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load language from localStorage if available
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
      setLanguageState(savedLang);
    } else {
      // Fallback to browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    document.cookie = `app_language=${lang}; path=/; max-age=31536000`;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if not found
        return key;
      }
    }

    let str = typeof value === 'string' ? value : key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return str;
  };

  // Always provide the context so hooks don't break during SSR
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextProps => {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a dummy context if used outside provider (e.g. server components if by mistake)
    return {
      language: 'tr',
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => key,
    };
  }
  return context;
};
