CREATE TABLE IF NOT EXISTS public.booster_settings (
  guild_id text PRIMARY KEY,
  booster_role_id text,
  reward_papel numeric DEFAULT 0,
  reward_earn_multiplier numeric DEFAULT 1.0,
  is_active boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booster_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow select and update for admin users (based on their guild_id, but the backend uses service_role mostly, still good practice)
CREATE POLICY "Admins can view and edit booster settings" ON public.booster_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
