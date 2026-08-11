'use client';

import { useEffect, useState } from "react";
import Image from 'next/image';
import { useTranslation } from '@/lib/i18nContext';
import {
  LuMessageSquare,
  LuMic,
  LuSave,
  LuShieldAlert,
  LuZap,
  LuTag,
  LuCheck,
  LuUndo2,
  LuLoader,
  LuServer,
  LuHash,
  LuVolume2,
  LuFolder,
  LuX,
  LuShield,
} from 'react-icons/lu';

type DiscordChannel = {
  id: string;
  name: string;
  type: number; // 0=text, 2=voice, 4=category
  parent_id: string | null;
};

type EarnChannels = {
  mode: 'all' | 'whitelist' | 'blacklist';
  message_channels: string[];
  message_categories: string[];
  voice_channels: string[];
  voice_categories: string[];
};

type EarnSettings = {
  earn_per_message: number;
  message_earn_enabled: boolean;
  earn_per_voice_minute: number;
  voice_earn_enabled: boolean;
  verify_role_id: string | null;
  tag_configured?: boolean;
  tag_required: boolean;
  tag_bonus_message: number;
  tag_bonus_voice: number;
  booster_bonus_message: number;
  booster_bonus_voice: number;
  earn_channels?: EarnChannels | null;
  spam_message_cooldown_ms: number;
  spam_min_message_length: number;
  spam_flood_count: number;
  spam_flood_window_ms: number;
  spam_block_sticker_only: boolean;
  spam_block_attachment_only: boolean;
  spam_block_emoji_only: boolean;
  spam_voice_block_alone: boolean;
  spam_voice_block_mute_deaf: boolean;
  daily_message_earn_cap: number;
  daily_voice_earn_cap: number;
  _boosterBonusEnabled?: boolean;
  _guildPreview?: {
    name: string;
    icon: string | null;
  };
  _channels?: DiscordChannel[];
  _roles?: Array<{ id: string; name: string; color: number }>;
};

export default function EarnSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EarnSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialSettings, setInitialSettings] = useState<EarnSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Rol Adı State'i
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/earn-settings', { cache: 'no-store' });
        if (!res.ok) throw new Error(t('admin.earn.data_error'));
        const data = await res.json();
        setSettings(data);
        setInitialSettings(data);
      } catch {
        setError(t('admin.earn.load_error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Değişiklik Kontrolü
  useEffect(() => {
    if (!settings || !initialSettings) return setHasChanges(false);
    // _guildPreview gibi UI alanlarını kıyaslamadan çıkarıyoruz
    const cleanSettings = {
      ...settings,
      _guildPreview: undefined,
      _boosterBonusEnabled: undefined,
      _channels: undefined,
      _roles: undefined,
    };
    const cleanInitial = {
      ...initialSettings,
      _guildPreview: undefined,
      _boosterBonusEnabled: undefined,
      _channels: undefined,
      _roles: undefined,
    };
    setHasChanges(JSON.stringify(cleanSettings) !== JSON.stringify(cleanInitial));
  }, [settings, initialSettings]);

  useEffect(() => {
    const roles = settings?._roles ?? [];
    const match = roles.find((r) => r.id === settings?.verify_role_id);
    setRoleName(match?.name ?? null);
  }, [settings?.verify_role_id, settings?._roles]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/earn-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          message_earn_enabled: true,
          voice_earn_enabled: true,
        }),
      });
      if (!res.ok) throw new Error(t('admin.earn.save_error'));
      
      const next = { ...settings, message_earn_enabled: true, voice_earn_enabled: true };
      setMessage(t('admin.earn.save_success'));
      setSettings(next);
      setInitialSettings(next);
      setHasChanges(false);
    } catch {
      setError(t('admin.earn.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const updateNumber = (key: keyof EarnSettings, value: number) => {
    if (!settings || isNaN(value) || value < 0) return;
    const current = settings[key];
    if (typeof current === 'number' && current === value) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <LuLoader className="h-7 w-7 animate-spin text-[#5865F2]" />
    </div>
  );
  
  if (!settings) return <div className="p-8 text-center text-sm text-red-300">{t('admin.earn.data_error')}</div>;

  const boosterOn =
    (settings.booster_bonus_message ?? 0) > 0 ||
    (settings.booster_bonus_voice ?? 0) > 0 ||
    settings._boosterBonusEnabled === true;

  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono text-white outline-none transition focus:border-[#5865F2]/40 focus:ring-2 focus:ring-[#5865F2]/20';
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40';

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-5 pb-16 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{t('admin.earn.title')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('admin.earn.subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={() => setSettings(initialSettings)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/55 transition hover:border-white/20 hover:text-white"
            >
              <LuUndo2 size={14} />
              <span>{t('admin.earn.undo')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuSave size={14} />}
            <span>{saving ? t('admin.earn.saving') : t('admin.earn.save')}</span>
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
            error
              ? 'border-red-500/20 bg-red-500/10 text-red-200'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {error ? <LuShieldAlert size={16} /> : <LuCheck size={16} />}
          <span>{error || message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#a5b4ff]">
              <LuMessageSquare size={16} />
            </span>
            <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.message_activity')}</h2>
          </div>
          <label className={labelClass}>{t('admin.earn.earn_per_message')}</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-amber-400">
              P
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings?.earn_per_message ?? 0}
              onChange={(e) => updateNumber('earn_per_message', Number(e.target.value))}
              className={`${fieldClass} pl-8`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <LuMic size={16} />
            </span>
            <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.voice_chat')}</h2>
          </div>
          <label className={labelClass}>{t('admin.earn.earn_per_voice')}</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-emerald-400">
              P
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings?.earn_per_voice_minute ?? 0}
              onChange={(e) => updateNumber('earn_per_voice_minute', Number(e.target.value))}
              className={`${fieldClass} pl-8`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
                <LuTag size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.tag_bonus')}</h2>
                <p className="truncate text-xs text-white/40">{t('admin.earn.tag_bonus_desc')}</p>
              </div>
            </div>
            <label
              className={`relative inline-flex shrink-0 items-center ${
                !settings.tag_configured ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.tag_required}
                onChange={(e) => {
                  if (!settings.tag_configured) return;
                  setSettings({ ...settings, tag_required: e.target.checked });
                }}
                className="peer sr-only"
                disabled={!settings.tag_configured}
              />
              <div className="h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-pink-500 peer-checked:after:translate-x-4 peer-focus:outline-none" />
            </label>
          </div>

          {settings.tag_required && settings._guildPreview && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="text-[11px] text-white/40">{t('admin.earn.tag_check_label')}</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">
                {settings._guildPreview.icon ? (
                  <span className="relative h-4 w-4 overflow-hidden rounded-full">
                    <Image
                      src={settings._guildPreview.icon}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                ) : (
                  <LuServer size={14} />
                )}
                <span className="truncate">{settings._guildPreview.name}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>{t('admin.earn.message_bonus')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings?.tag_bonus_message ?? 0}
                onChange={(e) => updateNumber('tag_bonus_message', Number(e.target.value))}
                disabled={!settings.tag_configured}
                className={`${fieldClass} ${!settings.tag_configured ? 'pointer-events-none opacity-50' : ''}`}
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.earn.voice_bonus')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings?.tag_bonus_voice ?? 0}
                onChange={(e) => updateNumber('tag_bonus_voice', Number(e.target.value))}
                disabled={!settings.tag_configured}
                className={`${fieldClass} ${!settings.tag_configured ? 'pointer-events-none opacity-50' : ''}`}
              />
            </div>
          </div>
          {!settings.tag_configured && (
            <p className="mt-2.5 text-xs leading-relaxed text-white/40">{t('admin.earn.tag_not_configured')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <LuZap size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.booster_bonus')}</h2>
                <p className="truncate text-xs text-white/40">{t('admin.earn.booster_bonus_desc')}</p>
              </div>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={boosterOn}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  if (!enabled) {
                    setSettings({
                      ...settings,
                      booster_bonus_message: 0,
                      booster_bonus_voice: 0,
                      _boosterBonusEnabled: false,
                    });
                    return;
                  }
                  setSettings({
                    ...settings,
                    _boosterBonusEnabled: true,
                  });
                }}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-4 peer-focus:outline-none" />
            </label>
          </div>

          <div className={`grid grid-cols-2 gap-2.5 ${boosterOn ? '' : 'pointer-events-none opacity-45'}`}>
            <div>
              <label className={labelClass}>{t('admin.earn.message_bonus')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings?.booster_bonus_message ?? 0}
                onChange={(e) => updateNumber('booster_bonus_message', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.earn.voice_bonus')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings?.booster_bonus_voice ?? 0}
                onChange={(e) => updateNumber('booster_bonus_voice', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
              <LuShieldAlert size={16} />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h3 className="text-[15px] font-semibold text-white">{t('admin.earn.security_title')}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-red-200/60">{t('admin.earn.security_desc')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('admin.earn.verify_role_label')}</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={settings.verify_role_id ?? ''}
                    onChange={(e) => setSettings({ ...settings, verify_role_id: e.target.value || null })}
                    className={`${fieldClass} flex-1`}
                  >
                    <option value="">{t('admin.earn.verify_role_placeholder')}</option>
                    {(settings._roles ?? []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {roleName && settings.verify_role_id && (
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                      <LuCheck size={14} />
                      <span>{roleName}</span>
                    </div>
                  )}
                </div>
                {!settings.verify_role_id && (
                  <p className="mt-2 text-xs text-amber-200/70">{t('admin.earn.verify_role_missing')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
          <div className="mb-4 flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <LuShield size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.spam_title')}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-white/40">{t('admin.earn.spam_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-black/20 p-3.5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                <LuMessageSquare size={14} className="text-[#a5b4ff]" />
                <span>{t('admin.earn.spam_message_section')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>{t('admin.earn.spam_cooldown')}</label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    step={1}
                    value={Math.round((settings.spam_message_cooldown_ms ?? 5000) / 1000)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        spam_message_cooldown_ms: Math.max(0, Math.round(Number(e.target.value) || 0) * 1000),
                      })
                    }
                    className={fieldClass}
                  />
                  <p className="mt-1 text-[10px] text-white/30">{t('admin.earn.unit_seconds')}</p>
                </div>
                <div>
                  <label className={labelClass}>{t('admin.earn.spam_min_length')}</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={settings.spam_min_message_length ?? 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        spam_min_message_length: Math.max(0, Math.round(Number(e.target.value) || 0)),
                      })
                    }
                    className={fieldClass}
                  />
                  <p className="mt-1 text-[10px] text-white/30">{t('admin.earn.unit_chars')}</p>
                </div>
                <div>
                  <label className={labelClass}>{t('admin.earn.spam_flood_count')}</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    step={1}
                    value={settings.spam_flood_count ?? 5}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        spam_flood_count: Math.max(2, Math.round(Number(e.target.value) || 2)),
                      })
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('admin.earn.spam_flood_window')}</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    step={1}
                    value={Math.round((settings.spam_flood_window_ms ?? 15000) / 1000)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        spam_flood_window_ms: Math.max(1, Math.round(Number(e.target.value) || 1) * 1000),
                      })
                    }
                    className={fieldClass}
                  />
                  <p className="mt-1 text-[10px] text-white/30">{t('admin.earn.unit_seconds')}</p>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>{t('admin.earn.daily_message_cap')}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-amber-400">
                      P
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={settings.daily_message_earn_cap ?? 0}
                      onChange={(e) => updateNumber('daily_message_earn_cap', Number(e.target.value))}
                      className={`${fieldClass} pl-8`}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">{t('admin.earn.daily_cap_hint')}</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {(
                  [
                    ['spam_block_sticker_only', 'spam_block_sticker', 'spam_block_sticker_desc'],
                    ['spam_block_attachment_only', 'spam_block_attachment', 'spam_block_attachment_desc'],
                    ['spam_block_emoji_only', 'spam_block_emoji', 'spam_block_emoji_desc'],
                  ] as const
                ).map(([key, titleKey, descKey]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white/85">{t(`admin.earn.${titleKey}`)}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/35">{t(`admin.earn.${descKey}`)}</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={settings[key] !== false}
                      onClick={() => setSettings({ ...settings, [key]: !(settings[key] !== false) })}
                      className={`relative h-5 w-9 shrink-0 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] ${
                        settings[key] !== false ? 'bg-[#5865F2] after:translate-x-4' : 'bg-white/10'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-black/20 p-3.5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                <LuMic size={14} className="text-cyan-300" />
                <span>{t('admin.earn.spam_voice_section')}</span>
              </div>

              <div className="mb-3">
                <label className={labelClass}>{t('admin.earn.daily_voice_cap')}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-emerald-400">
                    P
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={settings.daily_voice_earn_cap ?? 0}
                    onChange={(e) => updateNumber('daily_voice_earn_cap', Number(e.target.value))}
                    className={`${fieldClass} pl-8`}
                  />
                </div>
                <p className="mt-1 text-[10px] text-white/30">{t('admin.earn.daily_cap_hint')}</p>
              </div>

              <div className="space-y-2">
                {(
                  [
                    ['spam_voice_block_alone', 'spam_voice_alone', 'spam_voice_alone_desc'],
                    ['spam_voice_block_mute_deaf', 'spam_voice_mute_deaf', 'spam_voice_mute_deaf_desc'],
                  ] as const
                ).map(([key, titleKey, descKey]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white/85">{t(`admin.earn.${titleKey}`)}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/35">{t(`admin.earn.${descKey}`)}</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={settings[key] !== false}
                      onClick={() => setSettings({ ...settings, [key]: !(settings[key] !== false) })}
                      className={`relative h-5 w-9 shrink-0 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] ${
                        settings[key] !== false ? 'bg-cyan-500 after:translate-x-4' : 'bg-white/10'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ChannelEarnConfig
          settings={settings}
          onUpdate={(earnChannels) => setSettings({ ...settings, earn_channels: earnChannels })}
          t={t}
        />
      </div>
    </div>
  );
}

/* --- KANAL YAPILANDIRMA BİLEŞENİ --- */
function ChannelEarnConfig({
  settings,
  onUpdate,
  t,
}: {
  settings: EarnSettings;
  onUpdate: (channels: EarnChannels) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const channels = settings._channels ?? [];
  const earnChannels: EarnChannels = settings.earn_channels ?? {
    mode: 'all',
    message_channels: [],
    message_categories: [],
    voice_channels: [],
    voice_categories: [],
  };

  const categories = channels.filter((c) => c.type === 4);
  const textChannels = channels.filter((c) => c.type === 0);
  const voiceChannels = channels.filter((c) => c.type === 2);

  const update = (partial: Partial<EarnChannels>) => {
    onUpdate({ ...earnChannels, ...partial });
  };

  const toggleItem = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const getChannelName = (id: string) => channels.find((c) => c.id === id)?.name ?? id;
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  if (channels.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <LuHash size={16} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.channels_title')}</h2>
            <p className="text-xs text-white/40">{t('admin.earn.channels_load_error')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
          <LuHash size={16} />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-white">{t('admin.earn.channels_title')}</h2>
          <p className="text-xs text-white/40">{t('admin.earn.channels_desc')}</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: 'all', label: t('admin.earn.mode_all_label'), desc: t('admin.earn.mode_all_desc') },
          { value: 'whitelist', label: t('admin.earn.mode_whitelist_label'), desc: t('admin.earn.mode_whitelist_desc') },
          { value: 'blacklist', label: t('admin.earn.mode_blacklist_label'), desc: t('admin.earn.mode_blacklist_desc') },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update({ mode: opt.value })}
            className={`min-w-[120px] flex-1 rounded-xl border p-3 text-left transition ${
              earnChannels.mode === opt.value
                ? 'border-[#5865F2]/40 bg-[#5865F2]/10'
                : 'border-white/10 bg-black/20 hover:border-white/20'
            }`}
          >
            <p className={`text-sm font-semibold ${earnChannels.mode === opt.value ? 'text-[#a5b4ff]' : 'text-white/70'}`}>
              {opt.label}
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">{opt.desc}</p>
          </button>
        ))}
      </div>

      {earnChannels.mode !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesaj Kanalları */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-2">
              <LuMessageSquare size={14} />
              {t('admin.earn.message_channels')}
            </p>

            {/* Kategori Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuFolder size={12} /> {t('admin.earn.categories')}</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = earnChannels.message_categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update({ message_categories: toggleItem(earnChannels.message_categories, cat.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <LuFolder size={12} />
                      {cat.name}
                      {selected && <LuX size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kanal Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuHash size={12} /> {t('admin.earn.text_channels')}</p>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 bg-zinc-900/50 p-2">
                {textChannels.map((ch) => {
                  const selected = earnChannels.message_channels.includes(ch.id);
                  const catName = ch.parent_id ? getCategoryName(ch.parent_id) : null;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => update({ message_channels: toggleItem(earnChannels.message_channels, ch.id) })}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                        selected
                          ? 'bg-blue-500/15 text-blue-300'
                          : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <LuHash size={12} className="shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {catName && <span className="ml-auto text-[10px] text-zinc-600 truncate">{catName}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sesli Kanallar */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-2">
              <LuMic size={14} />
              {t('admin.earn.voice_channels')}
            </p>

            {/* Kategori Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuFolder size={12} /> {t('admin.earn.categories')}</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = earnChannels.voice_categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update({ voice_categories: toggleItem(earnChannels.voice_categories, cat.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <LuFolder size={12} />
                      {cat.name}
                      {selected && <LuX size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kanal Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuVolume2 size={12} /> {t('admin.earn.voice_channel_list')}</p>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 bg-zinc-900/50 p-2">
                {voiceChannels.map((ch) => {
                  const selected = earnChannels.voice_channels.includes(ch.id);
                  const catName = ch.parent_id ? getCategoryName(ch.parent_id) : null;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => update({ voice_channels: toggleItem(earnChannels.voice_channels, ch.id) })}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                        selected
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <LuVolume2 size={12} className="shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {catName && <span className="ml-auto text-[10px] text-zinc-600 truncate">{catName}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seçim Özeti */}
      {earnChannels.mode !== 'all' && (
        <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
            {earnChannels.mode === 'whitelist' ? t('admin.earn.summary_whitelist') : t('admin.earn.summary_blacklist')}
          </p>
          <div className="flex flex-wrap gap-2">
            {earnChannels.message_categories.map((id) => (
              <span key={`mc-${id}`} className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300">
                <LuFolder size={10} /> {getCategoryName(id)} <span className="text-blue-500">{t('admin.earn.suffix_message')}</span>
              </span>
            ))}
            {earnChannels.message_channels.map((id) => (
              <span key={`ch-${id}`} className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300">
                <LuHash size={10} /> {getChannelName(id)}
              </span>
            ))}
            {earnChannels.voice_categories.map((id) => (
              <span key={`vc-${id}`} className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
                <LuFolder size={10} /> {getCategoryName(id)} <span className="text-violet-500">{t('admin.earn.suffix_voice')}</span>
              </span>
            ))}
            {earnChannels.voice_channels.map((id) => (
              <span key={`vch-${id}`} className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
                <LuVolume2 size={10} /> {getChannelName(id)}
              </span>
            ))}
            {earnChannels.message_channels.length === 0 &&
              earnChannels.message_categories.length === 0 &&
              earnChannels.voice_channels.length === 0 &&
              earnChannels.voice_categories.length === 0 && (
                <span className="text-xs text-zinc-500">{t('admin.earn.no_channels_selected')}</span>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
