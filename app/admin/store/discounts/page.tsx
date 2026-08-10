'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuBadgePercent } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import { StoreListPanel, StoreListRow } from '../StoreListRow';

type Discount = {
  id: string;
  code: string;
  percent: number;
  max_uses: number | null;
  used_count: number;
  status: 'active' | 'disabled' | 'expired';
  expires_at: string | null;
  created_at: string;
};

function formatExpiry(
  expiresAt: string | null,
  language: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (!expiresAt) return t('admin.store_discounts.no_expiry');
  return new Date(expiresAt).toLocaleString(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminStoreDiscountsPage() {
  const { t, language } = useTranslation();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/admin/discounts');
    if (response.ok) {
      const data = (await response.json()) as Discount[];
      setDiscounts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {t('admin.store_discounts.eyebrow')}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {t('admin.store_discounts.title')}
          </h1>
        </div>
        <Link
          href="/admin/store/discounts/new"
          className="shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
        >
          {t('admin.store_discounts.add_new')}
        </Link>
      </div>

      <StoreListPanel
        loading={loading}
        isEmpty={discounts.length === 0}
        emptyMessage={t('admin.store_discounts.empty')}
      >
        {discounts.map((discount) => (
          <StoreListRow
            key={discount.id}
            icon={LuBadgePercent}
            iconClassName="bg-emerald-500/15 text-emerald-300"
            title={discount.code}
            titleMono
            meta={[
              {
                label: t('admin.store_discounts.usage'),
                value: discount.max_uses
                  ? `${discount.used_count}/${discount.max_uses}`
                  : t('admin.store_discounts.usage_unlimited', { count: discount.used_count }),
              },
              {
                label: t('admin.store_discounts.validity'),
                value: formatExpiry(discount.expires_at, language, t),
              },
            ]}
            value={`%${discount.percent}`}
            onDelete={() => handleDelete(discount.id)}
          />
        ))}
      </StoreListPanel>
    </div>
  );
}
