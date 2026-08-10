'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LuMessageSquare,
  LuMic,
  LuUsers,
  LuWallet,
  LuTag,
  LuZap,
  LuArrowUpRight,
  LuRefreshCw,
  LuPackage,
  LuCoins,
  LuBell,
  LuTrophy,
  LuStore,
} from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import { getLocaleTag, type LanguageCode } from '@/lib/i18n/languages';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { LOCAL_DEV_MOCK_OVERVIEW_STATS } from '@/lib/localDevMocks';

type OverviewStats = {
  rangeHours: number;
  rangeMessages: number;
  rangeVoiceMinutes: number;
  totalMessages: number;
  totalVoiceMinutes: number;
  totalMembers: number;
  totalWallets: number;
  totalCirculation: number;
  avgBalance: number;
  highestBalance: number;
  pendingOrders: number;
  paidOrders: number;
  activeStoreItems: number;
  tagCount: number;
  boosterCount: number;
};

type Props = {
  serverName: string | null;
  serverSetup: boolean;
  selectedGuildId: string;
};

const useNumberFormat = (language: LanguageCode) =>
  useMemo(() => new Intl.NumberFormat(getLocaleTag(language)), [language]);

function isEmptyStats(data: OverviewStats): boolean {
  return (
    data.rangeMessages === 0 &&
    data.rangeVoiceMinutes === 0 &&
    data.totalMembers === 0 &&
    data.totalWallets === 0 &&
    data.totalCirculation === 0
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'blurple',
  href,
  fmt,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'blurple' | 'cyan' | 'amber' | 'emerald';
  href?: string;
  fmt: Intl.NumberFormat;
}) {
  const tones = {
    blurple: {
      glow: 'bg-[#5865F2]/30',
      chip: 'bg-[#5865F2]/20 text-[#a5b4ff]',
    },
    cyan: {
      glow: 'bg-cyan-400/25',
      chip: 'bg-cyan-500/15 text-cyan-300',
    },
    amber: {
      glow: 'bg-amber-400/25',
      chip: 'bg-amber-500/15 text-amber-300',
    },
    emerald: {
      glow: 'bg-emerald-400/25',
      chip: 'bg-emerald-500/15 text-emerald-300',
    },
  }[tone];

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05] sm:p-5 ${
        href ? 'cursor-pointer' : ''
      }`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full ${tones.glow} blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones.chip}`}>
          {icon}
        </span>
        {href ? (
          <LuArrowUpRight className="h-4 w-4 text-white/25 transition group-hover:text-white/60" />
        ) : null}
      </div>
      <p className="relative mt-4 text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
        {typeof value === 'number' ? fmt.format(value) : value}
      </p>
      <p className="relative mt-1 text-sm text-white/50">{label}</p>
      {sub ? <p className="relative mt-0.5 text-xs text-white/30">{sub}</p> : null}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function AdminOverviewClient({
  serverName: _serverName,
  serverSetup: _serverSetup,
  selectedGuildId: _selectedGuildId,
}: Props) {
  const { t, language } = useTranslation();
  const fmt = useNumberFormat(language);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const applyLocalFallback = useCallback((data: OverviewStats | null): OverviewStats => {
    if (!isLocalDevBypassClient()) {
      return data ?? { ...LOCAL_DEV_MOCK_OVERVIEW_STATS, rangeHours: 24 };
    }
    if (!data || isEmptyStats(data)) {
      return { ...LOCAL_DEV_MOCK_OVERVIEW_STATS, rangeHours: 24 };
    }
    return data;
  }, []);

  const fetchStats = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const res = await fetch('/api/admin/overview-stats?rangeHours=24', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as OverviewStats;
          setStats(applyLocalFallback(data));
        } else if (isLocalDevBypassClient()) {
          setStats({ ...LOCAL_DEV_MOCK_OVERVIEW_STATS, rangeHours: 24 });
        } else {
          setStats(null);
        }
      } catch {
        if (isLocalDevBypassClient()) {
          setStats({ ...LOCAL_DEV_MOCK_OVERVIEW_STATS, rangeHours: 24 });
        } else {
          setStats(null);
        }
      }
      setLoading(false);
      setRefreshing(false);
    },
    [applyLocalFallback],
  );

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const quickActions = [
    {
      href: '/admin/store/products/new',
      label: t('admin.dashboard.action_new_product'),
      icon: LuPackage,
    },
    {
      href: '/admin/wallet',
      label: t('admin.dashboard.action_wallet'),
      icon: LuWallet,
    },
    {
      href: '/admin/quiz',
      label: t('sidebar.quiz_events'),
      icon: LuTrophy,
    },
    {
      href: '/admin/notifications/send',
      label: t('admin.dashboard.action_notify'),
      icon: LuBell,
    },
    {
      href: '/admin/earn-settings',
      label: t('admin.dashboard.earn_settings'),
      icon: LuCoins,
    },
    {
      href: '/admin/guide',
      label: t('admin.dashboard.action_guide'),
      icon: LuStore,
    },
  ];

  const refreshButton = (
    <button
      type="button"
      onClick={() => void fetchStats(true)}
      disabled={refreshing || loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/55 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
      aria-label={t('admin.dashboard.refresh')}
    >
      <LuRefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{t('admin.dashboard.refresh')}</span>
    </button>
  );

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                {t('admin.dashboard.server_activity')}
              </p>
              {refreshButton}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<LuMessageSquare className="h-5 w-5" />}
                label={t('admin.dashboard.messages_24h')}
                value={stats.rangeMessages}
                sub={`${t('admin.dashboard.total')}: ${fmt.format(stats.totalMessages)}`}
                tone="blurple"
                fmt={fmt}
              />
              <StatCard
                icon={<LuMic className="h-5 w-5" />}
                label={t('admin.dashboard.voice_24h')}
                value={stats.rangeVoiceMinutes}
                sub={t('admin.dashboard.total_min', { 0: fmt.format(stats.totalVoiceMinutes) })}
                tone="cyan"
                fmt={fmt}
              />
              <StatCard
                icon={<LuUsers className="h-5 w-5" />}
                label={t('admin.dashboard.registered_members')}
                value={stats.totalMembers}
                sub={t('admin.dashboard.wallets_created', { 0: fmt.format(stats.totalWallets) })}
                tone="emerald"
                href="/admin/wallet"
                fmt={fmt}
              />
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-1 xl:grid-rows-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#a5b4ff]">
                    <LuTag className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-white">{fmt.format(stats.tagCount)}</p>
                    <p className="truncate text-xs text-white/40">{t('admin.dashboard.tag_owner')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                    <LuZap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-white">{fmt.format(stats.boosterCount)}</p>
                    <p className="truncate text-xs text-white/40">{t('admin.dashboard.booster')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
              {t('admin.dashboard.economy')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<LuWallet className="h-5 w-5" />}
                label={t('admin.dashboard.circulation')}
                value={stats.totalCirculation}
                sub={t('admin.dashboard.avg_balance', { 0: fmt.format(stats.avgBalance) })}
                tone="amber"
                href="/admin/wallet"
                fmt={fmt}
              />
              <StatCard
                icon={<LuCoins className="h-5 w-5" />}
                label={t('admin.dashboard.highest_balance')}
                value={stats.highestBalance}
                tone="amber"
                fmt={fmt}
              />
              <StatCard
                icon={<LuPackage className="h-5 w-5" />}
                label={t('admin.dashboard.active_products')}
                value={stats.activeStoreItems}
                sub={t('admin.dashboard.orders_summary', {
                  0: fmt.format(stats.pendingOrders),
                  1: fmt.format(stats.paidOrders),
                })}
                tone="emerald"
                href="/admin/store"
                fmt={fmt}
              />
              <StatCard
                icon={<LuBell className="h-5 w-5" />}
                label={t('admin.dashboard.pending_orders')}
                value={stats.pendingOrders}
                sub={t('admin.dashboard.paid_orders', { 0: fmt.format(stats.paidOrders) })}
                tone="blurple"
                href="/admin/store"
                fmt={fmt}
              />
            </div>
          </section>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">{t('admin.dashboard.stats_error')}</p>
          {refreshButton}
        </div>
      )}

      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
          {t('admin.dashboard.quick_actions')}
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition hover:border-[#5865F2]/35 hover:bg-[#5865F2]/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2]/15 text-[#a5b4ff] transition group-hover:bg-[#5865F2]/25">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/70 transition group-hover:text-white">
                  {action.label}
                </span>
                <LuArrowUpRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-[#a5b4ff]" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
