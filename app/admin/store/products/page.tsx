'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuPackage } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import { StoreListPanel, StoreListRow } from '../StoreListRow';

type StoreItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive';
  role_id: string | null;
  duration_days: number;
  created_at: string;
};

function formatDuration(
  minutes: number,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (minutes === 0) return t('admin.store_products.unlimited');
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const mn = minutes % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(t('admin.store_products.duration_days', { count: d }));
  if (h > 0) parts.push(t('admin.store_products.duration_hours', { count: h }));
  if (mn > 0) parts.push(t('admin.store_products.duration_minutes', { count: mn }));
  return parts.join(' ') || t('admin.store_products.duration_minutes', { count: minutes });
}

function shortenId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function AdminStoreProductsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/admin/store-items');
    if (response.ok) {
      const data = (await response.json()) as StoreItem[];
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDeleteItem = async (id: string) => {
    await fetch('/api/admin/store-items', {
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
            {t('admin.store_products.eyebrow')}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {t('admin.store_products.title')}
          </h1>
        </div>
        <Link
          href="/admin/store/products/new"
          className="shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
        >
          {t('admin.store_products.add_new')}
        </Link>
      </div>

      <StoreListPanel
        loading={loading}
        isEmpty={items.length === 0}
        emptyMessage={t('admin.store_products.empty')}
      >
        {items.map((item) => {
          const meta = [
            { label: t('admin.store_products.duration'), value: formatDuration(item.duration_days, t) },
          ];
          if (item.role_id) {
            meta.push({ label: t('admin.store_products.role'), value: shortenId(item.role_id) });
          }

          return (
            <StoreListRow
              key={item.id}
              icon={LuPackage}
              title={item.title}
              subtitle={item.description}
              meta={meta}
              value={t('admin.store_products.price_papel', { amount: item.price })}
              onEdit={() => router.push(`/admin/store/products/new?edit=${item.id}`)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          );
        })}
      </StoreListPanel>
    </div>
  );
}
