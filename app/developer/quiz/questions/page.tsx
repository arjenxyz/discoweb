'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuBrain, LuCheck, LuRefreshCw, LuSearch, LuTrash2, LuUpload, LuPencil, LuX } from 'react-icons/lu';

type Question = {
  id: string;
  source: string;
  source_external_id: string | null;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  question_en: string | null;
  options_en: string[] | null;
  question_tr: string | null;
  options_tr: string[] | null;
  correct_index: number;
  is_ready: boolean;
  is_custom_for_guild_id: string | null;
  updated_at: string;
};

type ListResponse = {
  questions: Question[];
  total: number;
  limit: number;
  offset: number;
};

export default function QuizQuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [onlyReady, setOnlyReady] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Question | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/developer/quiz/questions', window.location.origin);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));
      if (onlyReady) url.searchParams.set('onlyReady', '1');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = (await res.json()) as ListResponse | { error: string };
      if (!res.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : `HTTP ${res.status}`);
      }
      setItems(data.questions);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [offset, onlyReady]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setError(null);
    setInfo(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [];
      if (arr.length === 0) throw new Error('JSON boş veya array değil');
      const payload = {
        action: 'import' as const,
        questions: arr.map((q: Record<string, unknown>) => ({
          source_external_id: (q.id as string) || (q.source_external_id as string),
          category: q.category as string | undefined,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard' | undefined,
          question_en: q.question_en as string,
          options_en: q.options_en as string[],
          correct_index: q.correct_index as number,
          question_tr: q.question_tr as string | undefined,
          options_tr: q.options_tr as string[] | undefined,
          is_ready: q.is_ready === true,
        })),
      };
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setInfo(`Başarılı: ${data.imported} satır yüklendi/güncellendi.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = items.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (q.question_tr ?? '').toLowerCase().includes(s) ||
      (q.question_en ?? '').toLowerCase().includes(s) ||
      (q.category ?? '').toLowerCase().includes(s)
    );
  });

  const closeEditor = () => setEditing(null);

  const saveEditor = async (q: Question) => {
    if (!q.question_tr || !q.options_tr || q.options_tr.some((o) => !o.trim())) {
      setError('Türkçe soru ve 4 şık dolu olmalı');
      return;
    }
    try {
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          question: {
            id: q.id,
            question_tr: q.question_tr,
            options_tr: q.options_tr,
            correct_index: q.correct_index,
            is_ready: q.is_ready,
            category: q.category,
            difficulty: q.difficulty,
            question_en: q.question_en,
            options_en: q.options_en,
            is_custom_for_guild_id: q.is_custom_for_guild_id,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      closeEditor();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteOne = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğine emin misin?')) return;
    try {
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <LuBrain className="h-6 w-6 text-indigo-400" />
        <h1 className="text-2xl font-bold">Quiz Soru Bankası</h1>
        <span className="ml-auto text-sm text-white/60">Toplam: {total}</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{info}</div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <LuSearch className="h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sorularda ara..."
            className="bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={onlyReady}
            onChange={(e) => {
              setOffset(0);
              setOnlyReady(e.target.checked);
            }}
            className="accent-indigo-500"
          />
          Sadece hazır olanlar
        </label>

        <button
          onClick={() => load()}
          className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.07]"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/25 disabled:opacity-50"
        >
          <LuUpload className="h-4 w-4" /> {importing ? 'Yükleniyor...' : 'JSON Yükle (raw-en.json veya tr.json)'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Hazır</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Zorluk</th>
              <th className="px-3 py-2">TR Soru</th>
              <th className="px-3 py-2">EN Soru</th>
              <th className="px-3 py-2">Doğru</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-white/40">
                  Yükleniyor...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-white/40">
                  Soru bulunamadı. JSON yükle veya yeni soru oluştur.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((q) => (
                <tr key={q.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    {q.is_ready ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        <LuCheck className="h-3 w-3" /> Hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                        Beklemede
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white/60">{q.category ?? '—'}</td>
                  <td className="px-3 py-2 text-white/60">{q.difficulty ?? '—'}</td>
                  <td className="max-w-[260px] px-3 py-2 text-white/80">
                    <div className="line-clamp-2">{q.question_tr || <span className="text-white/30">— çevrilmemiş —</span>}</div>
                  </td>
                  <td className="max-w-[260px] px-3 py-2 text-white/50">
                    <div className="line-clamp-2">{q.question_en ?? '—'}</div>
                  </td>
                  <td className="px-3 py-2 text-white/70">{'ABCD'[q.correct_index] ?? '?'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(q)}
                        className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                        title="Düzenle"
                      >
                        <LuPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteOne(q.id)}
                        className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10"
                        title="Sil"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
          className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70 disabled:opacity-30"
        >
          ← Önceki
        </button>
        <span className="text-xs text-white/50">
          {offset + 1} - {Math.min(offset + limit, total)} / {total}
        </span>
        <button
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
          className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70 disabled:opacity-30"
        >
          Sonraki →
        </button>
      </div>

      {editing && <Editor question={editing} onClose={closeEditor} onSave={saveEditor} />}
    </div>
  );
}

function Editor({
  question,
  onClose,
  onSave,
}: {
  question: Question;
  onClose: () => void;
  onSave: (q: Question) => void;
}) {
  const [draft, setDraft] = useState<Question>(() => ({
    ...question,
    question_tr: question.question_tr ?? '',
    options_tr: (question.options_tr ?? ['', '', '', '']).slice(0, 4) as string[],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Soruyu düzenle</h2>
          <button onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {draft.question_en && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-white/50">
              <div className="font-semibold text-white/60">EN: {draft.question_en}</div>
              <ul className="mt-2 space-y-0.5">
                {draft.options_en?.map((o, i) => (
                  <li key={i} className={i === draft.correct_index ? 'text-emerald-300' : ''}>
                    {'ABCD'[i]}: {o} {i === draft.correct_index && '(doğru)'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="block text-sm text-white/70">
            TR Soru
            <textarea
              value={draft.question_tr ?? ''}
              onChange={(e) => setDraft({ ...draft, question_tr: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>

          {(draft.options_tr ?? ['', '', '', '']).map((opt, i) => (
            <label key={i} className="block text-sm text-white/70">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold text-white/80">{'ABCD'[i]}</span>
                <label className="ml-auto flex items-center gap-1 text-xs text-white/60">
                  <input
                    type="radio"
                    name="correct"
                    checked={draft.correct_index === i}
                    onChange={() => setDraft({ ...draft, correct_index: i })}
                    className="accent-emerald-500"
                  />
                  Doğru cevap
                </label>
              </div>
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...(draft.options_tr ?? ['', '', '', ''])];
                  next[i] = e.target.value;
                  setDraft({ ...draft, options_tr: next });
                }}
                className="w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </label>
          ))}

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={draft.is_ready}
              onChange={(e) => setDraft({ ...draft, is_ready: e.target.checked })}
              className="accent-emerald-500"
            />
            Çeviri tamam, quiz'lerde kullanılabilir (is_ready)
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(draft)}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
