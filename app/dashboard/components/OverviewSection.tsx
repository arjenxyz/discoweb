'use client';

import Image from 'next/image';
import type { MemberProfile, OverviewStats, OrderStats, OverviewStatsExpanded } from '../types';

type OverviewSectionProps = {
  overviewLoading: boolean;
  overviewStats: OverviewStats | OverviewStatsExpanded | null;
  profileLoading: boolean;
  profileError: string | null;
  unauthorized: boolean;
  profile: MemberProfile | null;
  orderStats?: OrderStats | null;
  renderPapelAmount: (value: number) => React.ReactNode;
  formatRoleColor: (color: number) => string;
};

export default function OverviewSection({
  overviewLoading,
  overviewStats,
  profileLoading,
  profileError,
  unauthorized,
  profile,
  renderPapelAmount,
  formatRoleColor,
}: OverviewSectionProps) {
  // Move papelLeaderboard and related variables here
  type LeaderboardMember = NonNullable<OverviewStatsExpanded['papelLeaderboard']>[number] & {
    userId: string;
    papel: number;
  };

  const papelLeaderboard = ((overviewStats as OverviewStatsExpanded)?.papelLeaderboard ?? []) as LeaderboardMember[];
  // Use the strongly-typed MemberProfile instead of `any` to satisfy ESLint/TS.
  const prof = profile as MemberProfile | null;
  const currentUserId = prof?.userId;
  const currentUserInLeaderboard = papelLeaderboard.some((m: LeaderboardMember) => m.userId === currentUserId);
  const currentUserInfo = currentUserId && prof ? {
    userId: currentUserId,
    avatarUrl: prof.avatarUrl,
    nickname: prof.nickname,
    displayName: prof.displayName,
    username: prof.username,
    papel: (overviewStats as OverviewStatsExpanded)?.papel ?? 0,
    isCurrentUser: true,
  } : null;


  const getSafeAvatarUrl = (url: unknown) =>
    typeof url === 'string' && url.trim() ? url : '/default-avatar.png';

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 overview-fade">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Genel Bakış</p>
      <p className="mt-1 text-sm text-white/60">
        Genel Bakış, sunucudaki aktivite ve profil özetinizi hızlıca görmeniz için tasarlanmıştır.
      </p>
      <p className="mt-2 text-xs text-white/40">Özet veriler her gün 00:00’da güncellenir.</p>
      {overviewLoading ? (
        <p className="mt-4 text-sm text-white/60">Özet hazırlanıyor...</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0d12]/60 p-5 overview-fade overview-delay-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Profil Özeti</p>
            {profileLoading ? (
              <p className="mt-3 text-sm text-white/60">Profil yükleniyor...</p>
            ) : profileError ? (
              <p className="mt-3 text-sm text-rose-300">{profileError}</p>
            ) : unauthorized ? (
              <p className="mt-3 text-sm text-white/60">Profil bilgilerini görmek için giriş yapın.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                    {profile?.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt="avatar"
                        width={80}
                        height={80}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-white/50">?</div>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">
                      {profile?.nickname ?? profile?.displayName ?? profile?.username}
                    </p>
                    <p className="text-base text-white/50">@{profile?.username}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile?.roles?.length ? (
                    profile.roles.map((role: { id: string; name: string; color: number }) => (
                      <span
                        key={role.id}
                        className={`role-glow rounded-full border border-white/10 px-2 py-1 transition hover:scale-[1.03] ${
                          (profile?.roles?.length ?? 0) > 10
                            ? 'text-[9px]'
                            : (profile?.roles?.length ?? 0) > 6
                              ? 'text-[10px]'
                              : 'text-[11px]'
                        }`}
                        style={{
                          borderColor: `${formatRoleColor(role.color)}55`,
                          color: formatRoleColor(role.color),
                          ['--role-color' as string]: `${formatRoleColor(role.color)}66`,
                          ['--role-color-soft' as string]: `${formatRoleColor(role.color)}22`,
                        }}
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/40">Rol bilgisi bulunamadı.</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0b0d12]/60 p-5 overview-fade overview-delay-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Senin Özetin</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">Mesaj sayın</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {overviewStats?.userMessages?.toLocaleString('tr-TR') ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">Sesli dakika</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {overviewStats?.userVoiceMinutes?.toLocaleString('tr-TR') ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">Tag Durumu</p>
                  <p className="mt-1 text-sm text-white/60">
                    {(overviewStats as OverviewStatsExpanded)?.hasTag ? `Evet` : 'Hayır'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">Boost Durumu</p>
                  <p className="mt-1 text-sm text-white/60">
                    {(overviewStats as OverviewStatsExpanded)?.isBooster ? `Evet` : 'Hayır'}
                  </p>
                </div>
                {/* Removed: Son 24 saat - Mesaj and Son 24 saat - Sesli dakika tiles */}
                {/* Sunucuya katılım tarihi ve toplam rol kaldırıldı */}
                {(overviewStats as OverviewStatsExpanded)?.totalsSinceVerified ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                    <p className="text-xs text-white/50">Doğrulandıktan beri (toplam)</p>
                    <p className="mt-1 text-sm text-white/60">Mesaj: <span className="font-semibold">{(overviewStats as OverviewStatsExpanded)?.totalsSinceVerified?.messages?.toLocaleString?.('tr-TR') ?? (overviewStats as OverviewStatsExpanded)?.totalsSinceVerified?.messages ?? 0}</span> — Ses: <span className="font-semibold">{(overviewStats as OverviewStatsExpanded)?.totalsSinceVerified?.voice_minutes?.toLocaleString?.('tr-TR') ?? (overviewStats as OverviewStatsExpanded)?.totalsSinceVerified?.voice_minutes ?? 0}</span></p>
                    <p className="mt-1 text-xs text-white/40">Doğrulanma tarihi: {(overviewStats as OverviewStatsExpanded)?.verifiedSince ? new Date((overviewStats as OverviewStatsExpanded)!.verifiedSince!).toLocaleString('tr-TR') : '—'}</p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b0d12]/60 p-5 overview-fade overview-delay-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Sunucu Papel Sıralaması</p>
              <p className="mt-2 text-sm text-white/60">Menüden Sıralama’ya tıklayarak açabilirsiniz.</p>
            </div>
          </div>

        </div>
      )}

    </section>
  );
}
