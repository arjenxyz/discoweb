'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuUsers, LuDatabase, LuSearch, LuWrench, LuShoppingBag, LuBell,
  LuTriangleAlert, LuMail, LuRefreshCw, LuArrowRight, LuActivity,
  LuZap, LuShield, LuGlobe,
} from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

type SystemStats = {
  totalMembers: number; totalServers: number; totalOrders: number;
  totalNotifications: number; totalErrors: number; totalMails: number;
  maintenanceActive: boolean; maintenanceModules: number; activeMaintenanceCount: number;
};


export default function DeveloperPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const shimmerStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #fff 0%, #fff 35%, rgba(255,255,255,0.95) 45%, #fff 55%, #fff 100%)',
    backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', animation: 'titleShine 4s ease-in-out infinite',
  };
  const shimmerBlue: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #5865F2 0%, #5865F2 35%, #a5b4ff 45%, #5865F2 55%, #5865F2 100%)',
    backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', animation: 'titleShine 4s ease-in-out infinite',
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const r = await fetch('/api/developer/system-stats', { credentials: 'include', cache: 'no-store' });
      if (r.ok) { const d = await r.json(); setStats(d.stats); }
    } catch { /* ignore */ } finally { setStatsLoading(false); }
  };

  useEffect(() => { setTimeout(() => setVisible(true), 60); loadStats(); }, []);

  const handleSync = async () => {
    setSyncLoading(true); setSyncMessage(null);
    try {
      const r = await fetch('/api/developer/sync-members', { method: 'POST', credentials: 'include' });
      const d: { message?: string; error?: string } = await r.json();
      setSyncMessage(r.ok ? (d.message || 'Tamamlandı.') : (d.error || 'Başarısız.'));
      loadStats();
    } catch { setSyncMessage('Hata oluştu.'); }
    finally { setSyncLoading(false); }
  };

  const statCards = [
    { label: 'Üye', value: stats?.totalMembers ?? 0, icon: LuUsers, color: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/20', iconColor: 'text-indigo-400' },
    { label: 'Sunucu', value: stats?.totalServers ?? 0, icon: LuDatabase, color: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/20', iconColor: 'text-violet-400' },
    { label: 'Sipariş', value: stats?.totalOrders ?? 0, icon: LuShoppingBag, color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
    { label: 'Bildirim', value: stats?.totalNotifications ?? 0, icon: LuBell, color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
    { label: 'Hata', value: stats?.totalErrors ?? 0, icon: LuTriangleAlert, color: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/20', iconColor: 'text-rose-400' },
    { label: 'Mail', value: stats?.totalMails ?? 0, icon: LuMail, color: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
  ];

  const quickActions = [
    { label: 'Kullanıcı Sorgula', desc: 'Tekil arama', href: '/developer/user-lookup', icon: LuSearch, color: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/20' },
    { label: 'Sunucular', desc: 'Toplu görünüm', href: '/developer/all-servers', icon: LuGlobe, color: 'bg-sky-500/15 text-sky-300 ring-sky-400/20' },
    { label: 'Bakım', desc: 'Modül durumları', href: '/developer/maintenance', icon: LuWrench, color: 'bg-amber-500/15 text-amber-300 ring-amber-400/20' },
    { label: 'API Test', desc: 'Endpoint testi', href: '/developer/api-test', icon: LuZap, color: 'bg-pink-500/15 text-pink-300 ring-pink-400/20' },
  ];

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/88 to-[#0a0a0c]/65" />
      <div className="pointer-events-none absolute -top-32 left-1/4 w-96 h-96 bg-[#5865F2]/15 rounded-full blur-[160px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-[140px] animate-pulse" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">Sistem Aktif</span>
              {stats?.maintenanceActive && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-300 font-bold">BAKIM</span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              <span style={shimmerStyle}>Developer</span>
              <span style={shimmerBlue}> Dashboard</span>
            </h1>
            <p className="text-sm text-white/25 mt-1">Sistem sağlığı, istatistikler ve AI komuta merkezi</p>
          </div>
          <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white transition-all backdrop-blur-md">
            <LuRefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
        </div>

        {/* Main Grid: Left stats + Right AI */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3">
              {statCards.map(c => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.color} backdrop-blur-xl p-4 hover:scale-[1.02] transition-transform`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${c.iconColor}`} />
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{c.label}</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                      {statsLoading ? <span className="inline-block w-10 h-6 bg-white/10 rounded animate-pulse" /> : c.value.toLocaleString('tr-TR')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white/70">Hızlı İşlemler</h2>
                <LuActivity className="w-4 h-4 text-[#5865F2]/40" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.href} onClick={() => router.push(a.href)}
                      className="group flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3 text-left hover:border-white/15 hover:bg-white/5 transition-all">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${a.color} ring-1`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{a.label}</p>
                        <p className="text-[10px] text-white/30 truncate">{a.desc}</p>
                      </div>
                      <LuArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 ml-auto flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/8">
                <button onClick={handleSync} disabled={syncLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/10 text-sm font-semibold text-[#5865F2] hover:bg-[#5865F2]/15 transition-all disabled:opacity-50">
                  <LuRefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Senkronize Ediliyor...' : 'Discord Üyelerini Senkronize Et'}
                </button>
                {syncMessage && <p className="mt-2 text-xs text-center text-[#5865F2]/70">{syncMessage}</p>}
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
              <h2 className="text-sm font-bold text-white/70 mb-4">Sistem Durumu</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Veritabanı', warn: false },
                  { label: 'Discord Bot', warn: false },
                  { label: 'OAuth', warn: false },
                  { label: 'Bakım Modu', warn: stats?.maintenanceActive ?? false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.warn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className={`text-[10px] font-medium ${item.warn ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {item.label === 'Bakım Modu' ? (item.warn ? 'Aktif' : 'Kapalı') : 'Çalışıyor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#5865F2]/8 border border-[#5865F2]/15">
                <LuShield className="w-4 h-4 text-[#5865F2] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Güvenli Oturum</p>
                  <p className="text-[10px] text-white/30">Discord Developer rolü doğrulandı</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Developer Notes */}
          <div className="lg:sticky lg:top-8">
            <div className="rounded-3xl border border-white/10 bg-[#0f1116]/80 backdrop-blur-xl p-6 min-h-[500px] flex flex-col justify-between">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#5865F2]/10 text-[#5865F2]">
                    <LuShield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Developer Panel Güncellemesi</h2>
                    <p className="text-sm text-white/40">Ekonomi ve borsa yönetimine ait araçlar kaldırıldı.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Mevcut araçlar</h3>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>Sunucu ve kullanıcı yönetimi</li>
                    <li>Bakım ve sistem durumu</li>
                    <li>Cache yönetimi</li>
                    <li>API testi ve konfigürasyon</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-[#5865F2]/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-3">Not</p>
                <p className="text-sm leading-6 text-white/60">Borsa ve ekonomi özellikleriyle ilgili sayfalar, menüler ve API çağrıları bu panelden kaldırılmıştır.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
