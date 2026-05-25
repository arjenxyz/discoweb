'use client';

import Image from 'next/image';
import { LuPlus, LuX } from 'react-icons/lu';
import { discordColorToHex } from '@/lib/customRoles/types';

type Props = {
  roleName: string;
  roleColor: number | string;
  roleIconUrl?: string | null;
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export default function DiscordProfileRolePreview({
  roleName,
  roleColor,
  roleIconUrl,
  username = 'kullanici',
  displayName,
  avatarUrl,
}: Props) {
  const hex =
    typeof roleColor === 'string'
      ? roleColor.startsWith('#')
        ? roleColor
        : discordColorToHex(parseInt(roleColor, 10) || 0x5865f2)
      : discordColorToHex(roleColor);
  const label = displayName || username;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1e1f22] bg-[#313338]">
      <div className="relative h-20 bg-gradient-to-br from-[#4f545c] to-[#2b2d31]" />
      <div className="relative px-4 pb-4">
        <div className="-mt-8 mb-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-full border-4 border-[#313338] bg-[#5865f2]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-bold text-white">
                {label.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <p className="font-bold text-[#f2f3f5]">{label}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase text-[#b5bac1]">Roller</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-[#41434a] py-1 pl-1 pr-1.5 text-[13px] text-[#f2f3f5]"
            style={{ borderLeft: `3px solid ${hex}` }}
          >
            {roleIconUrl ? (
              <span className="relative h-5 w-5 overflow-hidden rounded-full">
                <Image src={roleIconUrl} alt="" fill className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: hex }} />
            )}
            {roleName}
            <LuX className="h-3.5 w-3.5 text-[#b5bac1]/70" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#41434a] text-[#b5bac1]">
            <LuPlus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
