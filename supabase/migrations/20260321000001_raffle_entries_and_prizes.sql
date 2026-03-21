-- Raffles tablosuna yeni alanlar ekle (mevcut kayıtları bozmaz)
ALTER TABLE raffles
  ADD COLUMN IF NOT EXISTS winner_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS prize_type text DEFAULT 'custom',        -- 'papel' | 'role' | 'custom'
  ADD COLUMN IF NOT EXISTS prize_papel_amount numeric,
  ADD COLUMN IF NOT EXISTS prize_role_id text,
  ADD COLUMN IF NOT EXISTS drawn_at timestamptz;                    -- null = henüz çekilmedi

-- Çekiliş katılım tablosu
CREATE TABLE IF NOT EXISTS raffle_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id     uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  guild_id      text NOT NULL,
  user_id       text NOT NULL,
  entered_at    timestamptz DEFAULT now(),
  is_winner     boolean DEFAULT false,
  reward_sent_at timestamptz,
  UNIQUE(raffle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle_id ON raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_user_id ON raffle_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_guild_id ON raffle_entries(guild_id);

-- RLS aktifse eğer
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

-- Servis rolü her şeyi yapabilsin
CREATE POLICY IF NOT EXISTS "service_role_all_raffle_entries"
  ON raffle_entries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
