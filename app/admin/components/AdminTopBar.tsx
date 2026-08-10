'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LuChevronRight, LuFileText, LuLogOut, LuMenu, LuSettings, LuX } from 'react-icons/lu';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18nContext';
import type { AdminProfile } from './AdminSidebar';

type AdminTopBarProps = {
  profile: AdminProfile | null;
  accountMenuOpen: boolean;
  onAccountMenuToggle: () => void;
  onAccountMenuClose: () => void;
  onMobileMenuOpen: () => void;
  onLogout: () => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
};

const logoWhiteStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(105deg, #fff 0%, #fff 35%, rgba(255,255,255,0.95) 45%, #fff 55%, #fff 100%)',
  backgroundSize: '300% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'adminTitleShine 4s ease-in-out infinite',
};

const logoBlueStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(105deg, #5865F2 0%, #5865F2 35%, #a5b4ff 45%, #5865F2 55%, #5865F2 100%)',
  backgroundSize: '300% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'adminTitleShine 4s ease-in-out infinite',
};

export default function AdminTopBar({
  profile,
  accountMenuOpen,
  onAccountMenuToggle,
  onAccountMenuClose,
  onMobileMenuOpen,
  onLogout,
  accountMenuRef,
}: AdminTopBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <header
      className={`md:fixed inset-x-0 top-0 flex h-16 items-center border-b border-white/[0.06] bg-[#090b10]/90 px-4 backdrop-blur-xl sm:px-6 transition-all duration-200 ${
        accountMenuOpen ? 'z-[9991]' : 'z-30'
      } lg:relative lg:inset-auto`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          aria-label={t('admin.shell.open_menu')}
        >
          <LuMenu className="h-[18px] w-[18px]" />
        </button>

        <div className="min-w-0 items-center">
          <span className="font-black text-xl tracking-tight leading-none" style={logoWhiteStyle}>
            Disco<span style={logoBlueStyle}>Web</span>
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={onAccountMenuToggle}
            className={`flex items-center gap-2 rounded-full border p-1 pr-3 transition-all ${
              accountMenuOpen
                ? 'border-indigo-400/30 bg-indigo-500/10'
                : 'border-transparent hover:border-white/10 hover:bg-white/5'
            }`}
          >
            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 ring-2 ring-transparent transition group-hover:ring-indigo-500/20">
              {profile ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/40">
                  ?
                </div>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="max-w-[110px] truncate text-sm font-semibold text-white leading-tight">
                {profile?.nickname ?? profile?.username ?? t('admin.shell.admin_fallback')}
              </p>
              <p className="text-[10px] text-indigo-300/70 leading-tight">{t('admin.shell.role')}</p>
            </div>
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e14] shadow-2xl shadow-black/50 origin-top-right">
              <div className="relative h-[88px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-violet-600/15 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(88,101,242,0.25),transparent_60%)]" />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0c0e14] to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="truncate text-base font-bold text-white">
                    {profile?.username ?? t('admin.shell.admin_fallback')}
                  </p>
                  <p className="text-[11px] text-white/45">{profile?.guildName}</p>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onAccountMenuClose();
                    window.location.href = '/admin/settings';
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                      <LuSettings className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{t('admin.shell.settings')}</span>
                  </div>
                  <LuChevronRight className="h-4 w-4 text-white/25" />
                </button>

                <Link
                  href="/admin/guide"
                  onClick={onAccountMenuClose}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                    pathname.startsWith('/admin/guide')
                      ? 'bg-indigo-500/10 text-indigo-200'
                      : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                      <LuFileText className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{t('admin.shell.guide')}</span>
                  </div>
                  <LuChevronRight className="h-4 w-4 text-white/25" />
                </Link>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/15"
                  >
                    <LuLogOut className="h-4 w-4" />
                    {t('admin.shell.logout')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AdminMobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`lg:hidden fixed inset-0 z-[9999] transition-all duration-300 ${
        open ? 'visible' : 'invisible pointer-events-none'
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`absolute top-0 bottom-0 left-0 flex w-[min(300px,88vw)] flex-col border-r border-white/[0.08] bg-[#090b10] shadow-[24px_0_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
            {t('admin.shell.menu_title')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label={t('admin.shell.close_menu')}
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
