'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuTrophy, LuPlus, LuRefreshCw, LuBrain, LuPencil, LuTrash2, LuX } from 'react-icons/lu';
import { apiErrorMessage } from '@/lib/apiError';

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
  checkpoints: Array<{ position: number; papel_reward: number; label?: string }>;
};

type Translation = { lang: string; question: string; options: string[]; is_ready: boolean };

type CustomQuestion = {
  id: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  correct_index: number;
  translations: Translation[];
};

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  'pt-br': 'Português (BR)',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

export default function AdminQuizPage() {
  const [tab, setTab] = useState<'events' | 'questions'>('events');

  return (
    <div className="min-w-0 text-white">
      <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:items-center">
        <LuTrophy className="mt-0.5 h-6 w-6 shrink-0 text-amber-400 sm:mt-0" />
        <h1 className="text-xl font-bold leading-tight sm:text-2xl">Quiz Etkinlikleri (Sunucu)</h1>
      </div>

      <div className="mb-5 flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:mb-6 sm:inline-flex sm:w-auto sm:overflow-visible">
        <button
          type="button"
          onClick={() => setTab('events')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:justify-start sm:px-4 ${
            tab === 'events' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <LuTrophy className="h-4 w-4 shrink-0" />
          <span className="truncate">Etkinlikler</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('questions')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:justify-start sm:px-4 ${
            tab === 'questions' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <LuBrain className="h-4 w-4 shrink-0" />
          <span className="truncate">Özel Sorular</span>
        </button>
      </div>

      {tab === 'events' && <EventsPanel />}
      {tab === 'questions' && <CustomQuestionsPanel />}
    </div>
  );
}

function EventsPanel() {
  const [events, setEvents] = useState<QuizEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: 'Sunucu Quiz Etkinliği',
    description: '',
    lang: 'tr',
    start_at: '',
    total_questions: 25,
    seconds_per_question: 20,
    wrong_allowed: 3,
    prize_pool_papel: 5000,
    cp1_pos: 8,
    cp1_reward: 25,
    cp2_pos: 16,
    cp2_reward: 50,
    cp3_pos: 25,
    cp3_reward: 100,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quiz/events', { cache: 'no-store' });
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

  const create = async () => {
    setError(null);
    try {
      const checkpoints = [
        { position: form.cp1_pos, papel_reward: form.cp1_reward, label: 'Checkpoint 1' },
        { position: form.cp2_pos, papel_reward: form.cp2_reward, label: 'Checkpoint 2' },
        { position: form.cp3_pos, papel_reward: form.cp3_reward, label: 'Final' },
      ];
      const res = await fetch('/api/admin/quiz/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          lang: form.lang.toLowerCase(),
          start_at: new Date(form.start_at).toISOString(),
          total_questions: Number(form.total_questions),
          seconds_per_question: Number(form.seconds_per_question),
          wrong_allowed: Number(form.wrong_allowed),
          prize_pool_papel: Number(form.prize_pool_papel),
          checkpoints,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const cancel = async (id: string) => {
    if (!confirm('İptal edilsin mi?')) return;
    await fetch('/api/admin/quiz/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    });
    await load();
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80 sm:justify-start"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-semibold text-black sm:ml-auto"
        >
          <LuPlus className="h-4 w-4" /> Yeni Etkinlik
        </button>
      </div>

      {error && (
        <div className="mb-4 break-words rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
            Yükleniyor...
          </div>
        )}
        {!loading && events.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
            Etkinlik yok
          </div>
        )}
        {!loading &&
          events.map((e) => (
            <article key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${badgeStyle(e.status)}`}>
                      {statusLabel(e.status)}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/70">
                      {e.lang ?? 'tr'}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-semibold text-white">{e.title}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {new Date(e.start_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                {e.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => cancel(e.id)}
                    className="shrink-0 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    İptal
                  </button>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <dt className="text-white/40">Soru</dt>
                  <dd className="mt-0.5 font-medium text-white/85">{e.total_questions}</dd>
                </div>
                <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <dt className="text-white/40">Havuz</dt>
                  <dd className="mt-0.5 font-medium text-amber-300">
                    {Number(e.prize_pool_papel).toLocaleString('tr-TR')}
                  </dd>
                </div>
                <div className="col-span-2 rounded-xl bg-white/[0.04] px-3 py-2">
                  <dt className="text-white/40">Checkpoint</dt>
                  <dd className="mt-0.5 break-words text-white/70">
                    {e.checkpoints.map((c) => `${c.position}→${c.papel_reward}`).join(' · ') || '—'}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Durum</th>
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
                <td colSpan={8} className="px-3 py-6 text-center text-white/40">
                  Yükleniyor...
                </td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-white/40">
                  Etkinlik yok
                </td>
              </tr>
            )}
            {!loading &&
              events.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${badgeStyle(e.status)}`}>
                      {statusLabel(e.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{e.lang ?? 'tr'}</span>
                  </td>
                  <td className="px-3 py-2 text-white/90">{e.title}</td>
                  <td className="px-3 py-2 text-white/60">
                    {new Date(e.start_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2 text-white/70">{e.total_questions}</td>
                  <td className="px-3 py-2 text-amber-300">
                    {Number(e.prize_pool_papel).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2 text-white/60">
                    {e.checkpoints.map((c) => `${c.position}→${c.papel_reward}`).join(' · ')}
                  </td>
                  <td className="px-3 py-2">
                    {e.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => cancel(e.id)}
                        className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        İptal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0f1116] shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-white">Yeni Etkinlik</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70 sm:col-span-2">
                  Başlık
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70 sm:col-span-2">
                  Açıklama
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Dil
                  <select
                    value={form.lang}
                    onChange={(e) => setForm({ ...form, lang: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  >
                    {Object.entries(LANG_LABELS).map(([c, l]) => (
                      <option key={c} value={c}>
                        {l} ({c})
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-white/40">
                    Soru havuzunda bu dilde <strong>{form.total_questions}</strong> hazır soru olmalı.
                  </span>
                </label>
                <label className="block text-sm text-white/70">
                  Toplam Soru
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.total_questions}
                    onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Soru Başı Süre (sn)
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={form.seconds_per_question}
                    onChange={(e) =>
                      setForm({ ...form, seconds_per_question: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Yanlış Hakkı
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.wrong_allowed}
                    onChange={(e) => setForm({ ...form, wrong_allowed: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Başlangıç
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Havuz (Papel)
                  <input
                    type="number"
                    value={form.prize_pool_papel}
                    onChange={(e) => setForm({ ...form, prize_pool_papel: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
              </div>
              <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-white/50">
                  Checkpoint Ödülleri
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'CP 1', pos: 'cp1_pos', rew: 'cp1_reward' },
                    { label: 'CP 2', pos: 'cp2_pos', rew: 'cp2_reward' },
                    { label: 'Final', pos: 'cp3_pos', rew: 'cp3_reward' },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs"
                    >
                      <div className="text-white/60">{c.label}</div>
                      <label className="mt-1 block text-white/50">
                        Pozisyon
                        <input
                          type="number"
                          value={form[c.pos as keyof typeof form] as number}
                          onChange={(e) => setForm({ ...form, [c.pos]: Number(e.target.value) })}
                          className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1.5 text-white"
                        />
                      </label>
                      <label className="mt-1 block text-white/50">
                        Papel
                        <input
                          type="number"
                          value={form[c.rew as keyof typeof form] as number}
                          onChange={(e) => setForm({ ...form, [c.rew]: Number(e.target.value) })}
                          className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1.5 text-white"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={create}
                className="rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
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

function CustomQuestionsPanel() {
  const [items, setItems] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [editingLang, setEditingLang] = useState<string>('tr');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quiz/questions', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setItems(data.questions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (q: EditDraft) => {
    if (!q.question.trim() || q.options.some((o) => !o.trim())) {
      setError('Soru ve 4 şık dolu olmalı');
      return;
    }
    try {
      const res = await fetch('/api/admin/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          question: {
            id: q.id || undefined,
            category: q.category,
            difficulty: q.difficulty,
            correct_index: q.correct_index,
            translations: {
              [editingLang]: {
                question: q.question,
                options: q.options,
                is_ready: q.is_ready,
              },
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, `HTTP ${res.status}`));
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Silinsin mi?')) return;
    await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    await load();
  };

  const openEdit = (q: CustomQuestion | null) => {
    if (q) {
      const t = q.translations.find((tr) => tr.lang === editingLang) ?? q.translations[0];
      setEditing({
        id: q.id,
        category: q.category,
        difficulty: q.difficulty,
        correct_index: q.correct_index,
        question: t?.question ?? '',
        options: t?.options ?? ['', '', '', ''],
        is_ready: t?.is_ready ?? true,
      });
      if (t?.lang) setEditingLang(t.lang);
    } else {
      setEditing({
        id: '',
        category: '',
        difficulty: 'medium',
        correct_index: 0,
        question: '',
        options: ['', '', '', ''],
        is_ready: true,
      });
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80 sm:justify-start"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/70">
          <span className="shrink-0 text-xs text-white/40">Editör dili:</span>
          <select
            value={editingLang}
            onChange={(e) => setEditingLang(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-white focus:outline-none"
          >
            {Object.entries(LANG_LABELS).map(([c, l]) => (
              <option key={c} value={c} className="bg-[#0f1116]">
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => openEdit(null)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white sm:ml-auto"
        >
          <LuPlus className="h-4 w-4" /> Yeni Soru
        </button>
      </div>

      {error && (
        <div className="mb-4 break-words rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
            Yükleniyor...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
            Sunucuya özel soru yok
          </div>
        )}
        {!loading &&
          items.map((q) => {
            const t = q.translations.find((tr) => tr.lang === editingLang);
            return (
              <article key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {q.translations.map((tr) => (
                        <span
                          key={tr.lang}
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            tr.is_ready
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {tr.lang}
                        </span>
                      ))}
                    </div>
                    <p className="line-clamp-3 text-sm text-white/85">
                      {t?.question || (
                        <span className="text-white/30">— bu dilde çevrilmemiş —</span>
                      )}
                    </p>
                    <p className="mt-2 text-xs text-white/40">
                      Doğru: {'ABCD'[q.correct_index]} · {q.difficulty ?? '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(q)}
                      className="rounded-md p-2 text-white/60 hover:bg-white/10"
                    >
                      <LuPencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(q.id)}
                      className="rounded-md p-2 text-red-300 hover:bg-red-500/10"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Diller</th>
              <th className="px-3 py-2">Soru ({editingLang})</th>
              <th className="px-3 py-2">Doğru</th>
              <th className="px-3 py-2">Zorluk</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-white/40">
                  Yükleniyor...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-white/40">
                  Sunucuya özel soru yok
                </td>
              </tr>
            )}
            {!loading &&
              items.map((q) => {
                const t = q.translations.find((tr) => tr.lang === editingLang);
                return (
                  <tr key={q.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-white/60">
                      <div className="flex flex-wrap gap-1">
                        {q.translations.map((tr) => (
                          <span
                            key={tr.lang}
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              tr.is_ready
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {tr.lang}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="max-w-[400px] px-3 py-2 text-white/80">
                      <div className="line-clamp-2">
                        {t?.question || (
                          <span className="text-white/30">— bu dilde çevrilmemiş —</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-white/70">{'ABCD'[q.correct_index]}</td>
                    <td className="px-3 py-2 text-white/60">{q.difficulty ?? '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(q)}
                          className="rounded-md p-1.5 text-white/60 hover:bg-white/10"
                        >
                          <LuPencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(q.id)}
                          className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0f1116] shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editing.id ? 'Soruyu düzenle' : 'Yeni soru'}
                </h2>
                <p className="text-xs text-white/50">
                  Dil:{' '}
                  <span className="font-mono text-indigo-300">
                    {LANG_LABELS[editingLang] ?? editingLang}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md p-1 text-white/60 hover:bg-white/10"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              <label className="block text-sm text-white/70">
                Soru
                <textarea
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                />
              </label>
              {editing.options.map((opt, i) => (
                <label key={i} className="block text-sm text-white/70">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-white/80">{'ABCD'[i]}</span>
                    <label className="ml-auto flex items-center gap-1 text-xs text-white/60">
                      <input
                        type="radio"
                        name="correct"
                        checked={editing.correct_index === i}
                        onChange={() => setEditing({ ...editing, correct_index: i })}
                        className="accent-emerald-500"
                      />
                      Doğru
                    </label>
                  </div>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...editing.options];
                      next[i] = e.target.value;
                      setEditing({ ...editing, options: next });
                    }}
                    className="w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
              ))}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Kategori
                  <input
                    value={editing.category ?? ''}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Zorluk
                  <select
                    value={editing.difficulty ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        difficulty: (e.target.value || null) as EditDraft['difficulty'],
                      })
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white"
                  >
                    <option value="">—</option>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={editing.is_ready}
                  onChange={(e) => setEditing({ ...editing, is_ready: e.target.checked })}
                  className="accent-emerald-500"
                />
                Bu dilde hazır (is_ready)
              </label>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => save(editing)}
                className="rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type EditDraft = {
  id: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  correct_index: number;
  question: string;
  options: string[];
  is_ready: boolean;
};

function badgeStyle(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'live':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'finished':
      return 'bg-white/10 text-white/60 border-white/10';
    case 'cancelled':
      return 'bg-red-500/15 text-red-300 border-red-500/30';
    default:
      return 'bg-white/10 text-white/60 border-white/10';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'scheduled':
      return 'Planlandı';
    case 'live':
      return 'Canlı';
    case 'finished':
      return 'Bitti';
    case 'cancelled':
      return 'İptal';
    default:
      return status;
  }
}
