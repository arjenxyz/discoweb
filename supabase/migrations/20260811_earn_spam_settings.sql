-- Anti-abuse / spam settings for earn system
-- Run in Supabase SQL editor if columns are missing.

ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_message_cooldown_ms integer DEFAULT 5000;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_min_message_length integer DEFAULT 3;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_flood_count integer DEFAULT 5;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_flood_window_ms integer DEFAULT 15000;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_voice_block_alone boolean DEFAULT true;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS spam_voice_block_mute_deaf boolean DEFAULT true;
