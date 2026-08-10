/** Shared localhost design mocks for setup / Discord API fallbacks. */

export const LOCAL_DEV_MOCK_GUILD = {
  id: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? '1465698764453838882',
  name: 'Local Development',
  icon: null as string | null,
  owner_id: 'local-dev-bypass',
};

export const LOCAL_DEV_MOCK_LOG_GUILD_ID = '987654321098765432';
export const LOCAL_DEV_MOCK_GUILD_NAME = 'Local Development';

export const LOCAL_DEV_MOCK_ROLES = [
  { id: 'local-role-everyone', name: '@everyone', color: 0, permissions: '0', position: 0 },
  { id: 'local-role-owner', name: 'Owner', color: 0xe74c3c, permissions: '8', position: 100 },
  { id: 'local-role-admin', name: 'Admin', color: 0x5865f2, permissions: '8', position: 90 },
  {
    id: 'local-role-mod',
    name: 'Moderator',
    color: 0x57f287,
    permissions: String(0x20 | 0x10000000),
    position: 80,
  },
  {
    id: 'local-role-staff',
    name: 'Staff',
    color: 0xfee75c,
    permissions: String(0x10000000),
    position: 70,
  },
  { id: 'local-role-member', name: 'Üye', color: 0x3498db, permissions: '0', position: 50 },
  { id: 'local-role-verified', name: 'Doğrulanmış', color: 0x1abc9c, permissions: '0', position: 40 },
  { id: 'local-role-booster', name: 'Booster', color: 0xf47fff, permissions: '0', position: 30 },
  { id: 'local-role-vip', name: 'VIP', color: 0xe67e22, permissions: '0', position: 20 },
  { id: 'local-role-muted', name: 'Muted', color: 0x95a5a6, permissions: '0', position: 10 },
] as const;
