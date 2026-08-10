-- Track per-user promo code redemptions (one use per user per code by default)
CREATE TABLE IF NOT EXISTS public.promotion_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_user ON public.promotion_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion ON public.promotion_usages(promotion_id);
