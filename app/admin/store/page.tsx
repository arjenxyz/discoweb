'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';

export default function AdminStorePage() {
  const { t } = useTranslation();

  const QUICK_LINKS = [
    {
      href: '/admin/store/products/new',
      title: t('admin.store.create_product'),
      description: t('admin.store.create_product_desc'),
    },
    {
      href: '/admin/store/promos/new',
      title: t('admin.store.create_promo'),
      description: t('admin.store.create_promo_desc'),
    },
    {
      href: '/admin/store/discounts/new',
      title: t('admin.store.create_discount'),
      description: t('admin.store.create_discount_desc'),
    },
    {
      href: '/admin/store/products',
      title: t('admin.store.products_list'),
      description: t('admin.store.products_list_desc'),
    },
    {
      href: '/admin/store/promos',
      title: t('admin.store.promos_list'),
      description: t('admin.store.promos_list_desc'),
    },
    {
      href: '/admin/store/discounts',
      title: t('admin.store.discounts_list'),
      description: t('admin.store.discounts_list_desc'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
          {t('admin.store.eyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{t('admin.store.title')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('admin.store.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-indigo-400/40 hover:bg-white/10"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{link.title}</h2>
              <p className="mt-2 text-sm text-white/60">{link.description}</p>
            </div>
            <span className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300/80">
              {t('admin.store.go_to_page')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
