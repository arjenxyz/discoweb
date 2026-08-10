'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminStorePromoCreatePage() {
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [promoSaving, setPromoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35';
  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white/85 placeholder:text-white/25 focus:border-[#5865F2]/50 focus:outline-none';

  const handleCreatePromo = async () => {
    setPromoSaving(true);
    setError(null);

    const payload = {
      code,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null,
      status: 'active' as const,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    const response = await fetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string; details?: string };
      if (data.error === 'invalid_payload') {
        setError('Kod ve papel paketi zorunlu.');
      } else if (data.error === 'invalid_value') {
        setError('Papel paketi 0 olamaz.');
      } else if (data.error === 'save_failed') {
        setError(`Promosyon kaydedilemedi: ${data.details ?? 'Sunucu hatası'}`);
      } else {
        setError('Promosyon kaydedilemedi.');
      }
      setPromoSaving(false);
      return;
    }

    setCode('');
    setValue('');
    setMaxUses('');
    setExpiresAt('');
    setPromoSaving(false);
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Mağaza</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">Yeni Promosyon Ekle</h1>
        </div>
        <Link
          href="/admin/store/promos"
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
        >
          Liste
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] px-3.5 py-2.5 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="grid gap-3.5">
          <div>
            <label className={labelClass}>Kod</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Örn. WELCOME100"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Papel paketi</label>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="100"
                type="number"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Limit</label>
              <input
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
                placeholder="Opsiyonel"
                type="number"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bitiş</label>
            <input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              type="datetime-local"
              className={fieldClass}
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleCreatePromo}
              disabled={promoSaving || !code || !value}
              className="rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {promoSaving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
