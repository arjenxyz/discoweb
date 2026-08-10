import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const DEVELOPER_ROLE_ID = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
const DEVELOPER_GUILD_ID = process.env.DEVELOPER_GUILD_ID ?? '1465698764453838882';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function getSelectedGuildId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value || GUILD_ID;
}

/**
 * Checks if the current session user is an admin (has admin_role_id in the selected guild)
 * OR a developer (has DEVELOPER_ROLE_ID in the developer guild).
 */
export async function isAdminOrDeveloper(): Promise<boolean> {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) return false;

    const userId = await getSessionUserId();
    const selectedGuildId = await getSelectedGuildId();
    if (!userId || !selectedGuildId) return false;

    // 1) Check developer role in the developer guild first (fast path)
    if (DEVELOPER_ROLE_ID && DEVELOPER_GUILD_ID) {
      try {
        const devRes = await fetch(
          `https://discord.com/api/guilds/${DEVELOPER_GUILD_ID}/members/${userId}`,
          { headers: { Authorization: `Bot ${botToken}` } },
        );
        if (devRes.ok) {
          const devMember = (await devRes.json()) as { roles: string[] };
          if (devMember.roles.includes(DEVELOPER_ROLE_ID)) return true;
        }
      } catch {
        // continue to admin check
      }
    }

    // 2) Check admin role in the selected guild
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: server } = await supabase
      .from('servers')
      .select('admin_role_id')
      .eq('discord_id', selectedGuildId)
      .maybeSingle();

    if (!server?.admin_role_id) return false;

    const memberRes = await fetch(
      `https://discord.com/api/guilds/${selectedGuildId}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!memberRes.ok) return false;

    const member = (await memberRes.json()) as { roles: string[] };
    return member.roles.includes(server.admin_role_id);
  } catch {
    return false;
  }
}
