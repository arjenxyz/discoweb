'use client';

import { useState, useEffect } from 'react';
import { LuMessageSquare, LuTrash2, LuPencil, LuPlus } from 'react-icons/lu';

type AnnouncementAdminItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  poll?: {
    id: string;
    question: string;
    options: Array<{ id: string; label: string; position: number; voteCount: number }>;
  } | null;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    body: '',
    mediaUrl: '',
    linkUrl: '',
    pollQuestion: '',
    pollOptions: '',
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/global-announcements?lang=tr', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setAnnouncements(data.announcements ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const buildBody = () => {
    const sections: string[] = [form.body.trim()];
    if (form.mediaUrl.trim()) sections.push(`Medya: ${form.mediaUrl.trim()}`);
    if (form.linkUrl.trim()) sections.push(`Link: ${form.linkUrl.trim()}`);
    if (form.pollQuestion.trim()) {
      const options = form.pollOptions.split('\n').map(o => o.trim()).filter(Boolean);
      const pollLines = [`Anket: ${form.pollQuestion.trim()}`, ...options.map(o => `- ${o}`)];
      sections.push(pollLines.join('\n'));
    }
    return sections.filter(Boolean).join('\n\n');
  };

  const parseBody = (body: string) => {
    const lines = body.split('\n');
    let mediaUrl = '';
    let linkUrl = '';
    const filtered: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('medya:')) { mediaUrl = trimmed.slice(6).trim(); return; }
      if (trimmed.toLowerCase().startsWith('link:')) { linkUrl = trimmed.slice(5).trim(); return; }
      filtered.push(line);
    });
    return { body: filtered.join('\n').trim(), mediaUrl, linkUrl };
  };

  const startEdit = (a: AnnouncementAdminItem) => {
    const parsed = parseBody(a.content);
    const pollQ = a.poll?.question ?? '';
    const pollO = a.poll?.options.slice().sort((x, y) => x.position - y.position).map(o => o.label).join('\n') ?? '';
    setEditingId(a.id);
    setForm({ title: a.title, body: parsed.body, mediaUrl: parsed.mediaUrl, linkUrl: parsed.linkUrl, pollQuestion: pollQ, pollOptions: pollO });
    setView('editor');
  };

  const saveAnnouncement = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Başlık ve içerik zorunludur.'); return;
    }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = {
        title: form.title.trim(),
        body: buildBody(),
        lang: 'tr',
        poll: form.pollQuestion.trim() ? {
          question: form.pollQuestion.trim(),
          options: form.pollOptions.split('\n').map(o => o.trim()).filter(Boolean),
        } : undefined,
      };

      const url = editingId ? '/api/admin/global-announcements' : '/api/admin/global-announcements';
      const body = editingId ? { ...payload, id: editingId } : payload;

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error((await res.json()).error ?? String(res.status));
      await fetchAnnouncements();
      setSuccess(editingId ? 'Duyuru güncellendi.' : 'Duyuru oluşturuldu.');
      setView('list');
      setForm({ title: '', body: '', mediaUrl: '', linkUrl: '', pollQuestion: '', pollOptions: '' });
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!window.confirm('Bu duyuruyu silmek istiyor musunuz?')) return;
    try {
      await fetch(`/api/admin/global-announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetchAnnouncements();
    } catch {}
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
          <button onClick={() => { setEditingId(null); setForm({ title: '', body: '', mediaUrl: '', linkUrl: '', pollQuestion: '', pollOptions: '' }); setView('editor'); }}
            className="flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2 text-sm font-bold text-white hover:bg-[#5865F2]/90 transition">
            <LuPlus className="w-4 h-4" /> Yeni Duyuru
          </button>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{success}</div>}

      {view === 'editor' ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <h2 className="text-lg font-bold text-white">{editingId ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</h2>
            <button onClick={() => setView('list')} className="text-xs text-white/50 hover:text-white transition">İptal Et</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Başlık</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">İçerik</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  className="w-full min-h-[160px] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50 custom-scrollbar" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Medya URL (Resim/Video)</label>
                  <input type="text" value={form.mediaUrl} onChange={e => setForm(p => ({ ...p, mediaUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Yönlendirme Linki</label>
                  <input type="text" value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white mb-3">Anket (Opsiyonel)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Anket Sorusu</label>
                  <input type="text" value={form.pollQuestion} onChange={e => setForm(p => ({ ...p, pollQuestion: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Seçenekler (Her satıra bir seçenek)</label>
                  <textarea value={form.pollOptions} onChange={e => setForm(p => ({ ...p, pollOptions: e.target.value }))}
                    className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/50 custom-scrollbar" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={saveAnnouncement} disabled={saving} className="rounded-xl bg-[#5865F2] hover:bg-[#5865F2]/90 px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
             <p className="text-white/40 text-sm">Yükleniyor...</p>
          ) : announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{a.title}</h3>
                    <span className="text-[10px] text-white/30">{new Date(a.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-3 mb-4 whitespace-pre-wrap">{a.content}</p>
                </div>
                <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                  <button onClick={() => startEdit(a)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition">
                    <LuPencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition">
                    <LuTrash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/40 text-sm">Duyuru bulunmuyor.</p>
          )}
        </div>
      )}
    </div>
  );
}
