'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LuOctagonAlert,
  LuPlay,
  LuRefreshCw,
  LuShield,
  LuWallet,
  LuStore,
  LuLoader,
} from 'react-icons/lu';

type Incident = {
  id: string;
  status: string;
  title: string;
  public_message: string;
  window_start: string;
  window_end: string | null;
  started_at: string;
};

type Affected = {
  id: string;
  guild_id: string;
  user_id: string;
  category: string;
  detected_amount: number;
  proposed_correction: number;
  applied_correction?: number | null;
  waived_amount?: number;
  status: string;
};

export default function DeveloperIncidentPage() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [defaultMessage, setDefaultMessage] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [windowHours, setWindowHours] = useState(6);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [affected, setAffected] = useState<Affected[]>([]);
  const [storeTransfers, setStoreTransfers] = useState<{
    orders: any[];
    transfers: any[];
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/incident', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'load_failed');
      setIncident(data.incident ?? null);
      setDefaultMessage(data.defaultMessage || '');
      if (!publicMessage) setPublicMessage(data.defaultMessage || data.incident?.public_message || '');
      if (data.incident?.id) {
        const aRes = await fetch(
          `/api/developer/incident/rollback?incidentId=${data.incident.id}&kind=affected`,
          { cache: 'no-store' },
        );
        const aData = await aRes.json();
        if (aRes.ok) setAffected(aData.affected ?? []);
      } else {
        setAffected([]);
        setStoreTransfers(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [publicMessage]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runStopResume = async (action: 'stop' | 'resume') => {
    if (action === 'stop') {
      const ok = window.confirm(
        'GLOBAL STOP: Kazanç, mağaza, transfer ve site kapanacak (incident). Maintenance panel flag’leri değişmez. Devam?',
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        'RESUME: Incident kapanır; sunucu kazanç ayarları geri yüklenir. Panel maintenance toggle’larına dokunulmaz. Devam?',
      );
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/developer/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          publicMessage: publicMessage || defaultMessage,
          windowStartHours: windowHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setNote(
        action === 'stop'
          ? 'Incident aktif — kullanıcılar full-screen görüyor. Panel flag’leri değişmedi.'
          : 'Incident kapandı. Maintenance toggle’lar olduğu gibi bırakıldı.',
      );
      await refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(
        /missing_system_incident_table|schema cache|could not find the table/i.test(raw)
          ? 'system_incident tablosu yok. Supabase SQL Editor’da supabase/migrations/20260811180001_system_incident.sql dosyasını çalıştırın, sonra Schema Cache yenileyin.'
          : raw,
      );
    } finally {
      setBusy(false);
    }
  };

  const rollbackAction = async (
    action: 'preview_unsettled' | 'apply_unsettled' | 'preview_claimed' | 'apply_claimed',
  ) => {
    if (!incident) return;
    if (action.startsWith('apply')) {
      const ok = window.confirm('Seçili/önizlenen düzeltmeler uygulanacak. Emin misin?');
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const body: Record<string, unknown> = { incidentId: incident.id, action };
      if (action.startsWith('apply') && selected.size > 0) {
        body.ids = [...selected];
      }
      const res = await fetch('/api/developer/incident/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setNote(JSON.stringify(data));
      setSelected(new Set());
      const aRes = await fetch(
        `/api/developer/incident/rollback?incidentId=${incident.id}&kind=affected`,
        { cache: 'no-store' },
      );
      const aData = await aRes.json();
      if (aRes.ok) setAffected(aData.affected ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadStoreTransfers = async () => {
    if (!incident) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/developer/incident/rollback?incidentId=${incident.id}&kind=store_transfers`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setStoreTransfers({ orders: data.orders ?? [], transfers: data.transfers ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LuOctagonAlert className="text-rose-400" />
            Incident Control
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Tek tıkla global acil durdurma, etkilenen üye tespiti ve adil geri alma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <LuRefreshCw className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {note && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 break-all">
          {note}
        </div>
      )}

      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-rose-300/80 font-semibold">Durum</p>
            <p className="text-lg font-bold text-white mt-1">
              {incident ? (
                <span className="text-rose-300">AKTİF — {incident.title}</span>
              ) : (
                <span className="text-emerald-300">Sistem normal</span>
              )}
            </p>
            {incident && (
              <p className="text-xs text-white/40 mt-1">
                Pencere: {new Date(incident.window_start).toLocaleString('tr-TR')} →{' '}
                {incident.window_end
                  ? new Date(incident.window_end).toLocaleString('tr-TR')
                  : 'şimdi'}
              </p>
            )}
            <p className="text-xs text-white/35 mt-2 max-w-xl">
              STOP, maintenance panel’deki bot/tracking vb. toggle’ları açmaz. Modül bakımı için{' '}
              <a href="/developer/maintenance" className="text-[#a5b4ff] hover:underline">
                Maintenance
              </a>{' '}
              panelini kullanın.
            </p>
          </div>
          <div className="flex gap-2">
            {!incident ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void runStopResume('stop')}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? <LuLoader className="animate-spin" /> : <LuOctagonAlert />}
                GLOBAL STOP
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void runStopResume('resume')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? <LuLoader className="animate-spin" /> : <LuPlay />}
                RESUME
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/60">
            Kullanıcı mesajı
            <textarea
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
              rows={3}
              disabled={Boolean(incident)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
            />
          </label>
          <label className="block text-sm text-white/60">
            Geri alma penceresi (saat, STOP anından geriye)
            <input
              type="number"
              min={1}
              max={72}
              value={windowHours}
              disabled={Boolean(incident)}
              onChange={(e) => setWindowHours(Number(e.target.value) || 6)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
            />
          </label>
        </div>
      </div>

      {incident && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LuShield className="text-[#a5b4ff]" />
              Adil geri alma
            </h2>
            <p className="text-sm text-white/45">
              Önce önizleme, sonra onay. Unsettled cüzdana dokunmaz. Claimed clawback bakiyeyi 0 altına
              indirmez.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void rollbackAction('preview_unsettled')}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Preview unsettled
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void rollbackAction('apply_unsettled')}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Apply unsettled {selected.size ? `(${selected.size})` : '(all previewed)'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void rollbackAction('preview_claimed')}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Preview claimed
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void rollbackAction('apply_claimed')}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
              >
                Apply claimed {selected.size ? `(${selected.size})` : '(all previewed)'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-xs text-white/70">
                <thead className="bg-white/5 text-white/40 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Sel</th>
                    <th className="px-3 py-2">Guild</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Detected</th>
                    <th className="px-3 py-2">Correction</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {affected.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-white/30">
                        Henüz etkilenen yok — önce preview çalıştır.
                      </td>
                    </tr>
                  ) : (
                    affected.map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            disabled={row.status === 'applied' || row.status === 'waived'}
                            onChange={() => toggleSelect(row.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px]">{row.guild_id}</td>
                        <td className="px-3 py-2 font-mono text-[10px]">{row.user_id}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2 tabular-nums">{row.detected_amount}</td>
                        <td className="px-3 py-2 tabular-nums text-amber-200">
                          {row.proposed_correction}
                        </td>
                        <td className="px-3 py-2">{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LuStore className="text-amber-300" />
              Satın alma / transfer (liste — otomatik geri alma yok)
            </h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => void loadStoreTransfers()}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <LuWallet /> Pencereyi listele
              </span>
            </button>
            {storeTransfers && (
              <div className="grid gap-4 lg:grid-cols-2 text-xs text-white/60">
                <div>
                  <p className="font-semibold text-white/80 mb-2">
                    Orders ({storeTransfers.orders.length})
                  </p>
                  <ul className="space-y-1 max-h-48 overflow-auto">
                    {storeTransfers.orders.map((o) => (
                      <li key={o.id} className="font-mono text-[10px] border-b border-white/5 py-1">
                        {o.created_at} · {o.guild_id} · {o.user_id} · {o.amount} · {o.status}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white/80 mb-2">
                    Ledger transfers/purchases ({storeTransfers.transfers.length})
                  </p>
                  <ul className="space-y-1 max-h-48 overflow-auto">
                    {storeTransfers.transfers.map((t) => (
                      <li key={t.id} className="font-mono text-[10px] border-b border-white/5 py-1">
                        {t.created_at} · {t.type} · {t.user_id} · {t.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
