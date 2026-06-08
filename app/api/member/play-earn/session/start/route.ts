import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import {
  bumpDailyStats,
  getOrCreateConfig,
  getSelectedGuildId,
  getServerRow,
  getSupabase,
  getTodayStats,
} from '@/lib/playEarn/db';
import { generateSpawnManifest } from '@/lib/playEarn/spawnGenerator';

export async function POST() {
  const maintenance = await checkMaintenance(['site']);
  if (maintenance.blocked) {
    return NextResponse.json({ error: 'maintenance', key: maintenance.key }, { status: 503 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const guildId = await getSelectedGuildId();
  const server = await getServerRow(supabase, guildId);
  if (!server) return NextResponse.json({ error: 'server_not_found' }, { status: 404 });

  const config = await getOrCreateConfig(supabase, server.id);
  if (!config.game_enabled) {
    return NextResponse.json({ error: 'game_disabled' }, { status: 403 });
  }

  const stats = await getTodayStats(supabase, server.id, userId);
  if ((stats?.sessions_count ?? 0) >= config.max_sessions_per_day) {
    return NextResponse.json({ error: 'daily_session_limit' }, { status: 429 });
  }

  const { data: lastSession } = await supabase
    .from('play_earn_sessions')
    .select('started_at, ended_at, status')
    .eq('server_id', server.id)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSession) {
    const ref = lastSession.ended_at ?? lastSession.started_at;
    const elapsedSec = (Date.now() - new Date(ref).getTime()) / 1000;
    if (lastSession.status === 'active') {
      return NextResponse.json({ error: 'session_already_active' }, { status: 409 });
    }
    if (elapsedSec < config.session_cooldown_sec) {
      return NextResponse.json(
        { error: 'cooldown', retryAfterSec: Math.ceil(config.session_cooldown_sec - elapsedSec) },
        { status: 429 },
      );
    }
  }

  const seed = crypto.randomBytes(16).toString('hex');
  const manifest = generateSpawnManifest(config, seed);

  const { data: session, error } = await supabase
    .from('play_earn_sessions')
    .insert({
      server_id: server.id,
      user_id: userId,
      status: 'active',
      difficulty_seed: seed,
      spawn_manifest: manifest,
      tokens_earned: 0,
      caught_spawn_ids: [],
    })
    .select('id, started_at')
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'session_create_failed' }, { status: 500 });
  }

  await bumpDailyStats(supabase, server.id, userId, { sessions_count: 1 });

  return NextResponse.json({
    sessionId: session.id,
    startedAt: session.started_at,
    durationSec: config.session_duration_sec,
    manifest,
  });
}
