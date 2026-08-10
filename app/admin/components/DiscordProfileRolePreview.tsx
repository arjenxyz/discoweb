'use client';

import Image from 'next/image';
import { discordColorToHex } from '@/lib/customRoles/types';
import { DiscordRoleOverflowPill, DiscordRolePill } from './DiscordRolePill';

type Props = {
  roleName: string;
  roleColor: number | string;
  roleIconUrl?: string | null;
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

const CONTEXT_ROLES = [
  { name: 'data', color: '#1e8f8f' },
  { name: 'draft', color: '#c23b3b' },
];

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
    <div className="overflow-hidden rounded-lg border border-[#1e1f22] bg-[#313338]">
      <div className="relative h-16 bg-[#4f545c]" />
      <div className="relative px-3 pb-3">
        <div className="-mt-7 mb-2">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-4 border-[#313338] bg-[#5865f2]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {label.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-bold text-[#f2f3f5]">{label}</p>
        <p className="mt-2 text-[11px] font-bold uppercase text-[#b5bac1]">Roller</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {CONTEXT_ROLES.map((r) => (
            <DiscordRolePill key={r.name} name={r.name} colorHex={r.color} />
          ))}
          <DiscordRolePill name={roleName} colorHex={hex} iconUrl={roleIconUrl} highlight />
          <DiscordRoleOverflowPill count={5} />
        </div>
      </div>
    </div>
  );
}
