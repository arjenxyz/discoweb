'use client';

import Image from 'next/image';
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
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  variant?: 'desktop' | 'mobile';
};

export default function AdminSidebar({
  profile,
  openSections,
  onToggleSection,
  variant = 'desktop',
}: AdminSidebarProps) {
  const { t } = useTranslation();
  const isMobile = variant === 'mobile';

  return (
    <>
      {!isMobile && (
        <div className="shrink-0 px-3 pt-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/20 backdrop-blur-md">
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#5865F2]/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-[#7289DA]/15 blur-2xl" />

            <div className="relative flex items-center gap-3">
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

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                  {profile?.guildName ?? t('admin.shell.default_server')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[#5865F2]/80">
                  {t('admin.shell.panel_label')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`custom-scrollbar flex-1 overflow-y-auto ${isMobile ? 'px-0 py-0' : 'px-3 py-4'}`}>
        <AdminSidebarNav
          collapsed={false}
          isMobile={isMobile}
          openSections={openSections}
          onToggleSection={onToggleSection}
        />
      </div>
    </>
  );
}
