'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useState, useEffect, useCallback } from 'react';
import { LuBug, LuMessageSquare } from 'react-icons/lu';

type ReportAdminItem = {
  id: string;
  user_id: string;
  guild_id: string | null;
  type: 'bug' | 'suggestion';
  section: string | null;
  description: string;
  status: string;
  dev_note: string | null;
  created_at: string;
};

const REPORT_STATUS_OPTIONS = [
  { value: 'reviewing',     label: t('developer.reports.status_reviewing'),     cls: 'border-amber-400/25 bg-amber-500/10 text-amber-300' },
  { value: 'need_info',     label: t('developer.reports.status_need_info'),cls: 'border-blue-400/25 bg-blue-500/10 text-blue-300' },
  { value: 'critical',      label: t('developer.reports.status_critical'),     cls: 'border-red-400/25 bg-red-500/10 text-red-300' },
  { value: 'fixed_pending', label: t('developer.reports.status_fixed_pending'),    cls: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300' },
  { value: 'planned_next',  label: t('developer.reports.status_planned'),    cls: 'border-teal-400/25 bg-teal-500/10 text-teal-300' },
  { value: 'long_term',     label: t('developer.reports.status_long_term'),     cls: 'border-purple-400/25 bg-purple-500/10 text-purple-300' },
  { value: 'resolved',      label: t('developer.reports.status_resolved'),      cls: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' },
  { value: 'not_found',     label: t('developer.reports.status_not_found'),      cls: 'border-red-400/25 bg-red-500/10 text-red-300' },
  { value: 'duplicate',     label: t('developer.reports.status_duplicate'),     cls: 'border-white/10 bg-white/5 text-white/50' },
  { value: 'invalid',       label: t('developer.reports.status_invalid'),        cls: 'border-white/10 bg-white/5 text-white/30' },
  { value: 'closed',        label: t('developer.reports.status_closed'),       cls: 'border-white/10 bg-white/5 text-white/30' },
];

const REPORT_STATUS_BADGE: Record<string, string> = {
  open:          'border-orange-400/30 bg-orange-500/10 text-orange-300',
  reviewing:     'border-amber-400/30 bg-amber-500/10 text-amber-300',
  need_info:     'border-blue-400/30 bg-blue-500/10 text-blue-300',
  critical:      'border-red-400/30 bg-red-500/10 text-red-300',
  fixed_pending: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
  planned_next:  'border-teal-400/30 bg-teal-500/10 text-teal-300',
  long_term:     'border-purple-400/30 bg-purple-500/10 text-purple-300',
  resolved:      'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  not_found:     'border-red-400/30 bg-red-500/10 text-red-300',
  duplicate:     'border-white/10 bg-white/5 text-white/50',
  invalid:       'border-white/10 bg-white/5 text-white/30',
  closed:        'border-white/10 bg-white/5 text-white/25',
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportAdminItem[]>([]);
  const [filter, setFilter] = useState('open');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchReports = useCallback(async (statusF: string, typeF: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?status=${statusF}&type=${typeF}&limit=100`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setReports(data.reports ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(filter, typeFilter);
  }, [filter, typeFilter, fetchReports]);

  const updateReport = async (id: string, status: string, note?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status, ...(note ? { dev_note: note } : {}) } : r));
      if (note) {
        setNoteInputs(p => ({ ...p, [id]: '' }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20">
          <LuBug className="h-5 w-5 text-[#7289da]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('developer.reports.title')}</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{t('developer.reports.subtitle')}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex flex-wrap gap-2">
            {['open', 'reviewing', 'need_info', 'resolved', 'closed', 'all'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${filter === s ? 'border-orange-400/40 bg-orange-500/15 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : 'border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[{ v: 'all', l: t('developer.common.all') }, { v: 'bug', l: t('developer.reports.filter_bug') }, { v: 'suggestion', l: t('developer.reports.filter_suggestion') }].map(({ v, l }) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${typeFilter === v ? 'border-[#5865F2]/40 bg-[#5865F2]/15 text-[#7289da]' : 'border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* List */}
        <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <p className="text-sm text-white/40 text-center py-8">{t('developer.common.loading')}</p>
          ) : reports.length > 0 ? (
            reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-md">{r.type === 'bug' ? '🐛' : '💡'}</span>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase ${REPORT_STATUS_BADGE[r.status] ?? 'border-white/10 text-white/30'}`}>
                          {r.status}
                        </span>
                        {r.section && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] text-white/50">{r.section}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-white/40">
                        <span>{t('developer.reports.sender')} <strong className="text-white/70">{r.user_id}</strong></span>
                        {r.guild_id && <span>Sunucu: <strong className="text-white/70">{r.guild_id}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-white/30 bg-black/40 px-2.5 py-1 rounded-lg">
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>

                {/* Description */}
                <div className="px-5 pb-4">
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                    {r.description}
                  </p>
                </div>

                {/* Dev note */}
                {r.dev_note && (
                  <div className="mx-5 mb-4 rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/5 px-4 py-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#5865F2]" />
                    <p className="text-xs text-[#7289da] font-bold mb-1">{t('developer.reports.dev_note')}</p>
                    <p className="text-[13px] text-white/70 leading-relaxed">{r.dev_note}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-white/5 bg-black/40 px-5 py-4 flex flex-col gap-3 mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {REPORT_STATUS_OPTIONS.map((opt) => (
                      <button key={opt.value}
                        disabled={r.status === opt.value || updatingId === r.id}
                        onClick={() => updateReport(r.id, opt.value)}
                        className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-40 ${opt.cls} hover:opacity-80`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('developer.reports.note_placeholder')}
                      value={noteInputs[r.id] ?? ''}
                      onChange={(e) => setNoteInputs((p) => ({ ...p, [r.id]: e.target.value }))}
                      className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#5865F2]/50 transition-colors"
                    />
                    <button
                      disabled={!noteInputs[r.id] || updatingId === r.id}
                      onClick={() => updateReport(r.id, r.status, noteInputs[r.id])}
                      className="shrink-0 flex items-center gap-2 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/15 hover:bg-[#5865F2]/25 px-4 py-2.5 text-xs font-bold text-[#7289da] transition disabled:opacity-40">
                      <LuMessageSquare className="w-4 h-4" /> Not Ekle
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
              <LuBug className="w-12 h-12 text-white/10" />
              <p className="text-sm font-medium">{t('developer.reports.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
