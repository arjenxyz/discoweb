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

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  category: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    category: 'GENEL',
    items: [
      { href: '/developer', label: 'Dashboard', icon: LuLayoutDashboard },
      { href: '/developer/user-lookup', label: 'Kullanıcı Sorgula', icon: LuSearch },
      { href: '/developer/users', label: 'Kullanıcılar', icon: LuUsers },
      { href: '/developer/servers', label: 'Sunucular', icon: LuDatabase },
      { href: '/developer/all-servers', label: 'Sunucular & Üyeler', icon: LuGlobe },
    ],
  },
  {
    category: 'BORSA',
    items: [
      { href: '/developer/market', label: 'Borsa Yönetimi', icon: LuTrendingUp },
      { href: '/developer/applications', label: 'Başvurular', icon: LuClipboardList },
    ],
  },
  {
    category: 'SİSTEM',
    items: [
      { href: '/developer/maintenance', label: 'Bakım Yönetimi', icon: LuWrench },
      { href: '/developer/cache', label: 'Cache Yönetimi', icon: LuHardDrive },
      { href: '/developer/config-view', label: 'Ayarlar', icon: LuSettings },
      { href: '/developer/api-test', label: 'API Test', icon: LuFlaskConical },
      { href: '/developer/clear-data', label: 'Veri Temizleme', icon: LuTrash2 },
    ],
  },
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
      <div className={`min-h-screen bg-[#080a0f] flex items-center justify-center ${ubuntu.className}`}>
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#5865F2]/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#7289DA]/8 rounded-full blur-[120px] animate-pulse" />
        </div>
        <div className="text-center z-10 flex flex-col items-center gap-6">
          {/* Cat gif */}
          <div className="w-20 h-20 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/30 p-1.5 shadow-[0_0_40px_rgba(88,101,242,0.3)]">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full rounded-xl object-cover" />
          </div>
          {/* Progress bar */}
          <div className="w-56 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-[#5865F2] via-[#7289DA] to-[#5865F2] rounded-full animate-pulse" />
          </div>
          <p className="text-sm text-white/40 tracking-wide">Developer yetkisi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className={`min-h-screen bg-[#080a0f] flex items-center justify-center ${ubuntu.className}`}>
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#5865F2]/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-sm mx-auto px-6 text-center">
          {/* Rose glow card */}
          <div className="rounded-2xl border border-rose-500/20 bg-[#0d0f14]/80 backdrop-blur-xl p-10 shadow-[0_0_60px_rgba(244,63,94,0.1)]">
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent rounded-t-2xl" />
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <LuShield className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Erişim Engellendi</h1>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">{accessError ?? 'Bu panele erişim izniniz yok.'}</p>
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5865F2] text-white font-semibold text-sm shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:bg-[#4752C4] hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] transition-all duration-200"
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

  const SidebarNavContent = ({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) => (
    <nav className="flex-1 overflow-y-auto py-3 scrollbar-hidden">
      {NAV_GROUPS.map((group) => (
        <div key={group.category} className="mb-2">
          {/* Category label */}
          {!collapsed && (
            <div className="px-4 py-2">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase">
                {group.category}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="px-3 py-1.5">
              <div className="h-px bg-white/[0.06]" />
            </div>
          )}
          <div className="px-2 space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
                    active
                      ? 'border-l-2 border-[#5865F2] bg-[#5865F2]/10 text-white pl-[10px]'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5 border-l-2 border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-[#5865F2]' : 'text-white/50 group-hover:text-white/70'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5865F2] shadow-[0_0_6px_rgba(88,101,242,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className={`min-h-screen bg-[#080a0f] text-white ${ubuntu.className}`}>
      {/* Global background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-24 left-[-10%] h-80 w-80 rounded-full bg-[#5865F2]/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-96 w-96 rounded-full bg-[#7289DA]/6 blur-[160px]" />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#080a0f]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 p-0.5 shadow-[0_0_16px_rgba(88,101,242,0.2)]">
              <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">DiscoWeb</span>
              <span className="ml-2 text-[9px] tracking-[0.2em] text-white/30 uppercase font-bold">Developer</span>
            </div>
            <PanelSwitcher
              currentPanel="developer"
              availablePanels={['developer', ...(isAdmin ? ['admin' as PanelType] : []), 'dashboard']}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] transition hover:bg-white/[0.08]"
          >
            {mobileMenuOpen ? <LuX className="w-5 h-5 text-white/60" /> : <LuMenu className="w-5 h-5 text-white/60" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9990]" ref={mobileRef}>
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-out drawer from left */}
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-[#080a0f]/95 backdrop-blur-xl border-r border-white/[0.06] shadow-2xl flex flex-col overflow-hidden">
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/30 to-transparent" />

            {/* Logo area */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 p-0.5 shadow-[0_0_20px_rgba(88,101,242,0.25)]">
                  <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full rounded-[10px] object-cover" />
                </div>
                <div>
                  <div className="text-white font-black text-base tracking-tight">DiscoWeb</div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">Developer</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 transition"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNavContent collapsed={false} onNavClick={() => setMobileMenuOpen(false)} />
            </div>

            {/* Bottom: user + actions */}
            <div className="border-t border-white/[0.06] p-3 space-y-2">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-lg border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center border border-white/10">
                      <span className="text-xs font-bold text-white/70">{user.username?.charAt(0).toUpperCase() ?? 'D'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                    <p className="text-[10px] text-white/30">Developer</p>
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
                  className="flex items-center justify-center p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                >
                  <LuLogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full flex-col z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } bg-[#080a0f]/95 backdrop-blur-xl border-r border-white/[0.06]`}
      >
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/30 to-transparent" />

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 p-0.5 shadow-[0_0_20px_rgba(88,101,242,0.2)] flex-shrink-0">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-full h-full rounded-[10px] object-cover" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-black text-base tracking-tight">DiscoWeb</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/25 font-bold">Developer</span>
              </div>
            </div>
          )}
        </div>

        {/* Categorized Nav */}
        <SidebarNavContent collapsed={sidebarCollapsed} />

        {/* Bottom: user + logout + PanelSwitcher + collapse */}
        <div className="border-t border-white/[0.06] p-3 space-y-1.5">
          {user && (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
              {user.avatar ? (
                <Image src={user.avatar} alt={user.username} width={28} height={28} className="w-7 h-7 rounded-lg border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#5865F2]/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <span className="text-xs font-bold text-white/60">{user.username?.charAt(0).toUpperCase() ?? 'D'}</span>
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                  <p className="text-[10px] text-white/30">Developer</p>
                </div>
              )}
            </div>
          )}

          <div className={`flex items-center gap-1.5 ${sidebarCollapsed ? 'flex-col' : ''}`}>
            <div className={sidebarCollapsed ? 'w-full' : 'flex-1'}>
              <PanelSwitcher
                currentPanel="developer"
                availablePanels={['developer', ...(isAdmin ? ['admin' as PanelType] : []), 'dashboard']}
              />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Çıkış Yap"
              className="flex items-center justify-center p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-rose-400/50 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
            >
              <LuLogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <LuChevronRight className="w-4 h-4" />
            ) : (
              <LuChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        } pt-[60px] lg:pt-0 min-h-screen bg-[#080a0f]`}
      >
        <div className="p-4 md:p-6 lg:p-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
