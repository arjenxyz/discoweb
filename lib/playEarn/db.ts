import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PLAY_EARN_CONFIG, type PlayEarnConfig } from './types';

export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function getOrCreateConfig(
  supabase: SupabaseClient,
  serverId: string,
): Promise<PlayEarnConfig> {
  const { data: existing } = await supabase
    .from('play_earn_config')
    .select('*')
    .eq('server_id', serverId)
    .maybeSingle();

  if (existing) {
    return {
      jeton_per_papel: Number(existing.jeton_per_papel ?? DEFAULT_PLAY_EARN_CONFIG.jeton_per_papel),
      daily_papel_cap: Number(existing.daily_papel_cap ?? DEFAULT_PLAY_EARN_CONFIG.daily_papel_cap),
      min_convert_jeton: Number(existing.min_convert_jeton ?? DEFAULT_PLAY_EARN_CONFIG.min_convert_jeton),
      session_duration_sec: Number(existing.session_duration_sec ?? DEFAULT_PLAY_EARN_CONFIG.session_duration_sec),
      session_cooldown_sec: Number(existing.session_cooldown_sec ?? DEFAULT_PLAY_EARN_CONFIG.session_cooldown_sec),
      max_sessions_per_day: Number(existing.max_sessions_per_day ?? DEFAULT_PLAY_EARN_CONFIG.max_sessions_per_day),
      game_enabled: Boolean(existing.game_enabled ?? DEFAULT_PLAY_EARN_CONFIG.game_enabled),
      difficulty_ramp_interval_sec: Number(
        existing.difficulty_ramp_interval_sec ?? DEFAULT_PLAY_EARN_CONFIG.difficulty_ramp_interval_sec,
      ),
      speed_ramp_percent: Number(existing.speed_ramp_percent ?? DEFAULT_PLAY_EARN_CONFIG.speed_ramp_percent),
      spawn_ramp_percent: Number(existing.spawn_ramp_percent ?? DEFAULT_PLAY_EARN_CONFIG.spawn_ramp_percent),
    };
  }

  const row = { server_id: serverId, ...DEFAULT_PLAY_EARN_CONFIG };
  await supabase.from('play_earn_config').insert(row);
  return { ...DEFAULT_PLAY_EARN_CONFIG };
}
