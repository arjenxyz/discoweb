-- Önceki gereksiz ayar tablosunu kaldır (eğer oluşturulduysa)
DROP TABLE IF EXISTS public.booster_settings CASCADE;

-- Yeni booster kademeleri tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.booster_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id text NOT NULL,
  name text NOT NULL,
  emoji text,
  months_required integer NOT NULL DEFAULT 1,
  color text,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  reward_papel numeric DEFAULT 0,
  reward_earn_multiplier numeric DEFAULT 1.0,
  reward_message text,
  role_id text,
  background_image text,
  UNIQUE(guild_id, months_required)
);

-- RLS ayarları
ALTER TABLE public.booster_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and edit booster tiers" ON public.booster_tiers
  FOR ALL
  USING (true)
  WITH CHECK (true);
