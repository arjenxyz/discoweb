'use client';

import { useEffect, useState } from 'react';
import {
  LuShield,
  LuUsers,
  LuSave,
  LuLoader,
  LuCheck,
  LuChevronDown,
  LuSearch,
  LuServer,
} from 'react-icons/lu';

type DiscordRole = {
  id: string;
  name: string;
  color: number;
};

type ServerSettings = {
  admin_role_id: string | null;
  verify_role_id: string | null;
  approval_threshold: number;
  is_setup: boolean;
  _roles: DiscordRole[];
};

function intToHex(color: number) {
  if (!color) return '#99aab5';
  return '#' + color.toString(16).padStart(6, '0');
}

function RoleSelector({
  label,
  description,
  icon,
  roles,
  value,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  roles: DiscordRole[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = roles.find((r) => r.id === value);
  const filtered = roles.filter((r) =>
    search ? r.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          <p className="mt-0.5 text-xs text-white/40">{description}</p>

          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm transition hover:border-white/20"
            >
              {selected ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: intToHex(selected.color) }}
                  />
                  <span className="text-white">{selected.name}</span>
                </span>
              ) : (
                <span className="text-white/40">Rol seçin...</span>
              )}
              <LuChevronDown
                className={`h-4 w-4 text-white/40 transition ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-hidden rounded-xl border border-white/10 bg-[#12141a] shadow-2xl">
                <div className="border-b border-white/5 p-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <LuSearch className="h-4 w-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Rol ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/5"
                  >
                    Kaldır (Rol Seçme)
                  </button>
                  {filtered.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        onChange(role.id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 ${
                        role.id === value ? 'bg-white/10 text-white' : 'text-white/70'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: intToHex(role.color) }}
                      />
                      <span>{role.name}</span>
                      {role.id === value && <LuCheck className="ml-auto h-4 w-4 text-emerald-400" />}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-white/30">Rol bulunamadı</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {value && (
            <p className="mt-2 text-xs text-white/30">
              Rol ID: <span className="font-mono text-white/50">{value}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initial, setInitial] = useState<ServerSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Veri alınamadı');
        const data = await res.json();
        setSettings(data);
        setInitial(data);
      } catch {
        setError('Ayarlar yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges =
    settings && initial
      ? settings.admin_role_id !== initial.admin_role_id ||
        settings.verify_role_id !== initial.verify_role_id ||
        settings.approval_threshold !== initial.approval_threshold
      : false;

  const handleSave = async () => {
    if (!settings || !hasChanges) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_role_id: settings.admin_role_id,
          verify_role_id: settings.verify_role_id,
          approval_threshold: settings.approval_threshold,
        }),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      setMessage('Ayarlar başarıyla kaydedildi.');
      setInitial({ ...settings });
    } catch {
      setError('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <LuLoader className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );

  if (!settings)
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
        {error ?? 'Ayarlar yüklenemedi.'}
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-[#0f1116] to-purple-500/5 p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <LuServer className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sunucu Ayarları</h1>
            <p className="mt-0.5 text-sm text-white/50">
              Rol yapılandırması ve genel sunucu tercihlerini yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <LuCheck className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Role Settings */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
          Rol Yapılandırması
        </p>
        <div className="space-y-3">
          <RoleSelector
            label="Admin Rolü"
            description="Bu role sahip üyeler admin paneline erişebilir ve yönetim işlemleri yapabilir."
            icon={<LuShield className="h-5 w-5" />}
            roles={settings._roles}
            value={settings.admin_role_id}
            onChange={(id) => setSettings({ ...settings, admin_role_id: id })}
          />
          <RoleSelector
            label="Onaylı Üye Rolü"
            description="Bu role sahip üyeler mesaj/ses kazancı elde eder ve mağazayı kullanabilir."
            icon={<LuUsers className="h-5 w-5" />}
            roles={settings._roles}
            value={settings.verify_role_id}
            onChange={(id) => setSettings({ ...settings, verify_role_id: id })}
          />
        </div>
      </div>

      {/* Approval Threshold */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
          Genel Ayarlar
        </p>
        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h3 className="text-sm font-semibold text-white">Yetkili Uygunluk Eşiği</h3>
          <p className="mt-0.5 text-xs text-white/40">
            Admin işlemlerinde onay yüzdesini belirler. (50-100%)
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={settings.approval_threshold}
              onChange={(e) =>
                setSettings({ ...settings, approval_threshold: Number(e.target.value) })
              }
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-indigo-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400"
            />
            <span className="w-12 rounded-lg border border-white/10 bg-[#0b0d12] px-2 py-1.5 text-center text-sm font-semibold text-white">
              {settings.approval_threshold}%
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {hasChanges && (
          <span className="text-xs text-amber-300/70">Kaydedilmemiş değişiklikler var</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <>
              <LuLoader className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <LuSave className="h-4 w-4" />
              Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
