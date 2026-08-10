'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useState, useEffect } from 'react';
import { LuCheck, LuX, LuClipboardList } from 'react-icons/lu';

type EconomyApp = {
  id: string;
  guild_id: string;
  status: string;
  application_type?: string | null;
  vote_count?: number | null;
  vote_threshold?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  scheduled_open_at?: string | null;
  created_at: string;
  server?: {
    discord_id: string;
    name: string;
    member_count: number | null;
    is_setup: boolean;
    economy_tier: string;
  } | null;
  criteria?: {
    memberCount: number;
    isSetup: boolean;
    voteCount: number;
    voteThreshold: number;
    memberOk: boolean;
    voteOk: boolean;
    eligible: boolean;
  } | null;
};

export default function EconomyAppsPage() {
  const { t } = useTranslation();
  const [economyApps, setEconomyApps] = useState<EconomyApp[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [thresholds, setThresholds] = useState({ voteThreshold: 120, directMemberThreshold: 500, autoApproveDays: 7 });
  const [thresholdInputs, setThresholdInputs] = useState({ voteThreshold: '120', directMemberThreshold: '500', autoApproveDays: '7' });
  const [thresholdSaving, setThresholdSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dev-panel?section=apps');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      
      setEconomyApps(data.economy ?? []);
      setAutoApprove(Boolean(data.autoApprove));
      if (data.thresholds) {
        setThresholds(data.thresholds);
        setThresholdInputs({
          voteThreshold: String(data.thresholds.voteThreshold),
          directMemberThreshold: String(data.thresholds.directMemberThreshold),
          autoApproveDays: String(data.thresholds.autoApproveDays),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const setAutoApproveFlag = async (value: boolean) => {
    try {
      const res = await fetch('/api/admin/dev-panel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_auto_approve', value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setAutoApprove(Boolean(data.economyAutoApprove));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const saveThreshold = async (configKey: string, value: string) => {
    setThresholdSaving(configKey);
    try {
      const res = await fetch('/api/admin/dev-panel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_config', configKey, configValue: parseInt(value, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setThresholds((prev) => ({ 
        ...prev, 
        [configKey.replace('economy_', '').replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof typeof thresholds]: data.value 
      }));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setThresholdSaving(null); }
  };

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Reddetme sebebini girin:') ?? '' : undefined;
    try {
      const res = await fetch('/api/admin/dev-panel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table: 'economy_applications', id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      await fetchApps();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
          <LuClipboardList className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('developer.economy_apps.title')}</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{t('developer.economy_apps.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Auto approve + thresholds */}
      <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <div>
            <p className="text-lg font-bold text-white">Otomatik Onay Sistemi</p>
            <p className="text-sm text-white/40 mt-1">{t('developer.economy_apps.auto_approve_desc')}</p>
          </div>
          <button onClick={() => setAutoApproveFlag(!autoApprove)}
            className={`relative h-8 w-14 rounded-full transition-colors duration-200 ${autoApprove ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/20'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${autoApprove ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {([
            { key: 'economy_vote_threshold',          label: t('developer.economy_apps.required_votes'),               stateKey: 'voteThreshold' },
            { key: 'economy_direct_member_threshold', label: t('developer.economy_apps.direct_members'),   stateKey: 'directMemberThreshold' },
            { key: 'economy_auto_approve_days',       label: t('developer.economy_apps.auto_days'),     stateKey: 'autoApproveDays' },
          ] as const).map(({ key, label, stateKey }) => (
            <div key={key} className="flex flex-col gap-3 rounded-2xl bg-black/40 border border-white/5 p-4">
              <span className="text-sm font-medium text-white/50">{label}</span>
              <div className="flex items-center gap-2">
                <input type="number" min={1} value={thresholdInputs[stateKey] ?? String(thresholds[stateKey])}
                  onChange={(e) => setThresholdInputs((p) => ({ ...p, [stateKey]: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#5865F2]/50 focus:outline-none focus:bg-black/50 transition-colors" />
                <button onClick={() => saveThreshold(key, thresholdInputs[stateKey])} disabled={thresholdSaving === key}
                  className="rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/15 hover:bg-[#5865F2]/25 px-4 py-2.5 text-sm font-bold text-[#7289da] transition disabled:opacity-50">
                  {thresholdSaving === key ? '...' : t('developer.common.save')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
        <p className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3">{t('developer.economy_apps.applications')}</p>
        <div className="flex flex-col gap-3">
          {loading && economyApps.length === 0 ? (
            <p className="text-sm font-medium text-white/30 py-8 text-center">{t('developer.common.loading')}</p>
          ) : economyApps.length > 0 ? (
            economyApps.map((app) => (
              <div key={app.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{app.server?.name ?? app.guild_id}</p>
                    <p className="text-xs text-white/40">{app.guild_id}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${app.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/10 text-white/40'}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-white/50 mb-4 bg-black/30 rounded-xl p-3 border border-white/5">
                  <span>{t('developer.economy_apps.member_label')} <strong className="text-white text-sm">{app.criteria?.memberCount ?? 0}</strong></span>
                  <span>Oy: <strong className="text-white text-sm">{app.criteria?.voteCount ?? 0}</strong>/{app.criteria?.voteThreshold ?? 120}</span>
                  <span>Kurulum: <strong className={app.criteria?.isSetup ? 'text-emerald-400' : 'text-red-400'}>{app.criteria?.isSetup ? t('developer.economy_apps.has') : t('developer.common.none')}</strong></span>
                  <span>Uygunluk: <strong className={app.criteria?.eligible ? 'text-emerald-400' : 'text-red-400'}>{app.criteria?.eligible ? t('developer.common.yes') : t('developer.common.no')}</strong></span>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(app.id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 transition">
                      <LuCheck className="w-4 h-4" /> Onayla
                    </button>
                    <button onClick={() => handleDecision(app.id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 transition">
                      <LuX className="w-4 h-4" /> Reddet
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm font-medium text-white/30 py-8 text-center">{t('developer.economy_apps.empty')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
