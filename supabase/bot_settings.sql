-- Bot ayarları ve durumu için tablo
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id text PRIMARY KEY DEFAULT 'default',
  presence_status text NOT NULL DEFAULT 'online',
  presence_type text NOT NULL DEFAULT 'PLAYING',
  presence_text text NOT NULL DEFAULT '',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) ayarları (Sadece Service Role yazıp okuyabilsin)
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- Servis rolü için tüm yetkileri tanımla
CREATE POLICY "Service role can manage bot settings" 
ON public.bot_settings
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- İlk (varsayılan) veriyi oluştur (eğer yoksa)
INSERT INTO public.bot_settings (id, presence_status, presence_type, presence_text)
VALUES ('default', 'online', 'PLAYING', 'DiscoWeb ile yönetiliyor')
ON CONFLICT (id) DO NOTHING;
