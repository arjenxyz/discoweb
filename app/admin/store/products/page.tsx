'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

function formatDuration(minutes: number) {
  if (minutes === 0) return 'Süresiz';
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const mn = minutes % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}g`);
  if (h > 0) parts.push(`${h}sa`);
  if (mn > 0) parts.push(`${mn}dk`);
  return parts.join(' ') || `${minutes}dk`;
}

export default function AdminStoreProductsPage() {
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Mağaza</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">Ürün Listesi</h1>
        </div>
        <Link
          href="/admin/store/products/new"
          className="shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Yeni Ürün Ekle
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-white/45">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-white/45">Henüz ürün yok.</p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <span className="shrink-0 text-xs text-white/40">{item.price} papel</span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-white/45">{item.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/45">
                      <span className="rounded-lg border border-white/10 px-2 py-0.5">
                        {formatDuration(item.duration_days)}
                      </span>
                      {item.role_id ? (
                        <span className="max-w-full truncate rounded-lg border border-white/10 px-2 py-0.5">
                          {item.role_id}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/store/products/new?edit=${item.id}`)}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-[11px] font-medium text-rose-300/80 transition hover:border-rose-500/40 hover:text-rose-200"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
