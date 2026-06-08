'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { LuFish, LuLoader, LuSave, LuUndo2 } from 'react-icons/lu';
import type { PlayEarnConfig } from '@/lib/playEarn/types';
import { DEFAULT_PLAY_EARN_CONFIG } from '@/lib/playEarn/types';

export default function PlayEarnSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PlayEarnConfig | null>(null);
  const [initial, setInitial] = useState<PlayEarnConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/play-earn-settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('load');
        const data = await res.json();
        const cfg: PlayEarnConfig = {
          jeton_per_papel: data.jeton_per_papel,
          daily_papel_cap: data.daily_papel_cap,
          min_convert_jeton: data.min_convert_jeton,
          session_duration_sec: data.session_duration_sec,
          session_cooldown_sec: data.session_cooldown_sec,
          max_sessions_per_day: data.max_sessions_per_day,
          game_enabled: data.game_enabled,
          difficulty_ramp_interval_sec: data.difficulty_ramp_interval_sec,
          speed_ramp_percent: data.speed_ramp_percent,
          spawn_ramp_percent: data.spawn_ramp_percent,
        };
        setSettings(cfg);
        setInitial(cfg);
      })
      .catch(() => setError(t('admin.play_earn.load_error')))
      .finally(() => setLoading(false));
  }, [t]);

  const hasChanges = settings && initial && JSON.stringify(settings) !== JSON.stringify(initial);

  const updateNum = (key: keyof PlayEarnConfig, value: number) => {
    if (!settings || Number.isNaN(value)) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/play-earn-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('save');
      setInitial(settings);
      setMessage(t('admin.play_earn.save_success'));
    } catch {
      setError(t('admin.play_earn.save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LuLoader className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!settings) {
    return <p className="p-8 text-red-400">{error ?? t('admin.play_earn.load_error')}</p>;
  }

  const fields: { key: keyof PlayEarnConfig; label: string; step?: number }[] = [
    { key: 'jeton_per_papel', label: t('admin.play_earn.field_jeton_per_papel') },
    { key: 'daily_papel_cap', label: t('admin.play_earn.field_daily_cap'), step: 0.01 },
    { key: 'min_convert_jeton', label: t('admin.play_earn.field_min_convert') },
    { key: 'session_duration_sec', label: t('admin.play_earn.field_session_duration') },
    { key: 'session_cooldown_sec', label: t('admin.play_earn.field_cooldown') },
    { key: 'max_sessions_per_day', label: t('admin.play_earn.field_max_sessions') },
    { key: 'difficulty_ramp_interval_sec', label: t('admin.play_earn.field_ramp_interval') },
    { key: 'speed_ramp_percent', label: t('admin.play_earn.field_speed_ramp'), step: 0.1 },
    { key: 'spawn_ramp_percent', label: t('admin.play_earn.field_spawn_ramp'), step: 0.1 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <LuFish className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Play & Earn</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">{t('admin.play_earn.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('admin.play_earn.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={() => setSettings(initial)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"
            >
              <LuUndo2 className="h-4 w-4" />
              {t('admin.play_earn.undo')}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuSave className="h-4 w-4" />}
            {t('admin.play_earn.save')}
          </button>
        </div>
      </div>

      {message && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1116] p-4">
        <input
          type="checkbox"
          checked={settings.game_enabled}
          onChange={(e) => setSettings({ ...settings, game_enabled: e.target.checked })}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm font-medium text-white">{t('admin.play_earn.field_enabled')}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, step }) => (
          <label key={key} className="block rounded-2xl border border-white/10 bg-[#0f1116] p-4">
            <span className="text-xs font-medium text-white/50">{label}</span>
            <input
              type="number"
              step={step ?? 1}
              value={settings[key] as number}
              onChange={(e) => updateNum(key, step ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-500/40"
            />
            <span className="mt-1 block text-[10px] text-white/30">
              {t('admin.play_earn.default')}: {DEFAULT_PLAY_EARN_CONFIG[key] as number}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
