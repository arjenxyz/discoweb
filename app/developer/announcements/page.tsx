'use client';

import { useState, useEffect } from 'react';
import { LuMessageSquare, LuTrash2, LuPencil, LuPlus } from 'react-icons/lu';
import fetchWithCreds from '@/lib/fetchWithCreds';

type AnnouncementAdminItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  mentions_everyone?: boolean;
  poll?: {
    id: string;
    question: string;
    options: Array<{ id: string; label: string; position: number; voteCount: number }>;
  } | null;
};

const emptyForm = {
  title: '',
  body: '',
  mediaUrl: '',
  linkUrl: '',
  pollQuestion: '',
  pollOptions: '',
  mentionEveryone: false,
};

type PostMode = 'announcement' | 'media_only' | 'poll_only';

function buildBody(form: typeof emptyForm, postMode: PostMode) {
  if (postMode === 'poll_only') return '';
  if (postMode === 'media_only') {
    const sections: string[] = [];
    const media = form.mediaUrl.trim().replace(/[&\s]+$/, '');
    const link = form.linkUrl.trim().replace(/[&\s]+$/, '');
    if (media) sections.push(`Medya: ${media}`);
    if (link) sections.push(`Link: ${link}`);
    return sections.join('\n\n');
  }
  const sections: string[] = [];
  if (form.body.trim()) sections.push(form.body.trim());
  if (form.mediaUrl.trim()) sections.push(`Medya: ${form.mediaUrl.trim().replace(/[&\s]+$/, '')}`);
  if (form.linkUrl.trim()) sections.push(`Link: ${form.linkUrl.trim().replace(/[&\s]+$/, '')}`);
  return sections.join('\n\n');
}

function parseBody(body: string) {
  const lines = body.split('\n');
  let mediaUrl = '';
  let linkUrl = '';
  let skipPollLines = false;
  const filtered: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('medya:')) {
      mediaUrl = trimmed.slice(6).trim();
      return;
    }
    if (trimmed.toLowerCase().startsWith('link:')) {
      linkUrl = trimmed.slice(5).trim();
      return;
    }
    if (trimmed.toLowerCase().startsWith('anket:')) {
      skipPollLines = true;
      return;
    }
    if (skipPollLines) {
      if (trimmed.startsWith('-') || trimmed === '') return;
      skipPollLines = false;
    }
    filtered.push(line);
  });

  let text = filtered.join('\n').trim();
  if (text === '·' || text === '\u00B7') text = '';
  return { body: text, mediaUrl, linkUrl };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [postMode, setPostMode] = useState<PostMode>('announcement');

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithCreds('/api/admin/global-announcements?lang=tr', { cache: 'no-store' });
      setAnnouncements((data as { announcements?: AnnouncementAdminItem[] }).announcements ?? []);
    } catch (e) {
      const err = e as { error?: string; message?: string };
      setError(err?.error ?? err?.message ?? (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const startEdit = (a: AnnouncementAdminItem) => {
    const parsed = parseBody(a.content);
    const pollQ = a.poll?.question ?? '';
    const pollO =
      a.poll?.options
        .slice()
        .sort((x, y) => x.position - y.position)
        .map((o) => o.label)
        .join('\n') ?? '';
    const isPollOnly = a.poll && parsed.body === '' && !parsed.mediaUrl && !parsed.linkUrl;
    const isMediaOnly = !a.poll && parsed.body === '' && (!!parsed.mediaUrl || !!parsed.linkUrl);
    setEditingId(a.id);
    setPostMode(isPollOnly ? 'poll_only' : isMediaOnly ? 'media_only' : 'announcement');
    setForm({
      title: a.title,
      body: parsed.body.replace(/^@everyone\s*/i, ''),
      mediaUrl: parsed.mediaUrl,
      linkUrl: parsed.linkUrl,
      pollQuestion: pollQ,
      pollOptions: pollO,
      mentionEveryone: Boolean(a.mentions_everyone) || /@everyone\b/i.test(`${a.title}\n${a.content}`),
    });
    setView('editor');
    setError(null);
    setSuccess(null);
  };

  const saveAnnouncement = async () => {
    const pollOptions = form.pollOptions.split('\n').map((o) => o.trim()).filter(Boolean);
    const hasPoll = form.pollQuestion.trim().length > 0 && pollOptions.length >= 2;
    let content = buildBody(form, postMode);
    if (form.mentionEveryone && !/@everyone\b/i.test(`${form.title}\n${content}`)) {
      content = content.trim() ? `@everyone\n\n${content.trim()}` : '@everyone';
    }

    if (!form.title.trim() && postMode !== 'media_only') {
      setError('Başlık zorunludur.');
      return;
    }
    if (postMode === 'poll_only') {
      if (!form.pollQuestion.trim()) {
        setError('Anket sorusu zorunludur.');
        return;
      }
      if (pollOptions.length < 2) {
        setError('Anket için en az 2 seçenek girin.');
        return;
      }
    } else if (postMode === 'media_only') {
      if (!form.mediaUrl.trim() && !form.linkUrl.trim()) {
        setError('Medya URL veya yönlendirme linki girin.');
        return;
      }
    } else if (!content.trim() && !hasPoll) {
      setError('En az içerik, medya URL, link veya anket girmelisiniz.');
      return;
    }
    if (form.pollQuestion.trim() && pollOptions.length < 2) {
      setError('Anket için en az 2 seçenek girin.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: form.title.trim(),
        body: content,
        lang: 'tr',
        mentionsEveryone: form.mentionEveryone,
        poll: hasPoll
          ? {
              question: form.pollQuestion.trim(),
              options: pollOptions,
            }
          : undefined,
      };

      const res = await fetch('/api/admin/global-announcements', {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));

      await fetchAnnouncements();
      setSuccess(editingId ? 'Duyuru güncellendi.' : 'Duyuru oluşturuldu.');
      setView('list');
      setForm(emptyForm);
      setPostMode('announcement');
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!window.confirm('Bu duyuruyu silmek istiyor musunuz?')) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/global-announcements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setSuccess('Duyuru silindi.');
      await fetchAnnouncements();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duyuru silinemedi.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <LuMessageSquare className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Duyurular</h1>
            <p className="text-sm text-[#99AAB5] mt-1">Platformdaki genel duyuruları yönetin.</p>
          </div>
        </div>
        {view === 'list' && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setPostMode('announcement');
              setView('editor');
              setError(null);
              setSuccess(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2 text-sm font-bold text-white hover:bg-[#5865F2]/90 transition"
          >
            <LuPlus className="w-4 h-4" /> Yeni Duyuru
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {view === 'editor' ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <h2 className="text-lg font-bold text-white">{editingId ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</h2>
            <button type="button" onClick={() => setView('list')} className="text-xs text-white/50 hover:text-white transition">
              İptal Et
            </button>
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            {(['announcement', 'media_only', 'poll_only'] as PostMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPostMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  postMode === mode
                    ? 'bg-[#5865F2] text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {mode === 'poll_only' ? 'Sadece Anket' : mode === 'media_only' ? 'Sadece Medya' : 'Duyuru'}
              </button>
            ))}
          </div>
          <div className={`grid gap-4 ${postMode === 'media_only' ? '' : 'lg:grid-cols-2'}`}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  {postMode === 'poll_only'
                    ? 'Anket Başlığı'
                    : postMode === 'media_only'
                      ? 'Başlık (opsiyonel)'
                      : 'Başlık'}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={postMode === 'media_only' ? 'Boş bırakılabilir' : undefined}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50"
                />
              </div>
              {postMode === 'announcement' && (
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">İçerik</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                    className="w-full min-h-[160px] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50 custom-scrollbar"
                  />
                  <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={form.mentionEveryone}
                      onChange={(e) => setForm((p) => ({ ...p, mentionEveryone: e.target.checked }))}
                      className="rounded border-amber-400/40 bg-black/40 text-amber-400 focus:ring-amber-400/30"
                    />
                    <span className="text-sm text-amber-100/90">
                      <strong className="text-amber-200">@everyone</strong> etiketi ekle (sarı vurgu + bildirim sayacı)
                    </span>
                  </label>
                </div>
              )}
              {(postMode === 'announcement' || postMode === 'media_only') && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1">
                      Medya URL (Resim/Video/YouTube)
                      {postMode === 'media_only' ? ' *' : ''}
                    </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.mediaUrl}
                    onChange={(e) => setForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50"
                  />
                  <p className="mt-1 text-[10px] text-white/30">Doğrudan .jpg/.png/.mp4 veya YouTube linki</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">
                    Yönlendirme Linki
                    {postMode === 'media_only' ? ' (alternatif)' : ''}
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.linkUrl}
                    onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50"
                  />
                  <p className="mt-1 text-[10px] text-white/30">Tıklanabilir link önizlemesi olarak gösterilir</p>
                </div>
              </div>
              )}
            </div>
            {postMode !== 'media_only' && (
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white mb-3">
                {postMode === 'poll_only' ? 'Anket' : 'Anket (Opsiyonel)'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Anket Sorusu</label>
                  <input
                    type="text"
                    value={form.pollQuestion}
                    onChange={(e) => setForm((p) => ({ ...p, pollQuestion: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Seçenekler (Her satıra bir seçenek, en az 2)</label>
                  <textarea
                    value={form.pollOptions}
                    onChange={(e) => setForm((p) => ({ ...p, pollOptions: e.target.value }))}
                    className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50 custom-scrollbar"
                  />
                </div>
              </div>
            </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveAnnouncement}
              disabled={saving}
              className="rounded-xl bg-[#5865F2] hover:bg-[#5865F2]/90 px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <p className="text-white/40 text-sm">Yükleniyor...</p>
          ) : announcements.length > 0 ? (
            announcements.map((a) => {
              const preview = parseBody(a.content);
              const isMediaOnly = !a.poll && preview.body === '' && (!!preview.mediaUrl || !!preview.linkUrl);
              return (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="font-bold text-white">{a.title || (isMediaOnly ? 'Medya' : 'Başlıksız')}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {isMediaOnly && (
                        <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                          Sadece Medya
                        </span>
                      )}
                      {a.poll && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                          {a.content === '·' ? 'Sadece Anket' : 'Anket'}
                        </span>
                      )}
                      {(a.mentions_everyone || /@everyone\b/i.test(`${a.title}\n${a.content}`)) && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          @everyone
                        </span>
                      )}
                      <span className="text-[10px] text-white/30">{new Date(a.created_at).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                  {a.poll && (
                    <p className="text-xs text-violet-200/80 mb-2">{a.poll.question}</p>
                  )}
                  {preview.body && (
                    <p className="text-xs text-white/60 line-clamp-3 mb-4 whitespace-pre-wrap">{preview.body}</p>
                  )}
                  {isMediaOnly && preview.mediaUrl && (
                    <p className="text-xs text-cyan-200/70 mb-4 truncate">{preview.mediaUrl}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition"
                  >
                    <LuPencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(a.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition"
                  >
                    <LuTrash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
              );
            })
          ) : (
            <p className="text-white/40 text-sm">Duyuru bulunmuyor.</p>
          )}
        </div>
      )}
    </div>
  );
}
