-- Add per_user_limit to promotions and allow multiple redemptions per user
BEGIN;

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS per_user_limit integer NOT NULL DEFAULT 1;

ALTER TABLE public.promotion_usages
  DROP CONSTRAINT IF EXISTS promotion_usages_promotion_id_user_id_key;

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion_user
  ON public.promotion_usages(promotion_id, user_id);

COMMIT;
