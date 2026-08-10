import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function GET() {
  const userId = await getSessionUserId();
  console.log('[/api/auth/me] getSessionUserId result:', userId ? `found (${userId.substring(0, 6)}...)` : 'null');
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('discord_id, username, avatar')
    .eq('discord_id', userId)
    .maybeSingle();

  const avatar = user?.avatar ?? null;
  const avatarUrl = avatar
    ? (avatar.startsWith('http')
        ? avatar
        : `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=96`)
    : `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;

  return NextResponse.json({
    id: userId,
    username: user?.username ?? null,
    avatar: avatarUrl,
  });
}

