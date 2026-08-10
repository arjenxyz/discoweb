'use client';

import Link from 'next/link';
import { Ubuntu } from 'next/font/google';
import { useTranslation } from '@/lib/i18nContext';

const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['400', '700'] });

export default function ImportantPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-16 px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${ubuntu.className}`}>{t('important.title')}</h1>
        <p className="text-sm text-[#99AAB5] mb-6">{t('important.last_updated', { date: t('important.date') })}</p>

        <div className="prose prose-invert text-sm md:text-base leading-relaxed space-y-4">
          <p>
            {t('important.p1_before')}{' '}
            <a href="https://discord.com/company" target="_blank" rel="noopener noreferrer" className="text-[#99AAB5] underline">Discord Inc.</a>{' '}
            {t('important.p1_mid')}{' '}
            {t('important.p1_marks_before')}
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-[#99AAB5] underline">Discord</a>
            {t('important.p1_marks_after')}{' '}
            <a href="https://discord.com/company" target="_blank" rel="noopener noreferrer" className="text-[#99AAB5] underline">Discord Inc.</a>
            {t('important.p1_end')}
          </p>

          <p>{t('important.p2')}</p>
          <p>{t('important.p3')}</p>

          <p>
            {t('important.p4_before')}
            <a href="https://support.discord.com" target="_blank" rel="noopener noreferrer" className="text-[#99AAB5] underline">{t('important.p4_link')}</a>
            {t('important.p4_after')}
          </p>

          <p className="mt-6">{t('important.contact')} <a href="mailto:info@discoweb.tr" className="text-[#99AAB5] underline">info@discoweb.tr</a></p>

          <p className="mt-4">{t('important.back_label')} <Link href="/" className="text-[#99AAB5] underline">{t('important.home')}</Link></p>
        </div>
      </div>
    </div>
  );
}
