'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuTriangleAlert, LuSearch, LuShield } from 'react-icons/lu';

type SuspiciousFlagAdmin = {
  id: string;
  user_id: string | null;
  guild_id: string | null;
  rule_key: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  status: 'open' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
  discord_alerted: boolean;
};

export default function SuspiciousFlagsPage() {
  const [flags, setFlags] = useState<SuspiciousFlagAdmin[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/suspicious?status=${status}&limit=100`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setFlags(data.flags ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags(filter);
  }, [filter, fetchFlags]);

  const runScan = async () => {
    setScanLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/suspicious', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      await fetchFlags('open');
      setFilter('open');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setScanLoading(false);
    }
  };

  const updateFlagStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/suspicious', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setFlags((prev) => prev.map((f) => f.id === id ? { ...f, status: status as any } : f));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const SEVERITY_STYLE: Record<string, string> = {
    low:      'border-[#5865F2]/25 bg-[#5865F2]/8  text-[#7289da]',
    medium:   'border-amber-500/25 bg-amber-500/8  text-amber-300',
    high:     'border-orange-500/25 bg-orange-500/8 text-orange-300',
    critical: 'border-red-500/25  bg-red-500/8   text-red-300',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
          <LuTriangleAlert className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Şüpheli Aktiviteler</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Platformdaki anormal durumları ve bot aktivitelerini inceleyin.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {['open', 'reviewed', 'dismissed', 'actioned', 'all'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${filter === s ? 'border-[#5865F2]/50 bg-[#5865F2]/20 text-white shadow-[0_0_10px_rgba(88,101,242,0.15)]' : 'border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={runScan} disabled={scanLoading}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-300 transition disabled:opacity-50">
            <LuSearch className="w-4 h-4" />
            {scanLoading ? 'Taranıyor...' : 'Şimdi Tara'}
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <p className="text-sm text-white/40 text-center py-4">Yükleniyor...</p>
          ) : flags.length > 0 ? (
            flags.map((flag) => (
              <div key={flag.id} className={`rounded-2xl border p-4 ${SEVERITY_STYLE[flag.severity] ?? 'border-white/10 bg-white/5 text-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_STYLE[flag.severity] ?? ''}`}>{flag.severity}</span>
                      <span className="text-xs text-white/40">{flag.rule_key}</span>
                      {flag.discord_alerted && <span className="text-[10px] bg-[#5865F2]/20 text-[#7289da] px-2 py-0.5 rounded-full">Discord'a Bildirildi</span>}
                    </div>
                    <p className="text-sm font-bold text-white">{flag.title}</p>
                    {flag.description && <p className="mt-1 text-xs text-white/60">{flag.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-white/50 bg-black/30 border border-white/5 p-2 rounded-xl w-fit">
                      {flag.guild_id && <span>Sunucu: <strong className="text-white">{flag.guild_id}</strong></span>}
                      {flag.user_id && <span>Kullanıcı: <strong className="text-white">{flag.user_id}</strong></span>}
                      <span>Tarih: <strong className="text-white">{new Date(flag.created_at).toLocaleString('tr-TR')}</strong></span>
                    </div>
                  </div>
                  {flag.status === 'open' && (
                    <div className="flex flex-col gap-2 shrink-0 w-[140px]">
                      {[
                        { status: 'reviewed',  label: 'İncelendi', cls: 'border-sky-400/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20' },
                        { status: 'actioned',  label: 'İşlem Yapıldı', cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' },
                        { status: 'dismissed', label: 'Yok Say', cls: 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10' },
                      ].map((btn) => (
                        <button key={btn.status} onClick={() => updateFlagStatus(flag.id, btn.status)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition w-full ${btn.cls}`}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
              <LuShield className="w-12 h-12 text-white/10" />
              <p className="text-sm font-medium">Bu kategoride şüpheli aktivite bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
