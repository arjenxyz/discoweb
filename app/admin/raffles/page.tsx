'use client';

import { useEffect, useState } from 'react';

type BadgeTier = { id: string; name: string; emoji: string | null; days_required: number };

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
  winner_count: number;
  prize_type: string;
  prize_papel_amount: number | null;
  prize_role_id: string | null;
  prize_multiplier_value: number | null;
  prize_multiplier_days: number | null;
  prize_mari_amount: number | null;
  prize_lot_count: number | null;
  eligibility_type: string;
  required_badge_tier_id: string | null;
  drawn_at: string | null;
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
  winner_count: string;
  prize_type: string;
  prize_papel_amount: string;
  prize_role_id: string;
  prize_multiplier_value: string;
  prize_multiplier_days: string;
  prize_mari_amount: string;
  prize_lot_count: string;
  eligibility_type: string;
  required_badge_tier_id: string;
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  prizes: [''],
  start_date: '',
  end_date: '',
  min_tag_days: '0',
  is_active: true,
  winner_count: '1',
  prize_type: 'custom',
  prize_papel_amount: '',
  prize_role_id: '',
  prize_multiplier_value: '',
  prize_multiplier_days: '',
  prize_mari_amount: '',
  prize_lot_count: '',
  eligibility_type: 'tag',
  required_badge_tier_id: '',
});

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const isExpired = (r: Raffle) => (r.end_date ? new Date(r.end_date) < new Date() : false);

const ELIGIBILITY_LABELS: Record<string, string> = {
  tag: 'Tag Taşıyanlar',
  everyone: 'Herkes',
  booster: 'Booster\'lar',
};

const PRIZE_LABELS: Record<string, string> = {
  custom: 'Özel',
  papel: 'Papel',
  role: 'Rol',
  timed_multiplier: 'Geçici Çarpan',
  mari: 'Mari',
  lot: 'Lot',
};

const input = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500';
const label = 'mb-1 block text-xs text-white/60';

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [badgeTiers, setBadgeTiers] = useState<BadgeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [drawResult, setDrawResult] = useState<{ raffleId: string; winnerCount: number } | null>(null);

  const load = async () => {
    const [rafflesRes, tiersRes] = await Promise.all([
      fetch('/api/admin/raffles'),
      fetch('/api/admin/badge-tiers'),
    ]);
    if (rafflesRes.ok) setRaffles((await rafflesRes.json()) as Raffle[]);
    if (tiersRes.ok) setBadgeTiers((await tiersRes.json()) as BadgeTier[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setError(null); setShowForm(false); };

  const startEdit = (r: Raffle) => {
    setForm({
      title: r.title,
      description: r.description ?? '',
      prizes: r.prizes?.length ? r.prizes : [''],
      start_date: r.start_date ? r.start_date.slice(0, 16) : '',
      end_date: r.end_date ? r.end_date.slice(0, 16) : '',
      min_tag_days: String(r.min_tag_days),
      is_active: r.is_active,
      winner_count: String(r.winner_count ?? 1),
      prize_type: r.prize_type ?? 'custom',
      prize_papel_amount: r.prize_papel_amount ? String(r.prize_papel_amount) : '',
      prize_role_id: r.prize_role_id ?? '',
      prize_multiplier_value: r.prize_multiplier_value ? String(r.prize_multiplier_value) : '',
      prize_multiplier_days: r.prize_multiplier_days ? String(r.prize_multiplier_days) : '',
      prize_mari_amount: r.prize_mari_amount ? String(r.prize_mari_amount) : '',
      prize_lot_count: r.prize_lot_count ? String(r.prize_lot_count) : '',
      eligibility_type: r.eligibility_type ?? 'tag',
      required_badge_tier_id: r.required_badge_tier_id ?? '',
    });
    setEditingId(r.id);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Başlık zorunludur.');
    if (form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date))
      return setError('Bitiş tarihi başlangıçtan sonra olmalı.');
    setSaving(true);

    const prizes = form.prizes.map((p) => p.trim()).filter(Boolean);
    const body: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      prizes: prizes.length ? prizes : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      min_tag_days: parseInt(form.min_tag_days, 10) || 0,
      is_active: form.is_active,
      winner_count: parseInt(form.winner_count, 10) || 1,
      prize_type: form.prize_type,
      prize_papel_amount: form.prize_papel_amount ? parseFloat(form.prize_papel_amount) : null,
      prize_role_id: form.prize_role_id || null,
      prize_multiplier_value: form.prize_multiplier_value ? parseFloat(form.prize_multiplier_value) : null,
      prize_multiplier_days: form.prize_multiplier_days ? parseInt(form.prize_multiplier_days, 10) : null,
      prize_mari_amount: form.prize_mari_amount ? parseFloat(form.prize_mari_amount) : null,
      prize_lot_count: form.prize_lot_count ? parseInt(form.prize_lot_count, 10) : null,
      eligibility_type: form.eligibility_type,
      required_badge_tier_id: form.required_badge_tier_id || null,
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
    await fetch('/api/admin/raffles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, is_active: !r.is_active }) });
    await load();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/raffles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setConfirmDelete(null);
    await load();
  };

  const handleDraw = async (raffleId: string) => {
    setDrawing(raffleId);
    const res = await fetch('/api/admin/raffles/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raffleId }),
    });
    setDrawing(null);
    if (res.ok) {
      const data = (await res.json()) as { winnerCount: number };
      setDrawResult({ raffleId, winnerCount: data.winnerCount });
      await load();
    }
  };

  const updatePrize = (i: number, val: string) => { const u = [...form.prizes]; u[i] = val; setForm({ ...form, prizes: u }); };
  const addPrize = () => setForm({ ...form, prizes: [...form.prizes, ''] });
  const removePrize = (i: number) => setForm({ ...form, prizes: form.prizes.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Topluluk</p>
          <h1 className="mt-2 text-2xl font-semibold">Çekilişler</h1>
          <p className="mt-1 text-sm text-white/60">Üyelere yönelik dönemsel çekilişleri yönetin.</p>
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
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-base font-semibold">{editingId ? 'Çekilişi Düzenle' : 'Yeni Çekiliş Oluştur'}</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className={label}>Başlık *</label>
              <input className={input} maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nisan 2026 Çekilişi" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={label}>Açıklama</label>
              <textarea className={input} maxLength={500} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* ── ELIGIBILITY ── */}
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Katılım Koşulu</p>
              <div className="flex flex-wrap gap-2">
                {(['tag', 'everyone', 'booster'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, eligibility_type: t })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${form.eligibility_type === t ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-white/40 hover:text-white'}`}
                  >
                    {t === 'tag' ? '🏷️ Tag Taşıyanlar' : t === 'everyone' ? '👥 Herkes' : '⚡ Booster\'lar'}
                  </button>
                ))}
              </div>
            </div>

            {form.eligibility_type === 'tag' && (
              <>
                <div>
                  <label className={label}>Min. Tag Günü</label>
                  <input type="number" min={0} step={1} className={input} value={form.min_tag_days} onChange={(e) => setForm({ ...form, min_tag_days: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Belirli Rozet Kademesi (opsiyonel)</label>
                  <select className={input} value={form.required_badge_tier_id} onChange={(e) => setForm({ ...form, required_badge_tier_id: e.target.value })}>
                    <option value="">— Kademe seçme —</option>
                    {badgeTiers.map((t) => (
                      <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ''}{t.name} ({t.days_required}g)</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ── PRIZE TYPE ── */}
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Ödül Türü</p>
              <div className="flex flex-wrap gap-2">
                {(['custom', 'papel', 'role', 'timed_multiplier', 'mari', 'lot'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, prize_type: t })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${form.prize_type === t ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-white/10 text-white/40 hover:text-white'}`}
                  >
                    {t === 'custom' ? '🎁 Özel' : t === 'papel' ? '💰 Papel' : t === 'role' ? '🛡️ Rol' : t === 'timed_multiplier' ? '⚡ Geçici Çarpan' : t === 'mari' ? '💎 Mari' : '📈 Lot'}
                  </button>
                ))}
              </div>
              {(form.prize_type === 'mari' || form.prize_type === 'lot') && (
                <p className="mt-1 text-[11px] text-amber-400/60">⚠️ Yüksek Ekonomi özelliği — ödül sunucu kasasından çıkar.</p>
              )}
            </div>

            {/* Prize-specific fields */}
            {form.prize_type === 'papel' && (
              <div>
                <label className={label}>Papel Miktarı</label>
                <input type="number" min={1} step={1} className={input} value={form.prize_papel_amount} onChange={(e) => setForm({ ...form, prize_papel_amount: e.target.value })} placeholder="500" />
              </div>
            )}
            {form.prize_type === 'role' && (
              <div>
                <label className={label}>Rol ID (Discord)</label>
                <input className={input} value={form.prize_role_id} onChange={(e) => setForm({ ...form, prize_role_id: e.target.value })} placeholder="1234567890123456789" />
              </div>
            )}
            {form.prize_type === 'timed_multiplier' && (
              <>
                <div>
                  <label className={label}>Çarpan Değeri (örn: 1.5)</label>
                  <input type="number" min={1.1} max={10} step={0.1} className={input} value={form.prize_multiplier_value} onChange={(e) => setForm({ ...form, prize_multiplier_value: e.target.value })} placeholder="1.5" />
                </div>
                <div>
                  <label className={label}>Süre (gün)</label>
                  <input type="number" min={1} step={1} className={input} value={form.prize_multiplier_days} onChange={(e) => setForm({ ...form, prize_multiplier_days: e.target.value })} placeholder="7" />
                </div>
              </>
            )}
            {form.prize_type === 'mari' && (
              <div>
                <label className={label}>Mari Miktarı</label>
                <input type="number" min={0.000001} step={0.0001} className={input} value={form.prize_mari_amount} onChange={(e) => setForm({ ...form, prize_mari_amount: e.target.value })} placeholder="10.0000" />
              </div>
            )}
            {form.prize_type === 'lot' && (
              <div>
                <label className={label}>Lot Sayısı</label>
                <input type="number" min={1} step={1} className={input} value={form.prize_lot_count} onChange={(e) => setForm({ ...form, prize_lot_count: e.target.value })} placeholder="100" />
              </div>
            )}

            {/* Custom prizes list */}
            {form.prize_type === 'custom' && (
              <div className="sm:col-span-2">
                <label className={label}>Ödüller (açıklama)</label>
                <div className="space-y-2">
                  {form.prizes.map((prize, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-500" maxLength={80} value={prize} onChange={(e) => updatePrize(i, e.target.value)} placeholder={`Ödül ${i + 1}`} />
                      {form.prizes.length > 1 && <button type="button" onClick={() => removePrize(i)} className="text-white/40 hover:text-red-400 px-2">✕</button>}
                    </div>
                  ))}
                  <button type="button" onClick={addPrize} className="text-xs text-indigo-400 hover:text-indigo-300">+ Ödül Ekle</button>
                </div>
              </div>
            )}

            {/* Dates + winner count */}
            <div>
              <label className={label}>Başlangıç Tarihi</label>
              <input type="datetime-local" className={input} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className={label}>Bitiş Tarihi</label>
              <input type="datetime-local" className={input} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className={label}>Kazanan Sayısı</label>
              <input type="number" min={1} step={1} className={input} value={form.winner_count} onChange={(e) => setForm({ ...form, winner_count: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="is_active" className="text-sm text-white/60">Aktif</label>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/60 transition hover:text-white">İptal</button>
          </div>
        </form>
      )}

      {/* List */}
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
              const drawn = Boolean(r.drawn_at);
              return (
                <div key={r.id} className="rounded-xl border border-white/10 bg-[#0b0d12]/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white/80 font-medium">{r.title}</p>
                        {drawn ? (
                          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">Çekildi</span>
                        ) : expired ? (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Süresi Doldu</span>
                        ) : r.is_active ? (
                          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">Aktif</span>
                        ) : (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Pasif</span>
                        )}
                        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">
                          {ELIGIBILITY_LABELS[r.eligibility_type] ?? r.eligibility_type}
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                          {PRIZE_LABELS[r.prize_type] ?? r.prize_type}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/40">
                        {r.eligibility_type === 'tag' && <span>Min. {r.min_tag_days}g tag</span>}
                        {r.prize_papel_amount && <span>{r.prize_papel_amount} papel</span>}
                        {r.prize_multiplier_value && <span>×{r.prize_multiplier_value} / {r.prize_multiplier_days}g</span>}
                        {r.prize_mari_amount && <span>{r.prize_mari_amount} mari</span>}
                        {r.prize_lot_count && <span>{r.prize_lot_count} lot</span>}
                        {r.winner_count > 1 && <span>{r.winner_count} kazanan</span>}
                        {r.end_date && <span>Bitiş: {formatDate(r.end_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!drawn && !expired && r.is_active && (
                        <button
                          onClick={() => void handleDraw(r.id)}
                          disabled={drawing === r.id}
                          className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
                        >
                          {drawing === r.id ? 'Çekiliyor...' : 'Çek'}
                        </button>
                      )}
                      {!drawn && (
                        <button onClick={() => void handleToggleActive(r)} className="text-xs text-indigo-400 hover:text-indigo-300">
                          {r.is_active ? 'Pasife Al' : 'Aktif Yap'}
                        </button>
                      )}
                      {!drawn && <button onClick={() => startEdit(r)} className="text-xs text-white/40 hover:text-white">Düzenle</button>}
                      <button onClick={() => setConfirmDelete(r.id)} className="text-xs text-red-400 hover:text-red-300">Sil</button>
                    </div>
                  </div>
                  {drawResult?.raffleId === r.id && (
                    <p className="mt-2 text-xs text-emerald-400">✓ Çekiliş tamamlandı — {drawResult.winnerCount} kazanan belirlendi.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-xl w-80">
            <h3 className="text-base font-semibold">Çekilişi sil</h3>
            <p className="mt-2 text-sm text-white/60">Bu çekilişi silmek istediğinizden emin misiniz?</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => void handleDelete(confirmDelete)} className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-500">Sil</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full border border-white/10 py-2 text-xs text-white/60 hover:text-white">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
