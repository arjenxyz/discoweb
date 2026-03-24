-- Sunucu başına referral ödül miktarı (Papel cinsinden)
-- Hem davet eden hem davet edilen bu kadar Papel kazanır
ALTER TABLE public.servers
  ADD COLUMN IF NOT EXISTS referral_reward INTEGER NOT NULL DEFAULT 500;

COMMENT ON COLUMN public.servers.referral_reward IS
  'Referral davetinde davet eden ve davet edilen kişiye verilecek Papel ödülü (admin tarafından ayarlanır)';
