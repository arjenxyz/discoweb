-- Play & Earn (Balık Jetonu) — Supabase migration
-- Run once in Supabase SQL editor.

ALTER TABLE member_wallets
  ADD COLUMN IF NOT EXISTS fish_token_balance integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS play_earn_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  jeton_per_papel integer NOT NULL DEFAULT 100,
  daily_papel_cap numeric NOT NULL DEFAULT 40,
  min_convert_jeton integer NOT NULL DEFAULT 100,
  session_duration_sec integer NOT NULL DEFAULT 90,
  session_cooldown_sec integer NOT NULL DEFAULT 120,
  max_sessions_per_day integer NOT NULL DEFAULT 15,
  game_enabled boolean NOT NULL DEFAULT true,
  difficulty_ramp_interval_sec integer NOT NULL DEFAULT 15,
  speed_ramp_percent numeric NOT NULL DEFAULT 15,
  spawn_ramp_percent numeric NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (server_id)
);

CREATE TABLE IF NOT EXISTS play_earn_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  difficulty_seed text NOT NULL,
  tokens_earned integer NOT NULL DEFAULT 0,
  spawn_manifest jsonb NOT NULL,
  caught_spawn_ids text[] NOT NULL DEFAULT '{}',
  last_catch_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_play_earn_sessions_user_server
  ON play_earn_sessions (server_id, user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS play_earn_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  papel_converted_today numeric NOT NULL DEFAULT 0,
  sessions_count integer NOT NULL DEFAULT 0,
  UNIQUE (server_id, user_id, stat_date)
);

CREATE TABLE IF NOT EXISTS play_earn_catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES play_earn_sessions(id) ON DELETE CASCADE,
  spawn_id text NOT NULL,
  fish_type text NOT NULL,
  tokens integer NOT NULL,
  client_elapsed_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, spawn_id)
);
