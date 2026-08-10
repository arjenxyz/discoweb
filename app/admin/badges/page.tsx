'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import { StoreListPanel } from '../store/StoreListRow';

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
  reward_papel: number | null;
  reward_earn_multiplier: number | null;
  reward_message: string | null;
  role_id: string | null;
  background_image: string | null;
};

type DiscordRole = {
  id: string;
  name: string;
  color: number;
  icon?: string | null;
  unicode_emoji?: string | null;
};

type GuildEmoji = {
  id: string;
  name: string;
  animated: boolean;
  url: string;
  tag: string;
};

type FormState = {
  name: string;
  emoji: string;
  days_required: string;
  color: string;
  description: string;
  sort_order: string;
  reward_papel: string;
  reward_earn_multiplier: string;
  reward_message: string;
  role_id: string;
  background_image: string;
};

const emptyForm = (): FormState => ({
  name: '',
  emoji: '',
  days_required: '',
  color: '#5865F2',
  description: '',
  sort_order: '0',
  reward_papel: '0',
  reward_earn_multiplier: '1.0',
  reward_message: '',
  role_id: '',
  background_image: '',
});

function colorToHex(color: number): string {
  if (!color) return '#5865F2';
  return '#' + color.toString(16).padStart(6, '0');
}

function getRoleIconUrl(role: DiscordRole): string | null {
  if (role.icon) {
    return `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.webp?size=64`;
  }
  return null;
}

export default function AdminBadgesPage() {
  const [tiers, setTiers] = useState<BadgeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Role picker
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const rolePickerRef = useRef<HTMLDivElement>(null);

  // Emoji picker
  const [guildEmojis, setGuildEmojis] = useState<GuildEmoji[]>([]);
  const [emojisLoading, setEmojisLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch('/api/admin/badge-tiers');
    if (res.ok) setTiers((await res.json()) as BadgeTier[]);
    setLoading(false);
  };

  const loadRoles = async () => {
    if (roles.length > 0) return;
    setRolesLoading(true);
    try {
      // Use the guild roles endpoint that returns icon/unicode_emoji fields
      const botToken = ''; // roles fetched server-side via admin API
      const res = await fetch('/api/admin/roles?limit=100');
      if (res.ok) {
        const data = (await res.json()) as DiscordRole[];
        setRoles(data);
      }
    } finally {
      setRolesLoading(false);
    }
  };

  const loadGuildEmojis = async () => {
    if (guildEmojis.length > 0) return;
    setEmojisLoading(true);
    try {
      const res = await fetch('/api/admin/guild-emojis');
      if (res.ok) setGuildEmojis((await res.json()) as GuildEmoji[]);
    } finally {
      setEmojisLoading(false);
    }
  };

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rolePickerRef.current && !rolePickerRef.current.contains(e.target as Node)) {
        setShowRolePicker(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
    setShowForm(false);
    setRoleSearch('');
  };

  const startEdit = (tier: BadgeTier) => {
    setForm({
      name: tier.name,
      emoji: tier.emoji ?? '',
      days_required: String(tier.days_required),
      color: tier.color ?? '#5865F2',
      description: tier.description ?? '',
      sort_order: String(tier.sort_order),
      reward_papel: String(tier.reward_papel ?? 0),
      reward_earn_multiplier: String(tier.reward_earn_multiplier ?? 1.0),
      reward_message: tier.reward_message ?? '',
      role_id: tier.role_id ?? '',
      background_image: tier.background_image ?? '',
    });
    setEditingId(tier.id);
    setShowForm(true);
    setError(null);
    void loadRoles();
    void loadGuildEmojis();
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
      reward_papel: parseInt(form.reward_papel, 10) || 0,
      reward_earn_multiplier: parseFloat(form.reward_earn_multiplier) || 1.0,
      reward_message: form.reward_message.trim() || null,
      role_id: form.role_id.trim() || null,
      background_image: form.background_image.trim() || null,
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

  const selectedRole = roles.find((r) => r.id === form.role_id);
  const filteredRoles = roles.filter(
    (r) => !roleSearch || r.name.toLowerCase().includes(roleSearch.toLowerCase()) || r.id.includes(roleSearch),
  );
  const filteredEmojis = guildEmojis.filter(
    (e) => !emojiSearch || e.name.toLowerCase().includes(emojiSearch.toLowerCase()),
  );

  const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35';
  const inputCls =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white/85 placeholder:text-white/25 focus:border-[#5865F2]/50 focus:outline-none';
  const sectionCls = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35';
  const pickerInputCls =
    'w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/85 placeholder:text-white/25 outline-none focus:border-[#5865F2]/50';

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Topluluk</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">Tag Ayarları</h1>
        </div>
        <button
          onClick={() => {
            if (showForm && !editingId) { resetForm(); return; }
            setShowForm(true); setEditingId(null); setForm(emptyForm()); setError(null);
            void loadRoles(); void loadGuildEmojis();
          }}
          className={
            showForm && !editingId
              ? 'shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white'
              : 'shrink-0 rounded-xl bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]'
          }
        >
          {showForm && !editingId ? 'İptal' : '+ Yeni Kademe'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">{editingId ? 'Kademeyi Düzenle' : 'Yeni Kademe Oluştur'}</h2>
          {error && (
            <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] px-3.5 py-2.5 text-sm text-rose-200">{error}</p>
          )}

          <div className="mt-4 space-y-4">
          {/* ── Temel Bilgiler ── */}
          <div>
            <p className={sectionCls}>Temel Bilgiler</p>
            <div className="mt-2.5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>İsim *</label>
                <input className={inputCls} maxLength={32} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bronz" />
              </div>

              {/* Emoji picker */}
              <div ref={emojiPickerRef} className="relative">
                <label className={labelCls}>
                  Emoji{' '}
                  <span className="normal-case tracking-normal text-white/25">(unicode veya sunucu emojisi)</span>
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    className={`${inputCls} mt-0 flex-1`}
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    placeholder="🥉 veya tıkla →"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); }}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                  >
                    {emojisLoading ? '...' : '😀 Sunucu'}
                  </button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-white/10 bg-[#161925] shadow-2xl">
                    <div className="p-2">
                      <input
                        className={pickerInputCls}
                        placeholder="Emoji ara..."
                        value={emojiSearch}
                        onChange={(e) => setEmojiSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-6 gap-1">
                      {emojisLoading && <p className="col-span-6 py-4 text-center text-xs text-white/30">Yükleniyor...</p>}
                      {!emojisLoading && filteredEmojis.length === 0 && (
                        <p className="col-span-6 py-4 text-center text-xs text-white/30">Emoji bulunamadı</p>
                      )}
                      {filteredEmojis.map((emoji) => (
                        <button
                          key={emoji.id}
                          type="button"
                          title={`:${emoji.name}:`}
                          onClick={() => { setForm({ ...form, emoji: emoji.tag }); setShowEmojiPicker(false); }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 transition"
                        >
                          <Image src={emoji.url} alt={emoji.name} width={28} height={28} className="rounded-sm" unoptimized />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Gün Gereksinimi *</label>
                <input type="number" min={1} step={1} className={inputCls} value={form.days_required}
                  onChange={(e) => setForm({ ...form, days_required: e.target.value })} placeholder="7" />
              </div>

              <div>
                <label className={labelCls}>Renk</label>
                <div className="mt-1.5 flex gap-2">
                  <input type="color" className="h-[42px] w-12 cursor-pointer rounded-xl border border-white/10 bg-black/25 p-1"
                    value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  <input className={`${inputCls} mt-0 flex-1`} value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#CD7F32" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Sıra No</label>
                <input type="number" min={0} step={1} className={inputCls} value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Açıklama</label>
                <textarea className={`${inputCls} resize-y`} maxLength={200} rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Üyeler tag'i 7 gün taşıyarak bu rozeti kazanır." />
              </div>
            </div>
          </div>

          {/* ── Ödüller ── */}
          <div className="border-t border-white/[0.06] pt-4">
            <p className={sectionCls}>Ödüller</p>
            <div className="mt-2.5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Papel Ödülü (tek seferlik)</label>
                <input type="number" min={0} step={1} className={inputCls} value={form.reward_papel}
                  onChange={(e) => setForm({ ...form, reward_papel: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Kazanç Çarpanı (örn: 1.5)</label>
                <input type="number" min={1} step={0.1} className={inputCls} value={form.reward_earn_multiplier}
                  onChange={(e) => setForm({ ...form, reward_earn_multiplier: e.target.value })} placeholder="1.0" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Ödül Mesajı (kullanıcıya gösterilir)</label>
                <input className={inputCls} maxLength={200} value={form.reward_message}
                  onChange={(e) => setForm({ ...form, reward_message: e.target.value })}
                  placeholder="Tebrikler! Bu rozeti kazandın." />
              </div>
            </div>
          </div>

          {/* ── Otomatik Rol ── */}
          <div className="border-t border-white/[0.06] pt-4">
            <p className={sectionCls}>Otomatik Rol Ataması</p>
            <div ref={rolePickerRef} className="relative mt-2.5">
              <label className={labelCls}>
                Rol{' '}
                <span className="normal-case tracking-normal text-white/25">(kademeye ulaşıldığında otomatik atanır)</span>
              </label>

              {/* Selected role display */}
              <button
                type="button"
                onClick={() => { setShowRolePicker(!showRolePicker); }}
                className="mt-1.5 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-left text-sm text-white/85 transition hover:border-white/20"
              >
                {selectedRole ? (
                  <>
                    {getRoleIconUrl(selectedRole) ? (
                      <Image
                        src={getRoleIconUrl(selectedRole)!}
                        alt={selectedRole.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : selectedRole.unicode_emoji ? (
                      <span className="text-base">{selectedRole.unicode_emoji}</span>
                    ) : (
                      <span
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedRole.color ? colorToHex(selectedRole.color) : '#5865F2' }}
                      />
                    )}
                    <span className="flex-1 text-white/80">{selectedRole.name}</span>
                    <span className="text-xs text-white/30">{selectedRole.id}</span>
                  </>
                ) : form.role_id ? (
                  <span className="flex-1 text-white/50">ID: {form.role_id}</span>
                ) : (
                  <span className="flex-1 text-white/30">Rol seç veya ID girin...</span>
                )}
                <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRolePicker && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#161925] shadow-2xl">
                  <div className="p-2">
                    <input
                      className={pickerInputCls}
                      placeholder="Rol adı veya ID ara..."
                      value={roleSearch}
                      onChange={(e) => { setRoleSearch(e.target.value); if (!roles.length) void loadRoles(); }}
                      onFocus={() => { if (!roles.length) void loadRoles(); }}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {/* Clear option */}
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, role_id: '' }); setShowRolePicker(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/30 hover:bg-white/5 transition"
                    >
                      <span className="h-4 w-4 rounded-full border border-white/10" />
                      Rol yok (temizle)
                    </button>
                    {rolesLoading && (
                      <p className="px-3 py-4 text-center text-xs text-white/30">Roller yükleniyor...</p>
                    )}
                    {filteredRoles.map((role) => {
                      const iconUrl = getRoleIconUrl(role);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => { setForm({ ...form, role_id: role.id }); setShowRolePicker(false); setRoleSearch(''); }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-white/5 ${form.role_id === role.id ? 'bg-white/[0.07]' : ''}`}
                        >
                          {iconUrl ? (
                            <Image src={iconUrl} alt={role.name} width={20} height={20} className="rounded-full flex-shrink-0" unoptimized />
                          ) : role.unicode_emoji ? (
                            <span className="text-base flex-shrink-0">{role.unicode_emoji}</span>
                          ) : (
                            <span
                              className="h-4 w-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: role.color ? colorToHex(role.color) : '#5865F2' }}
                            />
                          )}
                          <span className="flex-1 text-left text-white/80">{role.name}</span>
                          <span className="text-[10px] text-white/25">{role.id}</span>
                        </button>
                      );
                    })}
                    {/* Manual ID input */}
                    <div className="border-t border-white/5 p-2">
                      <p className="mb-1.5 text-[11px] text-white/35">Veya ID ile gir:</p>
                      <input
                        className={pickerInputCls}
                        placeholder="Role ID..."
                        value={form.role_id}
                        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Arkaplan Görseli ── */}
          <div className="border-t border-white/[0.06] pt-4">
            <p className={sectionCls}>Tag Yolu Arkaplanı</p>
            <div className="mt-2.5">
              <label className={labelCls}>Arkaplan Görseli URL</label>
              <input
                className={inputCls}
                value={form.background_image}
                onChange={(e) => setForm({ ...form, background_image: e.target.value })}
                placeholder="https://example.com/background.jpg"
              />
              {form.background_image && (
                <div className="mt-2 relative h-20 w-full overflow-hidden rounded-xl border border-white/10 sm:h-24">
                  <Image
                    src={form.background_image}
                    alt="Arkaplan önizleme"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => {}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-2 left-3 text-xs text-white/70">Önizleme</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white">
              İptal
            </button>
          </div>
          </div>
        </form>
      )}

      {/* Tier List */}
      <div>
        <p className="mb-2 text-[11px] text-white/35">Üyeler tag&apos;i belirlediğiniz süre boyunca taşırlarsa ilgili kademeye erişirler.</p>
        <StoreListPanel loading={loading} isEmpty={tiers.length === 0} emptyMessage="Henüz rozet kademesi oluşturulmadı.">
          {tiers.map((tier) => (
            <div key={tier.id} className="group px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-5">
              <div className="flex items-center gap-3">
                {tier.background_image ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <Image src={tier.background_image} alt="bg" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 flex items-center justify-center text-lg">{tier.emoji ?? '🏅'}</div>
                  </div>
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ background: (tier.color ?? '#5865F2') + '22', border: `1px solid ${tier.color ?? '#5865F2'}44` }}
                  >
                    {tier.emoji ?? '🏅'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{tier.name}</span>
                    <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">{tier.days_required}g</span>
                    {tier.role_id && (
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/45">
                        Rol ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {(tier.reward_papel ?? 0) > 0 && (
                      <p className="text-[11px] text-white/40">
                        <span className="text-white/25">Papel</span>
                        <span className="mx-1 text-white/15">·</span>
                        <span className="text-white/55">+{tier.reward_papel}</span>
                      </p>
                    )}
                    {(tier.reward_earn_multiplier ?? 1) > 1 && (
                      <p className="text-[11px] text-white/40">
                        <span className="text-white/25">Çarpan</span>
                        <span className="mx-1 text-white/15">·</span>
                        <span className="text-white/55">×{tier.reward_earn_multiplier}</span>
                      </p>
                    )}
                    {tier.color && (
                      <p className="flex items-center gap-1 text-[11px] text-white/55">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tier.color }} />
                        {tier.color}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(tier)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                    aria-label="Düzenle"
                    title="Düzenle"
                  >
                    <LuPencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(tier.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 text-rose-300/70 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label="Sil"
                    title="Sil"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </StoreListPanel>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0f111a] p-4 shadow-xl sm:p-5">
            <h3 className="text-sm font-semibold text-white">Ayarı Sil</h3>
            <p className="mt-2 text-sm text-white/50">Bu tag kademesini silmek istediğinizden emin misiniz?</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => void handleDelete(confirmDelete)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500">
                Sil
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
