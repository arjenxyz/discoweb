import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';
import { isLocalDevBypass, LOCAL_DEV_USER_ID } from '@/lib/localDevBypass';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;
  return selectedGuildId || GUILD_ID;
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function GET() {
  try {
    if (await isLocalDevBypass()) {
      return NextResponse.json({
        username: 'Local Dev',
        nickname: 'Localhost Bypass',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        guildName: 'Local Development',
        guildIcon: null,
        localDevBypass: true,
      });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
    }
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (userId === LOCAL_DEV_USER_ID) {
      return NextResponse.json({
        username: 'Local Dev',
        nickname: 'Localhost Bypass',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        guildName: 'Local Development',
        guildIcon: null,
        localDevBypass: true,
      });
    }

    const selectedGuildId = await getSelectedGuildId();

    const supabase = getSupabase();
    let adminRoleFromDb: string | null = null;
    if (supabase) {
      const { data: server } = await supabase
        .from('servers')
        .select('admin_role_id')
        .eq('discord_id', selectedGuildId)
        .maybeSingle();
      adminRoleFromDb = server?.admin_role_id ?? null;
    }

    const [memberResponse, guildResponse] = await Promise.all([
      fetch(`https://discord.com/api/guilds/${selectedGuildId}/members/${userId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      fetch(`https://discord.com/api/guilds/${selectedGuildId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
    ]);

    if (!memberResponse.ok || !guildResponse.ok) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });

    const member = (await memberResponse.json()) as {
      nick?: string;
      user: { id: string; username: string; avatar: string | null };
      roles: string[];
    };
    const guild = (await guildResponse.json()) as { name: string; icon: string | null; id: string };

    const adminRoleId = adminRoleFromDb || process.env.ADMIN_ROLE_ID;
    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? '1465698764453838882';
    if (!adminRoleId && !developerRoleId) return NextResponse.json({ error: 'admin_role_missing' }, { status: 403 });

    const hasAdminRole = adminRoleId ? member.roles.includes(adminRoleId) : false;

    let hasDeveloperRole = false;
    if (developerRoleId) {
      if (selectedGuildId === developerGuildId) {
        hasDeveloperRole = member.roles.includes(developerRoleId);
      } else {
        try {
          const devMemberRes = await fetch(
            `https://discord.com/api/guilds/${developerGuildId}/members/${userId}`,
            { headers: { Authorization: `Bot ${botToken}` } },
          );
          if (devMemberRes.ok) {
            const devMember = (await devMemberRes.json()) as { roles: string[] };
            hasDeveloperRole = devMember.roles.includes(developerRoleId);
          }
        } catch {
          // ignore
        }
      }
    }
    if (!hasAdminRole && !hasDeveloperRole) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const avatarHash = member.user.avatar;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${avatarHash}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(member.user.id) % 5}.png`;

    const guildIcon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` : null;

    return NextResponse.json({
      username: member.user.username,
      nickname: member.nick ?? null,
      avatarUrl,
      guildName: guild.name,
      guildIcon,
    });
  } catch {
    return NextResponse.json({ error: 'unhandled_exception' }, { status: 500 });
  }
}
