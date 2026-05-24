'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuTrophy, LuPlus, LuRefreshCw, LuBrain, LuPencil, LuTrash2, LuX } from 'react-icons/lu';

type QuizEvent = {
  id: string;
  scope: 'global' | 'guild';
  guild_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  total_questions: number;
  seconds_per_question: number;
  wrong_allowed: number;
  prize_pool_papel: number;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  checkpoints: Array<{ position: number; papel_reward: number; label?: string }>;
};

type CustomQuestion = {
  id: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  question_tr: string | null;
  options_tr: string[] | null;
  correct_index: number;
  is_ready: boolean;
};

export default function AdminQuizPage() {
  const [tab, setTab] = useState<'events' | 'questions'>('events');

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <LuTrophy className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-bold">Quiz Etkinlikleri (Sunucu)</h1>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setTab('events')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'events' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <LuTrophy className="h-4 w-4" /> Etkinlikler
        </button>
        <button
          onClick={() => setTab('questions')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'questions' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <LuBrain className="h-4 w-4" /> Sunucuya Özel Sorular
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
    start_at: '',
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
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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
          start_at: new Date(form.start_at).toISOString(),
          prize_pool_papel: Number(form.prize_pool_papel),
          checkpoints,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => load()}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black"
        >
          <LuPlus className="h-4 w-4" /> Yeni Etkinlik
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Başlık</th>
              <th className="px-3 py-2">Başlangıç</th>
              <th className="px-3 py-2">Havuz</th>
              <th className="px-3 py-2">Checkpoint</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-white/40">Yükleniyor...</td></tr>
            )}
            {!loading && events.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-white/40">Etkinlik yok</td></tr>
            )}
            {!loading && events.map((e) => (
              <tr key={e.id} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2">
                  <span className={`rounded-md border px-2 py-0.5 text-xs ${badgeStyle(e.status)}`}>{statusLabel(e.status)}</span>
                </td>
                <td className="px-3 py-2 text-white/90">{e.title}</td>
                <td className="px-3 py-2 text-white/60">{new Date(e.start_at).toLocaleString('tr-TR')}</td>
                <td className="px-3 py-2 text-amber-300">{Number(e.prize_pool_papel).toLocaleString('tr-TR')}</td>
                <td className="px-3 py-2 text-white/60">{e.checkpoints.map(c => `${c.position}→${c.papel_reward}`).join(' · ')}</td>
                <td className="px-3 py-2">
                  {e.status === 'scheduled' && (
                    <button onClick={() => cancel(e.id)} className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Yeni Etkinlik</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-white/70 sm:col-span-2">
                Başlık
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white" />
              </label>
              <label className="block text-sm text-white/70 sm:col-span-2">
                Açıklama
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white" />
              </label>
              <label className="block text-sm text-white/70">
                Başlangıç
                <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white" />
              </label>
              <label className="block text-sm text-white/70">
                Havuz (Papel)
                <input type="number" value={form.prize_pool_papel} onChange={(e) => setForm({ ...form, prize_pool_papel: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white" />
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
                      <input type="number" value={form[c.pos as keyof typeof form] as number} onChange={(e) => setForm({ ...form, [c.pos]: Number(e.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1 text-white" />
                    </label>
                    <label className="mt-1 block text-white/50">
                      Papel
                      <input type="number" value={form[c.rew as keyof typeof form] as number} onChange={(e) => setForm({ ...form, [c.rew]: Number(e.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-white/[0.03] p-1 text-white" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">İptal</button>
              <button onClick={create} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400">Oluştur</button>
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
  const [editing, setEditing] = useState<CustomQuestion | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quiz/questions', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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

  const save = async (q: CustomQuestion) => {
    if (!q.question_tr || !q.options_tr || q.options_tr.some((o) => !o.trim())) {
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
            id: q.id,
            category: q.category,
            difficulty: q.difficulty,
            question_tr: q.question_tr,
            options_tr: q.options_tr,
            correct_index: q.correct_index,
            is_ready: q.is_ready,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => load()} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>
        <button
          onClick={() =>
            setEditing({ id: '', category: '', difficulty: 'medium', question_tr: '', options_tr: ['', '', '', ''], correct_index: 0, is_ready: true })
          }
          className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white"
        >
          <LuPlus className="h-4 w-4" /> Yeni Soru
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Soru</th>
              <th className="px-3 py-2">Doğru</th>
              <th className="px-3 py-2">Zorluk</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && <tr><td colSpan={4} className="px-3 py-6 text-center text-white/40">Yükleniyor...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-white/40">Sunucuya özel soru yok</td></tr>}
            {!loading && items.map((q) => (
              <tr key={q.id} className="hover:bg-white/[0.02]">
                <td className="max-w-[400px] px-3 py-2 text-white/80"><div className="line-clamp-2">{q.question_tr}</div></td>
                <td className="px-3 py-2 text-white/70">{'ABCD'[q.correct_index]}</td>
                <td className="px-3 py-2 text-white/60">{q.difficulty ?? '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(q)} className="rounded-md p-1.5 text-white/60 hover:bg-white/10"><LuPencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(q.id)} className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10"><LuTrash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing.id ? 'Soruyu düzenle' : 'Yeni soru'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1 text-white/60 hover:bg-white/10"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-white/70">
                Soru
                <textarea
                  value={editing.question_tr ?? ''}
                  onChange={(e) => setEditing({ ...editing, question_tr: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                />
              </label>
              {(editing.options_tr ?? ['', '', '', '']).map((opt, i) => (
                <label key={i} className="block text-sm text-white/70">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-white/80">{'ABCD'[i]}</span>
                    <label className="ml-auto flex items-center gap-1 text-xs text-white/60">
                      <input type="radio" name="correct" checked={editing.correct_index === i} onChange={() => setEditing({ ...editing, correct_index: i })} className="accent-emerald-500" />
                      Doğru
                    </label>
                  </div>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...(editing.options_tr ?? ['', '', '', ''])];
                      next[i] = e.target.value;
                      setEditing({ ...editing, options_tr: next });
                    }}
                    className="w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white"
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-white/70">
                  Kategori
                  <input value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white" />
                </label>
                <label className="block text-sm text-white/70">
                  Zorluk
                  <select value={editing.difficulty ?? ''} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value as CustomQuestion['difficulty'] })} className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white">
                    <option value="">—</option>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">İptal</button>
              <button onClick={() => save(editing)} className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function badgeStyle(status: string) {
  switch (status) {
    case 'scheduled': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'live': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'finished': return 'bg-white/10 text-white/60 border-white/10';
    case 'cancelled': return 'bg-red-500/15 text-red-300 border-red-500/30';
    default: return 'bg-white/10 text-white/60 border-white/10';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'scheduled': return 'Planlandı';
    case 'live': return 'Canlı';
    case 'finished': return 'Bitti';
    case 'cancelled': return 'İptal';
    default: return status;
  }
}
