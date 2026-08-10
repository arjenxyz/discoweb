import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AdminGuild = {
  id: string;
  name: string;
  isAdmin: boolean;
  isSetup: boolean;
  verifyRoleId: string | null;
  isOwner: boolean;
  iconUrl?: string | null;
};

export type DiscordUserGuild = {
  id: string;
  name: string;
  permissions?: string;
  owner?: boolean;
  icon?: string | null;
};

type KnownServer = {
  discord_id: string;
  name: string | null;
  admin_role_id: string | null;
  verify_role_id: string | null;
  is_setup: boolean | null;
};

export type BuildAdminGuildsOptions = {
  userId: string;
  botToken: string;
  /** Pre-fetched user guilds; if omitted, fetched via accessToken */
  guilds?: DiscordUserGuild[];
  accessToken?: string;
  supabase?: SupabaseClient | null;
  onMemberFetchFailed?: (info: {
    guildId: string;
    status: number;
    body: unknown;
  }) => void | Promise<void>;
};

export function getServiceSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export function guildIconUrl(guildId: string, icon: string | null | undefined): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=128`;
}

export async function fetchUserGuilds(accessToken: string): Promise<{
  ok: boolean;
  status: number;
  guilds: DiscordUserGuild[];
}> {
  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    return { ok: false, status: response.status, guilds: [] };
  }
  const guilds = (await response.json()) as DiscordUserGuild[];
  return { ok: true, status: response.status, guilds };
}

/**
 * Intersection of user guilds ∩ bot guilds, enriched with admin/owner/setup flags.
 */
export async function buildAdminGuilds(options: BuildAdminGuildsOptions): Promise<{
  adminGuilds: AdminGuild[];
  guilds: DiscordUserGuild[];
  guildsStatus: number;
}> {
  const { userId, botToken, supabase = null, onMemberFetchFailed } = options;

  let guilds = options.guilds;
  let guildsStatus = 200;

  if (!guilds) {
    if (!options.accessToken) {
      return { adminGuilds: [], guilds: [], guildsStatus: 401 };
    }
    const fetched = await fetchUserGuilds(options.accessToken);
    guilds = fetched.guilds;
    guildsStatus = fetched.status;
    if (!fetched.ok) {
      return { adminGuilds: [], guilds: [], guildsStatus };
    }
  }

  let knownServers: KnownServer[] = [];
  if (supabase && guilds.length > 0) {
    const { data } = await supabase
      .from('servers')
      .select('discord_id, name, admin_role_id, verify_role_id, is_setup')
      .in(
        'discord_id',
        guilds.map((g) => g.id),
      );
    knownServers = data ?? [];
  }

  const serverByGuildId = new Map(knownServers.map((server) => [server.discord_id, server]));

  let botGuildIdSet = new Set<string>();
  let hasBotGuildList = false;
  try {
    const botGuildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (botGuildsResponse.ok) {
      const botGuilds = (await botGuildsResponse.json()) as Array<{ id: string }>;
      botGuildIdSet = new Set(botGuilds.map((guild) => guild.id));
      hasBotGuildList = true;
    }
  } catch {
    // fall back to per-guild checks
  }

  const adminGuilds: AdminGuild[] = [];

  for (const userGuild of guilds) {
    const server = serverByGuildId.get(userGuild.id);

    try {
      if (hasBotGuildList) {
        if (!botGuildIdSet.has(userGuild.id)) continue;
      } else {
        const botGuildResponse = await fetch(`https://discord.com/api/guilds/${userGuild.id}`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (!botGuildResponse.ok) continue;
      }

      let isAdmin = false;
      const adminRoleId = server?.admin_role_id ?? null;

      if (adminRoleId) {
        const memberResponse = await fetch(
          `https://discord.com/api/guilds/${userGuild.id}/members/${userId}`,
          { headers: { Authorization: `Bot ${botToken}` } },
        );

        if (memberResponse.ok) {
          const member = (await memberResponse.json()) as { roles: string[] };
          isAdmin = member.roles.includes(adminRoleId);
        } else if (onMemberFetchFailed) {
          let memberBody: unknown = null;
          try {
            memberBody = await memberResponse.json();
          } catch {
            try {
              memberBody = await memberResponse.text();
            } catch {
              memberBody = null;
            }
          }
          await onMemberFetchFailed({
            guildId: userGuild.id,
            status: memberResponse.status,
            body: memberBody,
          });
        }
      }

      adminGuilds.push({
        id: userGuild.id,
        name: server?.name ?? userGuild.name,
        isAdmin,
        isSetup: Boolean(server?.is_setup),
        verifyRoleId: server?.verify_role_id ?? null,
        isOwner: Boolean(userGuild.owner),
        iconUrl: guildIconUrl(userGuild.id, userGuild.icon),
      });
    } catch {
      // skip guild on unexpected errors
    }
  }

  return { adminGuilds, guilds, guildsStatus };
}
