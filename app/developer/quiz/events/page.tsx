'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuTrophy, LuPlus, LuRefreshCw, LuX, LuCalendar, LuChartBar } from 'react-icons/lu';
import { apiErrorMessage } from '@/lib/apiError';

type Checkpoint = { position: number; papel_reward: number; label?: string };

type QuizEvent = {
  id: string;
  scope: 'global' | 'guild';
  guild_id: string | null;
  title: string;
  description: string | null;
  lang: string;
  start_at: string;
  end_at: string | null;
  total_questions: number;
  seconds_per_question: number;
  wrong_allowed: number;
  prize_pool_papel: number;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  current_position: number;
  paid_out_at: string | null;
  checkpoints: Checkpoint[];
};

type EventResults = {
  event: QuizEvent;
  summary: {
    participant_count: number;
    perfect_count: number;
    eliminated_count: number;
    total_papel_distributed: number;
    rewards_paid: boolean;
  };
  participants: Array<{
    user_id: string;
    username: string;
    guild_id: string | null;
    total_correct: number;
    wrong_count: number;
    last_position: number;
    eliminated_at: string | null;
    perfect_score: boolean;
    papel_earned: number;
    paid_out_at: string | null;
  }>;
};

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  'pt-br': 'Português (BR)',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

export default function QuizEventsPage() {
  const [events, setEvents] = useState<QuizEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resultsEventId, setResultsEventId] = useState<string | null>(null);
  const [results, setResults] = useState<EventResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [form, setForm] = useState({
    scope: 'global' as 'global' | 'guild',
    guild_id: '',
    title: 'Haftalık Quiz Etkinliği',
    description: '',
    lang: 'tr',
    start_at: '',
    total_questions: 25,
    seconds_per_question: 20,
    wrong_allowed: 3,
    prize_pool_papel: 50000,
    cp1_pos: 8,
    cp1_reward: 50,
    cp2_pos: 16,
    cp2_reward: 100,
    cp3_pos: 25,
    cp3_reward: 250,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/quiz/events', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setEvents(data.events ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createEvent = async () => {
    setError(null);
    setInfo(null);
    try {
      const checkpoints: Checkpoint[] = [
        { position: form.cp1_pos, papel_reward: form.cp1_reward, label: 'Checkpoint 1' },
        { position: form.cp2_pos, papel_reward: form.cp2_reward, label: 'Checkpoint 2' },
        { position: form.cp3_pos, papel_reward: form.cp3_reward, label: 'Final' },
      ].filter((c) => c.position > 0);

      const payload = {
        scope: form.scope,
        guild_id: form.scope === 'guild' ? form.guild_id.trim() : null,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        lang: form.lang.trim().toLowerCase(),
        start_at: new Date(form.start_at).toISOString(),
        total_questions: Number(form.total_questions),
        seconds_per_question: Number(form.seconds_per_question),
        wrong_allowed: Number(form.wrong_allowed),
        prize_pool_papel: Number(form.prize_pool_papel),
        checkpoints,
      };

      const res = await fetch('/api/developer/quiz/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setInfo('Etkinlik oluşturuldu');
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const loadResults = async (eventId: string) => {
    setResultsEventId(eventId);
    setResults(null);
    setResultsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/developer/quiz/events/${encodeURIComponent(eventId)}/results`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setResults(data as EventResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResultsEventId(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const closeResults = () => {
    setResultsEventId(null);
    setResults(null);
  };

  const cancelEvent = async (id: string) => {
    if (!confirm('Etkinliği iptal etmek istediğine emin misin?')) return;
    try {
      const res = await fetch('/api/developer/quiz/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <LuTrophy className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-bold">Quiz Etkinlikleri</h1>
        <button
          onClick={() => load()}
          className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.07]"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          <LuPlus className="h-4 w-4" /> Yeni Etkinlik
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{info}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Kapsam</th>
              <th className="px-3 py-2">Dil</th>
              <th className="px-3 py-2">Başlık</th>
              <th className="px-3 py-2">Başlangıç</th>
              <th className="px-3 py-2">Soru</th>
              <th className="px-3 py-2">Havuz</th>
              <th className="px-3 py-2">Checkpoint</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-white/40">Yükleniyor...</td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-white/40">Etkinlik yok</td>
              </tr>
            )}
            {!loading &&
              events.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <StatusBadge status={e.status} paidOut={!!e.paid_out_at} />
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    {e.scope === 'global' ? 'Global' : `Sunucu (${e.guild_id})`}
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{e.lang ?? 'tr'}</span>
                  </td>
                  <td className="px-3 py-2 text-white/90">{e.title}</td>
                  <td className="px-3 py-2 text-white/60">
                    <div className="flex items-center gap-1">
                      <LuCalendar className="h-3.5 w-3.5" />
                      {new Date(e.start_at).toLocaleString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-white/60">{e.total_questions}</td>
                  <td className="px-3 py-2 text-amber-300">{Number(e.prize_pool_papel).toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2 text-white/60">
                    {e.checkpoints.map((c) => `${c.position}→${c.papel_reward}`).join(' · ')}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {(e.status === 'finished' || e.status === 'cancelled' || e.status === 'live') && (
                        <button
                          type="button"
                          onClick={() => loadResults(e.id)}
                          className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 hover:bg-amber-500/20"
                        >
                          <LuChartBar className="h-3.5 w-3.5" /> Sonuçlar
                        </button>
                      )}
                      {e.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => cancelEvent(e.id)}
                          className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          İptal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {resultsEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-[#0f1116] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {results?.event.title ?? 'Etkinlik Sonuçları'}
                </h2>
                {results && (
                  <p className="mt-1 text-xs text-white/50">
                    {results.summary.participant_count} katılımcı ·{' '}
                    {results.summary.total_papel_distributed.toLocaleString('tr-TR')} papel dağıtıldı
                    {results.summary.rewards_paid ? ' · ödeme tamamlandı' : ' · ödeme bekleniyor'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeResults}
                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              {resultsLoading && (
                <p className="py-12 text-center text-sm text-white/40">Sonuçlar yükleniyor...</p>
              )}
              {!resultsLoading && results && (
                <>
                  {results.event.status === 'finished' && !results.summary.rewards_paid && (
                    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                      Papel tutarları ödeme cron&apos;u çalıştıktan sonra güncellenir. Doğru/yanlış sayıları şimdiden görülebilir.
                    </div>
                  )}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Katılımcı', value: results.summary.participant_count },
                      { label: 'Perfect', value: results.summary.perfect_count },
                      { label: 'Elenen', value: results.summary.eliminated_count },
                      {
                        label: 'Toplam Papel',
                        value: results.summary.total_papel_distributed.toLocaleString('tr-TR'),
                      },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-white/40">{s.label}</div>
                        <div className="mt-1 text-lg font-bold text-white">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {results.participants.length === 0 ? (
                    <p className="py-8 text-center text-sm text-white/40">Henüz katılımcı yok.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-[#0f1116] text-xs uppercase text-white/50">
                        <tr>
                          <th className="px-2 py-2">#</th>
                          <th className="px-2 py-2">Kullanıcı</th>
                          <th className="px-2 py-2 text-right">Doğru</th>
                          <th className="px-2 py-2 text-right">Yanlış</th>
                          <th className="px-2 py-2 text-right">Son poz.</th>
                          <th className="px-2 py-2 text-right">Papel</th>
                          <th className="px-2 py-2">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.participants.map((p, i) => (
                          <tr key={p.user_id} className="hover:bg-white/[0.02]">
                            <td className="px-2 py-2 text-white/40">{i + 1}</td>
                            <td className="px-2 py-2">
                              <div className="font-medium text-white/90">{p.username}</div>
                              <div className="font-mono text-[10px] text-white/30">{p.user_id}</div>
                            </td>
                            <td className="px-2 py-2 text-right text-emerald-300">{p.total_correct}</td>
                            <td className="px-2 py-2 text-right text-red-300/80">{p.wrong_count}</td>
                            <td className="px-2 py-2 text-right text-white/60">{p.last_position}</td>
                            <td className="px-2 py-2 text-right font-semibold text-amber-300">
                              {p.papel_earned.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-2 py-2">
                              {p.perfect_score ? (
                                <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-300">
                                  Perfect
                                </span>
                              ) : p.eliminated_at ? (
                                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                                  Elendi
                                </span>
                              ) : (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                                  Devam / bitti
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Yeni Quiz Etkinliği</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-white/70">
                Kapsam
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as 'global' | 'guild' })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                >
                  <option value="global">Global (tüm DiscoWeb)</option>
                  <option value="guild">Sunucu (per-guild)</option>
                </select>
              </label>
              {form.scope === 'guild' && (
                <label className="block text-sm text-white/70">
                  Guild ID
                  <input
                    value={form.guild_id}
                    onChange={(e) => setForm({ ...form, guild_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                  />
                </label>
              )}
              <label className="block text-sm text-white/70 sm:col-span-2">
                Başlık
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70 sm:col-span-2">
                Açıklama
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70">
                Dil
                <select
                  value={form.lang}
                  onChange={(e) => setForm({ ...form, lang: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                >
                  {Object.entries(LANG_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code})</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-white/40">
                  Soru bankasında bu dilde <strong>{form.total_questions}</strong> hazır soru olmalı, yoksa lock fail eder.
                </span>
              </label>
              <label className="block text-sm text-white/70">
                Başlangıç (yerel saat)
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70">
                Toplam Soru
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.total_questions}
                  onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70">
                Soru Başı Süre (sn)
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={form.seconds_per_question}
                  onChange={(e) => setForm({ ...form, seconds_per_question: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70">
                Yanlış Hakkı
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.wrong_allowed}
                  onChange={(e) => setForm({ ...form, wrong_allowed: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/70">
                Havuz (Papel)
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.prize_pool_papel}
                  onChange={(e) => setForm({ ...form, prize_pool_papel: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 text-xs font-semibold uppercase text-white/50">Checkpoint Ödülleri</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'CP 1', pos: 'cp1_pos', rew: 'cp1_reward' },
                  { label: 'CP 2', pos: 'cp2_pos', rew: 'cp2_reward' },
                  { label: 'Final', pos: 'cp3_pos', rew: 'cp3_reward' },
                ].map((c) => (
                  <div key={c.label} className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs">
                    <div className="text-white/60">{c.label}</div>
                    <label className="mt-1 block text-white/50">
                      Pozisyon
                      <input
                        type="number"
                        value={form[c.pos as keyof typeof form] as number}
                        onChange={(e) => setForm({ ...form, [c.pos]: Number(e.target.value) })}
                        className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1 text-white"
                      />
                    </label>
                    <label className="mt-1 block text-white/50">
                      Papel
                      <input
                        type="number"
                        value={form[c.rew as keyof typeof form] as number}
                        onChange={(e) => setForm({ ...form, [c.rew]: Number(e.target.value) })}
                        className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1 text-white"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                İptal
              </button>
              <button
                onClick={createEvent}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, paidOut }: { status: string; paidOut?: boolean }) {
  const palette: Record<string, string> = {
    scheduled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    live: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    finished: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
    cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  const labels: Record<string, string> = {
    scheduled: 'Planlandı',
    live: 'Canlı',
    finished: 'Tamamlandı',
    cancelled: 'İptal',
  };
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${palette[status] ?? 'bg-white/10 text-white/60'}`}>
        {labels[status] ?? status}
      </span>
      {status === 'finished' && paidOut && (
        <span className="text-[10px] text-emerald-400/80">Ödendi</span>
      )}
      {status === 'finished' && !paidOut && (
        <span className="text-[10px] text-amber-400/70">Ödeme bekliyor</span>
      )}
    </span>
  );
}
