'use client';

import Image from 'next/image';
import { LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import AdminSidebarNav from './AdminSidebarNav';

export type AdminProfile = {
  username: string;
  nickname: string | null;
  avatarUrl: string;
  guildName: string;
  guildIcon: string | null;
};

type AdminSidebarProps = {
  profile: AdminProfile | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  variant?: 'desktop' | 'mobile';
};

export default function AdminSidebar({
  profile,
  collapsed,
  onToggleCollapse,
  openSections,
  onToggleSection,
  variant = 'desktop',
}: AdminSidebarProps) {
  const { t } = useTranslation();
  const isMobile = variant === 'mobile';
  const showExpanded = !collapsed || isMobile;

  return (
    <>
      {!isMobile && (
        <div className="shrink-0 px-3 pt-4">
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md ${
              showExpanded ? 'p-3' : 'p-2'
            }`}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#5865F2]/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-[#7289DA]/15 blur-2xl" />

            <div className={`relative flex items-center ${showExpanded ? 'gap-3' : 'justify-center'}`}>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#1e1f22] shadow-md shadow-black/30">
                {profile?.guildIcon ? (
                  <Image
                    src={profile.guildIcon}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#5865F2]/25 text-sm font-bold text-white">
                    {profile?.guildName?.charAt(0) ?? '#'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0e14] bg-emerald-400" />
              </div>

              {showExpanded && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {profile?.guildName ?? t('admin.shell.default_server')}
                  </p>
                  <p className="text-[11px] font-medium tracking-wide text-[#5865F2]/80">
                    {t('admin.shell.panel_label')}
                  </p>
                </div>
              )}

              {showExpanded && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="shrink-0 rounded-xl p-1.5 text-white/35 transition hover:bg-white/10 hover:text-white/80"
                  aria-label={t('admin.shell.collapse')}
                >
                  <LuPanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {!showExpanded && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label={t('admin.shell.expand')}
            >
              <LuPanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className={`custom-scrollbar flex-1 overflow-y-auto ${isMobile ? 'px-0 py-0' : 'px-3 py-4'}`}>
        <AdminSidebarNav
          collapsed={collapsed && !isMobile}
          isMobile={isMobile}
          openSections={openSections}
          onToggleSection={onToggleSection}
        />
      </div>
    </>
  );
}
