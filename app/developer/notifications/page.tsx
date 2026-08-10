'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';

export default function DeveloperNotificationsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">{t('developer.notifications.title')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('developer.notifications.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/developer/notifications/send"
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            {t('developer.notifications.send_eyebrow')}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{t('developer.notifications.send_title')}</h2>
          <p className="mt-2 text-sm text-white/60">{t('developer.notifications.send_desc')}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition group-hover:border-white/30 group-hover:text-white">
            {t('developer.notifications.send_cta')}
          </span>
        </Link>

        <Link
          href="/developer/notifications/history"
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            {t('developer.notifications.history_eyebrow')}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{t('developer.notifications.history_title')}</h2>
          <p className="mt-2 text-sm text-white/60">{t('developer.notifications.history_desc')}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition group-hover:border-white/30 group-hover:text-white">
            {t('developer.notifications.history_cta')}
          </span>
        </Link>
      </div>
    </div>
  );
}
