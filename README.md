# DiscoWeb — Web Arayüzü

<div align="center">

[![Website](https://img.shields.io/badge/🌐_Website-discowebtr.vercel.app-0070f3?style=for-the-badge)](https://discowebtr.vercel.app)
[![Docs](https://img.shields.io/badge/📚_Docs-discowebtr.vercel.app/docs-22c55e?style=for-the-badge)](https://discowebtr.vercel.app/docs)
[![Discord](https://img.shields.io/badge/💬_Discord-Sunucuya_Katıl-5865F2?style=for-the-badge)](https://discord.gg/3Y6YNwdE5Q)

**Discord sunucu yönetimini kolaylaştıran, tam entegre modern web paneli.**

</div>

---

## 🚀 Nedir?

DiscoWeb'in web arayüzü bileşeni — **Next.js 16**, **TypeScript**, **Tailwind CSS** ve **Supabase** ile geliştirilmiş tam donanımlı bir yönetim panelidir. Discord OAuth2 ile kimlik doğrulama, gerçek zamanlı bildirimler, mağaza yönetimi, cüzdan sistemi ve daha fazlasını tek bir arayüzde sunar.

---

## ✨ Özellikler

- 🔐 **Discord OAuth2 Kimlik Doğrulama** — Güvenli oturum yönetimi
- 🏪 **Mağaza & Ürün Yönetimi** — Ürün, sipariş, promosyon ve indirim kodu desteği
- 💰 **Cüzdan Sistemi** — Bakiye transferi ve işlem geçmişi
- 📬 **Dahili Mesajlaşma** — Sunucu içi mail sistemi
- 💬 **Canlı Sohbet** — Gerçek zamanlı chat arayüzü
- 🔔 **Bildirim Merkezi** — Anlık push bildirimleri (PWA destekli)
- 🛡️ **Admin Paneli** — Gelişmiş sunucu ve üye yönetimi
- 🧑‍💻 **Developer Araçları** — Önbellek yönetimi, sistem istatistikleri, log görüntüleme
- 🛑 **Acil Durdurma (Incident)** — Developer paneli üzerinden global STOP / RESUME ve adil geri alma (`/developer/incident`)
- 🎯 **Quiz Etkinlikleri** — Canlı quiz, checkpoint ödülleri, otomatik payout ve mail bildirimleri
- 🔧 **Bakım Modu** — Tek tıkla bakım modu açma/kapama

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript 5.1 |
| Stil | Tailwind CSS 3 |
| Veritabanı | Supabase (PostgreSQL) |
| Auth | Discord OAuth2 + Supabase SSR |
| İkonlar | Lucide React & React Icons |
| PWA | Service Worker + Web Manifest |

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- npm / yarn / pnpm
- Supabase projesi
- Discord Developer Application

### 1. Depoyu Klonla

```bash
git clone https://github.com/arjenxyz/discowebtr.git
cd discowebtr
```

### 2. Bağımlılıkları Yükle

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarla

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını doldurun:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
QUIZ_CRON_SECRET=...   # Production'da zorunlu — aşağıdaki "Quiz Cron" bölümüne bakın
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 📜 Kullanılabilir Komutlar

```bash
npm run dev      # Geliştirme sunucusunu başlatır (port 3000)
npm run build    # Production build oluşturur
npm run start    # Production sunucusunu başlatır
npm run lint     # ESLint ile kod kontrolü yapar
```

---

## 🗂️ Proje Yapısı

```
src/web/
├── app/
│   ├── api/          # API route'ları (admin, member, developer, discord)
│   ├── admin/        # Admin paneli sayfaları
│   ├── dashboard/    # Kullanıcı dashboard sayfaları
│   ├── developer/    # Geliştirici araçları
│   ├── chat/         # Canlı sohbet arayüzü
│   └── auth/         # Kimlik doğrulama akışı
├── lib/              # Yardımcı kütüphaneler (auth, cache, supabase vb.)
├── components/       # Paylaşılan UI bileşenleri
├── public/           # Statik dosyalar & PWA varlıkları
└── supabase/         # Veritabanı migration dosyaları
```

---

## ☁️ Dağıtım

En kolay dağıtım yöntemi [Vercel](https://vercel.com) platformudur:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/arjenxyz/discowebtr)

Ortam değişkenlerini Vercel dashboard'undan ayarlamayı unutmayın.

> **Önemli (Hobby plan):** Bu repoda `vercel.json` içinde Vercel Cron **tanımlı değildir**. Dakikalık quiz zamanlaması için harici bir scheduler (ör. [cron-job.org](https://cron-job.org)) kullanın. Ayrıntılar: [Quiz cron ve kota](#quiz-etkinlikleri--cron-zamanlayıcı-ve-kotalar).

---

## 🎯 Quiz Etkinlikleri — Cron, Zamanlayıcı ve Kotalar

Canlı quiz, sunucu tarafında bir **state machine** ile yönetilir. Soruların ilerlemesi ve etkinliğin bitirilmesi periyodik olarak tetiklenmelidir; aksi halde etkinlik `live` durumunda takılı kalabilir.

**İlgili repolar**

| Repo | Rol |
|------|-----|
| **discoweb** (bu repo) | Developer panel, soru bankası, `/api/cron/quiz-tick`, `/api/cron/quiz-payout`, mail gönderimi |
| **[discoweb-activity](https://github.com/arjenxyz/discoweb-activity)** | Üye arayüzü (quiz oynama); yedek tick için dashboard polling |

### Ne işe yarar?

| Endpoint | Önerilen sıklık | Görev |
|----------|-----------------|--------|
| `GET/POST /api/cron/quiz-tick` | ~**1 dakika** | `scheduled` → `live`, soru ilerletme, `finished` |
| `GET/POST /api/cron/quiz-payout` | ~**5 dakika** | Bitmiş etkinliklere papel dağıtımı + bilgilendirme maili |

**Kimlik doğrulama** (production'da zorunlu):

- Query: `?secret=$QUIZ_CRON_SECRET`
- veya header: `Authorization: Bearer $QUIZ_CRON_SECRET`
- `CRON_SECRET` (Vercel'in kendi cron secret'ı) da kabul edilir.

`QUIZ_CRON_SECRET` tanımlı değilse development'ta endpoint açık kalır; **production'da mutlaka tanımlayın**.

### Neden Vercel Cron değil? (Hobby plan)

Vercel **Hobby** planında cron ifadeleri **günde en fazla bir kez** çalışabilir; dakikada bir (`* * * * *`) deploy sırasında hata verir.

Bu nedenle production'da **harici zamanlayıcı** kullanıyoruz. Örnek: [cron-job.org](https://cron-job.org) (ücretsiz, makul kullanım).

### cron-job.org kurulumu (önerilen)

İki ayrı iş oluşturun (**discoweb** production URL'si, örn. `https://www.discoweb.tech`):

**1. Quiz tick** (~her 1 dakika)

- URL: `https://SENIN-DOMAIN/api/cron/quiz-tick`
- Header: `Authorization` → `Bearer <QUIZ_CRON_SECRET>`
- Test: yanıt **200** ve `{"ok":true,...}`

**2. Quiz payout** (~her 5 dakika)

- URL: `https://SENIN-DOMAIN/api/cron/quiz-payout`
- Aynı `Authorization` header

> URL'de `?secret=...` kullanmak da mümkündür; header tercih edilir (loglarda secret görünmez).

**403 Forbidden** → `QUIZ_CRON_SECRET` Vercel'deki değerle eşleşmiyor veya Production'a deploy edilmemiş.

### Zaman çizelgesi (örnek)

```
20:00  tick → etkinlik live, soru 1
20:xx  tick → sorular ilerler (soru süresi + reveal_seconds)
~20:10 tick → son soru biter, status = finished
~20:15 payout → cüzdana papel + system_mails (ödül / motivasyon)
```

### Mail bildirimleri

Payout sonrası `system_mails` tablosuna kayıt eklenir (`category: system`):

- **Kazanç > 0:** `{Etkinlik adı} — X Papel Kazandınız` (fiş formatı)
- **Kazanç = 0:** `{Etkinlik adı} — Katıldığın İçin Teşekkürler` (motivasyon)

Ödül zaten cüzdana yatırıldığı için `metadata.already_credited: true` kullanılır; mail "topla" ile tekrar ödenmez.

### Yedek mekanizma (activity-web)

Kullanıcılar activity-web dashboard'dayken `/api/member/quiz/active` ~15 sn'de bir çağrılır ve `runQuizTick` çalışır. Site tamamen boşsa **yalnızca harici cron** quiz'i ilerletir — cron-job işlerini açık tutun.

### Kota özeti (kabaca / ay)

| Kaynak | quiz-tick | quiz-payout | Toplam cron |
|--------|-----------|-------------|-------------|
| Çağrı sayısı | ~43.000 | ~8.600 | **~52.000** |

**Vercel Hobby — Function Invocations**

- Dahil: **1.000.000 / 30 gün** (kayan pencere, [Vercel Hobby plan](https://vercel.com/docs/plans/hobby))
- Sadece cron ≈ **%5** kotası; asıl tüketim normal site + quiz API trafiği
- Limit aşılırsa Hobby'de ilgili özellik duraklayabilir → Vercel **Usage** sekmesini izleyin

**cron-job.org**

- Ücretsiz; job başına saatte en fazla ~60 çalıştırma (dakikada 1)
- 2 job (tick + payout) tipik quiz kullanımı için genelde yeterli
- İstek başına **30 sn** timeout; tick/payout normalde saniyeler içinde biter

### Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| Quiz canlı ama soru ilerlemiyor | cron-job kapalı, 403, veya secret yanlış |
| Bitti ama papel/mail yok | payout job yok veya başarısız |
| Vercel deploy cron hatası | `vercel.json` içinde dakikalık cron olmamalı (bu repoda kaldırıldı) |
| Developer panelde "Canlı" takılı | tick çalışmıyor |

Manuel test:

```bash
curl -H "Authorization: Bearer $QUIZ_CRON_SECRET" \
  "https://SENIN-DOMAIN/api/cron/quiz-tick"
```

### İlgili dosyalar

```
app/api/cron/quiz-tick/route.ts    # State machine: başlat, ilerlet, bitir
app/api/cron/quiz-payout/route.ts  # Papel + mail
lib/quiz/sendRewardMail.ts         # Ödül ve motivasyon mail metinleri
lib/quiz/lockQuestions.ts          # Etkinlik öncesi soru kilitleme
```

---

## 📄 Lisans

Bu proje özel bir lisans altındadır. Kullanım koşulları için [iletişime geçin](https://discord.gg/3Y6YNwdE5Q).
