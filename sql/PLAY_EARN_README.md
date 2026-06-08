# Play & Earn — Kurulum

1. Supabase SQL Editor'da `play_earn_migration.sql` dosyasını çalıştırın.
2. **Admin (discoweb-main):** `/admin/play-earn-settings` — jeton/Papel oranı, limitler ve oyun aç/kapa.
3. **Oyuncu (activity-web):** Dashboard → Play & Earn — balık avı, jeton kazanımı ve Papel dönüşümü.

## Mimari

| Repo | Rol |
|------|-----|
| **activity-web** | Oyun UI, `FishingGame`, `/api/member/play-earn/*`, `public/games/fish` |
| **discoweb-main** | Sadece admin API: `GET/PUT /api/admin/play-earn-settings` |

Her iki uygulama aynı Supabase tablolarını paylaşır (`play_earn_config`, `play_earn_sessions`, vb.).

## Balık Jetonu

- Tur sırasında sunucu doğrulamalı yakalamalarla kazanılır.
- `member_wallets.fish_token_balance` sütununda tutulur.
- Papel'e dönüşüm: `POST /api/member/play-earn/convert` (activity-web)
