'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuBadgePercent } from 'react-icons/lu';
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

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return 'Bitiş tarihi yok';
  return new Date(expiresAt).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminStoreDiscountsPage() {
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Mağaza</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">İndirim Listesi</h1>
        </div>
        <Link
          href="/admin/store/discounts/new"
          className="shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Yeni İndirim Ekle
        </Link>
      </div>

      <StoreListPanel loading={loading} isEmpty={discounts.length === 0} emptyMessage="Henüz indirim yok.">
        {discounts.map((discount) => (
          <StoreListRow
            key={discount.id}
            icon={LuBadgePercent}
            iconClassName="bg-emerald-500/15 text-emerald-300"
            title={discount.code}
            titleMono
            meta={[
              {
                label: 'Kullanım',
                value: discount.max_uses
                  ? `${discount.used_count}/${discount.max_uses}`
                  : `${discount.used_count} (sınırsız)`,
              },
              { label: 'Geçerlilik', value: formatExpiry(discount.expires_at) },
            ]}
            value={`%${discount.percent}`}
            onDelete={() => handleDelete(discount.id)}
          />
        ))}
      </StoreListPanel>
    </div>
  );
}
