'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuUsers,
  LuDatabase,
  LuSearch,
  LuWrench,
  LuShoppingBag,
  LuBell,
  LuTriangleAlert,
  LuMail,
  LuRefreshCw,
  LuArrowRight,
  LuActivity,
  LuZap,
  LuShield,
  LuGlobe,
  LuTrendingUp,
  LuClipboardList,
} from 'react-icons/lu';

type SystemStats = {
  totalMembers: number;
  totalServers: number;
  totalOrders: number;
  totalNotifications: number;
  totalErrors: number;
  totalMails: number;
  maintenanceActive: boolean;
  maintenanceModules: number;
  activeMaintenanceCount: number;
};

export default function DeveloperPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/developer/system-stats', { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSyncMembers = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/developer/sync-members', { method: 'POST', credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSyncMessage(data.message || 'Senkronizasyon tamamlandı.');
        loadStats();
      } else {
        const data = await response.json().catch(() => ({}));
        setSyncMessage(data.error || 'Senkronizasyon başarısız.');
      }
    } catch {
      setSyncMessage('Senkronizasyon sırasında hata oluştu.');
    } finally {
      setSyncLoading(false);
    }
  };

  const statCards = [
    { label: 'Toplam Üye', value: stats?.totalMembers ?? 0, icon: LuUsers, color: 'from-indigo-500/20 to-indigo-600/10', iconColor: 'text-indigo-400', borderColor: 'border-indigo-500/20' },
    { label: 'Sunucu', value: stats?.totalServers ?? 0, icon: LuDatabase, color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400', borderColor: 'border-violet-500/20' },
    { label: 'Sipariş', value: stats?.totalOrders ?? 0, icon: LuShoppingBag, color: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
    { label: 'Bildirim', value: stats?.totalNotifications ?? 0, icon: LuBell, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20' },
    { label: 'Hata Logu', value: stats?.totalErrors ?? 0, icon: LuTriangleAlert, color: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-400', borderColor: 'border-rose-500/20' },
    { label: 'Sistem Maili', value: stats?.totalMails ?? 0, icon: LuMail, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400', borderColor: 'border-cyan-500/20' },
  ];

  const quickActions = [
    { label: 'Kullanıcı Sorgula', desc: 'Tekil kullanıcı araması', href: '/developer/user-lookup', icon: LuSearch, color: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/20' },
    { label: 'Sunucular & Üyeler', desc: 'Toplu görünüm ve analiz', href: '/developer/all-servers', icon: LuGlobe, color: 'bg-sky-500/15 text-sky-300 ring-sky-400/20' },
    { label: 'Bakım Yönetimi', desc: 'Modül bakım durumları', href: '/developer/maintenance', icon: LuWrench, color: 'bg-amber-500/15 text-amber-300 ring-amber-400/20' },
    { label: 'API Test', desc: 'Endpoint test aracı', href: '/developer/api-test', icon: LuZap, color: 'bg-pink-500/15 text-pink-300 ring-pink-400/20' },
    { label: 'Borsa Yönetimi', desc: 'Listeler, AI analiz, aksiyonlar', href: '/developer/market', icon: LuTrendingUp, color: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20' },
    { label: 'Başvurular', desc: 'Ekonomi ve IPO başvuruları', href: '/developer/applications', icon: LuClipboardList, color: 'bg-orange-500/15 text-orange-300 ring-orange-400/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Sistem Aktif</span>
            </div>
            {stats?.maintenanceActive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20">
                <LuWrench className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Bakım Modu</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Developer Dashboard</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Sistem sağlığı, istatistikler ve hızlı operasyonlar.</p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all"
        >
          <LuRefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.color} backdrop-blur-xl p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
                <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {statsLoading ? (
                  <span className="inline-block w-12 h-7 bg-white/10 rounded animate-pulse" />
                ) : (
                  card.value.toLocaleString('tr-TR')
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + System Status */}
      <div className="grid lg:grid-cols-[1fr_0.55fr] gap-6">
        {/* Quick Actions */}
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Hızlı İşlemler</h2>
              <p className="text-xs text-white/40 mt-0.5">Sık kullanılan operasyonlar</p>
            </div>
            <LuActivity className="w-5 h-5 text-[#5865F2]/60" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => router.push(action.href)}
                  className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-left transition-all hover:border-white/15 hover:bg-white/5"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} ring-1`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="text-[11px] text-white/40">{action.desc}</p>
                  </div>
                  <LuArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Sync Members */}
          <div className="mt-4 pt-4 border-t border-white/8">
            <button
              type="button"
              onClick={handleSyncMembers}
              disabled={syncLoading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/10 text-sm font-semibold text-[#5865F2] hover:bg-[#5865F2]/15 transition-all ${syncLoading ? 'opacity-60' : ''}`}
            >
              <LuRefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Senkronize Ediliyor...' : 'Discord Üyelerini Senkronize Et'}
            </button>
            {syncMessage && (
              <div className="mt-3 p-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20">
                <p className="text-xs text-[#5865F2]/80">{syncMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Sistem Durumu</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Veritabanı', status: true, color: 'bg-emerald-400' },
                { label: 'Discord Bot', status: true, color: 'bg-emerald-400' },
                { label: 'OAuth Servisi', status: true, color: 'bg-emerald-400' },
                { label: 'Bakım Modu', status: stats?.maintenanceActive ?? false, color: stats?.maintenanceActive ? 'bg-amber-400' : 'bg-emerald-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-white/60">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className={`text-xs font-medium ${
                      item.label === 'Bakım Modu'
                        ? item.status ? 'text-amber-300' : 'text-emerald-300'
                        : item.status ? 'text-emerald-300' : 'text-rose-300'
                    }`}>
                      {item.label === 'Bakım Modu'
                        ? item.status ? 'Aktif' : 'Kapalı'
                        : item.status ? 'Çalışıyor' : 'Hata'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Info */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Platform Bilgisi</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Ortam', value: process.env.NODE_ENV === 'production' ? 'Production' : 'Development' },
                { label: 'Framework', value: 'Next.js 15' },
                { label: 'Veritabanı', value: 'Supabase' },
                { label: 'Bot', value: 'Discord.js' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-white/60">{item.label}</span>
                  <span className="text-xs font-medium text-white/80">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Badge */}
          <div className="rounded-3xl border border-[#5865F2]/15 bg-[#5865F2]/5 backdrop-blur-xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/20">
                <LuShield className="w-5 h-5 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Güvenli Oturum</p>
                <p className="text-[11px] text-white/40">Discord Developer rolü ile doğrulanmış</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
