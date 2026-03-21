'use client';

import { useEffect, useState } from 'react';

type Raffle = {
  id: string;
  guild_id: string;
  title: string;
  description: string | null;
  prizes: string[] | null;
  start_date: string | null;
  end_date: string | null;
  min_tag_days: number;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  title: string;
  description: string;
  prizes: string[];
  start_date: string;
  end_date: string;
  min_tag_days: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  prizes: [''],
  start_date: '',
  end_date: '',
  min_tag_days: '1',
  is_active: true,
});

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const isExpired = (raffle: Raffle) => {
  if (!raffle.end_date) return false;
  return new Date(raffle.end_date) < new Date();
};

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/raffles');
    if (res.ok) setRaffles((await res.json()) as Raffle[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
    setShowForm(false);
  };

  const startEdit = (r: Raffle) => {
    setForm({
      title: r.title,
      description: r.description ?? '',
      prizes: r.prizes?.length ? r.prizes : [''],
      start_date: r.start_date ? r.start_date.slice(0, 16) : '',
      end_date: r.end_date ? r.end_date.slice(0, 16) : '',
      min_tag_days: String(r.min_tag_days),
      is_active: r.is_active,
    });
    setEditingId(r.id);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Başlık zorunludur.');
    if (form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)) {
      return setError('Bitiş tarihi başlangıçtan sonra olmalı.');
    }
    setSaving(true);

    const prizes = form.prizes.map((p) => p.trim()).filter(Boolean);
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      prizes: prizes.length ? prizes : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      min_tag_days: parseInt(form.min_tag_days, 10) || 1,
      is_active: form.is_active,
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch('/api/admin/raffles', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return setError(data.message ?? 'Bir hata oluştu.');
    }
    resetForm();
    await load();
  };

  const handleToggleActive = async (r: Raffle) => {
    await fetch('/api/admin/raffles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, is_active: !r.is_active }),
    });
    await load();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/raffles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    await load();
  };

  const updatePrize = (i: number, val: string) => {
    const updated = [...form.prizes];
    updated[i] = val;
    setForm({ ...form, prizes: updated });
  };

  const addPrize = () => setForm({ ...form, prizes: [...form.prizes, ''] });
  const removePrize = (i: number) => setForm({ ...form, prizes: form.prizes.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Topluluk</p>
          <h1 className="mt-2 text-2xl font-semibold">Çekilişler</h1>
          <p className="mt-1 text-sm text-white/60">Tag taşıyan üyeler için dönemsel çekilişleri yönetin.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm()); setError(null); }}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/30 hover:text-white"
        >
          {showForm && !editingId ? 'İptal' : '+ Yeni Çekiliş'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold">{editingId ? 'Çekilişi Düzenle' : 'Yeni Çekiliş Oluştur'}</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/60">Başlık *</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Mart 2026 Çekilişi"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/60">Açıklama</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                maxLength={500}
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {/* Ödüller */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/60">Ödüller</label>
              <div className="space-y-2">
                {form.prizes.map((prize, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      maxLength={80}
                      value={prize}
                      onChange={(e) => updatePrize(i, e.target.value)}
                      placeholder={`Ödül ${i + 1}`}
                    />
                    {form.prizes.length > 1 && (
                      <button type="button" onClick={() => removePrize(i)} className="text-white/40 hover:text-red-400 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPrize} className="text-xs text-indigo-400 hover:text-indigo-300">+ Ödül Ekle</button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Başlangıç Tarihi</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Bitiş Tarihi</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Min. Tag Günü</label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.min_tag_days}
                onChange={(e) => setForm({ ...form, min_tag_days: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm text-white/60">Aktif</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/60 transition hover:text-white">
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="mb-1 text-xs text-white/40">Aktif çekilişler üyelerin Activity panelinde görünür.</p>
        {loading ? (
          <p className="mt-3 text-sm text-white/60">Yükleniyor...</p>
        ) : raffles.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Henüz çekiliş oluşturulmadı.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {raffles.map((r) => {
              const expired = isExpired(r);
              return (
                <div key={r.id} className="rounded-xl border border-white/10 bg-[#0b0d12]/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white/80 font-medium">{r.title}</p>
                        {expired ? (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Süresi Doldu</span>
                        ) : r.is_active ? (
                          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">Aktif</span>
                        ) : (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Pasif</span>
                        )}
                      </div>
                      {r.prizes?.length ? (
                        <p className="mt-1 text-xs text-white/50">Ödüller: {r.prizes.join(', ')}</p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/40">
                        <span>Min. {r.min_tag_days} gün</span>
                        {r.end_date && <span>Bitiş: {formatDate(r.end_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleToggleActive(r)}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        {r.is_active ? 'Pasife Al' : 'Aktif Yap'}
                      </button>
                      <button onClick={() => startEdit(r)} className="text-xs text-white/40 hover:text-white">Düzenle</button>
                      <button onClick={() => setConfirmDelete(r.id)} className="text-xs text-red-400 hover:text-red-300">Sil</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Silme onay dialogu */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-xl w-80">
            <h3 className="text-base font-semibold">Çekilişi sil</h3>
            <p className="mt-2 text-sm text-white/60">Bu çekilişi silmek istediğinizden emin misiniz?</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void handleDelete(confirmDelete)}
                className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                Sil
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full border border-white/10 py-2 text-xs text-white/60 hover:text-white"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
