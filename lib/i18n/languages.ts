import tr from '../locales/tr.json';
import en from '../locales/en.json';

export type LanguageCode = 'tr' | 'en';

export type LanguageDefinition = {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
};

export const DEFAULT_LANGUAGE: LanguageCode = 'tr';

export const SUPPORTED_LANGUAGES: readonly LanguageDefinition[] = [
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
] as const;

export type Translations = Record<string, unknown>;

export const translations: Record<LanguageCode, Translations> = {
  tr,
  en,
};

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return value === 'tr' || value === 'en';
}

export function translateText(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.');
  let value: unknown = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
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
}

export function getLocaleTag(language: LanguageCode): string {
  return language === 'tr' ? 'tr-TR' : 'en-US';
}
