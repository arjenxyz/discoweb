'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RemoveSetupButton from './RemoveSetupButton';
import {
  LuMessageSquare,
  LuMic,
  LuUsers,
  LuWallet,
  LuTrendingUp,
  LuClock,
  LuTag,
  LuZap,
  LuArrowUpRight,
  LuRefreshCw,
  LuShield,
  LuPackage,
  LuCoins,
  LuChartBar,
  LuDatabase,
  LuSettings,
  LuBell,
  LuStore,
} from 'react-icons/lu';

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

const fmt = new Intl.NumberFormat('tr-TR');

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] p-5 transition hover:border-white/20 ${href ? 'cursor-pointer' : ''}`}>
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.replace('bg-', 'bg-').replace('500', '500/15')} ${color.replace('bg-', 'text-').replace('500', '300')}`}>
          {icon}
        </div>
        {href && <LuArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:text-white/60" />}
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{typeof value === 'number' ? fmt.format(value) : value}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function AdminOverviewClient({
  serverName,
  serverSetup,
  selectedGuildId,
}: Props) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/overview-stats?rangeHours=24', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-[#0f1116] to-purple-500/5 p-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Yönetim Paneli</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${serverSetup ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                {serverSetup ? 'Aktif' : 'Kurulmamış'}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">
              {serverName ?? 'Yönetim Merkezi'}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Sunucunuzun genel durumunu ve istatistiklerini buradan takip edin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            <Link
              href="/admin/earn-settings"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <LuChartBar className="h-4 w-4" />
              Kazanç Ayarları
            </Link>
            <Link
              href="/admin/maintenance"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <LuShield className="h-4 w-4" />
              Bakım Modu
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Activity Stats */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Sunucu Aktivitesi</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<LuMessageSquare className="h-5 w-5" />}
                label="Mesaj (Son 24 Saat)"
                value={stats.rangeMessages}
                sub={`Toplam: ${fmt.format(stats.totalMessages)}`}
                color="bg-blue-500"
              />
              <StatCard
                icon={<LuMic className="h-5 w-5" />}
                label="Sesli Dakika (Son 24 Saat)"
                value={stats.rangeVoiceMinutes}
                sub={`Toplam: ${fmt.format(stats.totalVoiceMinutes)} dk`}
                color="bg-violet-500"
              />
              <StatCard
                icon={<LuUsers className="h-5 w-5" />}
                label="Kayıtlı Üye"
                value={stats.totalMembers}
                sub={`${fmt.format(stats.totalWallets)} cüzdan oluşturulmuş`}
                color="bg-cyan-500"
              />
              <div className="grid grid-rows-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1116] p-4 transition hover:border-white/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                    <LuTag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{fmt.format(stats.tagCount)}</p>
                    <p className="text-xs text-white/40">Tag Sahibi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1116] p-4 transition hover:border-white/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                    <LuZap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{fmt.format(stats.boosterCount)}</p>
                    <p className="text-xs text-white/40">Booster</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Economy & Store */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Ekonomi & Mağaza</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<LuCoins className="h-5 w-5" />}
                label="Dolaşımdaki Papel"
                value={`${fmt.format(stats.totalCirculation)} P`}
                sub={`Ortalama: ${fmt.format(stats.avgBalance)} papel/üye`}
                color="bg-emerald-500"
                href="/admin/wallet"
              />
              <StatCard
                icon={<LuTrendingUp className="h-5 w-5" />}
                label="En Yüksek Bakiye"
                value={`${fmt.format(stats.highestBalance)} P`}
                color="bg-amber-500"
              />
              <StatCard
                icon={<LuPackage className="h-5 w-5" />}
                label="Aktif Ürün"
                value={stats.activeStoreItems}
                sub={`${fmt.format(stats.paidOrders)} tamamlanan sipariş`}
                color="bg-pink-500"
                href="/admin/store/products"
              />
              <StatCard
                icon={<LuClock className="h-5 w-5" />}
                label="Bekleyen Sipariş"
                value={stats.pendingOrders}
                sub={stats.pendingOrders > 0 ? 'İşlem bekliyor' : 'Bekleyen yok'}
                color="bg-orange-500"
                href="/admin/store/orders/pending"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/50">
          İstatistik verileri yüklenemedi. Lütfen sayfayı yenileyin.
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Hızlı İşlemler</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/admin/store/products/new', label: 'Yeni Ürün Oluştur', icon: <LuPackage className="h-5 w-5" />, color: 'text-emerald-300' },
            { href: '/admin/wallet', label: 'Bakiye Yönetimi', icon: <LuWallet className="h-5 w-5" />, color: 'text-blue-300' },
            { href: '/admin/notifications/send', label: 'Bildirim Gönder', icon: <LuBell className="h-5 w-5" />, color: 'text-violet-300' },
            { href: '/admin/store/promos/new', label: 'Promosyon Kodu Oluştur', icon: <LuTag className="h-5 w-5" />, color: 'text-pink-300' },
            { href: '/admin/store/discounts/new', label: 'İndirim Kodu Oluştur', icon: <LuCoins className="h-5 w-5" />, color: 'text-amber-300' },
            { href: '/admin/log-channels', label: 'Log Kanalları', icon: <LuDatabase className="h-5 w-5" />, color: 'text-cyan-300' },
            { href: '/admin/earn-settings', label: 'Kazanç Ayarları', icon: <LuSettings className="h-5 w-5" />, color: 'text-indigo-300' },
            { href: '/admin/guide', label: 'Kullanım Kılavuzu', icon: <LuStore className="h-5 w-5" />, color: 'text-white/50' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1116] p-4 transition hover:border-white/20 hover:bg-white/5"
            >
              <span className={`${action.color}`}>{action.icon}</span>
              <span className="text-sm text-white/70 transition group-hover:text-white">{action.label}</span>
              <LuArrowUpRight className="ml-auto h-4 w-4 text-white/20 transition group-hover:text-white/50" />
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-red-400">Tehlikeli Bölge</h2>
            <p className="mt-1 text-sm text-white/50">
              Bu işlemler geri alınamaz. Dikkatli kullanın.
            </p>
          </div>
          <RemoveSetupButton />
        </div>
      </div>
    </div>
  );
}
