'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18nContext';

type MemberResult = {
  id: string;
  username: string;
  nickname: string | null;
  displayName: string | null;
  avatarUrl: string;
};

const USER_ADD_PRESET_KEYS = ['add_maintenance', 'add_event', 'add_gift', 'add_refund', 'add_milestone', 'add_support'] as const;
const REMOVE_USER_PRESET_KEYS = ['remove_penalty', 'remove_chargeback', 'remove_fee', 'remove_refund'] as const;
const ALL_ADD_PRESET_KEYS = ['all_maintenance', 'all_announcement', 'all_event', 'all_season', 'all_promo', 'all_loyalty'] as const;
const ALL_REMOVE_PRESET_KEYS = ['remove_all_adjustment', 'remove_all_fee'] as const;

function buildPresets(t: (key: string) => string, keys: readonly string[]) {
  return keys.map((key) => ({
    value: key,
    label: t(`admin.wallet.presets.${key}.label`),
    text: t(`admin.wallet.presets.${key}.text`),
  }));
}

export default function AdminWalletPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [scope, setScope] = useState<'user' | 'all'>('user');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [preset, setPreset] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);

  const sendWalletChangeMail = async (userId: string | null, mode: 'add' | 'remove', amount: number, message: string, scope: 'user' | 'all') => {
    try {
      const mailTitle = scope === 'all'
        ? t(mode === 'add' ? 'admin.wallet.mail.title_add_all' : 'admin.wallet.mail.title_remove_all')
        : t(mode === 'add' ? 'admin.wallet.mail.title_add' : 'admin.wallet.mail.title_remove');
      // replace {amount} placeholders in the message with the actual amount
      const filledMessage = (message || '').replace(/\{amount\}/g, String(amount));

      const sign = mode === 'add' ? '+' : '-';
      const headingKey = scope === 'all'
        ? (mode === 'add' ? 'admin.wallet.mail.heading_add_all' : 'admin.wallet.mail.heading_remove_all')
        : (mode === 'add' ? 'admin.wallet.mail.heading_add' : 'admin.wallet.mail.heading_remove');
      const footerKey = scope === 'all' ? 'admin.wallet.mail.footer_all' : 'admin.wallet.mail.footer_single';
      const headingColor = mode === 'add' ? '#10b981' : '#ef4444';

      const mailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: ${headingColor}; margin-bottom: 20px;">
            ${t(headingKey)}
          </h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold;">
              ${t('admin.wallet.mail.amount_label')} <span style="color: ${headingColor};">${t('admin.wallet.mail.amount_value', { sign, amount })}</span>
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #374151; margin-bottom: 10px;">${t('admin.wallet.mail.description_label')}</h3>
            <p style="color: #6b7280; margin: 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
              ${filledMessage}
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ${t(footerKey)}
            </p>
          </div>
        </div>
      `;

      const response = await fetch('/api/admin/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: mailTitle,
          body: mailBody,
          category: 'system',
        }),
      });

      if (!response.ok) {
        console.error('Mail gönderme başarısız:', response.status);
      }
    } catch (error) {
      console.error('Mail gönderme hatası:', error);
    }
  };

  const userPresets = useMemo(() => buildPresets(t, USER_ADD_PRESET_KEYS), [t]);
  const removeUserPresets = useMemo(() => buildPresets(t, REMOVE_USER_PRESET_KEYS), [t]);
  const allPresets = useMemo(() => buildPresets(t, ALL_ADD_PRESET_KEYS), [t]);
  const removeAllPresets = useMemo(() => buildPresets(t, ALL_REMOVE_PRESET_KEYS), [t]);

  const presets = mode === 'remove'
    ? (scope === 'all' ? removeAllPresets : removeUserPresets)
    : (scope === 'all' ? allPresets : userPresets);

  useEffect(() => {
    if (!preset) {
      return;
    }
    const stillExists = presets.some((item) => item.value === preset);
    if (!stillExists) {
      setPreset('');
    }
  }, [mode, scope, preset, presets]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError(t('admin.wallet.error_invalid_amount'));
      return;
    }

    if (scope === 'user' && !userId.trim()) {
      setError(t('admin.wallet.error_user_required'));
      return;
    }

    if (mode === 'add' && !message.trim()) {
      setError(t('admin.wallet.error_message_required'));
      return;
    }

    setLoading(true);
    const response = await fetch('/api/admin/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        scope,
        amount: value,
        userId: scope === 'user' ? userId.trim() : undefined,
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string; updated?: number };

    if (!response.ok) {
      if (data.error === 'message_required') {
        setError(t('admin.wallet.error_message_required'));
      } else {
        setError(t('admin.wallet.error_failed'));
      }
      setLoading(false);
      return;
    }

    if (scope === 'all') {
      setSuccess(t('admin.wallet.success_all', { count: data.updated ?? 0 }));
    } else {
      setSuccess(t('admin.wallet.success_single'));
    }

    // Mail gönderme işlemi (sadece papel düşme için - ekleme API tarafından reward mail olarak gönderiliyor)
    if (mode === 'remove') {
      if (scope === 'user') {
        await sendWalletChangeMail(userId.trim(), mode, value, message.trim(), 'user');
      } else if (scope === 'all') {
        await sendWalletChangeMail(null, mode, value, message.trim(), 'all');
      }
    }

    setAmount('');
    setMessage('');
    setPreset('');
    setImageUrl('');
    setLoading(false);
  };

  // DÜZELTME 1: Temizleme işlemi useEffect'ten çıkarıldı, aşağıda onChange içine taşındı.
  // useEffect artık sadece arama (search) işlemiyle ilgileniyor.
  useEffect(() => {
    if (scope !== 'user') {
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const response = await fetch(`/api/admin/members/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      const data = (await response.json().catch(() => [])) as MemberResult[];
      if (active) {
        setSearchResults(Array.isArray(data) ? data : []);
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, scope]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">{t('admin.wallet.eyebrow')}</p>
        <h1 className="mt-2 text-2xl font-semibold">{t('admin.wallet.title')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('admin.wallet.subtitle')}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-white/50">{t('admin.wallet.operation')}</label>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as 'add' | 'remove')}
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            >
              <option value="add">{t('admin.wallet.mode_add')}</option>
              <option value="remove">{t('admin.wallet.mode_remove')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">{t('admin.wallet.scope')}</label>
            <select
              value={scope}
              // DÜZELTME 2: Temizleme işlemi buraya (event handler'a) taşındı.
              onChange={(event) => {
                const newScope = event.target.value as 'user' | 'all';
                setScope(newScope);
                if (newScope !== 'user') {
                  setSearchResults([]);
                  setSearchQuery('');
                  setSelectedMember(null);
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            >
              <option value="user">{t('admin.wallet.scope_user')}</option>
              <option value="all">{t('admin.wallet.scope_all')}</option>
            </select>
          </div>
        </div>

        {scope === 'user' && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/50">{t('admin.wallet.search_label')}</label>
              <input
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchQuery(value);
                  if (value.trim().length < 2) {
                    setSearchResults([]);
                  }
                }}
                placeholder={t('admin.wallet.search_placeholder')}
                className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
              />
              {searchLoading && <p className="text-xs text-white/50">{t('admin.wallet.searching')}</p>}
              {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-white/50">{t('admin.wallet.no_results')}</p>
              )}
              {searchResults.length > 0 && (
                <div className="grid gap-2 rounded-xl border border-white/10 bg-[#0b0d12]/60 p-2">
                  {searchResults.map((member) => {
                    const label = member.nickname || member.displayName || member.username;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setUserId(member.id);
                          setSelectedMember(member);
                          setSearchQuery(label);
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left text-sm text-white/80 transition hover:border-indigo-400/40"
                      >
                        <Image
                          src={member.avatarUrl}
                          alt="avatar"
                          width={28}
                          height={28}
                          unoptimized
                          className="h-7 w-7 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-sm text-white">{label}</p>
                          <p className="text-xs text-white/50">
                            @{member.username} · {member.id}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/50">{t('admin.wallet.user_id_label')}</label>
              <input
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setSelectedMember(null);
                }}
                placeholder={t('admin.wallet.user_id_placeholder')}
                className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            {selectedMember && (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedMember.avatarUrl}
                    alt="avatar"
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded-full border border-white/10"
                  />
                  <div>
                    <p className="text-white">
                      {selectedMember.nickname || selectedMember.displayName || selectedMember.username}
                    </p>
                    <p className="text-xs text-white/50">{selectedMember.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setUserId('');
                    setSearchQuery('');
                  }}
                  className="text-xs text-white/60 transition hover:text-white"
                >
                  {t('admin.wallet.clear_selection')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <label className="text-xs text-white/50">{t('admin.wallet.amount_label')}</label>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={t('admin.wallet.amount_placeholder')}
            type="number"
            className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs text-white/50">{t('admin.wallet.presets_label')}</label>
          <select
            value={preset}
            onChange={(event) => {
              const selected = event.target.value;
              setPreset(selected);
              const found = presets.find((item) => item.value === selected);
              if (found) {
                setMessage(found.text);
              }
            }}
            className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
          >
            <option value="">{t('admin.wallet.presets_select')}</option>
            {presets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/40">{t('admin.wallet.amount_hint')}</p>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs text-white/50">{mode === 'add' ? t('admin.wallet.description_required') : t('admin.wallet.description_optional')}</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder={t('admin.wallet.description_placeholder')}
            className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {mode === 'add' && (
          <div className="mt-4 space-y-2">
            <label className="text-xs text-white/50">{t('admin.wallet.image_label')}</label>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder={t('admin.wallet.image_placeholder')}
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            />
            {imageUrl.trim().length > 0 && (
              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <Image
                  src={imageUrl}
                  alt="preview"
                  width={960}
                  height={480}
                  unoptimized
                  className="max-h-64 w-full object-contain"
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('admin.wallet.submit_loading') : t('admin.wallet.submit')}
        </button>
      </div>
    </div>
  );
}