-- Allow multiple active community server ads
DROP INDEX IF EXISTS ads_one_active;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS target_guild_id text,
  ADD COLUMN IF NOT EXISTS mari_reward decimal(18,6) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS task_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ads_active_sort_idx
  ON public.ads (sort_order DESC, created_at DESC)
  WHERE active = true;
