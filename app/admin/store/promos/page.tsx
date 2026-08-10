'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuTicket } from 'react-icons/lu';
import { StoreListPanel, StoreListRow } from '../StoreListRow';

type Promotion = {
  id: string;
  code: string;
  value: number;
  max_uses: number | null;
  used_count: number;
  per_user_limit?: number | null;
  status: 'active' | 'disabled' | 'expired';
  expires_at: string | null;
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

export default function AdminStorePromosPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/admin/promotions');
    if (response.ok) {
      const data = (await response.json()) as Promotion[];
      setPromos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDeletePromo = async (id: string) => {
    await fetch('/api/admin/promotions', {
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
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">Promosyon Listesi</h1>
        </div>
        <Link
          href="/admin/store/promos/new"
          className="shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Yeni Promosyon Ekle
        </Link>
      </div>

      <StoreListPanel loading={loading} isEmpty={promos.length === 0} emptyMessage="Henüz promosyon yok.">
        {promos.map((promo) => (
          <StoreListRow
            key={promo.id}
            icon={LuTicket}
            iconClassName="bg-amber-500/15 text-amber-300"
            title={promo.code}
            titleMono
            meta={[
              {
                label: 'Kullanım',
                value: promo.max_uses
                  ? `${promo.used_count}/${promo.max_uses}`
                  : `${promo.used_count} (sınırsız)`,
              },
              { label: 'Kişi başı', value: String(promo.per_user_limit ?? 1) },
              { label: 'Geçerlilik', value: formatExpiry(promo.expires_at) },
            ]}
            value={`${promo.value} papel`}
            onDelete={() => handleDeletePromo(promo.id)}
          />
        ))}
      </StoreListPanel>
    </div>
  );
}
