# Play & Earn — Kurulum

1. Supabase SQL Editor'da `play_earn_migration.sql` dosyasını çalıştırın.
2. Admin panel: `/admin/play-earn-settings` — jeton/Papel oranı ve limitler.
3. Oyuncu sayfası: `/play-earn` (giriş yapmış üye gerekir).

## Balık Jetonu

- Tur sırasında sunucu doğrulamalı yakalamalarla kazanılır.
- `member_wallets.fish_token_balance` sütununda tutulur.
- Papel'e dönüşüm: `POST /api/member/play-earn/convert`

## Discord Activity (activity-web)

Activity istemcisi aynı Supabase ve API'leri kullanmalıdır. Bileşenler `discoweb-main` içinde:

- `components/play-earn/FishingGame.tsx`
- `app/play-earn/page.tsx`
- `app/api/member/play-earn/*`

Activity repo'ya entegre ederken bu dosyaları kopyalayıp dashboard menüsüne `play-earn` section ekleyin.
