'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Ubuntu } from 'next/font/google';
import {
  LuLayoutDashboard,
  LuUsers,
  LuDatabase,
  LuSearch,
  LuWrench,
  LuTrash2,
  LuHardDrive,
  LuSettings,
  LuFlaskConical,
  LuChevronLeft,
  LuChevronRight,
  LuLogOut,
  LuShield,
  LuMenu,
  LuX,
  LuGlobe,
  LuTrendingUp,
  LuClipboardList,
} from 'react-icons/lu';
import PanelSwitcher from '@/components/PanelSwitcher';
import type { PanelType } from '@/components/PanelSwitcher';

const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['400', '700'] });

type UserInfo = {
  id: string;
  username: string;
  avatar: string | null;
};

const NAV_ITEMS = [
  { href: '/developer', label: 'Dashboard', icon: LuLayoutDashboard, color: 'text-indigo-400' },
  { href: '/developer/user-lookup', label: 'Kullanıcı Sorgula', icon: LuSearch, color: 'text-sky-400' },
  { href: '/developer/users', label: 'Kullanıcılar', icon: LuUsers, color: 'text-emerald-400' },
  { href: '/developer/servers', label: 'Sunucular', icon: LuDatabase, color: 'text-violet-400' },
  { href: '/developer/all-servers', label: 'Sunucular & Üyeler', icon: LuGlobe, color: 'text-cyan-400' },
  { href: '/developer/maintenance', label: 'Bakım Yönetimi', icon: LuWrench, color: 'text-amber-400' },
  { href: '/developer/cache', label: 'Cache Yönetimi', icon: LuHardDrive, color: 'text-teal-400' },
  { href: '/developer/config-view', label: 'Ayarlar', icon: LuSettings, color: 'text-orange-400' },
  { href: '/developer/api-test', label: 'API Test', icon: LuFlaskConical, color: 'text-pink-400' },
  { href: '/developer/clear-data', label: 'Veri Temizleme', icon: LuTrash2, color: 'text-rose-400' },
  { href: '/developer/market', label: 'Borsa Yönetimi', icon: LuTrendingUp, color: 'text-emerald-400' },
  { href: '/developer/applications', label: 'Başvurular', icon: LuClipboardList, color: 'text-orange-400' },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = (await response.json()) as UserInfo;
          setUser(userData);
        }
      } catch {
        // ignore
      }
    };

    const checkAccess = async () => {
      try {
        setAccessLoading(true);
        const response = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
        const data = (await response.json().catch(() => ({}))) as { hasAccess?: boolean; error?: string };

        if (response.ok && data.hasAccess) {
          setAccessAllowed(true);
          setAccessError(null);
        } else if (response.status === 401 || data.error === 'unauthorized') {
          setAccessError('Giriş yapmanız gerekiyor.');
          setAccessAllowed(false);
        } else if (response.status === 403 || data.error === 'forbidden') {
          setAccessError('Bu panele erişim izniniz yok.');
          setAccessAllowed(false);
        } else {
          setAccessError('Geliştirici paneli doğrulaması yapılamadı.');
          setAccessAllowed(false);
        }
      } catch {
        setAccessError('Geliştirici paneli doğrulaması yapılamadı.');
        setAccessAllowed(false);
      } finally {
        setAccessLoading(false);
      }
    };

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/profile', { credentials: 'include', cache: 'no-store' });
        if (res.ok) setIsAdmin(true);
      } catch { /* ignore */ }
    };

    fetchUserInfo();
    checkAccess();
    checkAdmin();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim();
          try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          } catch {
            // ignore
          }
        });
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  if (accessLoading) {
    return (
      <div className={`min-h-screen bg-[#0a0a0c] flex items-center justify-center ${ubuntu.className}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#5865F2]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#7289DA]/15 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/90 p-1.5 shadow-lg shadow-[#5865F2]/40 mx-auto mb-6">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-[#5865F2] to-[#7289DA] rounded-full animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-[#99AAB5]">Developer yetkisi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className={`min-h-screen bg-[#0a0a0c] flex items-center justify-center ${ubuntu.className}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md mx-auto px-6 text-center">
          <div className="rounded-3xl border border-rose-500/20 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <LuShield className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Erişim Engellendi</h1>
            <p className="text-[#99AAB5] mb-8">{accessError ?? 'Bu panele erişim izniniz yok.'}</p>
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] text-white font-semibold text-sm shadow-lg shadow-[#5865F2]/30 hover:bg-[#4752C4] transition-all"
            >
              Panele Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/developer') return pathname === '/developer';
    return pathname.startsWith(href);
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0c] text-white ${ubuntu.className}`}>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-24 left-[-10%] h-96 w-96 rounded-full bg-[#5865F2]/15 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[30rem] w-[30rem] rounded-full bg-[#7289DA]/10 blur-[160px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.08),_transparent_55%)]" />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2]/90 p-0.5 shadow-lg shadow-[#5865F2]/30">
              <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <span className="font-bold text-white">Developer</span>
            <PanelSwitcher
              currentPanel="developer"
              availablePanels={['developer', ...(isAdmin ? ['admin' as PanelType] : []), 'dashboard']}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 transition hover:bg-white/10"
          >
            {mobileMenuOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9990]" ref={mobileRef}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-[60px] left-3 right-3 bottom-3 bg-[#0f1116]/95 border border-white/10 rounded-3xl shadow-2xl overflow-y-auto p-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.username} width={40} height={40} className="w-10 h-10 rounded-xl border border-white/20" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/30 flex items-center justify-center border border-white/20">
                  <span className="text-sm font-bold">{user?.username?.charAt(0).toUpperCase() ?? 'D'}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{user?.username ?? 'Developer'}</p>
                <p className="text-[10px] text-white/40">Developer Paneli</p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#5865F2]/20 text-white border border-[#5865F2]/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-[#5865F2]' : item.color}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Divider & Actions */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
              <div className="px-4 py-2">
                <PanelSwitcher
                  currentPanel="developer"
                  availablePanels={['developer', ...(isAdmin ? ['admin' as PanelType] : []), 'dashboard']}
                />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
              >
                <LuLogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full flex-col z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/8`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/8">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/90 p-0.5 shadow-lg shadow-[#5865F2]/30 flex-shrink-0 cursor-pointer transition-transform hover:scale-110">
            <div className="w-full h-full bg-[#1e1f22] rounded-[10px] overflow-hidden">
              <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full object-cover" />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-black text-lg tracking-tight">DiscoWeb</div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">Developer</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-[#5865F2]/15 text-white shadow-sm shadow-[#5865F2]/10 border border-[#5865F2]/20'
                    : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all ${
                  active ? 'bg-[#5865F2]/25' : 'bg-white/5 group-hover:bg-white/8'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-[#5865F2]' : item.color}`} />
                </div>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User & Collapse */}
        <div className="border-t border-white/8 p-3 space-y-2">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-lg border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/30 flex items-center justify-center border border-white/20">
                  <span className="text-xs font-bold">{user.username?.charAt(0).toUpperCase() ?? 'D'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-white/40">Developer</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PanelSwitcher
                currentPanel="developer"
                availablePanels={['developer', ...(isAdmin ? ['admin' as PanelType] : []), 'dashboard']}
              />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Çıkış Yap"
              className="flex items-center justify-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
            >
              <LuLogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-xl text-white/30 hover:text-white/60 transition-all"
          >
            {sidebarCollapsed ? <LuChevronRight className="w-4 h-4" /> : <LuChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-[60px] lg:pt-0 min-h-screen`}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
