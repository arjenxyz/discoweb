-- bot_log_channels channel_type CHECK constraint'ini genişlet
-- Yeni borsa/ekonomi kanal tiplerini ekle

ALTER TABLE bot_log_channels
  DROP CONSTRAINT IF EXISTS bot_log_channels_channel_type_check;

ALTER TABLE bot_log_channels
  ADD CONSTRAINT bot_log_channels_channel_type_check CHECK (
    channel_type IN (
      -- Eski tipler (web logları)
      'user_main', 'user_auth', 'user_roles', 'user_exchange', 'user_store',
      'admin_main', 'admin_wallet', 'admin_store', 'admin_notifications', 'admin_settings',
      -- Legacy tipler
      'main', 'auth', 'roles', 'suspicious', 'store', 'wallet', 'admin', 'settings',
      -- Borsa başvuru kanalları
      'basvuru_ekonomi', 'basvuru_ipo', 'basvuru_onay', 'basvuru_red',
      -- Borsa işlem kanalları
      'borsa_trades', 'borsa_emirler', 'circuit_breaker', 'buyuk_islemler', 'suphe_log',
      -- Hazine kanalları
      'hazine_giris', 'hazine_cikis',
      -- Cron / sistem kanalları
      'temetu_haftalik', 'halving_log', 'referral_aktivasyon', 'referral_odeme',
      'ceza_log', 'piyasa_olaylari', 'freeze_log', 'cron_sonuclar', 'sistem_hatalar'
    )
  );
