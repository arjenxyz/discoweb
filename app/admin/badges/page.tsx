'use client';

import { useEffect, useState } from 'react';

type BadgeTier = {
  id: string;
  guild_id: string;
  name: string;
  emoji: string | null;
  days_required: number;
  color: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
};

type FormState = {
  name: string;
  emoji: string;
  days_required: string;
  color: string;
  description: string;
  sort_order: string;
};

const emptyForm = (): FormState => ({
  name: '',
  emoji: '',
  days_required: '',
  color: '#5865F2',
  description: '',
  sort_order: '0',
});

export default function AdminBadgesPage() {
  const [tiers, setTiers] = useState<BadgeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/badge-tiers');
    if (res.ok) setTiers((await res.json()) as BadgeTier[]);
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

  const startEdit = (tier: BadgeTier) => {
    setForm({
      name: tier.name,
      emoji: tier.emoji ?? '',
      days_required: String(tier.days_required),
      color: tier.color ?? '#5865F2',
      description: tier.description ?? '',
      sort_order: String(tier.sort_order),
    });
    setEditingId(tier.id);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const days = parseInt(form.days_required, 10);
    if (!form.name.trim()) return setError('İsim zorunludur.');
    if (!Number.isInteger(days) || days < 1) return setError('Gün gereksinimi en az 1 olmalı.');
    setSaving(true);

    const body = {
      name: form.name.trim(),
      emoji: form.emoji || null,
      days_required: days,
      color: form.color || null,
      description: form.description.trim() || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch('/api/admin/badge-tiers', {
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

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/admin/badge-tiers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    if (res.ok) await load();
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Topluluk</p>
          <h1 className="mt-2 text-2xl font-semibold">Rozet Kademeleri</h1>
          <p className="mt-1 text-sm text-white/60">Tag taşıyan üyelerin kazanacağı rozet kademelerini tanımlayın.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm()); setError(null); }}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/30 hover:text-white"
        >
          {showForm && !editingId ? 'İptal' : '+ Yeni Kademe'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold">{editingId ? 'Kademeyi Düzenle' : 'Yeni Kademe Oluştur'}</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">İsim *</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                maxLength={32}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bronz"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Emoji</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                maxLength={8}
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="🥉"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Gün Gereksinimi *</label>
              <input
                type="number"
                min={1}
                step={1}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.days_required}
                onChange={(e) => setForm({ ...form, days_required: e.target.value })}
                placeholder="7"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Renk</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#CD7F32"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Sıra No</label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/60">Açıklama</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                maxLength={200}
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Üyeler tag'i 7 gün taşıyarak bu rozeti kazanır."
              />
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
        <p className="mb-1 text-xs text-white/40">Üyeler tag&apos;i ne kadar süre taşırlarsa o kademeye erişirler.</p>
        {loading ? (
          <p className="mt-3 text-sm text-white/60">Yükleniyor...</p>
        ) : tiers.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Henüz rozet kademesi oluşturulmadı.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="pb-2 pr-4">Emoji</th>
                  <th className="pb-2 pr-4">İsim</th>
                  <th className="pb-2 pr-4">Gün</th>
                  <th className="pb-2 pr-4">Renk</th>
                  <th className="pb-2 pr-4">Sıra</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 text-lg">{tier.emoji ?? '—'}</td>
                    <td className="py-3 pr-4 text-white/80">{tier.name}</td>
                    <td className="py-3 pr-4 text-white/60">{tier.days_required} gün</td>
                    <td className="py-3 pr-4">
                      {tier.color ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-4 w-4 rounded" style={{ backgroundColor: tier.color }} />
                          <span className="text-xs text-white/40">{tier.color}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-white/40">{tier.sort_order}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => startEdit(tier)}
                        className="mr-2 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => setConfirmDelete(tier.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Silme onay dialogu */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-xl w-80">
            <h3 className="text-base font-semibold">Kademeyi sil</h3>
            <p className="mt-2 text-sm text-white/60">Bu rozet kademesini silmek istediğinizden emin misiniz?</p>
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
