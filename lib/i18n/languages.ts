import tr from '../locales/tr.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';
import id from '../locales/id.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import ru from '../locales/ru.json';
import hu from '../locales/hu.json';

export type LanguageCode =
  | 'en'
  | 'pt'
  | 'id'
  | 'es'
  | 'de'
  | 'tr'
  | 'fr'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'hu';

export type LanguageDefinition = {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  country: string;
};

export const DEFAULT_LANGUAGE: LanguageCode = 'tr';

/** Top Discord-active country languages (approx. by MAU / community size). */
export const SUPPORTED_LANGUAGES: readonly LanguageDefinition[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', country: 'United States' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', country: 'Brazil' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', country: 'Indonesia' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', country: 'Mexico' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', country: 'Germany' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', country: 'Türkiye' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', country: 'France' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar', country: 'Hungary' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', country: 'Japan' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', country: 'South Korea' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', country: 'Russia' },
] as const;

export type Translations = Record<string, unknown>;

const LOCALE_TAGS: Record<LanguageCode, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  id: 'id-ID',
  es: 'es-MX',
  de: 'de-DE',
  tr: 'tr-TR',
  fr: 'fr-FR',
  hu: 'hu-HU',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
};

/** Merge section overlays onto English so missing keys still resolve. */
function mergeLocale(base: Translations, overlay: Translations): Translations {
  const result: Translations = { ...base };
  for (const [section, value] of Object.entries(overlay)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[section] = {
        ...((base[section] as Record<string, unknown>) ?? {}),
        ...(value as Record<string, unknown>),
      };
    } else {
      result[section] = value;
    }
  }
  return result;
}

export const translations: Record<LanguageCode, Translations> = {
  en,
  tr,
  pt: mergeLocale(en, pt),
  id: mergeLocale(en, id),
  es: mergeLocale(en, es),
  de: mergeLocale(en, de),
  fr: mergeLocale(en, fr),
  hu: mergeLocale(en, hu),
  ja: mergeLocale(en, ja),
  ko: mergeLocale(en, ko),
  ru: mergeLocale(en, ru),
};

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === value);
}

function lookupTranslation(bundle: Translations, key: string): string | null {
  const keys = key.split('.');
  let value: unknown = bundle;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }

  return typeof value === 'string' ? value : null;
}

export function translateText(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>,
): string {
  let str =
    lookupTranslation(translations[language], key) ??
    (language !== 'en' ? lookupTranslation(translations.en, key) : null) ??
    key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }

  return str;
}

export function getLocaleTag(language: LanguageCode): string {
  return LOCALE_TAGS[language] ?? 'en-US';
}
