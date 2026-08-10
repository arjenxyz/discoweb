import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;
  return selectedGuildId || GUILD_ID; // Fallback to default
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

const toAvatarUrl = (userId: string, avatar: string | null) => {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;
};

export async function GET(request: Request) {
  const selectedGuildId = await getSelectedGuildId();
  console.log('members search GET: selectedGuildId:', selectedGuildId);

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  if (!(await isAdminUser())) {
    console.log('members search GET: isAdminUser failed');
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: server } = await supabase
    .from('servers')
    .select('verify_role_id')
    .eq('discord_id', selectedGuildId)
    .maybeSingle();

  const verifyRoleId = server?.verify_role_id ?? null;
  if (!verifyRoleId) {
    return NextResponse.json([]);
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const limit = Math.min(Number(searchParams.get('limit') ?? 8), 20);

  if (!query) {
    return NextResponse.json([]);
  }

  const results: Array<{
    id: string;
    username: string;
    nickname: string | null;
    displayName: string | null;
    avatarUrl: string;
  }> = [];

  const seen = new Set<string>();

  const pushMember = (member: { user: { id: string; username: string; avatar: string | null; global_name?: string | null; bot?: boolean }; nick?: string | null; roles?: string[] }) => {
    if (member.user?.bot) {
      return;
    }
    if (!member.roles?.includes(verifyRoleId)) {
      return;
    }
    if (seen.has(member.user.id)) {
      return;
    }
    seen.add(member.user.id);
    results.push({
      id: member.user.id,
      username: member.user.username,
      nickname: member.nick ?? null,
      displayName: member.user.global_name ?? null,
      avatarUrl: toAvatarUrl(member.user.id, member.user.avatar),
    });
  };

  if (/^\d{6,20}$/.test(query)) {
    const directResponse = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/members/${query}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (directResponse.ok) {
      const member = (await directResponse.json()) as {
        nick?: string | null;
        roles?: string[];
        user: { id: string; username: string; avatar: string | null; global_name?: string | null; bot?: boolean };
      };
      pushMember(member);
    }
  }

  if (query.length >= 2 && results.length < limit) {
    const searchUrl = new URL(`https://discord.com/api/guilds/${selectedGuildId}/members/search`);
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('limit', String(limit));

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (searchResponse.ok) {
      const members = (await searchResponse.json()) as Array<{
        nick?: string | null;
        roles?: string[];
        user: { id: string; username: string; avatar: string | null; global_name?: string | null; bot?: boolean };
      }>;
      members.forEach(pushMember);
    }
  }

  return NextResponse.json(results.slice(0, limit));
}
