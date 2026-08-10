'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuLogOut, LuServer, LuX } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import type { AdminProfile } from './AdminSidebar';

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

export default function AdminMobileDrawer({
  open,
  onClose,
  onLogout,
  profile,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  profile: AdminProfile | null;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`lg:hidden fixed inset-0 z-[9999] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <button
        type="button"
        aria-label={t('admin.shell.close_menu')}
        onClick={onClose}
        className={`absolute inset-0 bg-black/55 backdrop-blur-md transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col border-r border-white/[0.08] bg-[#0a0c12]/96 shadow-[20px_0_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-[#5865F2]/30 blur-[80px]" />
          <div className="absolute bottom-24 -right-16 h-40 w-40 rounded-full bg-[#7289DA]/15 blur-[70px]" />
        </div>

        <div className="relative z-10 flex h-full flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="font-black text-lg tracking-tight leading-none" style={logoWhiteStyle}>
              Disco<span style={logoBlueStyle}>Web</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label={t('admin.shell.close_menu')}
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#5865F2]/25 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#1e1f22]">
                {profile?.guildIcon ? (
                  <Image
                    src={profile.guildIcon}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#5865F2]/25 text-sm font-bold text-white">
                    {(profile?.guildName ?? '#').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0c12] bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-white">
                  {profile?.guildName ?? t('admin.shell.default_server')}
                </p>
                <p className="truncate text-[11px] font-medium tracking-wide text-[#a5b4ff]/80">
                  {t('admin.shell.panel_label')}
                </p>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">{children}</div>

          <div className="mt-4 shrink-0 space-y-2 border-t border-white/[0.06] pt-4">
            <Link
              href="/auth/select-server"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/25 transition hover:bg-[#4752c4]"
            >
              <LuServer className="h-4 w-4" />
              {t('admin.shell.change_server')}
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/80"
            >
              <LuLogOut className="h-4 w-4" />
              {t('admin.shell.logout')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
