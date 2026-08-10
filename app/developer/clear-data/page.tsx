'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuTrash2, LuTriangle, LuCheck, LuLoader, LuShield } from 'react-icons/lu';

type CleanupResult = {
  logChannelsDeleted: number;
  tablesCleared: number;
  totalTables: number;
  walletsReset: number;
  ledgerEntries: number;
  errors: string[];
};

export default function ClearDataPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleClearData = async () => {
    if (confirmText !== t('developer.clear_data.confirm_phrase')) {
      setError(t('developer.clear_data.confirm_mismatch'));
      return;
    }

    setClearing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/developer/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.results);
      } else {
        setError(data.error || t('developer.clear_data.clear_failed'));
      }
    } catch {
      setError(t('developer.common.error_generic'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('developer.clear_data.title')}</h1>
        <p className="text-sm text-[#99AAB5] mt-1">{t('developer.clear_data.subtitle')}</p>
      </div>

      {/* Warning Card */}
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
            <LuTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-rose-300 mb-3">{t('developer.clear_data.danger_title')}</h2>
            <p className="text-sm text-white/60 mb-4">{t('developer.clear_data.danger_intro')}</p>
            <div className="space-y-2">
              {[
                t('developer.clear_data.item_logs'),
                t('developer.clear_data.item_errors'),
                t('developer.clear_data.item_store'),
                t('developer.clear_data.item_promos'),
                t('developer.clear_data.item_notifs'),
                t('developer.clear_data.item_wallets'),
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <LuTrash2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>

            {/* Protected Data */}
            <div className="mt-5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <LuShield className="w-4 h-4 text-[#5865F2]" />
                <p className="text-sm font-semibold text-[#5865F2]">Korunan Veriler</p>
              </div>
              <ul className="text-sm text-white/50 space-y-1 ml-6">
                <li>{t('developer.clear_data.keep_members')}</li>
                <li>{t('developer.clear_data.keep_servers')}</li>
                <li>{t('developer.clear_data.keep_relations')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {!result && (
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
          <label className="block text-sm font-medium text-white/70 mb-3">
            {t('developer.clear_data.confirm_label', { phrase: t('developer.clear_data.confirm_phrase') })}
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:border-rose-500/50 focus:outline-none transition-all"
            placeholder={t('developer.clear_data.confirm_phrase')}
            disabled={clearing}
          />

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleClearData}
            disabled={clearing || confirmText !== t('developer.clear_data.confirm_phrase')}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold text-sm transition-all"
          >
            {clearing ? (
              <><LuLoader className="w-4 h-4 animate-spin" /> {t('developer.clear_data.clearing')}</>
            ) : (
              <><LuTrash2 className="w-4 h-4" /> {t('developer.clear_data.clear_btn')}</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <LuCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-emerald-300">{t('developer.clear_data.done_title')}</h3>
              <p className="text-xs text-white/40">{t('developer.clear_data.done_body')}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: t('developer.clear_data.result_tables'), value: `${result.tablesCleared}/${result.totalTables}` },
              { label: t('developer.clear_data.result_channels'), value: result.logChannelsDeleted },
              { label: t('developer.clear_data.result_wallets'), value: result.walletsReset },
              { label: t('developer.clear_data.result_ledger'), value: result.ledgerEntries },
            ].map(item => (
              <div key={item.label} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[11px] text-white/40">{item.label}</p>
                <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-300 mb-2">{t('developer.clear_data.warnings', { count: result.errors.length })}</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-amber-200/60">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
