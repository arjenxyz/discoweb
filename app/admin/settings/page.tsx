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
  LuUndo2,
} from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import RemoveSetupButton from '../RemoveSetupButton';

type DiscordRole = {
  id: string;
  name: string;
  color: number;
};

type ServerSettings = {
  admin_role_id: string | null;
  verify_role_id: string | null;
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = roles.find((r) => r.id === value);
  const filtered = roles.filter((r) =>
    search ? r.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#a5b4ff]">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-white">{label}</h3>
          <p className="mt-0.5 text-xs text-white/40">{description}</p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm transition hover:border-white/20"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: intToHex(selected.color) }}
              />
              <span className="text-white">{selected.name}</span>
            </span>
          ) : (
            <span className="text-white/40">{t('admin.settings.select_role')}</span>
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
                  placeholder={t('admin.settings.search_role')}
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
                {t('admin.settings.clear_role')}
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
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: intToHex(role.color) }}
                  />
                  <span>{role.name}</span>
                  {role.id === value && <LuCheck className="ml-auto h-4 w-4 text-emerald-400" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-white/30">
                  {t('admin.settings.role_not_found')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {value && (
        <p className="mt-2 text-[11px] text-white/30">
          {t('admin.settings.role_id_label', { id: value })}
        </p>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
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
        if (!res.ok) throw new Error(t('admin.settings.fetch_failed'));
        const data = await res.json();
        setSettings(data);
        setInitial(data);
      } catch {
        setError(t('admin.settings.load_error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges =
    settings && initial
      ? settings.admin_role_id !== initial.admin_role_id ||
        settings.verify_role_id !== initial.verify_role_id
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
        }),
      });
      if (!res.ok) throw new Error(t('admin.settings.save_failed_short'));
      setMessage(t('admin.settings.save_success'));
      setInitial({ ...settings });
    } catch {
      setError(t('admin.settings.save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LuLoader className="h-7 w-7 animate-spin text-[#5865F2]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-sm text-red-200">
        {error ?? t('admin.settings.load_failed')}
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {t('admin.settings.eyebrow')}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {t('admin.settings.title')}
          </h1>
          <p className="mt-1 text-sm text-white/45">{t('admin.settings.subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={() => setSettings(initial)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/55 transition hover:border-white/20 hover:text-white"
            >
              <LuUndo2 size={14} />
              <span>{t('admin.settings.undo')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5865F2] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuSave size={14} />}
            <span>{saving ? t('admin.settings.saving') : t('admin.settings.save')}</span>
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm ${
            error
              ? 'border-rose-500/20 bg-rose-500/[0.08] text-rose-200'
              : 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
          }`}
        >
          {error ? null : <LuCheck className="h-4 w-4 shrink-0" />}
          <span>{error || message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RoleSelector
          label={t('admin.settings.admin_role')}
          description={t('admin.settings.admin_role_desc')}
          icon={<LuShield size={16} />}
          roles={settings._roles}
          value={settings.admin_role_id}
          onChange={(id) => setSettings({ ...settings, admin_role_id: id })}
        />
        <RoleSelector
          label={t('admin.settings.verify_role')}
          description={t('admin.settings.verify_role_desc')}
          icon={<LuUsers size={16} />}
          roles={settings._roles}
          value={settings.verify_role_id}
          onChange={(id) => setSettings({ ...settings, verify_role_id: id })}
        />
      </div>

      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-rose-300">
              {t('admin.settings.danger_zone')}
            </h2>
            <p className="mt-0.5 text-xs text-white/45">{t('admin.settings.danger_zone_desc')}</p>
          </div>
          <RemoveSetupButton />
        </div>
      </div>
    </div>
  );
}
