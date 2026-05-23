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
  LuZap,
  LuLayoutGrid,
} from 'react-icons/lu';
import { LuCode } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

/* ─── MENÜ YAPISI İÇERİ TAŞINDI ─── */

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  const MENU_GROUPS = [
    {
      title: 'Genel',
      items: [{ href: '/admin', label: t('sidebar.dashboard'), icon: <LuChartBar className="h-4 w-4" /> }],
    },
    {
      title: 'Mağaza',
      items: [
        {
          label: t('sidebar.store'),
          icon: <LuStore className="h-4 w-4" />,
          children: [
            { href: '/admin/store/products/new', label: 'Yeni Ürün Oluştur', group: 'Oluştur', icon: <LuPackage className="h-4 w-4" /> },
            { href: '/admin/store/promos/new', label: 'Promosyon Kodu Oluştur', group: 'Oluştur', icon: <LuTag className="h-4 w-4" /> },
            { href: '/admin/store/discounts/new', label: 'İndirim Kodu Oluştur', group: 'Oluştur', icon: <LuBadgePercent className="h-4 w-4" /> },
            { href: '/admin/store/products', label: 'Ürün Listesi', group: 'Listeler', icon: <LuClipboardList className="h-4 w-4" /> },
            { href: '/admin/store/promos', label: 'Promosyon Listesi', group: 'Listeler', icon: <LuTag className="h-4 w-4" /> },
            { href: '/admin/store/discounts', label: 'İndirim Listesi', group: 'Listeler', icon: <LuBadgePercent className="h-4 w-4" /> },
          ],
        },
      ],
    },
    {
      title: 'Topluluk',
      items: [
        {
          label: 'Tag & Booster',
          icon: <LuAward className="h-4 w-4" />,
          children: [
            { href: '/admin/badges', label: 'Tag Ayarları', group: 'Tag Rozeti', icon: <LuAward className="h-4 w-4" /> },
            { href: '/admin/boosters', label: 'Booster Ayarları', group: 'Tag Rozeti', icon: <LuZap className="h-4 w-4" /> },
          ],
        },
      ],
    },
    {
      title: 'Yönetim',
      items: [
        { href: '/admin/wallet', label: t('sidebar.wallet'), icon: <LuWallet className="h-4 w-4" /> },
        { href: '/admin/earn-settings', label: t('sidebar.earn_settings'), icon: <LuChartBar className="h-4 w-4" /> },
        { href: '/admin/log-channels', label: t('sidebar.channels_logs'), icon: <LuClipboardList className="h-4 w-4" /> },
      ],
    },
  ];

  const HEADER_LINKS = [
    { href: '/admin/guide', label: 'Kullanım Kılavuzu', icon: <LuFileText className="h-4 w-4" /> },
  ];
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
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
        window.location.href = '/';
      } catch (error) {
        console.error('Erişim kontrolü hatası:', error);
        window.location.href = '/';
      }
    };
    checkAccess();
  }, []);


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

  const logoWhiteStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #fff 0%, #fff 35%, rgba(255,255,255,0.95) 45%, #fff 55%, #fff 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'titleShine 4s ease-in-out infinite',
  };
  const logoBlueStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #5865F2 0%, #5865F2 35%, #a5b4ff 45%, #5865F2 55%, #5865F2 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'titleShine 4s ease-in-out infinite',
  };

  /* ── Sidebar Nav Renderer ── */
  const renderSidebarNav = (isMobile: boolean) => (
    <nav className="space-y-4">
      {MENU_GROUPS.map((group) => (
        <div key={group.title} className="space-y-0.5">
          {(!collapsed || isMobile) && (
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/25">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            if ('children' in item && item.children) {
              const isActive = pathname.startsWith('/admin/store') || pathname.startsWith('/admin/badges') || pathname.startsWith('/admin/boosters');
              const isOpen = isMobile ? mobileStoreOpen : (storeMenuOpen && !collapsed);
              const toggleOpen = () => isMobile ? setMobileStoreOpen(p => !p) : setStoreMenuOpen(p => !p);
              const groupedChildren = item.children.reduce((acc, child) => {
                const g = child.group ?? 'Diğer';
                if (!acc[g]) acc[g] = [];
                acc[g].push(child);
                return acc;
              }, {} as Record<string, typeof item.children>);

              return (
                <div key={item.label} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={toggleOpen}
                    className={`group relative flex w-full items-center overflow-hidden rounded-xl transition-all duration-150 ${
                      collapsed && !isMobile ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2.5'
                    } ${isActive || isOpen ? 'text-white' : 'text-white/45 hover:text-white/80'}`}
                  >
                    <div className={`pointer-events-none absolute inset-0 rounded-xl transition-all duration-150 ${
                      isActive || isOpen ? 'bg-white/10' : 'group-hover:bg-white/[0.06]'
                    }`} />
                    <span className={`relative flex shrink-0 items-center justify-center rounded-lg transition-all ${
                      collapsed && !isMobile ? 'h-10 w-10' : 'h-7 w-7'
                    } ${isActive || isOpen ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>
                      {item.icon}
                    </span>
                    {(!collapsed || isMobile) && (
                      <span className={`relative flex-1 text-left text-sm font-medium leading-none ${isActive || isOpen ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    {(!collapsed || isMobile) && (
                      <LuChevronDown className={`relative h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-white/30'}`} />
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 space-y-2.5 pt-1.5 pb-2">
                      {Object.entries(groupedChildren).map(([groupTitle, children]) => (
                        <div key={groupTitle} className="space-y-0.5">
                          {(!collapsed || isMobile) && <p className="px-3 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">{groupTitle}</p>}
                          <div className={`space-y-0.5 ${!collapsed || isMobile ? 'border-l border-white/[0.06] pl-2.5 ml-1.5' : ''}`}>
                            {children.map((child) => {
                              const isChildActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`group relative flex w-full items-center overflow-hidden rounded-xl transition-all duration-150 ${
                                    collapsed && !isMobile ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2.5'
                                  } ${isChildActive ? 'text-white' : 'text-white/45 hover:text-white/80'}`}
                                >
                                  <div className={`pointer-events-none absolute inset-0 rounded-xl transition-all duration-150 ${
                                    isChildActive ? 'bg-white/10' : 'group-hover:bg-white/[0.06]'
                                  }`} />
                                  <span className={`relative flex shrink-0 items-center justify-center rounded-lg transition-all ${
                                    collapsed && !isMobile ? 'h-10 w-10' : 'h-7 w-7'
                                  } ${isChildActive ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>
                                    {child.icon}
                                  </span>
                                  {(!collapsed || isMobile) && (
                                    <span className={`relative text-sm font-medium leading-none ${isChildActive ? 'text-white' : ''}`}>
                                      {child.label}
                                    </span>
                                  )}
                                  {(!collapsed || isMobile) && isChildActive && (
                                    <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                                  )}
                                </Link>
                              );
                            })}
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
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`group relative flex w-full items-center overflow-hidden rounded-xl transition-all duration-150 ${
                    collapsed && !isMobile ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2.5'
                  } ${active ? 'text-white' : 'text-white/45 hover:text-white/80'}`}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <div className={`pointer-events-none absolute inset-0 rounded-xl transition-all duration-150 ${
                    active ? 'bg-white/10' : 'group-hover:bg-white/[0.06]'
                  }`} />
                  <span className={`relative flex shrink-0 items-center justify-center rounded-lg transition-all ${
                    collapsed && !isMobile ? 'h-10 w-10' : 'h-7 w-7'
                  } ${active ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>
                    {item.icon}
                  </span>
                  {(!collapsed || isMobile) && (
                    <span className={`relative text-sm font-medium leading-none ${active ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {(!collapsed || isMobile) && active && (
                    <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                  )}
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
    <div className="h-screen overflow-hidden bg-[#0b0d12] text-white">
      <div className="flex h-full">
        <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

        {/* ═══════ DESKTOP SIDEBAR ═══════ */}
        <aside className={`sticky top-0 hidden lg:flex h-screen flex-col border-r border-white/[0.06] bg-[#0b0d12] transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}>
          {/* Sidebar Header (Sunucu Bilgisi) */}
          <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-4'}`}>
            {collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <LuChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  {profile?.guildIcon ? (
                    <Image src={profile.guildIcon} alt="guild" width={32} height={32} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/40">
                      {profile?.guildName?.charAt(0) ?? '#'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white leading-tight">
                    {profile?.guildName ?? 'Veri Merkezi'}
                  </p>
                  <p className="text-[10px] text-white/35">Yönetim Paneli</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/60"
                >
                  <LuChevronRight className="h-3.5 w-3.5 rotate-180" />
                </button>
              </>
            )}
          </div>

          <div className="mx-3 border-t border-white/[0.06]" />

          {/* Nav */}
          <div className="flex-1 overflow-y-auto mt-4 px-3 pb-6 custom-scrollbar">
            {renderSidebarNav(false)}
          </div>
          
          <div className="mx-3 border-t border-white/[0.06]" />

          {!collapsed && (
            <div className="px-3 pb-4 pt-3 flex flex-col gap-1.5">
              {isDeveloper && (
                <Link
                  href="/developer"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-emerald-400/70 transition hover:bg-white/5 hover:text-emerald-400"
                >
                  <LuCode className="h-4 w-4" />
                  <span className="text-sm font-medium">Geliştirici Paneli</span>
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* ═══════ ANA İÇERİK ═══════ */}
        <div className="flex-1 min-w-0 flex flex-col relative z-0">
          
          {/* Mobil Menü Arkaplan Overlay (Modalların altında) */}
          <div
            onClick={() => { setMobileMenuOpen(false); setAccountMenuOpen(false); }}
            className={`lg:hidden fixed inset-0 z-[35] bg-black/60 backdrop-blur-sm transition-all duration-300 ${
              (mobileMenuOpen || accountMenuOpen) ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
            }`}
          />

          {/* ═══════ HEADER ═══════ */}
          <header className={`md:fixed inset-x-0 top-0 flex items-center bg-[#0e1018]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 transition-all duration-200 h-16 ${
            accountMenuOpen ? 'z-[9991]' : 'z-30'
          } lg:relative lg:inset-auto`}>
            
            {/* Mobil hamburger */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
              >
                <LuMenu className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Sol — logo (desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 min-w-fit ml-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight leading-none" style={logoWhiteStyle}>
                  Disco<span style={logoBlueStyle}>Web</span>
                </span>
              </div>
            </div>

            {/* Orta — Mobil Logo */}
            <div className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
              <div className="flex flex-col gap-0.5 items-center">
                <span className="font-black text-xl tracking-tight leading-none" style={logoWhiteStyle}>
                  Disco<span style={logoBlueStyle}>Web</span>
                </span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Sağ — İkonlar + Hesap */}
            <div className="flex items-center gap-2">

              {HEADER_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all ${
                    pathname === item.href
                      ? 'border-white/20 bg-white/10'
                      : 'border-transparent hover:border-white/10 hover:bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {item.icon}
                </Link>
              ))}

              <LanguageSwitcher />

              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((p) => !p)}
                  className={`flex items-center gap-2 rounded-full border p-1 pr-3 transition-all ${
                    accountMenuOpen
                      ? 'border-white/20 bg-white/10'
                      : 'border-transparent hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10">
                    {profile ? (
                      <Image src={profile.avatarUrl} alt="avatar" width={32} height={32} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/40">?</div>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white leading-tight max-w-[100px] truncate">{profile?.nickname ?? profile?.username ?? 'Yetkili'}</p>
                    <p className="text-[10px] text-white/40 leading-tight">Admin</p>
                  </div>
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] shadow-2xl origin-top-right">
                    <div className="relative h-20 overflow-hidden bg-[#5865F2]/15">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1116] via-[#0f1116]/40 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <p className="text-lg font-black text-white">Yönetici, {profile?.username ?? ''}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => { setAccountMenuOpen(false); window.location.href='/admin/settings'; }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-white/70 transition hover:bg-white/5 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8">
                            <LuSettings className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">Panel Ayarları</span>
                        </div>
                        <LuChevronRight className="h-3.5 w-3.5 text-white/30" />
                      </button>

                      <div className="grid gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex flex-col items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] py-2.5 text-xs text-rose-400 transition hover:bg-rose-500/15"
                        >
                          <LuLogOut className="h-3.5 w-3.5" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ═══════ MAIN ═══════ */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 2xl:px-12 custom-scrollbar lg:h-[calc(100vh-64px)] md:pt-24 lg:pt-8">
            {children}
          </main>
        </div>
      </div>

      {/* ═══════ MOBİL MENÜ DRAWER ═══════ */}
      <div className={`lg:hidden fixed inset-0 z-[9999] transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div
          className={`absolute top-0 left-0 bottom-0 w-[280px] bg-[#0b0d12]/98 backdrop-blur-2xl border-r border-white/[0.06] shadow-[20px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center gap-3 px-4 border-b border-white/[0.06]">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {profile?.guildIcon ? (
                <Image src={profile.guildIcon} alt="guild" width={32} height={32} unoptimized className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/40">
                  {profile?.guildName?.charAt(0) ?? '#'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white leading-tight">
                {profile?.guildName ?? 'Veri Merkezi'}
              </p>
              <p className="text-[10px] text-white/35">Yönetim Paneli</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/60"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto mt-4 px-3 pb-6 custom-scrollbar">
            {renderSidebarNav(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
