import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { DEFAULT_PLAY_EARN_CONFIG } from '@/lib/playEarn/types';
import { getOrCreateConfig, getSupabase } from '@/lib/playEarn/db';

const getGuildId = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value || process.env.DISCORD_GUILD_ID || '';
};

export async function GET() {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  const guildId = await getGuildId();
  if (!supabase || !guildId) return NextResponse.json({ error: 'missing_config' }, { status: 500 });

  const { data: server } = await supabase
    .from('servers')
    .select('id, discord_id')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (!server) return NextResponse.json({ error: 'server_not_found' }, { status: 404 });

  const config = await getOrCreateConfig(supabase, server.id);
  return NextResponse.json({ serverId: server.id, ...config });
}

export async function PUT(request: Request) {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  const guildId = await getGuildId();
  if (!supabase || !guildId) return NextResponse.json({ error: 'missing_config' }, { status: 500 });

  const { data: server } = await supabase
    .from('servers')
    .select('id')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (!server) return NextResponse.json({ error: 'server_not_found' }, { status: 404 });

  const payload = await request.json();

  const update = {
    server_id: server.id,
    jeton_per_papel: Math.max(1, Math.floor(Number(payload.jeton_per_papel ?? DEFAULT_PLAY_EARN_CONFIG.jeton_per_papel))),
    daily_papel_cap: Math.max(0, Number(payload.daily_papel_cap ?? DEFAULT_PLAY_EARN_CONFIG.daily_papel_cap)),
    min_convert_jeton: Math.max(1, Math.floor(Number(payload.min_convert_jeton ?? DEFAULT_PLAY_EARN_CONFIG.min_convert_jeton))),
    session_duration_sec: Math.max(30, Math.min(300, Math.floor(Number(payload.session_duration_sec ?? 90)))),
    session_cooldown_sec: Math.max(0, Math.floor(Number(payload.session_cooldown_sec ?? 120))),
    max_sessions_per_day: Math.max(1, Math.floor(Number(payload.max_sessions_per_day ?? 15))),
    game_enabled: Boolean(payload.game_enabled ?? true),
    difficulty_ramp_interval_sec: Math.max(5, Math.floor(Number(payload.difficulty_ramp_interval_sec ?? 15))),
    speed_ramp_percent: Math.max(0, Number(payload.speed_ramp_percent ?? 15)),
    spawn_ramp_percent: Math.max(0, Number(payload.spawn_ramp_percent ?? 10)),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('play_earn_config').upsert(update, { onConflict: 'server_id' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  return NextResponse.json({ status: 'ok', ...update });
}
