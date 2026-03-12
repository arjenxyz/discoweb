import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return auth.response;
    }
    const body = await request.json();
    const { discord_id } = body as { discord_id?: string };
    if (!discord_id) return NextResponse.json({ error: 'missing_discord_id' }, { status: 400 });

    const adminDiscordId = auth.userId;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'bot_token_missing' }, { status: 500 });
    }
    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
    const developerResponse = await fetch(
      `https://discord.com/api/guilds/${developerGuildId}/members/${adminDiscordId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!developerResponse.ok) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const developerMember = (await developerResponse.json()) as { roles?: string[] };
    if (!developerMember.roles?.includes(developerRoleId)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'db_not_configured' }, { status: 500 });

    // Nullify stored oauth tokens for the target user
    await supabase.from('users').update({ oauth_access_token: null, oauth_refresh_token: null, oauth_expires_at: null }).eq('discord_id', discord_id);
    // Remove user_guilds for that user
    await supabase.from('user_guilds').delete().eq('user_id', discord_id);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Error revoking oauth token:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
