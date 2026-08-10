'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';

type ChannelConfig = {
  channel_type:
    | 'user_main'
    | 'user_auth'
    | 'user_roles'
    | 'user_exchange'
    | 'user_store'
    | 'admin_main'
    | 'admin_wallet'
    | 'admin_store'
    | 'admin_notifications'
    | 'admin_settings';
  webhook_url: string;
  is_active: boolean;
};

const CHANNEL_LABEL_KEYS: Record<ChannelConfig['channel_type'], string> = {
  user_main: 'admin.log_channels.channel_user_main',
  user_auth: 'admin.log_channels.channel_user_auth',
  user_roles: 'admin.log_channels.channel_user_roles',
  user_exchange: 'admin.log_channels.channel_user_exchange',
  user_store: 'admin.log_channels.channel_user_store',
  admin_main: 'admin.log_channels.channel_admin_main',
  admin_wallet: 'admin.log_channels.channel_admin_wallet',
  admin_store: 'admin.log_channels.channel_admin_store',
  admin_notifications: 'admin.log_channels.channel_admin_notifications',
  admin_settings: 'admin.log_channels.channel_admin_settings',
};

export default function LogChannelsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ChannelConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const channelLabel = (type: ChannelConfig['channel_type']) => t(CHANNEL_LABEL_KEYS[type]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/log-channels');
      if (response.ok) {
        const data = (await response.json()) as ChannelConfig[];
        setConfigs(data);
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleChange = (channelType: ChannelConfig['channel_type'], field: keyof ChannelConfig, value: string | boolean) => {
    setConfigs((prev) =>
      prev.map((config) =>
        config.channel_type === channelType ? { ...config, [field]: value } : config,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const normalizedUrls = configs
      .map((config) => ({
        type: config.channel_type,
        url: config.webhook_url.trim(),
      }))
      .filter((entry) => entry.url.length > 0);
    const urlMap = new Map<string, ChannelConfig['channel_type'][]>();
    normalizedUrls.forEach((entry) => {
      const list = urlMap.get(entry.url) ?? [];
      list.push(entry.type);
      urlMap.set(entry.url, list);
    });
    const duplicates = Array.from(urlMap.entries()).filter(([, list]) => list.length > 1);
    if (duplicates.length) {
      const channels = duplicates
        .flatMap(([, list]) => list)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .map((type) => channelLabel(type))
        .join(', ');
      setError(t('admin.log_channels.duplicate_error', { channels }));
      setSaving(false);
      return;
    }

    const response = await fetch('/api/log-channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs }),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const payload = (await response.json()) as { error?: string; detail?: { message?: string } };
        if (payload?.detail?.message) {
          detail = ` (${payload.detail.message})`;
        } else if (payload?.error) {
          detail = ` (${payload.error})`;
        }
      } catch {
        // ignore parse errors
      }
      setError(t('admin.log_channels.save_error', { detail }));
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
  };

  const handleTest = async (channelType: ChannelConfig['channel_type']) => {
    setTesting(channelType);
    setError(null);
    const response = await fetch('/api/log-channels/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelType }),
    });
    if (!response.ok) {
      let message = t('admin.log_channels.test_error');
      try {
        const payload = (await response.json()) as { error?: string; detail?: string };
        if (payload?.detail) {
          message = `${message} (${payload.detail})`;
        } else if (payload?.error) {
          message = `${message} (${payload.error})`;
        }
      } catch {
        // ignore parse errors
      }
      setError(message);
    }
    setTesting(null);
  };

  const userConfigs = configs.filter((config) => config.channel_type.startsWith('user_'));
  const adminConfigs = configs.filter((config) => config.channel_type.startsWith('admin_'));

  const renderConfig = (config: ChannelConfig) => (
    <div
      key={config.channel_type}
      className="rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{channelLabel(config.channel_type)}</h2>
          <p className="mt-1 text-xs text-white/50">{config.channel_type}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            checked={config.is_active}
            onChange={(event) => handleChange(config.channel_type, 'is_active', event.target.checked)}
            className="h-4 w-4 accent-indigo-400"
          />
          {t('admin.log_channels.active')}
        </label>
      </div>
      <button
        type="button"
        onClick={() => handleTest(config.channel_type)}
        disabled={testing === config.channel_type}
        className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {testing === config.channel_type
          ? t('admin.log_channels.testing')
          : t('admin.log_channels.webhook_test')}
      </button>
      <input
        value={config.webhook_url}
        onChange={(event) => handleChange(config.channel_type, 'webhook_url', event.target.value)}
        placeholder={t('admin.log_channels.webhook_placeholder')}
        className="mt-4 w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
      />
      {config.webhook_url && (
        <p className="mt-2 break-all text-[11px] text-white/50">
          {t('admin.log_channels.current_url', { url: config.webhook_url })}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
          {t('admin.log_channels.eyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{t('admin.log_channels.title')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('admin.log_channels.subtitle')}</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/70">{t('admin.log_channels.loading')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('admin.log_channels.user_logs')}</h2>
                <p className="text-xs text-white/50">{t('admin.log_channels.user_logs_desc')}</p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {userConfigs.map(renderConfig)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('admin.log_channels.admin_logs')}</h2>
                <p className="text-xs text-white/50">{t('admin.log_channels.admin_logs_desc')}</p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {adminConfigs.map(renderConfig)}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {success && <p className="text-sm text-emerald-300">{t('admin.log_channels.saved')}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(99,102,241,0.45)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('admin.log_channels.saving') : t('admin.log_channels.save')}
        </button>
        <span className="text-xs text-white/50">{t('admin.log_channels.webhook_hint')}</span>
      </div>
    </div>
  );
}
