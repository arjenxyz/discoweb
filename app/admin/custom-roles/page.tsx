'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { LuCheck, LuClock, LuSearch, LuShield, LuX } from 'react-icons/lu';
import DiscordRolePreview from '../components/DiscordRolePreview';
import type { CustomRoleRequestRow } from '@/lib/customRoles/types';
import { discordColorToHex } from '@/lib/customRoles/types';

type MemberHit = {
  id: string;
  username: string;
  nickname: string | null;
  displayName: string | null;
  avatarUrl: string;
};

const STATUS_TABS = [
  { id: 'pending', label: 'Bekleyen' },
  { id: 'active', label: 'Aktif' },
  { id: 'all', label: 'Tümü' },
] as const;

const DURATION_PRESETS = [
  { hours: 24, label: '24 saat' },
  { hours: 72, label: '3 gün' },
  { hours: 168, label: '7 gün' },
  { hours: 720, label: '30 gün' },
];

export default function AdminCustomRolesPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]['id']>('pending');
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
        setError(res.status === 403 ? 'Bu sayfaya erişim yetkiniz yok.' : 'Talepler yüklenemedi.');
        setRequests([]);
        return;
      }
      setRequests(data.requests ?? []);
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!approveId || memberQuery.trim().length < 2) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      setMemberSearchLoading(true);
      fetch(`/api/admin/members/search?q=${encodeURIComponent(memberQuery.trim())}&limit=10`)
        .then((r) => r.json())
        .then((list) => setMembers(Array.isArray(list) ? list : []))
        .catch(() => setMembers([]))
        .finally(() => setMemberSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
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
      setActionMsg('Rol hiyerarşisi uyarısını onaylamanız gerekir.');
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
          setActionMsg(data.message ?? 'Bot rolü yetersiz. Rolü Discord\'da yukarı taşıyın.');
        } else if (data.error === 'hierarchy_ack_required') {
          setActionMsg('Hiyerarşi onay kutusunu işaretleyin.');
        } else {
          setActionMsg('Rol oluşturulamadı. Tekrar deneyin.');
        }
        return;
      }
      if (data.hierarchy_warning) {
        setActionMsg('Rol oluşturuldu. Rolü botun üstüne taşımayı unutmayın.');
      } else {
        setActionMsg('Rol oluşturuldu ve kayıt güncellendi.');
      }
      closeApprove();
      await load();
    } catch {
      setActionMsg('İşlem başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Bu talebi reddetmek istediğinize emin misiniz?')) return;
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
        <h1 className="text-2xl font-bold text-white">Özel Rol Talepleri</h1>
        <p className="mt-1 text-sm text-slate-400">
          Çekiliş kazananlarını aratın, süreyi belirleyin, Discord&apos;da rolü oluşturun. Süre dolunca bot rolü siler.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
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
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500">Bu filtrede talep yok.</p>
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
                    Talep: {row.requester_id}
                    {row.target_user_id ? ` → ${row.target_user_id}` : ''}
                  </p>
                  {row.expires_at && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <LuClock className="h-3.5 w-3.5" />
                      Bitiş: {new Date(row.expires_at).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
                <div className="w-full max-w-[260px] shrink-0">
                  <DiscordRolePreview
                    roleName={row.role_name}
                    roleColor={row.role_color}
                    username="kazanan"
                    displayName="Kazanan Üye"
                    showHierarchyWarning={false}
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
                      Rolü Oluştur
                    </button>
                    <button
                      type="button"
                      onClick={() => void reject(row.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <LuX className="h-4 w-4" />
                      Reddet
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
              <h2 className="text-lg font-semibold text-white">Rolü Oluştur — {activeRequest.role_name}</h2>
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
                  <label className="text-xs font-medium text-slate-500">Kazanan üye ara</label>
                  <div className="relative mt-1">
                    <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={memberQuery}
                      onChange={(e) => {
                        setMemberQuery(e.target.value);
                        setSelectedMember(null);
                      }}
                      placeholder="Kullanıcı adı veya ID"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  {memberSearchLoading && (
                    <p className="mt-2 text-xs text-slate-500">Aranıyor…</p>
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
                  <label className="text-xs font-medium text-slate-500">Süre</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((p) => (
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
                  <label className="text-xs font-medium text-slate-500">Çekiliş etiketi (isteğe bağlı)</label>
                  <input
                    value={raffleLabel}
                    onChange={(e) => setRaffleLabel(e.target.value.slice(0, 120))}
                    placeholder="Örn. Mart 2026 Çekilişi"
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
                  Rol oluşturulduktan sonra kazanan üyeye otomatik ver
                </label>

                <label className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <input
                    type="checkbox"
                    checked={hierarchyAck}
                    onChange={(e) => setHierarchyAck(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span>
                    <LuShield className="mb-1 inline h-3.5 w-3.5" /> Rolün botun altında kalabileceğini ve ikonun
                    görünmeyebileceğini biliyorum; gerekirse Discord&apos;da rolü yukarı taşıyacağım.
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
                  {saving ? 'Oluşturuluyor…' : 'Created Rol — Discord\'da Oluştur'}
                </button>
              </div>

              <div>
                <DiscordRolePreview
                  roleName={activeRequest.role_name}
                  roleColor={activeRequest.role_color}
                  username={selectedMember?.username ?? 'kazanan'}
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
