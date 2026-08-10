'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';

export default function AdminStorePromoCreatePage() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
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
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
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
        setError(t('admin.store_promo_new.error_required'));
      } else if (data.error === 'invalid_value') {
        setError(t('admin.store_promo_new.error_zero'));
      } else if (data.error === 'save_failed') {
        setError(
          t('admin.store_promo_new.error_save_detail', {
            details: data.details ?? t('admin.store_promo_new.server_error'),
          }),
        );
      } else {
        setError(t('admin.store_promo_new.error_save'));
      }
      setPromoSaving(false);
      return;
    }

    setCode('');
    setValue('');
    setMaxUses('');
    setPerUserLimit('1');
    setExpiresAt('');
    setPromoSaving(false);
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {t('admin.store_promo_new.eyebrow')}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {t('admin.store_promo_new.title')}
          </h1>
        </div>
        <Link
          href="/admin/store/promos"
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
        >
          {t('admin.store_promo_new.list')}
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
            <label className={labelClass}>{t('admin.store_promo_new.code')}</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('admin.store_promo_new.code_placeholder')}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t('admin.store_promo_new.papel_pack')}</label>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="100"
              type="number"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t('admin.store_promo_new.max_uses')}</label>
              <input
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
                placeholder={t('admin.store_promo_new.max_uses_placeholder')}
                type="number"
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-white/35">{t('admin.store_promo_new.max_uses_hint')}</p>
            </div>
            <div>
              <label className={labelClass}>{t('admin.store_promo_new.per_user_limit')}</label>
              <input
                value={perUserLimit}
                onChange={(event) => setPerUserLimit(event.target.value)}
                placeholder="1"
                type="number"
                min="1"
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-white/35">{t('admin.store_promo_new.per_user_hint')}</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('admin.store_promo_new.expires')}</label>
            <input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              type="datetime-local"
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleCreatePromo}
              disabled={promoSaving || !code || !value}
              className="rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {promoSaving ? t('admin.store_promo_new.saving') : t('admin.store_promo_new.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
