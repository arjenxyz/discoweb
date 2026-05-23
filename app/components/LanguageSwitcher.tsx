'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18nContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('tr')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'tr'
            ? 'bg-blue-500 text-white'
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'en'
            ? 'bg-blue-500 text-white'
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
