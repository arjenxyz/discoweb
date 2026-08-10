'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';

export function AdminAccessDenied() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-400">{t('admin.dashboard.access_denied_title')}</h1>
        <p className="mb-6 text-white/70">{t('admin.dashboard.access_denied_body')}</p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-indigo-600 px-6 py-3 transition-colors hover:bg-indigo-700"
        >
          {t('admin.dashboard.back_home')}
        </Link>
      </div>
    </div>
  );
}

export function AdminLoadFailed() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
      {t('admin.dashboard.load_failed')}
    </div>
  );
}
