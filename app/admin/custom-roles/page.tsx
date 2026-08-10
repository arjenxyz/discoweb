'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { LuCheck, LuClock, LuSearch, LuShield, LuX } from 'react-icons/lu';
import DiscordProfileRolePreview from '../components/DiscordProfileRolePreview';
import type { CustomRoleRequestRow } from '@/lib/customRoles/types';
import { discordColorToHex } from '@/lib/customRoles/types';
import { useTranslation } from '@/lib/i18nContext';

type MemberHit = {
  id: string;
  username: string;
  nickname: string | null;
  displayName: string | null;
  avatarUrl: string;
};

export default function AdminCustomRolesPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'pending' | 'active' | 'all'>('pending');
  const [requests, setRequests] = useState<CustomRoleRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approveId, setApproveId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<MemberHit[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberHit | null>(null);
  const [durationHours, setDurationHours] = useState(24);
  const [autoAssign, setAutoAssign] = useState(true);
  const [hierarchyAck, setHierarchyAck] = useState(false);
  const [raffleLabel, setRaffleLabel] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const statusTabs = useMemo(
    () =>
      [
        { id: 'pending' as const, label: t('admin.custom_roles.tab_pending') },
        { id: 'active' as const, label: t('admin.custom_roles.tab_active') },
        { id: 'all' as const, label: t('admin.custom_roles.tab_all') },
      ] as const,
    [t],
  );

  const durationPresets = useMemo(
    () =>
      [
        { hours: 24, label: t('admin.custom_roles.duration_24h') },
        { hours: 72, label: t('admin.custom_roles.duration_3d') },
        { hours: 168, label: t('admin.custom_roles.duration_7d') },
        { hours: 720, label: t('admin.custom_roles.duration_30d') },
      ] as const,
    [t],
  );

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === approveId) ?? null,
    [requests, approveId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/custom-role-requests?status=${tab}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 403 ? t('admin.custom_roles.forbidden') : t('admin.custom_roles.load_error'));
        setRequests([]);
        return;
      }
      setRequests(data.requests ?? []);
    } catch {
      setError(t('admin.custom_roles.connection_error'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!approveId || memberQuery.trim().length < 2) {
      setMembers([]);
      return;
    }
    const timer = setTimeout(() => {
      setMemberSearchLoading(true);
      fetch(`/api/admin/members/search?q=${encodeURIComponent(memberQuery.trim())}&limit=10`)
        .then((r) => r.json())
        .then((list) => setMembers(Array.isArray(list) ? list : []))
        .catch(() => setMembers([]))
        .finally(() => setMemberSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [memberQuery, approveId]);

  const openApprove = (row: CustomRoleRequestRow) => {
    setApproveId(row.id);
    setMemberQuery('');
    setMembers([]);
    setSelectedMember(null);
    setDurationHours(24);
    setAutoAssign(true);
    setHierarchyAck(false);
    setRaffleLabel('');
    setAdminNote('');
    setActionMsg(null);
  };

  const closeApprove = () => {
    setApproveId(null);
    setSelectedMember(null);
  };

  const submitApprove = async () => {
    if (!approveId || !selectedMember) return;
    if (!hierarchyAck) {
      setActionMsg(t('admin.custom_roles.need_hierarchy_ack'));
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/custom-role-requests/${approveId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: selectedMember.id,
          duration_hours: durationHours,
          auto_assign: autoAssign,
          hierarchy_ack: hierarchyAck,
          admin_note: adminNote,
          raffle_label: raffleLabel || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'bot_hierarchy') {
          setActionMsg(data.message ?? t('admin.custom_roles.bot_hierarchy'));
        } else if (data.error === 'hierarchy_ack_required') {
          setActionMsg(t('admin.custom_roles.hierarchy_checkbox'));
        } else {
          setActionMsg(t('admin.custom_roles.create_failed'));
        }
        return;
      }
      if (data.hierarchy_warning) {
        setActionMsg(t('admin.custom_roles.created_move_up'));
      } else {
        setActionMsg(t('admin.custom_roles.created_ok'));
      }
      closeApprove();
      await load();
    } catch {
      setActionMsg(t('admin.custom_roles.action_failed'));
    } finally {
      setSaving(false);
    }
  };

  const reject = async (id: string) => {
    if (!confirm(t('admin.custom_roles.reject_confirm'))) return;
    const res = await fetch(`/api/admin/custom-role-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) await load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.custom_roles.title')}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {t('admin.custom_roles.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === tabItem.id
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {actionMsg && !approveId && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {actionMsg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">{t('admin.custom_roles.loading')}</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin.custom_roles.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded px-2 py-0.5 text-sm font-semibold"
                      style={{
                        backgroundColor: `${discordColorToHex(row.role_color)}33`,
                        color: discordColorToHex(row.role_color),
                      }}
                    >
                      {row.role_name}
                    </span>
                    <span className="text-xs text-slate-500">{row.status}</span>
                  </div>
                  {row.requester_note && (
                    <p className="mt-2 text-sm text-slate-400">{row.requester_note}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-slate-600">
                    {t('admin.custom_roles.request_label', {
                      id: row.target_user_id
                        ? `${row.requester_id} → ${row.target_user_id}`
                        : row.requester_id,
                    })}
                  </p>
                  {row.expires_at && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <LuClock className="h-3.5 w-3.5" />
                      {t('admin.custom_roles.expires', {
                        date: new Date(row.expires_at).toLocaleString('tr-TR'),
                      })}
                    </p>
                  )}
                </div>
                <div className="w-full max-w-[260px] shrink-0">
                  <DiscordProfileRolePreview
                    roleName={row.role_name}
                    roleColor={row.role_color}
                    roleIconUrl={row.role_icon_url}
                    displayName={t('admin.custom_roles.winner_member')}
                  />
                </div>
                {row.status === 'pending' && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => openApprove(row)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
                    >
                      <LuCheck className="h-4 w-4" />
                      {t('admin.custom_roles.create_role')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void reject(row.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <LuX className="h-4 w-4" />
                      {t('admin.custom_roles.reject')}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {approveId && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">
                {t('admin.custom_roles.modal_title', { name: activeRequest.role_name })}
              </h2>
              <button
                type="button"
                onClick={closeApprove}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">{t('admin.custom_roles.search_member')}</label>
                  <div className="relative mt-1">
                    <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={memberQuery}
                      onChange={(e) => {
                        setMemberQuery(e.target.value);
                        setSelectedMember(null);
                      }}
                      placeholder={t('admin.custom_roles.search_placeholder')}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  {memberSearchLoading && (
                    <p className="mt-2 text-xs text-slate-500">{t('admin.custom_roles.searching')}</p>
                  )}
                  {members.length > 0 && (
                    <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800">
                      {members.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(m);
                              setMemberQuery(m.displayName || m.nickname || m.username);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                              selectedMember?.id === m.id ? 'bg-indigo-500/10 text-indigo-200' : 'text-slate-300'
                            }`}
                          >
                            <Image
                              src={m.avatarUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="rounded-full"
                              unoptimized
                            />
                            <span>
                              {m.displayName || m.nickname || m.username}
                              <span className="ml-1 text-xs text-slate-500">{m.id}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">{t('admin.custom_roles.duration')}</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {durationPresets.map((p) => (
                      <button
                        key={p.hours}
                        type="button"
                        onClick={() => setDurationHours(p.hours)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          durationHours === p.hours
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={8760}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value) || 24)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">{t('admin.custom_roles.raffle_label')}</label>
                  <input
                    value={raffleLabel}
                    onChange={(e) => setRaffleLabel(e.target.value.slice(0, 120))}
                    placeholder={t('admin.custom_roles.raffle_placeholder')}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="rounded"
                  />
                  {t('admin.custom_roles.auto_assign')}
                </label>

                <label className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <input
                    type="checkbox"
                    checked={hierarchyAck}
                    onChange={(e) => setHierarchyAck(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span>
                    <LuShield className="mb-1 inline h-3.5 w-3.5" /> {t('admin.custom_roles.hierarchy_ack')}
                  </span>
                </label>

                {actionMsg && (
                  <p className="text-sm text-amber-300">{actionMsg}</p>
                )}

                <button
                  type="button"
                  disabled={saving || !selectedMember}
                  onClick={() => void submitApprove()}
                  className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-40"
                >
                  {saving ? t('admin.custom_roles.creating') : t('admin.custom_roles.create_discord')}
                </button>
              </div>

              <div>
                <DiscordProfileRolePreview
                  roleName={activeRequest.role_name}
                  roleColor={activeRequest.role_color}
                  roleIconUrl={activeRequest.role_icon_url}
                  username={selectedMember?.username ?? t('admin.custom_roles.fallback_username')}
                  displayName={
                    selectedMember?.displayName ??
                    selectedMember?.nickname ??
                    null
                  }
                  avatarUrl={selectedMember?.avatarUrl ?? null}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
