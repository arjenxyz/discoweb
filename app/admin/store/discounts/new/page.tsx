'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuStore, LuWand } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';

type TabType = 'single' | 'welcome';

export default function AdminStoreDiscountCreatePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSpecial, setIsSpecial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35';
  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white/85 placeholder:text-white/25 focus:border-[#5865F2]/50 focus:outline-none';

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCreateDiscount = async () => {
    setSaving(true);
    setMessage(null);

    if (!code || !percent) {
      setMessage({ type: 'error', text: t('admin.store_discount_new.error_required') });
      setSaving(false);
      return;
    }

    const payload = {
      code: code.toUpperCase(),
      percent: Number(percent),
      maxUses: activeTab === 'welcome' ? null : maxUses ? Number(maxUses) : null,
      minSpend: activeTab === 'welcome' ? 0 : minSpend ? Number(minSpend) : 0,
      perUserLimit: activeTab === 'welcome' ? 1 : perUserLimit ? Number(perUserLimit) : 1,
      status: 'active' as const,
      expiresAt:
        activeTab === 'welcome' ? null : expiresAt ? new Date(expiresAt).toISOString() : null,
      is_special: activeTab === 'welcome' ? false : isSpecial,
      is_welcome: activeTab === 'welcome',
    };

    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t('admin.store_discount_new.error_generic'));
      }

      setMessage({ type: 'success', text: t('admin.store_discount_new.success') });

      if (activeTab !== 'welcome') {
        setCode('');
        setPercent('');
        setMaxUses('');
        setMinSpend('');
        setExpiresAt('');
        setPerUserLimit('1');
        setIsSpecial(false);
      }
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('admin.store_discount_new.error_generic'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {t('admin.store_discount_new.eyebrow')}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {activeTab === 'welcome'
              ? t('admin.store_discount_new.title_welcome')
              : t('admin.store_discount_new.title_new')}
          </h1>
        </div>
        <Link
          href="/admin/store/discounts"
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
        >
          {t('admin.store_discount_new.list')}
        </Link>
      </div>

      <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('single');
            setCode('');
            setMessage(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'single'
              ? 'bg-[#5865F2] text-white'
              : 'text-white/45 hover:text-white'
          }`}
        >
          {t('admin.store_discount_new.tab_single')}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('welcome');
            setCode('WELCOME2026');
            setIsSpecial(false);
            setExpiresAt('');
            setMessage(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'welcome'
              ? 'bg-[#5865F2] text-white'
              : 'text-white/45 hover:text-white'
          }`}
        >
          {t('admin.store_discount_new.tab_welcome')}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-3.5 py-2.5 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/[0.08] text-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        {activeTab === 'welcome' && (
          <p className="mb-3.5 rounded-xl border border-[#5865F2]/25 bg-[#5865F2]/10 px-3.5 py-2.5 text-xs leading-relaxed text-[#c7d0ff]">
            {t('admin.store_discount_new.welcome_hint')}
          </p>
        )}
        <div className="grid gap-3.5">
          <div>
            <label className={labelClass}>{t('admin.store_discount_new.code')}</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('admin.store_discount_new.code_placeholder')}
                className={`${fieldClass} mt-0 flex-1 font-mono tracking-wide`}
              />
              {activeTab !== 'welcome' && (
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-[#a5b4ff] transition hover:border-[#5865F2]/40 hover:bg-[#5865F2]/15"
                  title={t('admin.store_discount_new.random_code')}
                >
                  <LuWand className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className={`grid gap-3 ${activeTab === 'welcome' ? '' : 'sm:grid-cols-2'}`}>
            <div>
              <label className={labelClass}>{t('admin.store_discount_new.percent')}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="10"
                className={fieldClass}
              />
            </div>
            {activeTab !== 'welcome' && (
              <div>
                <label className={labelClass}>{t('admin.store_discount_new.max_uses')}</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder={t('admin.store_discount_new.max_uses_placeholder')}
                  className={fieldClass}
                />
                <p className="mt-1 text-[11px] text-white/35">
                  {t('admin.store_discount_new.max_uses_hint')}
                </p>
              </div>
            )}
          </div>

          {activeTab !== 'welcome' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('admin.store_discount_new.min_spend')}</label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
                <p className="mt-1 text-[11px] text-white/35">
                  {t('admin.store_discount_new.min_spend_hint')}
                </p>
              </div>
              <div>
                <label className={labelClass}>{t('admin.store_discount_new.per_user_limit')}</label>
                <input
                  type="number"
                  min="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  placeholder="1"
                  className={fieldClass}
                />
                <p className="mt-1 text-[11px] text-white/35">
                  {t('admin.store_discount_new.per_user_hint')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'welcome' ? (
            <div>
              <label className={labelClass}>{t('admin.store_discount_new.validity')}</label>
              <div className={`${fieldClass} text-white/55`}>
                {t('admin.store_discount_new.no_expiry')}
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>{t('admin.store_discount_new.expires')}</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={`${fieldClass} [color-scheme:dark]`}
              />
            </div>
          )}

          {activeTab !== 'welcome' && (
            <button
              type="button"
              role="switch"
              aria-checked={isSpecial}
              onClick={() => setIsSpecial((prev) => !prev)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                isSpecial
                  ? 'border-[#5865F2]/40 bg-[#5865F2]/15'
                  : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isSpecial ? 'bg-[#5865F2]/30 text-[#a5b4ff]' : 'bg-white/[0.06] text-white/45'
                }`}
              >
                <LuStore className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">
                  {t('admin.store_discount_new.show_in_cart')}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-white/40">
                  {t('admin.store_discount_new.show_in_cart_desc')}
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                  isSpecial ? 'bg-[#5865F2]' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    isSpecial ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleCreateDiscount}
              disabled={saving}
              className="rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? t('admin.store_discount_new.saving')
                : activeTab === 'welcome'
                  ? t('admin.store_discount_new.save')
                  : t('admin.store_discount_new.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
