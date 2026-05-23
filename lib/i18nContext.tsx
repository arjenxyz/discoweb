'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  translateText,
  translations,
  type LanguageCode,
} from './i18n/languages';

interface I18nContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (isLanguageCode(savedLang)) {
      setLanguageState(savedLang);
      return;
    }

    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'en') {
      setLanguageState('en');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    document.cookie = `app_language=${lang}; path=/; max-age=31536000`;
    document.documentElement.lang = lang;
  };

  const t = (key: string, params?: Record<string, string | number>): string =>
    translateText(language, key, params);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextProps => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => translateText(DEFAULT_LANGUAGE, key, params),
    };
  }
  return context;
};

export type { LanguageCode };
export { translations, DEFAULT_LANGUAGE };
