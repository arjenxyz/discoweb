"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
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
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[32rem] animate-slideUp origin-top z-50">
      <div className="relative overflow-visible rounded-[28px] border border-white/20 bg-[#5865F2] p-6 pr-14 pb-6 shadow-[0_28px_70px_rgba(88,101,242,0.5)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_42%)]" />
        <div className="relative z-20 space-y-3 pt-0.5">
          <div>
            <div className="mb-2.5 h-1 w-10 rounded-full bg-white/80" />
            <h3 className="text-[1.55rem] font-black leading-[1.15] tracking-tight text-white">
              {title}
            </h3>
          </div>
          <p className="max-w-none text-[13.5px] leading-6 text-white/78">
            {body}
          </p>
          <p className="border-l-2 border-white/35 pl-3 text-[12px] leading-5 text-white/60">
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

export default function CuteNavbar() {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

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
  // Mobil menü scroll kilidi
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  useEffect(() => {
    // Check if user is logged in via localStorage + validate session cookie
    const checkLoginStatus = async () => {
      const discordUser = localStorage.getItem('discordUser');
      const adminGuilds = localStorage.getItem('adminGuilds');
      const hasLocalData = !!(discordUser && adminGuilds);

      if (!hasLocalData) {
        setIsLoggedIn(false);
        return;
      }

      // Verify session cookie is still valid
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          // Session expired — clear stale localStorage
          console.log('Session expired, clearing stale localStorage');
          localStorage.removeItem('discordUser');
          localStorage.removeItem('adminGuilds');
          localStorage.removeItem('adminGuildsUpdatedAt');
          setIsLoggedIn(false);
        }
      } catch {
        // Network error — keep showing logged-in state, will fail at select-server
        setIsLoggedIn(hasLocalData);
      }
    };

    checkLoginStatus();

    // Listen for storage changes (in case login happens in another tab)
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  function toggleMobileSubmenu(menu: string) {
    setMobileSubmenu((prev) => (prev === menu ? null : menu));
  }

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
          
          {/* Logo Kısmı */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] p-0.5 shadow-lg shadow-[#5865F2]/20 group cursor-pointer transition-transform hover:scale-110 relative z-50">
              <div className="w-full h-full bg-[#1e1f22] rounded-[10px] overflow-hidden">
                <img src="/gif/cat.gif" alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            
            {/* --- İNTERAKTİF LOGO --- */}
            <div 
              className="relative flex items-center gap-1 cursor-pointer h-full group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {/* Z-Index 50: Yazının penguenin üzerinde kalmasını sağlar */}
              <div className="text-white font-black text-xl tracking-tight z-50 relative">DiscoWeb</div>

              {/* --- ASILI PENGUEN GIF --- */}
              <div className={`absolute top-[60%] left-1/2 -translate-x-1/2 z-0 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                isLogoHovered 
                  ? 'opacity-100 translate-y-0 rotate-0' 
                  : 'opacity-0 -translate-y-12 -rotate-12 pointer-events-none'
              }`}>
                <div className="w-[280px] drop-shadow-2xl filter brightness-110">
                  <img 
                    src="/gif/asılıpengu.gif" 
                    alt="Hanging Penguin" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-2">
            {/* --- ANA SAYFA --- */}
            <div
              className="relative group"
              onMouseEnter={() => setOpenMenu('home')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                className={`flex items-center px-5 py-2.5 font-medium transition-all duration-200 rounded-full ${
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
              className="relative group"
              onMouseEnter={() => setOpenMenu('developer')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                className={`flex items-center px-5 py-2.5 font-medium transition-all duration-200 rounded-full ${
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
              className="px-5 py-2.5 font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200"
            >
              {t('navbar.status')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Link 
                href="/auth/select-server"
                className="hidden md:inline-flex items-center justify-center px-5 py-2.5 font-bold text-sm rounded-full bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 hover:bg-[#4752c4] transition-all duration-300"
              >
                {t('navbar.continue')}
              </Link>
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
                className={`hidden md:inline-flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-sm rounded-full transition-all duration-300 ${
                  openMenu === 'login'
                    ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <DiscordIcon className="h-4 w-4 shrink-0 opacity-90" />
                {t('navbar.login')}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 transition-all hover:bg-white/10"
              onClick={() => {
                setMobileOpen((v) => {
                  if (v) setMobileSubmenu(null);
                  return !v;
                });
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </nav>
      </div>

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
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                {t('navbar.mobile_greeting')}
              </h2>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/45">
                {t('navbar.mobile_welcome')}
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('home')}
                className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-left"
              >
                <span className={`text-lg font-semibold transition-colors ${mobileSubmenu === 'home' ? 'text-white' : 'text-white/70'}`}>
                  {t('navbar.home')}
                </span>
                <ChevronIcon isOpen={mobileSubmenu === 'home'} />
              </button>
              {mobileSubmenu === 'home' && (
                <div className="animate-fadeIn space-y-3 pb-5 pt-1 pl-0.5">
                  <div className="h-1 w-9 rounded-full bg-white/80" />
                  <p className="text-xl font-black leading-tight text-white">{t('navbar.home_panel_title')}</p>
                  <p className="text-sm leading-relaxed text-white/60">{t('navbar.home_panel_body')}</p>
                  <p className="border-l-2 border-[#5865F2]/70 pl-3 text-xs leading-relaxed text-white/40">
                    {t('navbar.home_panel_note')}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleMobileSubmenu('developer')}
                className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-left"
              >
                <span className={`text-lg font-semibold transition-colors ${mobileSubmenu === 'developer' ? 'text-white' : 'text-white/70'}`}>
                  {t('navbar.developer')}
                </span>
                <ChevronIcon isOpen={mobileSubmenu === 'developer'} />
              </button>
              {mobileSubmenu === 'developer' && (
                <div className="animate-fadeIn space-y-3 pb-5 pt-1 pl-0.5">
                  <div className="h-1 w-9 rounded-full bg-white/80" />
                  <p className="text-xl font-black leading-tight text-white">{t('navbar.developer_panel_title')}</p>
                  <p className="text-sm leading-relaxed text-white/60">{t('navbar.developer_panel_body')}</p>
                  <p className="border-l-2 border-[#5865F2]/70 pl-3 text-xs leading-relaxed text-white/40">
                    {t('navbar.developer_panel_note')}
                  </p>
                </div>
              )}

              <Link
                href="/status"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-between border-b border-white/[0.06] py-4 text-lg font-semibold text-white/70 transition-colors hover:text-white"
              >
                {t('navbar.status')}
                <span className="text-white/25 text-sm">→</span>
              </Link>
            </nav>

            <div className="mt-6 shrink-0">
              {isLoggedIn ? (
                <Link
                  href="/auth/select-server"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5865F2] py-4 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30"
                >
                  {t('navbar.continue')}
                </Link>
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