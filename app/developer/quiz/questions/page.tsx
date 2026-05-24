'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuBrain, LuCheck, LuRefreshCw, LuSearch, LuTrash2, LuUpload, LuPencil, LuX, LuDatabase, LuLanguages, LuPlus } from 'react-icons/lu';

type Translation = {
  lang: string;
  question: string;
  options: string[];
  is_ready: boolean;
};

type Question = {
  id: string;
  source: string;
  source_external_id: string | null;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  correct_index: number;
  is_custom_for_guild_id: string | null;
  updated_at: string;
  translations: Translation[];
};

type ListResponse = {
  questions: Question[];
  total: number;
  limit: number;
  offset: number;
  available_langs: string[];
  current_lang: string;
};

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  'pt-br': 'Português (BR)',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code.toUpperCase();
}

export default function QuizQuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing'>('all');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<string>('tr');
  const [availableLangs, setAvailableLangs] = useState<string[]>(['tr', 'en']);
  const [editing, setEditing] = useState<Question | null>(null);
  const bankFileRef = useRef<HTMLInputElement>(null);
  const transFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/developer/quiz/questions', window.location.origin);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('lang', lang);
      if (filter === 'ready') url.searchParams.set('onlyReady', '1');
      else if (filter === 'missing') url.searchParams.set('onlyMissing', '1');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = (await res.json()) as ListResponse | { error: string };
      if (!res.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : `HTTP ${res.status}`);
      }
      setItems(data.questions);
      setTotal(data.total);
      setAvailableLangs(data.available_langs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [offset, lang, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImportBank = async (file: File) => {
    setImporting(true);
    setError(null);
    setInfo(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : null;
      if (!arr || arr.length === 0) throw new Error('bank.json bir array olmalı');
      // bank.json formatını doğrula: ilk kayıt id + correct_index + category içermeli
      const first = arr[0] as Record<string, unknown>;
      if (typeof first.correct_index !== 'number' || (first as { question?: unknown }).question !== undefined) {
        throw new Error('Bu bir bank.json değil. Çeviri yüklemek için "Çeviri Yükle" butonunu kullan.');
      }
      const payload = {
        action: 'import_bank' as const,
        questions: arr.map((q: Record<string, unknown>) => ({
          id: q.id as string,
          source_external_id: (q.source_external_id as string) ?? (q.id as string),
          category: q.category as string | undefined,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard' | undefined,
          correct_index: q.correct_index as number,
        })),
      };
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setInfo(`Ana banka: ${data.imported} kayıt eklendi/güncellendi.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (bankFileRef.current) bankFileRef.current.value = '';
    }
  };

  const handleImportTranslation = async (file: File) => {
    setImporting(true);
    setError(null);
    setInfo(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { lang?: string; questions?: unknown[] };
      if (!parsed.lang || !Array.isArray(parsed.questions)) {
        throw new Error('lang-XX.json formatı bekleniyor: { lang: "tr", questions: [...] }');
      }
      const fileLang = parsed.lang.toLowerCase();
      const confirmMsg = `"${file.name}" dosyası '${fileLang}' dili olarak ${parsed.questions.length} çeviri içeriyor.\n\nUyarı: aynı dilde mevcut çeviriler ÜZERİNE YAZILACAK.\n\nDevam edilsin mi?`;
      if (!confirm(confirmMsg)) {
        setImporting(false);
        if (transFileRef.current) transFileRef.current.value = '';
        return;
      }
      const payload = {
        action: 'import_translation' as const,
        lang: fileLang,
        questions: parsed.questions.map((q) => {
          const x = q as { id: string; question: string; options: string[]; is_ready?: boolean };
          return { id: x.id, question: x.question, options: x.options, is_ready: x.is_ready === true };
        }),
      };
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const skippedMsg = data.skipped > 0 ? ` (${data.skipped} kayıt bank'ta yok, atlandı — önce bank.json yükle)` : '';
      setInfo(`Çeviri (${fileLang}): ${data.imported} kayıt eklendi/güncellendi${skippedMsg}.`);
      setLang(fileLang);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (transFileRef.current) transFileRef.current.value = '';
    }
  };

  const addLanguage = () => {
    const code = prompt('Yeni dil kodu (ör: pt-br, es, de, fr)')?.trim().toLowerCase();
    if (!code) return;
    if (!/^[a-z]{2}(-[a-z0-9]{2,8})?$/i.test(code)) {
      alert('Geçersiz dil kodu. Örnek: tr, en, pt-br, es, de');
      return;
    }
    setLang(code);
    if (!availableLangs.includes(code)) setAvailableLangs([...availableLangs, code]);
  };

  const filtered = items.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const tr = q.translations.find((t) => t.lang === lang)?.question?.toLowerCase() ?? '';
    const enT = q.translations.find((t) => t.lang === 'en')?.question?.toLowerCase() ?? '';
    return (
      tr.includes(s) ||
      enT.includes(s) ||
      (q.category ?? '').toLowerCase().includes(s)
    );
  });

  const closeEditor = () => setEditing(null);

  const saveEditor = async (q: Question, draft: { question: string; options: string[]; is_ready: boolean }) => {
    if (!draft.question.trim() || draft.options.some((o) => !o.trim())) {
      setError(`${langLabel(lang)} sorusu ve 4 şık dolu olmalı`);
      return;
    }
    try {
      const res = await fetch('/api/developer/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_translation',
          question_id: q.id,
          lang,
          question: draft.question,
          options: draft.options,
          is_ready: draft.is_ready,
          correct_index: q.correct_index,
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
    if (!confirm('Bu soruyu (tüm dillerdeki çevirileriyle birlikte) silmek istediğine emin misin?')) return;
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

      {/* Dil sekmeleri */}
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        <span className="px-2 text-xs text-white/40">Dil:</span>
        {availableLangs.map((code) => (
          <button
            key={code}
            onClick={() => { setOffset(0); setLang(code); }}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              lang === code
                ? 'bg-indigo-500/25 text-indigo-200'
                : 'text-white/60 hover:bg-white/[0.05] hover:text-white/80'
            }`}
          >
            {langLabel(code)} <span className="ml-1 text-xs text-white/40">{code}</span>
          </button>
        ))}
        <button
          onClick={addLanguage}
          className="ml-1 rounded-lg p-1.5 text-white/50 hover:bg-white/[0.05] hover:text-white"
          title="Yeni dil ekle"
        >
          <LuPlus className="h-4 w-4" />
        </button>
      </div>

      {/* Filtre + arama + import */}
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

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {(['all', 'ready', 'missing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setOffset(0); setFilter(f); }}
              className={`rounded-md px-3 py-1 text-xs transition ${
                filter === f
                  ? 'bg-indigo-500/25 text-indigo-200'
                  : 'text-white/60 hover:bg-white/[0.05]'
              }`}
            >
              {f === 'all' ? 'Tümü' : f === 'ready' ? `${langLabel(lang)} hazır` : `${langLabel(lang)} eksik`}
            </button>
          ))}
        </div>

        <button
          onClick={() => load()}
          className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.07]"
        >
          <LuRefreshCw className="h-4 w-4" /> Yenile
        </button>

        <input
          ref={bankFileRef}
          type="file"
          accept="application/json"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportBank(f); }}
          className="hidden"
        />
        <button
          onClick={() => bankFileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50"
          title="bank.json: dil-bağımsız canonical soru kayıtları"
        >
          <LuDatabase className="h-4 w-4" /> {importing ? 'Yükleniyor...' : 'Ana Banka Yükle (bank.json)'}
        </button>

        <input
          ref={transFileRef}
          type="file"
          accept="application/json"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportTranslation(f); }}
          className="hidden"
        />
        <button
          onClick={() => transFileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/25 disabled:opacity-50"
          title="lang-tr.json / lang-en.json / lang-pt-br.json gibi"
        >
          <LuLanguages className="h-4 w-4" /> {importing ? 'Yükleniyor...' : 'Çeviri Yükle (lang-XX.json)'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/50">
            <tr>
              <th className="px-3 py-2">Hazır ({lang})</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Zorluk</th>
              <th className="px-3 py-2">{langLabel(lang)} Soru</th>
              <th className="px-3 py-2">EN Soru</th>
              <th className="px-3 py-2">Doğru</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-white/40">Yükleniyor...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-white/40">
                Soru bulunamadı. Önce <strong>Ana Banka</strong>, sonra <strong>Çeviri</strong> yükle.
              </td></tr>
            )}
            {!loading && filtered.map((q) => {
              const tr = q.translations.find((t) => t.lang === lang);
              const enT = q.translations.find((t) => t.lang === 'en');
              return (
                <tr key={q.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    {tr?.is_ready ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        <LuCheck className="h-3 w-3" /> Hazır
                      </span>
                    ) : tr ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Taslak</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">Çeviri yok</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white/60">{q.category ?? '—'}</td>
                  <td className="px-3 py-2 text-white/60">{q.difficulty ?? '—'}</td>
                  <td className="max-w-[260px] px-3 py-2 text-white/80">
                    <div className="line-clamp-2">
                      {tr?.question || <span className="text-white/30">— bu dile çevrilmemiş —</span>}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-3 py-2 text-white/50">
                    <div className="line-clamp-2">{enT?.question ?? '—'}</div>
                  </td>
                  <td className="px-3 py-2 text-white/70">{'ABCD'[q.correct_index] ?? '?'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(q)}
                        className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                        title={`${langLabel(lang)} çevirisini düzenle`}
                      >
                        <LuPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteOne(q.id)}
                        className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10"
                        title="Soruyu sil (tüm dillerdeki çevirileriyle)"
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

      {editing && (
        <Editor
          question={editing}
          lang={lang}
          onClose={closeEditor}
          onSave={saveEditor}
        />
      )}
    </div>
  );
}

function Editor({
  question,
  lang,
  onClose,
  onSave,
}: {
  question: Question;
  lang: string;
  onClose: () => void;
  onSave: (q: Question, draft: { question: string; options: string[]; is_ready: boolean }) => void;
}) {
  const existing = question.translations.find((t) => t.lang === lang);
  const enT = question.translations.find((t) => t.lang === 'en');
  const [text, setText] = useState<string>(existing?.question ?? '');
  const [options, setOptions] = useState<string[]>(existing?.options ?? ['', '', '', '']);
  const [isReady, setIsReady] = useState<boolean>(existing?.is_ready ?? false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Çeviri düzenle</h2>
            <p className="text-xs text-white/50">
              Dil: <span className="font-mono text-indigo-300">{langLabel(lang)} ({lang})</span> · Kategori: {question.category ?? '—'} · Doğru cevap: <span className="font-mono text-emerald-300">{'ABCD'[question.correct_index]}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {enT && lang !== 'en' && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-white/50">
              <div className="font-semibold text-white/60">Kaynak (EN): {enT.question}</div>
              <ul className="mt-2 space-y-0.5">
                {enT.options.map((o, i) => (
                  <li key={i} className={i === question.correct_index ? 'text-emerald-300' : ''}>
                    {'ABCD'[i]}: {o} {i === question.correct_index && '(doğru)'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="block text-sm text-white/70">
            Soru ({langLabel(lang)})
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>

          {options.map((opt, i) => (
            <label key={i} className="block text-sm text-white/70">
              <div className="mb-1 flex items-center gap-2">
                <span className={`font-semibold ${i === question.correct_index ? 'text-emerald-300' : 'text-white/80'}`}>
                  {'ABCD'[i]} {i === question.correct_index && '(doğru cevap)'}
                </span>
              </div>
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                className="w-full rounded-md border border-white/10 bg-white/[0.03] p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </label>
          ))}

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={isReady}
              onChange={(e) => setIsReady(e.target.checked)}
              className="accent-emerald-500"
            />
            Çeviri tamam, bu dilde quiz'lerde kullanılabilir (is_ready)
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
            onClick={() => onSave(question, { question: text, options, is_ready: isReady })}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
