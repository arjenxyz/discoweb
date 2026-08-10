'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Promotion = {
  id: string;
  code: string;
  value: number;
  max_uses: number | null;
  used_count: number;
  status: 'active' | 'disabled' | 'expired';
  expires_at: string | null;
};

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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-white/45">Yükleniyor…</p>
        ) : promos.length === 0 ? (
          <p className="text-sm text-white/45">Henüz promosyon yok.</p>
        ) : (
          <div className="space-y-2.5">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-semibold text-white">{promo.code}</p>
                      <span className="shrink-0 text-xs text-white/40">{promo.value} papel</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/45">
                      <span className="rounded-lg border border-white/10 px-2 py-0.5">
                        {promo.expires_at
                          ? new Date(promo.expires_at).toLocaleString('tr-TR')
                          : 'Süresiz'}
                      </span>
                      <span className="rounded-lg border border-white/10 px-2 py-0.5">
                        {promo.max_uses
                          ? `${promo.used_count}/${promo.max_uses}`
                          : `${promo.used_count} kullanım`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePromo(promo.id)}
                    className="w-fit rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-[11px] font-medium text-rose-300/80 transition hover:border-rose-500/40 hover:text-rose-200"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
