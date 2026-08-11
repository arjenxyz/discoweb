'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LuChevronRight, LuLanguages, LuLogOut, LuMenu, LuServer, LuSettings } from 'react-icons/lu';
import LanguageSwitcher, { LanguagePickerModal } from '@/app/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18nContext';
import type { AdminProfile } from './AdminSidebar';
import AdminServerSwitchModal from './AdminServerSwitchModal';


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
  const [serverSwitchOpen, setServerSwitchOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  return (
    <>
      <header
        className={`md:fixed inset-x-0 top-0 flex h-16 items-center border-b border-white/[0.06] bg-[#090b10]/90 px-4 backdrop-blur-xl sm:px-6 transition-all duration-200 ${
          accountMenuOpen || serverSwitchOpen || languageModalOpen ? 'z-[9991]' : 'z-30'
        } lg:relative lg:inset-auto`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
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
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={onAccountMenuToggle}
              className="flex items-center gap-2 rounded-full bg-transparent p-0 transition-opacity hover:opacity-90"
            >
              <div
                className={`h-9 w-9 overflow-hidden rounded-full border transition ${
                  accountMenuOpen ? 'border-[#5865F2]/50' : 'border-white/15'
                }`}
              >
                {profile ? (
                  <Image
                    src={profile.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#5865F2]/25 text-[10px] font-bold text-white">
                    ?
                  </div>
                )}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[110px] truncate text-sm font-semibold leading-tight text-white">
                  {profile?.nickname ?? profile?.username ?? t('admin.shell.admin_fallback')}
                </p>
                <p className="text-[10px] leading-tight text-[#a5b4ff]/70">{t('admin.shell.role')}</p>
              </div>
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e14] shadow-2xl shadow-black/50 origin-top-right">
                <div className="relative overflow-hidden border-b border-white/10 px-4 pb-4 pt-4">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5865F2]/35 via-[#5865F2]/10 to-transparent" />
                  <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#5865F2]/30 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[#1e1f22] shadow-lg shadow-black/30">
                      {profile ? (
                        <Image
                          src={profile.avatarUrl}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#5865F2]/25 text-sm font-bold text-white">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-white">
                        {profile?.username ?? t('admin.shell.admin_fallback')}
                      </p>
                      <p className="mt-1 text-[11px] text-white/50">
                        {t('admin.shell.welcome')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAccountMenuClose();
                      setServerSwitchOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                        <LuServer className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{t('admin.shell.change_server')}</span>
                    </div>
                    <LuChevronRight className="h-4 w-4 text-white/25" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAccountMenuClose();
                      setLanguageModalOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-white/70 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                        <LuLanguages className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{t('admin.shell.language_settings')}</span>
                    </div>
                    <LuChevronRight className="h-4 w-4 text-white/25" />
                  </button>

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

      <AdminServerSwitchModal open={serverSwitchOpen} onClose={() => setServerSwitchOpen(false)} />
      <LanguagePickerModal open={languageModalOpen} onClose={() => setLanguageModalOpen(false)} />
    </>
  );
}
