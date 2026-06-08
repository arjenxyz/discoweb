import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import { getOrCreateConfig, getSelectedGuildId, getServerRow, getSupabase } from '@/lib/playEarn/db';
import { FISH_TYPES } from '@/lib/playEarn/types';

export async function GET() {
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

  return NextResponse.json({
    gameEnabled: config.game_enabled,
    sessionDurationSec: config.session_duration_sec,
    sessionCooldownSec: config.session_cooldown_sec,
    maxSessionsPerDay: config.max_sessions_per_day,
    jetonPerPapel: config.jeton_per_papel,
    dailyPapelCap: config.daily_papel_cap,
    minConvertJeton: config.min_convert_jeton,
    fishTypes: FISH_TYPES,
  });
}
