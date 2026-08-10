'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type MemberResult = {
  id: string;
  username: string;
  nickname: string | null;
  displayName: string | null;
  avatarUrl: string;
};

type Template = {
  value: string;
  label: string;
  title: string;
  type: 'announcement' | 'mail';
  body: string;
  detailsUrl?: string;
};

const ANNOUNCEMENT_TEMPLATES: Template[] = [
  {
    value: 'maintenance',
    label: t('developer.notifications_send.tpl_maint_label'),
    title: t('developer.notifications_send.tpl_maint_title'),
    type: 'announcement',
    body: t('developer.notifications_send.tpl_maint_body'),
  },
  {
    value: 'event',
    label: t('developer.notifications_send.tpl_event_label'),
    title: t('developer.notifications_send.tpl_event_title'),
    type: 'announcement',
    body: t('developer.notifications_send.tpl_event_body'),
  },
  {
    value: 'rules',
    label: t('developer.notifications_send.tpl_rules_label'),
    title: t('developer.notifications_send.tpl_rules_title'),
    type: 'announcement',
    body: t('developer.notifications_send.tpl_rules_body'),
  },
  {
    value: 'store',
    label: t('developer.notifications_send.tpl_store_label'),
    title: t('developer.notifications_send.tpl_store_title'),
    type: 'announcement',
    body: t('developer.notifications_send.tpl_store_body'),
  },
];

const MAIL_TEMPLATES: Template[] = [
  {
    value: 'account',
    label: t('developer.notifications_send.tpl_account_label'),
    title: t('developer.notifications_send.tpl_account_label'),
    type: 'mail',
    body: t('developer.notifications_send.tpl_account_body'),
    detailsUrl: 'https://',
  },
  {
    value: 'warning',
    label: t('developer.notifications_send.tpl_warn_label'),
    title: t('developer.notifications_send.tpl_warn_title'),
    type: 'mail',
    body: t('developer.notifications_send.tpl_warn_body'),
    detailsUrl: '',
  },
  {
    value: 'info',
    label: t('developer.notifications_send.tpl_info_label'),
    title: t('developer.notifications_send.tpl_info_title'),
    type: 'mail',
    body: t('developer.notifications_send.tpl_info_body'),
    detailsUrl: '',
  },
];

export default function AdminNotificationSendPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'announcement' | 'mail'>('announcement');
  const [template, setTemplate] = useState('');
  const [detailsUrl, setDetailsUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'mail') {
      setMemberQuery('');
      setMemberResults([]);
      setSelectedMember(null);
      return;
    }

    if (!memberQuery.trim()) {
      setMemberResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setMemberLoading(true);
      try {
        const response = await fetch(`/api/admin/members/search?q=${encodeURIComponent(memberQuery.trim())}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = (await response.json()) as MemberResult[];
          setMemberResults(data ?? []);
        }
      } finally {
        if (!controller.signal.aborted) {
          setMemberLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [memberQuery, type]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    if (type === 'mail' && !selectedMember) {
      setError(t('developer.notifications_send.need_member'));
      setSaving(false);
      return;
    }

    const response = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        type,
        status: 'published',
        targetUserId: type === 'mail' ? selectedMember?.id : null,
        detailsUrl: type === 'mail' && detailsUrl.trim().length ? detailsUrl.trim() : null,
        imageUrl: imageUrl.trim().length ? imageUrl.trim() : null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (data.error === 'target_required') {
        setError(t('developer.notifications_send.need_member'));
      } else {
        setError(t('developer.notifications_send.send_failed'));
      }
      setSaving(false);
      return;
    }

    setTitle('');
    setBody('');
    setTemplate('');
    setDetailsUrl('');
    setImageUrl('');
    setMemberQuery('');
    setMemberResults([]);
    setSelectedMember(null);
    setSaving(false);
  };

  const templateOptions = type === 'announcement' ? ANNOUNCEMENT_TEMPLATES : MAIL_TEMPLATES;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">{t('developer.notifications_send.submit')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('developer.notifications_send.subtitle')}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0d12]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">{t('developer.notifications_send.form_title')}</p>
            <p className="mt-2 text-sm text-white/60">{t('developer.notifications_send.form_desc')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('developer.common.title')}
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value as 'announcement' | 'mail')}
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            >
              <option value="announcement">{t('developer.announcements.mode_post')}</option>
              <option value="mail">{t('developer.home.stat_mail')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{t('developer.notifications_send.templates')}</label>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <select
                value={template}
                onChange={(event) => {
                  const selectedValue = event.target.value;
                  setTemplate(selectedValue);
                  const source = templateOptions.find((item) => item.value === selectedValue);
                  if (source) {
                    setTitle(source.title);
                    setBody(source.body);
                    setDetailsUrl(source.detailsUrl ?? '');
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
              >
                <option value="">{t('developer.notifications_send.pick_template')}</option>
                {templateOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {type === 'mail' && (
                <input
                  value={detailsUrl}
                  onChange={(event) => setDetailsUrl(event.target.value)}
                  placeholder={t('developer.notifications_history.detail_link')}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
                />
              )}
            </div>
          </div>
          {type === 'mail' && (
            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{t('developer.notifications_send.target_member')}</label>
              <input
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
                placeholder={t('developer.notifications_send.member_placeholder')}
                className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
              />
              {memberLoading && <p className="text-xs text-white/40">{t('developer.common.searching')}</p>}
              {!memberLoading && memberResults.length > 0 && (
                <div className="grid gap-2 rounded-xl border border-white/10 bg-[#0b0d12]/60 p-2">
                  {memberResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberResults([]);
                        setMemberQuery(member.nickname ?? member.displayName ?? member.username);
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      <Image
                        src={member.avatarUrl}
                        alt={member.username}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                      <div>
                        <p>{member.nickname ?? member.displayName ?? member.username}</p>
                        <p className="text-xs text-white/40">@{member.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="rounded-xl border border-white/10 bg-[#0b0d12]/60 p-3 text-sm text-white/70">
                  <p>{t('developer.notifications_send.selected_member', { name: selectedMember.nickname ?? selectedMember.displayName ?? selectedMember.username })}</p>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{t('developer.notifications_send.image')}</label>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
            />
            {imageUrl.trim().length > 0 && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2">
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
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('developer.notifications_send.body_placeholder')}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-[#0b0d12]/70 px-4 py-3 text-sm text-white/80 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !title || !body}
          className="mt-4 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('developer.common.sending') : t('developer.notifications_send.submit')}
        </button>
      </div>
    </div>
  );
}
