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

---

## 📄 Lisans

Bu proje özel bir lisans altındadır. Kullanım koşulları için [iletişime geçin](https://discord.gg/3Y6YNwdE5Q).
