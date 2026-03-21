'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LuBell,
  LuChartBar,
  LuChevronRight,
  LuClipboardList,
  LuChevronDown,
  LuFileText,
  LuTriangle,
  LuBadgePercent,
  LuClock,
  LuPackage,
  LuTag,
  LuLogOut,
  LuSettings,
  LuStore,
  LuWallet,
  LuMenu,
  LuX,
  LuShield,
  LuAward,
  LuGift,
} from 'react-icons/lu';
import { LuCode, LuLayoutDashboard, LuCoins, LuCalculator, LuHistory } from 'react-icons/lu';

/* ─── MEN\u00DC YAPISI ─── */
const MENU_GROUPS = [
  {
    title: 'Genel',
    items: [{ href: '/admin', label: 'Genel Bakış', icon: <LuChartBar className="h-5 w-5" /> }],
  },
  {
    title: 'Mağaza',
    items: [
      {
        label: 'Mağaza',
        icon: <LuStore className="h-5 w-5" />,
        children: [
          { href: '/admin/store/products/new', label: 'Yeni Ürün Oluştur', group: 'Oluştur', icon: <LuPackage className="h-4 w-4" /> },
          { href: '/admin/store/promos/new', label: 'Promosyon Kodu Oluştur', group: 'Oluştur', icon: <LuTag className="h-4 w-4" /> },
          { href: '/admin/store/discounts/new', label: 'İndirim Kodu Oluştur', group: 'Oluştur', icon: <LuBadgePercent className="h-4 w-4" /> },
          { href: '/admin/store/orders/pending', label: 'Bekleyen Siparişler', group: 'Siparişler', icon: <LuClock className="h-4 w-4" /> },
          { href: '/admin/store/orders/stuck', label: 'Sorunlu Siparişler', group: 'Siparişler', icon: <LuTriangle className="h-4 w-4" /> },
          { href: '/admin/store/orders/failed', label: 'Başarısız Siparişler', group: 'Siparişler', icon: <LuFileText className="h-4 w-4" /> },
          { href: '/admin/store/products', label: 'Ürün Listesi', group: 'Listeler', icon: <LuClipboardList className="h-4 w-4" /> },
          { href: '/admin/store/promos', label: 'Promosyon Listesi', group: 'Listeler', icon: <LuTag className="h-4 w-4" /> },
          { href: '/admin/store/discounts', label: 'İndirim Listesi', group: 'Listeler', icon: <LuBadgePercent className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: 'Ekonomi',
    items: [
      { href: '/admin/economy', label: 'Ekonomi Paneli', icon: <LuCoins className="h-5 w-5" /> },
      { href: '/admin/economy/transactions', label: 'İşlem Geçmişi', icon: <LuHistory className="h-5 w-5" /> },
      { href: '/admin/economy/settings', label: 'Simülasyon & Öneriler', icon: <LuCalculator className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Topluluk',
    items: [
      {
        label: 'Rozet & Çekiliş',
        icon: <LuAward className="h-5 w-5" />,
        children: [
          { href: '/admin/badges', label: 'Rozet Kademeleri', group: 'Tag Rozeti', icon: <LuAward className="h-4 w-4" /> },
          { href: '/admin/raffles', label: 'Çekilişler', group: 'Tag Rozeti', icon: <LuGift className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { href: '/admin/settings', label: 'Sunucu Ayarları', icon: <LuSettings className="h-5 w-5" /> },
      { href: '/admin/wallet', label: 'Bakiye Yönetimi', icon: <LuWallet className="h-5 w-5" /> },
      { href: '/admin/earn-settings', label: 'Kazanç Ayarları', icon: <LuChartBar className="h-5 w-5" /> },
      { href: '/admin/log-channels', label: 'Log Kanalları', icon: <LuClipboardList className="h-5 w-5" /> },
    ],
  },
];

const HEADER_LINKS = [
  { href: '/admin/guide', label: 'Kullanım Kılavuzu', icon: <LuFileText className="h-4 w-4" /> },
];

/* ─── DESKTOP NAV STİLLERİ ─── */
const navItemClass = (active: boolean, collapsed: boolean) =>
  `group flex w-full items-center text-[13px] font-medium transition-all duration-200 ${
    collapsed
      ? `justify-center rounded-xl px-2 py-2.5 ${
          active
            ? 'bg-[#5865F2]/15 text-white shadow-[0_0_12px_rgba(88,101,242,0.1)]'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
        }`
      : `gap-3 rounded-xl px-3 py-2.5 ${
          active
            ? 'bg-[#5865F2]/10 text-white border border-[#5865F2]/15'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white border border-transparent'
        }`
  }`;

const navIconClass = (active: boolean, collapsed: boolean) =>
  `flex items-center justify-center transition-all duration-200 ${
    collapsed ? 'h-10 w-10 rounded-xl' : 'h-8 w-8 rounded-lg'
  } ${
    active
      ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white shadow-lg shadow-[#5865F2]/25'
      : `bg-white/[0.05] ${collapsed ? 'text-white/60 group-hover:text-white' : 'text-white/40 group-hover:text-white/70'}`
  }`;

/* ─── MOBİL NAV STİLLERİ ─── */
const mobileNavClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
    active
      ? 'bg-[#5865F2]/10 text-white border border-[#5865F2]/15'
      : 'text-white/50 hover:bg-white/[0.04] hover:text-white border border-transparent'
  }`;

const mobileNavIconClass = (active: boolean) =>
  `flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
    active
      ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white shadow-md shadow-[#5865F2]/25'
      : 'bg-white/[0.05] text-white/40'
  }`;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<{
    username: string;
    nickname: string | null;
    avatarUrl: string;
    guildName: string;
    guildIcon: string | null;
  } | null>(null);
  const pathname = usePathname();

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch('/api/admin/profile', { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as {
          username: string; nickname: string | null; avatarUrl: string; guildName: string; guildIcon: string | null;
        };
        setProfile(data);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const safeJson = async (res: Response) => {
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) return await res.json();
        } catch (e) { /* ignore */ }
        return { status: res.status, statusText: res.statusText };
      };
      try {
        const maxAttempts = 2;
        let adminOk = false;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const adminResponse = await fetch('/api/admin/profile', { credentials: 'include', cache: 'no-store' });
          if (adminResponse.ok) { adminOk = true; break; }
          const info = await safeJson(adminResponse);
          console.warn(`Admin erişimi reddedildi (attempt ${attempt}):`, info);
          if (adminResponse.status === 403 && attempt < maxAttempts) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 300));
            continue;
          }
          break;
        }
        if (adminOk) {
          try {
            const devCheck = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
            if (devCheck.ok) setIsDeveloper(true);
          } catch { /* ignore */ }
          return;
        }
        const devResponse = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
        if (devResponse.ok) { setIsDeveloper(true); return; }
        console.warn('Developer erişimi reddedildi:', await safeJson(devResponse));
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Erişim kontrolü hatası:', error);
        window.location.href = '/dashboard';
      }
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (!notificationMenuOpen) return undefined;
    const h = (e: MouseEvent) => { if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target as Node)) setNotificationMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notificationMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const h = (e: MouseEvent) => { if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) setAccountMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [accountMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
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
          } catch (e) { /* ignore */ }
        });
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  /* ── Sidebar Nav Renderer ── */
  const renderSidebarNav = (isMobile: boolean) => (
    <nav className={isMobile ? 'space-y-0.5' : 'space-y-3'}>
      {MENU_GROUPS.map((group) => (
        <div key={group.title} className={isMobile ? 'space-y-0.5' : 'space-y-1'}>
          {(!collapsed || isMobile) && (
            <p className={`px-3 text-[10px] uppercase tracking-[0.25em] text-white/25 font-semibold ${isMobile ? 'pt-3 pb-1' : 'pt-1'}`}>{group.title}</p>
          )}
          {group.items.map((item) => {
            if ('children' in item && item.children) {
              const isActive = pathname.startsWith('/admin/store');
              const isOpen = isMobile ? mobileStoreOpen : (storeMenuOpen && !collapsed);
              const toggleOpen = () => isMobile ? setMobileStoreOpen(p => !p) : setStoreMenuOpen(p => !p);
              const groupedChildren = item.children.reduce((acc, child) => {
                const g = child.group ?? 'Diğer';
                if (!acc[g]) acc[g] = [];
                acc[g].push(child);
                return acc;
              }, {} as Record<string, typeof item.children>);

              if (isMobile) {
                return (
                  <div key={item.label} className="space-y-0.5">
                    <button type="button" onClick={toggleOpen} className={mobileNavClass(isActive)}>
                      <span className={mobileNavIconClass(isActive)}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      <LuChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="ml-4 space-y-2.5 pt-1.5 pb-2">
                        {Object.entries(groupedChildren).map(([groupTitle, children]) => (
                          <div key={groupTitle} className="space-y-0.5">
                            <p className="px-3 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">{groupTitle}</p>
                            <div className="space-y-0.5 border-l border-[#5865F2]/10 pl-2.5">
                              {children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-all duration-200 ${
                                    pathname === child.href
                                      ? 'bg-[#5865F2]/10 text-white font-semibold'
                                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
                                  }`}
                                >
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                                    pathname === child.href
                                      ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white shadow-sm'
                                      : 'bg-white/[0.05] text-white/35'
                                  }`}>{child.icon}</span>
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.label} className="space-y-1">
                  <button type="button" onClick={toggleOpen} className={navItemClass(isActive, collapsed)}>
                    <span className={navIconClass(isActive, collapsed)}>{item.icon}</span>
                    {!collapsed && (
                      <div className="flex flex-1 items-center justify-between">
                        <span>{item.label}</span>
                        <LuChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-5 space-y-3 pt-1">
                      {Object.entries(groupedChildren).map(([groupTitle, children]) => (
                        <div key={groupTitle} className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 px-1">{groupTitle}</p>
                          <div className="space-y-1 border-l border-[#5865F2]/10 pl-3">
                            {children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-200 ${
                                  pathname === child.href
                                    ? 'bg-[#5865F2]/10 text-white border border-[#5865F2]/15 font-medium'
                                    : 'text-white/45 hover:bg-white/[0.04] hover:text-white border border-transparent'
                                }`}
                              >
                                <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                  pathname === child.href
                                    ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white shadow-md shadow-[#5865F2]/20'
                                    : 'bg-white/[0.05] text-white/35 group-hover:text-white/60'
                                }`}>{child.icon}</span>
                                <span>{child.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if ('href' in item) {
              const active = pathname === item.href;
              if (isMobile) {
                return (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className={mobileNavClass(active)}>
                    <span className={mobileNavIconClass(active)}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link key={`${item.href}-${item.label}`} href={item.href} className={navItemClass(active, collapsed)}>
                  <span className={navIconClass(active, collapsed)}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0c] text-white">
      <div className="flex h-full">

        {/* ═══════ DESKTOP SIDEBAR ═══════ */}
        <aside className={`sticky top-0 hidden lg:flex h-screen flex-col border-r border-white/[0.06] bg-[#0a0a0c] transition-all duration-300 ${
          collapsed ? 'w-[80px]' : 'w-[280px]'
        }`}>
          {/* Dekoratif blur */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#5865F2]/[0.04] rounded-full blur-[80px] pointer-events-none" />

          {/* Sidebar Header */}
          <div className={`relative flex h-14 items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3`}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#5865F2]/15 flex items-center justify-center">
                  <LuShield className="h-3.5 w-3.5 text-[#5865F2]" />
                </div>
                <span className="text-[13px] font-bold text-white/80">Admin Panel</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((p) => !p)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={collapsed ? 'Menüyü Aç' : 'Menüyü Kapat'}
            >
              <LuChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* Sunucu kartı */}
          {!collapsed && (
            <div className="px-3 pb-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  {profile?.guildIcon ? (
                    <Image src={profile.guildIcon} alt="guild" width={28} height={28} unoptimized className="h-7 w-7 rounded-lg object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-[#5865F2]/15 flex items-center justify-center text-[10px] font-bold text-white/50">
                      {profile?.guildName?.charAt(0) ?? '#'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{profile?.guildName ?? 'Veri Merkezi'}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center px-2 pb-2">
              <div className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            {renderSidebarNav(false)}
          </div>

          {/* Panel Geçişleri - sidebar alt */}
          {!collapsed && (
            <div className="px-3 pb-3 border-t border-white/[0.04] pt-3 flex gap-1.5">
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
              >
                <LuLayoutDashboard className="w-3.5 h-3.5" />
                Üye
              </Link>
              {isDeveloper && (
                <Link
                  href="/developer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors"
                >
                  <LuCode className="w-3.5 h-3.5" />
                  Dev
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* ═══════ ANA İÇERİK ═══════ */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* ═══════ HEADER ═══════ */}
          <header className="relative z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl px-3 lg:px-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Mobil hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
              >
                <LuMenu className="h-4.5 w-4.5" />
              </button>

              {/* Bildirim */}
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotificationMenuOpen((p) => !p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-all ${
                    pathname.startsWith('/admin/notifications')
                      ? 'border-[#5865F2]/20 bg-[#5865F2]/10 text-[#5865F2]'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <LuBell className="h-4 w-4" />
                </button>
                {notificationMenuOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] z-[60] w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111114]/95 backdrop-blur-xl shadow-xl shadow-black/40">
                    <div className="border-b border-white/[0.06] px-3.5 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5865F2]">Bildirimler</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/admin/notifications/send"
                        onClick={() => setNotificationMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <LuBell className="h-3.5 w-3.5 text-white/40" />
                        Bildirim Gönder
                      </Link>
                      <Link
                        href="/admin/notifications/history"
                        onClick={() => setNotificationMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <LuFileText className="h-3.5 w-3.5 text-white/40" />
                        Bildirim Geçmişi
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Kılavuz */}
              {HEADER_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-all ${
                    pathname === item.href
                      ? 'border-[#5865F2]/20 bg-[#5865F2]/10 text-[#5865F2]'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {item.icon}
                </Link>
              ))}
            </div>

            {/* Sağ: Hesap */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((p) => !p)}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1.5 transition-all ${
                    accountMenuOpen
                      ? 'border-white/[0.15] bg-white/[0.06] text-white'
                      : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/10">
                    {profile ? (
                      <Image src={profile.avatarUrl} alt="avatar" width={24} height={24} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-[10px] text-white/40">?</div>
                    )}
                  </div>
                  <span className="hidden md:inline text-[13px] font-medium max-w-[100px] truncate">{profile?.nickname ?? profile?.username ?? 'Yetkili'}</span>
                  <LuChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-[60] w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111114]/95 backdrop-blur-xl shadow-xl shadow-black/40">
                    {/* Kullanıcı bilgisi */}
                    <div className="border-b border-white/[0.06] px-3.5 py-2.5">
                      <p className="text-[13px] font-semibold text-white truncate">{profile?.nickname ?? profile?.username ?? 'Yetkili'}</p>
                      <p className="text-[11px] text-white/30 flex items-center gap-1">
                        <LuShield className="h-3 w-3" />
                        Admin
                      </p>
                    </div>
                    {/* Menü */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/admin/settings"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <LuSettings className="h-3.5 w-3.5 text-white/40" />
                        Ayarlar
                      </Link>
                      {/* Panel Geçişleri */}
                      <div className="flex gap-1 px-1 py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
                        >
                          <LuLayoutDashboard className="w-3 h-3" />
                          Üye
                        </Link>
                        {isDeveloper && (
                          <Link
                            href="/developer"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors"
                          >
                            <LuCode className="w-3 h-3" />
                            Dev
                          </Link>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/50 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <LuLogOut className="h-3.5 w-3.5 text-white/40" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ═══════ MAIN ═══════ */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 2xl:px-12 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>

      {/* ═══════ MOBİL MENÜ ═══════ */}
      <div className={`lg:hidden fixed inset-0 z-[9999] transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-[#0a0a0c]/98 backdrop-blur-2xl border-r border-white/[0.06] shadow-[20px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Dekoratif */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#5865F2]/[0.05] rounded-full blur-[60px] pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5865F2]/15 flex items-center justify-center">
                <LuShield className="h-3.5 w-3.5 text-[#5865F2]" />
              </div>
              <span className="text-[13px] font-bold text-white">Admin Panel</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white transition"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          {/* Sunucu */}
          <div className="relative px-3 pt-3 pb-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 flex items-center gap-2.5">
              {profile?.guildIcon ? (
                <Image src={profile.guildIcon} alt="guild" width={24} height={24} unoptimized className="h-6 w-6 rounded-lg object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-lg bg-[#5865F2]/15 flex items-center justify-center text-[9px] font-bold text-white/50">
                  {profile?.guildName?.charAt(0) ?? '#'}
                </div>
              )}
              <p className="text-xs font-medium text-white/60 truncate flex-1">{profile?.guildName ?? 'Veri Merkezi'}</p>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Panel Geçişleri */}
          <div className="px-3 pt-1 pb-2 flex gap-1.5">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              <LuLayoutDashboard className="w-3.5 h-3.5" />
              Üye Paneli
            </Link>
            {isDeveloper && (
              <Link
                href="/developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors"
              >
                <LuCode className="w-3.5 h-3.5" />
                Geliştirici
              </Link>
            )}
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            {renderSidebarNav(true)}
          </div>

          {/* Footer */}
          <div className="px-3 pb-3 border-t border-white/[0.04] pt-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.02]">
              <div className="h-7 w-7 overflow-hidden rounded-lg bg-white/10 flex-shrink-0">
                {profile ? (
                  <Image src={profile.avatarUrl} alt="avatar" width={28} height={28} unoptimized className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[9px] text-white/40">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.nickname ?? profile?.username ?? 'Yetkili'}</p>
                <p className="text-[10px] text-white/25">Admin</p>
              </div>
            </div>
          </div>

          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      </div>
    </div>
  );
}
