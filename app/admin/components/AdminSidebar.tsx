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
      {/* Server card */}
      <div className={`shrink-0 ${isMobile ? 'px-4 pt-4' : 'px-3 pt-4'}`}>
        <div
          className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] ${
            showExpanded ? 'p-3' : 'p-2'
          }`}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className={`relative flex items-center ${showExpanded ? 'gap-3' : 'justify-center'}`}>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0f1116] shadow-lg shadow-black/20">
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
                <div className="flex h-full w-full items-center justify-center bg-indigo-500/20 text-sm font-bold text-indigo-200">
                  {profile?.guildName?.charAt(0) ?? '#'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b0d12] bg-emerald-400" />
            </div>
            {showExpanded && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {profile?.guildName ?? t('admin.shell.default_server')}
                </p>
                <p className="text-[11px] text-white/40">{t('admin.shell.panel_label')}</p>
              </div>
            )}
            {showExpanded && !isMobile && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/70"
                aria-label={t('admin.shell.collapse')}
              >
                <LuPanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!showExpanded && !isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white mx-auto"
            aria-label={t('admin.shell.expand')}
          >
            <LuPanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
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
