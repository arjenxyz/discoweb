import { cookies } from 'next/headers';
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  translateText,
  type LanguageCode,
} from './i18n/languages';

export async function getServerLanguage(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const saved = cookieStore.get('app_language')?.value;
  if (isLanguageCode(saved)) return saved;
  return DEFAULT_LANGUAGE;
}

export async function getServerTranslation() {
  const language = await getServerLanguage();
  return {
    language,
    t: (key: string, params?: Record<string, string | number>) => translateText(language, key, params),
  };
}
