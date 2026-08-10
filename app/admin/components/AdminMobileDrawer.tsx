'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuLogOut, LuX } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import type { AdminProfile } from './AdminSidebar';

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
      className={`lg:hidden fixed inset-0 z-[9999] transition-all duration-300 ${
        open ? 'visible animate-fadeIn' : 'invisible pointer-events-none'
      }`}
    >
      <div
        className={`absolute inset-0 bg-[#05060a]/90 backdrop-blur-2xl transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#5865F2]/25 blur-[90px]" />
        <div className="absolute bottom-10 -right-10 h-56 w-56 rounded-full bg-[#7289DA]/15 blur-[80px]" />
      </div>

      <div
        className={`relative z-10 flex h-full flex-col px-6 pb-8 pt-6 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5865F2]">
            DiscoWeb
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={t('admin.shell.close_menu')}
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#1e1f22]">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#5865F2]/25 text-sm font-black text-white">
                  {(profile?.username ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight text-white">
                {profile?.username ?? t('admin.shell.admin_fallback')}
              </h2>
              <p className="truncate text-sm text-white/45">
                {profile?.guildName ?? t('admin.shell.default_server')}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/45">
            {t('admin.shell.mobile_welcome')}
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>

        <div className="mt-4 shrink-0 space-y-3">
          <Link
            href="/auth/select-server"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5865F2] py-4 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30"
          >
            {t('admin.shell.change_server')}
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <LuLogOut className="h-4 w-4" />
            {t('admin.shell.logout')}
          </button>
          <p className="pt-1 text-center text-[11px] text-white/25">Copyright Discoweb 2026</p>
        </div>
      </div>
    </div>
  );
}
