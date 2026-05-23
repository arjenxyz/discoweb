'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuGift, LuX } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_payload: 'promo.error.invalid',
  unauthorized: 'promo.error.unauthorized',
  server_not_found: 'promo.error.server',
  invalid_code: 'promo.error.invalid',
  wrong_server: 'promo.error.wrong_server',
  expired: 'promo.error.expired',
  limit_reached: 'promo.error.limit',
  already_used: 'promo.error.already_used',
  maintenance: 'promo.error.maintenance',
};

type PromoRedeemPanelProps = {
  compact?: boolean;
  onSuccess?: (balance: number) => void;
};

export function PromoRedeemPanel({ compact = false, onSuccess }: PromoRedeemPanelProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: t('promo.error.empty') });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/member/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        balance?: number;
        amount?: number;
      };

      if (!response.ok) {
        const key = data.error ? ERROR_MESSAGES[data.error] : undefined;
        setMessage({
          type: 'error',
          text: key ? t(key) : data.message ?? t('promo.error.generic'),
        });
        return;
      }

      setMessage({
        type: 'success',
        text: data.message ?? t('promo.success', { amount: data.amount ?? 0 }),
      });
      setCode('');
      onSuccess?.(Number(data.balance ?? 0));
      try {
        window.dispatchEvent(new CustomEvent('wallet:refresh'));
      } catch {
        /* ignore */
      }
    } catch {
      setMessage({ type: 'error', text: t('promo.error.generic') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div>
          <p className="text-xs font-bold text-pink-300">{t('promo.title')}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{t('promo.subtitle')}</p>
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleRedeem()}
          placeholder={t('promo.placeholder')}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:border-pink-400/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="shrink-0 rounded-lg bg-pink-500/90 px-3 py-2 text-xs font-bold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '...' : t('promo.redeem')}
        </button>
      </div>
      {message && (
        <p className={`text-[10px] ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function PromoRedeemWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      setLoggedIn(res.ok);
    } catch {
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
    const onOpen = () => setOpen(true);
    window.addEventListener('promo:open', onOpen);
    return () => window.removeEventListener('promo:open', onOpen);
  }, [checkAuth]);

  if (!loggedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9998] flex h-12 items-center gap-2 rounded-full border border-pink-500/30 bg-[#0b0d12]/95 px-4 text-sm font-semibold text-pink-200 shadow-lg shadow-pink-500/10 backdrop-blur-xl transition hover:border-pink-400/50 hover:text-white"
        aria-label={t('promo.title')}
      >
        <LuGift className="h-4 w-4" />
        <span className="hidden sm:inline">{t('promo.title')}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[10001] flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d12] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
                  <LuGift className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{t('promo.title')}</p>
                  <p className="text-[11px] text-white/45">{t('promo.subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>
            <PromoRedeemPanel onSuccess={() => setTimeout(() => setOpen(false), 1800)} />
          </div>
        </div>
      )}
    </>
  );
}
