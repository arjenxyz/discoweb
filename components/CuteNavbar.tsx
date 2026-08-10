"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18nContext';
import { lockBodyScroll } from '@/lib/lockBodyScroll';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { siteConfig } from '@/config/site';
import { LuCode } from 'react-icons/lu';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-3 h-3 ml-1.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const DiscordIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

function NavInfoPanel({
  title,
  body,
  note,
  gifSrc,
}: {
  title: string;
  body: string;
  note: string;
  gifSrc: string;
}) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[min(32rem,calc(100vw-2rem))] animate-slideUp origin-top z-50">
      <div className="relative overflow-visible rounded-[28px] border border-white/20 bg-[#5865F2] p-6 pr-14 pb-6 shadow-[0_28px_70px_rgba(88,101,242,0.5)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_42%)]" />
        <div className="relative z-20 space-y-3 pt-0.5">
          <div>
            <div className="mb-2.5 h-1 w-10 rounded-full bg-white/80" />
            <h3 className="break-words text-[1.55rem] font-black leading-[1.15] tracking-tight text-white">
              {title}
            </h3>
          </div>
          <p className="max-w-none break-words text-[13.5px] leading-6 text-white/78">
            {body}
          </p>
          <p className="break-words border-l-2 border-white/35 pl-3 text-[12px] leading-5 text-white/60">
            {note}
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-[-1.25rem] right-[-7.5rem] z-10 h-52 w-52 -rotate-[10deg] drop-shadow-2xl transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105">
          <img src={gifSrc} alt="" className="h-full w-full object-contain" draggable={false} />
        </div>
      </div>
    </div>
  );
}

function MobileInfoModal({
  title,
  body,
  note,
  gifSrc,
  onClose,
}: {
  title: string;
  body: string;
  note: string;
  gifSrc: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center px-5 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm animate-slideUp overflow-visible"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0d0f14]/95 text-white/80 shadow-lg backdrop-blur-md"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative overflow-visible rounded-[28px] border border-white/20 bg-[#5865F2] p-5 pb-16 shadow-[0_28px_70px_rgba(88,101,242,0.55)]">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_42%)]" />
          <div className="relative z-20 space-y-3 pr-2">
            <div>
              <div className="mb-2.5 h-1 w-10 rounded-full bg-white/80" />
              <h3 className="break-words text-[1.45rem] font-black leading-[1.15] tracking-tight text-white">
                {title}
              </h3>
            </div>
            <p className="break-words text-[13.5px] leading-6 text-white/85">{body}</p>
            <p className="break-words border-l-2 border-white/35 pl-3 text-[12px] leading-5 text-white/65">
              {note}
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-4 z-10 h-40 w-40 -rotate-[8deg] drop-shadow-2xl">
            <img src={gifSrc} alt="" className="h-full w-full object-contain" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CuteNavbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; avatar: string | null } | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const onSelectServer = pathname?.startsWith('/auth/select-server') ?? false;
  const botInviteUrl = siteConfig.bot.inviteUrl;

  const FAB_SIZE = 56;
  const FAB_STORAGE_KEY = 'discoweb_mobile_fab_pos';
  const [fabPos, setFabPos] = useState<{ left: number; top: number } | null>(null);
  const fabDragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    pointerId: number | null;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originLeft: 0,
    originTop: 0,
    pointerId: null,
  });

  const clampFabPos = (left: number, top: number) => {
    const pad = 12;
    const maxLeft = Math.max(pad, window.innerWidth - FAB_SIZE - pad);
    const maxTop = Math.max(pad, window.innerHeight - FAB_SIZE - pad);
    return {
      left: Math.min(Math.max(left, pad), maxLeft),
      top: Math.min(Math.max(top, pad), maxTop),
    };
  };

  const defaultFabPos = () =>
    clampFabPos(window.innerWidth - FAB_SIZE - 20, window.innerHeight - FAB_SIZE - 28);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { left?: number; top?: number };
        if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
          setFabPos(clampFabPos(parsed.left, parsed.top));
          return;
        }
      }
    } catch {
      // ignore
    }
    setFabPos(defaultFabPos());
  }, []);

  useEffect(() => {
    const onResize = () => {
      setFabPos((prev) => (prev ? clampFabPos(prev.left, prev.top) : defaultFabPos()));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- DISCORD OAUTH LINK ---
  const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? process.env.DISCORD_CLIENT_ID ?? '';
  // Prefer the explicit Discord redirect env var to avoid origin mismatches on Vercel
  const REDIRECT_RAW = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? process.env.NEXT_PUBLIC_REDIRECT_URI ?? '';

  // Normalize redirect URI: prefer configured env, otherwise derive from current origin.
  const getAuthRedirect = () => {
    if (REDIRECT_RAW && REDIRECT_RAW.trim() !== '') {
      // remove trailing slashes
      return REDIRECT_RAW.replace(/\/+$/g, '');
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const baseRedirect = getAuthRedirect();
  // If env already points to the full callback path, use it as-is; otherwise append /auth/callback
  const authRedirect = baseRedirect
    ? baseRedirect.endsWith('/auth/callback')
      ? baseRedirect
      : `${baseRedirect.replace(/\/+$/,'')}/auth/callback`
    : '';

  const DISCORD_LOGIN_URL = DISCORD_CLIENT_ID && authRedirect
    ? `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(authRedirect)}&response_type=code&scope=identify%20guilds`
    : '/';

  useEffect(() => {
    console.debug('CuteNavbar env', { DISCORD_CLIENT_ID, REDIRECT_RAW, authRedirect, DISCORD_LOGIN_URL });
  }, [DISCORD_CLIENT_ID, REDIRECT_RAW, authRedirect, DISCORD_LOGIN_URL]);
  // Mobil menü / modal: scroll kilidi (scrollbar kayması olmadan)
  useEffect(() => {
    if (!mobileOpen) return undefined;
    return lockBodyScroll();
  }, [mobileOpen]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      let signedIn = false;

      // Prefer live session (/api/auth/me) — also covers localhost bypass
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as {
            username?: string | null;
            avatar?: string | null;
          };
          signedIn = true;
          setIsLoggedIn(true);
          setUser({
            username: data.username?.trim() || 'Local Dev',
            avatar: data.avatar ?? null,
          });
        }
      } catch {
        // fall through
      }

      if (!signedIn && isLocalDevBypassClient()) {
        signedIn = true;
        setIsLoggedIn(true);
        setUser({ username: 'Local Dev', avatar: null });
      }

      if (!signedIn) {
        const discordUser = localStorage.getItem('discordUser');
        const adminGuilds = localStorage.getItem('adminGuilds');
        const hasLocalData = !!(discordUser && adminGuilds);

        if (!hasLocalData) {
          setIsLoggedIn(false);
          setUser(null);
          setIsDeveloper(false);
          return;
        }

        try {
          const parsed = JSON.parse(discordUser!) as {
            username?: string;
            global_name?: string;
            avatar?: string | null;
            id?: string;
          };
          const avatar =
            parsed.avatar && parsed.id
              ? parsed.avatar.startsWith('http')
                ? parsed.avatar
                : `https://cdn.discordapp.com/avatars/${parsed.id}/${parsed.avatar}.png?size=96`
              : null;
          signedIn = true;
          setIsLoggedIn(true);
          setUser({
            username: parsed.global_name || parsed.username || 'Discord User',
            avatar,
          });
        } catch {
          signedIn = true;
          setIsLoggedIn(true);
          setUser(null);
        }
      }

      if (!signedIn) {
        setIsDeveloper(false);
        return;
      }

      try {
        const devRes = await fetch('/api/developer/check-access', {
          credentials: 'include',
          cache: 'no-store',
        });
        setIsDeveloper(devRes.ok);
      } catch {
        setIsDeveloper(isLocalDevBypassClient());
      }
    };

    checkLoginStatus();

    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const onFabPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!fabPos) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    fabDragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: fabPos.left,
      originTop: fabPos.top,
      pointerId: e.pointerId,
    };
  };

  const onFabPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = fabDragRef.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    // Ignore tiny mouse jitter so a normal click still opens the menu
    const DRAG_THRESHOLD = 14;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
    }
    setFabPos(clampFabPos(drag.originLeft + dx, drag.originTop + dy));
  };

  const onFabPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = fabDragRef.current;
    if (!drag.active) return;
    drag.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (drag.moved) {
      setFabPos((prev) => {
        if (!prev) return prev;
        const next = clampFabPos(prev.left, prev.top);
        try {
          localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      return;
    }
    setMobileOpen((v) => {
      if (v) setMobileSubmenu(null);
      return !v;
    });
  };

  return (
    <>
      {/* --- FOCUS OVERLAY --- */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-[12px] transition-all duration-500 z-[9990] ${
          openMenu ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      />

      {/* --- LOGIN GIF LAYER (below top navbar; full scene + edge fill) --- */}
      <div
        className={`fixed top-[6.75rem] inset-x-0 bottom-0 z-[9991] pointer-events-none overflow-hidden transition-opacity duration-300 ${
          openMenu === 'login' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Edge fill so sides aren't empty */}
        <div className="absolute inset-0">
          <Image
            src="/gif/image.gif"
            alt=""
            className="object-cover object-center scale-125 blur-2xl opacity-50"
            fill
            unoptimized
            aria-hidden
          />
        </div>
        {/* Full GIF visible (including bottom) */}
        <div className="absolute inset-0 flex items-end justify-center px-4 pb-2 pt-6">
          <div className="relative h-full w-full max-w-6xl">
            <Image
              src="/gif/image.gif"
              alt="Login Animation"
              className="object-contain object-bottom drop-shadow-2xl"
              fill
              unoptimized
              priority
            />
          </div>
        </div>
      </div>


      <div ref={containerRef} className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] w-[min(1100px,calc(100%-32px))]">
        {/* Navbar Container: overflow-visible önemli */}
        <nav className="relative flex items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl transition-colors duration-300 overflow-visible">
          
          {/* Logo / kullanıcı */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative z-50 h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#5865F2] p-0.5 shadow-lg shadow-[#5865F2]/20 transition-transform hover:scale-110">
              <div className="h-full w-full overflow-hidden rounded-[10px] bg-[#1e1f22]">
                {isLoggedIn && user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : isLoggedIn && user ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#5865F2] text-sm font-black text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/gif/cat.gif" alt="" className="h-full w-full object-cover" draggable={false} />
                )}
              </div>
            </div>

            <div
              className="relative flex h-full min-w-0 cursor-pointer items-center gap-1 group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {isLoggedIn && user ? (
                <Link
                  href="/"
                  className="relative z-50 block min-w-0 max-w-[11rem] sm:max-w-[14rem] md:max-w-[16rem]"
                  aria-label={t('navbar.back_home_hint')}
                >
                  <div className="truncate text-lg font-black tracking-tight text-white md:text-xl">
                    {user.username}
                  </div>
                  <div className="truncate text-[10px] font-medium text-white/40 transition-colors hover:text-white/70">
                    {t('navbar.back_home_hint')}
                  </div>
                </Link>
              ) : (
                <Link href="/" className="relative z-50 text-xl font-black tracking-tight text-white">
                  DiscoWeb
                </Link>
              )}

              {!isLoggedIn && (
                <div
                  className={`absolute left-1/2 top-[60%] z-0 -translate-x-1/2 transition-all duration-500 ${
                    isLogoHovered
                      ? 'translate-y-0 rotate-0 opacity-100'
                      : 'pointer-events-none -translate-y-12 -rotate-12 opacity-0'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <div className="w-[280px] drop-shadow-2xl filter brightness-110">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/gif/asılıpengu.gif"
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Menu — hide only on select-server */}
          {!onSelectServer && (
            <div className="hidden md:flex flex-1 items-center justify-center gap-0.5 lg:gap-2 min-w-0">
              {/* --- ANA SAYFA --- */}
              <div
                className="relative group shrink-0"
                onMouseEnter={() => setOpenMenu('home')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  className={`flex items-center whitespace-nowrap px-3 py-2.5 font-medium transition-all duration-200 rounded-full lg:px-5 ${
                    openMenu === 'home'
                      ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('navbar.home')}
                  <ChevronIcon isOpen={openMenu === 'home'} />
                </button>

                {openMenu === 'home' && (
                  <NavInfoPanel
                    title={t('navbar.home_panel_title')}
                    body={t('navbar.home_panel_body')}
                    note={t('navbar.home_panel_note')}
                    gifSrc="/gif/from.gif"
                  />
                )}
              </div>

              {/* --- DEVELOPER --- */}
              <div
                className="relative group shrink-0"
                onMouseEnter={() => setOpenMenu('developer')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  className={`flex items-center whitespace-nowrap px-3 py-2.5 font-medium transition-all duration-200 rounded-full lg:px-5 ${
                    openMenu === 'developer'
                      ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('navbar.developer')}
                  <ChevronIcon isOpen={openMenu === 'developer'} />
                </button>

                {openMenu === 'developer' && (
                  <NavInfoPanel
                    title={t('navbar.developer_panel_title')}
                    body={t('navbar.developer_panel_body')}
                    note={t('navbar.developer_panel_note')}
                    gifSrc="/gif/sungoandpato.gif"
                  />
                )}
              </div>

              {/* --- STATUS --- */}
              <Link
                href="/status"
                className="shrink-0 whitespace-nowrap px-3 py-2.5 font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 lg:px-5"
              >
                {t('navbar.status')}
              </Link>
            </div>
          )}

          {onSelectServer && <div className="hidden flex-1 md:block" aria-hidden />}

          <div className="flex items-center gap-2 lg:gap-3 shrink-0 min-w-0">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {isDeveloper && (
              <Link
                href="/developer"
                className="hidden md:inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:border-[#5865F2]/40 hover:bg-[#5865F2]/20 hover:text-white lg:px-3.5"
              >
                <LuCode className="h-3.5 w-3.5 shrink-0 opacity-90" />
                {t('navbar.developer')}
              </Link>
            )}
            {isLoggedIn ? (
              onSelectServer ? (
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 font-bold text-sm rounded-full bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 hover:bg-[#4752c4] transition-all duration-300 lg:px-5"
                >
                  {t('navbar.add_bot')}
                </a>
              ) : (
                <Link
                  href="/auth/select-server"
                  className="hidden md:inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 font-bold text-sm rounded-full bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 hover:bg-[#4752c4] transition-all duration-300 lg:px-5"
                >
                  {t('navbar.continue')}
                </Link>
              )
            ) : (
              <Link 
                href={DISCORD_LOGIN_URL}
                onMouseEnter={() => setOpenMenu('login')}
                onMouseLeave={() => setOpenMenu(null)}
                onClick={(e) => {
                  if (!DISCORD_CLIENT_ID || !DISCORD_LOGIN_URL || DISCORD_LOGIN_URL === '/') {
                    e.preventDefault();
                    console.warn('DISCORD login blocked: missing env vars', { DISCORD_CLIENT_ID, DISCORD_LOGIN_URL });
                    alert(t('navbar.login_error'));
                    return;
                  }
                }}
                className={`hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 font-bold text-sm rounded-full transition-all duration-300 lg:px-5 ${
                  openMenu === 'login'
                    ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <DiscordIcon className="h-4 w-4 shrink-0 opacity-90" />
                {t('navbar.login')}
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile floating menu FAB (draggable) */}
      {fabPos && !mobileSubmenu && (
        <button
          type="button"
          className={`md:hidden fixed z-[10020] flex h-14 w-14 touch-none items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg shadow-black/30 backdrop-blur-md transition-[box-shadow,transform,background-color] active:scale-95 hover:bg-white/15 ${
            mobileOpen ? 'bg-white/20 ring-2 ring-white/25' : ''
          }`}
          style={{ left: fabPos.left, top: fabPos.top }}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onPointerCancel={onFabPointerUp}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <div className="pointer-events-none w-5 h-4 flex flex-col justify-between">
            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      )}

      {/* Mobile menu — full-screen glass sheet */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[9990] animate-fadeIn">
          <div
            className="absolute inset-0 bg-[#05060a]/90 backdrop-blur-2xl"
            onClick={() => {
              setMobileOpen(false);
              setMobileSubmenu(null);
            }}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#5865F2]/25 blur-[90px]" />
            <div className="absolute bottom-10 -right-10 h-56 w-56 rounded-full bg-[#7289DA]/15 blur-[80px]" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-6 pb-8 pt-28">
            <div className="mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5865F2]">
                DiscoWeb
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white break-words">
                {t('navbar.mobile_greeting')}
              </h2>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/45 break-words">
                {t('navbar.mobile_welcome')}
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pb-2">
              {isDeveloper && (
                <Link
                  href="/developer"
                  onClick={() => setMobileOpen(false)}
                  className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-[#5865F2]/35 bg-[#5865F2]/15 px-4 py-3 text-left transition-colors hover:bg-[#5865F2]/25"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/30 text-white">
                    <LuCode className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{t('navbar.developer')}</span>
                    <span className="block truncate text-xs text-white/50">
                      {t('navbar.developer_panel_note')}
                    </span>
                  </span>
                  <span className="text-sm text-white/35">→</span>
                </Link>
              )}

              {!onSelectServer && (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileSubmenu('home')}
                    className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-left text-white/70 transition-colors hover:text-white"
                  >
                    <span className="text-lg font-semibold">{t('navbar.home')}</span>
                    <span className="text-sm text-white/25">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileSubmenu('developer')}
                    className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-left text-white/70 transition-colors hover:text-white"
                  >
                    <span className="text-lg font-semibold">{t('navbar.developer')}</span>
                    <span className="text-sm text-white/25">→</span>
                  </button>

                  <Link
                    href="/status"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-lg font-semibold text-white/70 transition-colors hover:text-white"
                  >
                    {t('navbar.status')}
                    <span className="text-sm text-white/25">→</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-6 shrink-0 space-y-5">
              <LanguageSwitcher variant="menu" />

              {isLoggedIn ? (
                onSelectServer ? (
                  <a
                    href={botInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5865F2] py-4 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30"
                  >
                    {t('navbar.add_bot')}
                  </a>
                ) : (
                  <Link
                    href="/auth/select-server"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5865F2] py-4 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30"
                  >
                    {t('navbar.continue')}
                  </Link>
                )
              ) : (
                <Link
                  href={DISCORD_LOGIN_URL}
                  onClick={(e) => {
                    if (!DISCORD_CLIENT_ID || !DISCORD_LOGIN_URL || DISCORD_LOGIN_URL === '/') {
                      e.preventDefault();
                      console.warn('DISCORD login blocked (mobile): missing env vars', { DISCORD_CLIENT_ID, DISCORD_LOGIN_URL });
                      alert(t('navbar.login_error'));
                      return;
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#5865F2] py-4 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30"
                >
                  <DiscordIcon className="h-5 w-5 shrink-0" />
                  {t('navbar.connect_discord')}
                </Link>
              )}
              <p className="mt-4 text-center text-[11px] text-white/25">Copyright Discoweb 2026</p>
            </div>
          </div>

          {mobileSubmenu === 'home' && (
            <MobileInfoModal
              title={t('navbar.home_panel_title')}
              body={t('navbar.home_panel_body')}
              note={t('navbar.home_panel_note')}
              gifSrc="/gif/from.gif"
              onClose={() => setMobileSubmenu(null)}
            />
          )}
          {mobileSubmenu === 'developer' && (
            <MobileInfoModal
              title={t('navbar.developer_panel_title')}
              body={t('navbar.developer_panel_body')}
              note={t('navbar.developer_panel_note')}
              gifSrc="/gif/sungoandpato.gif"
              onClose={() => setMobileSubmenu(null)}
            />
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(15px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </>
  );
}