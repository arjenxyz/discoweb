"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowLeft,
  LuChevronRight,
  LuTriangleAlert,
  LuShieldAlert,
  LuUser,
  LuCoins,
  LuWifi,
  LuBug,
  LuSearch,
  LuCopy,
  LuCheck,
} from "react-icons/lu";

type ErrorEntry = {
  code: string;
  title: string;
  message: string;
  causes: string[];
  solutions: string[];
};

type ErrorCategory = {
  id: string;
  label: string;
  prefix: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
  errors: ErrorEntry[];
};

const CATEGORIES: ErrorCategory[] = [
  {
    id: "auth",
    label: "Kimlik Doğrulama",
    prefix: "DW-1xxx",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: <LuShieldAlert className="w-4 h-4" />,
    description: "Discord Activity başlatılırken yaşanan oturum ve yetkilendirme sorunları.",
    errors: [
      {
        code: "DW-1001",
        title: "frame_id Bulunamadı",
        message: "Discord frame_id parametresi bulunamadı.",
        causes: [
          "Activity normal bir tarayıcıdan açılmaya çalışıldı (Discord dışı).",
          "URL'de frame_id parametresi eksik; Discord bunu Activity başlarken otomatik ekler.",
          "Çok eski veya desteklenmeyen bir Discord istemcisi kullanılıyor.",
        ],
        solutions: [
          "Activity'yi Discord masaüstü veya mobil uygulaması üzerinden aç.",
          "Discord uygulamasını güncelleyerek tekrar dene.",
          "Pencereyi kapatıp yeniden aç.",
        ],
      },
      {
        code: "DW-1002",
        title: "SDK Zaman Aşımı",
        message: "Authentication timeout.",
        causes: [
          "Discord SDK 90 saniye içinde hazır hale gelemedi.",
          "İnternet bağlantısı yavaş veya kesintili.",
          "Discord sunucuları geçici olarak yüksek yük altında.",
        ],
        solutions: [
          "Activity penceresini kapatıp tekrar aç.",
          "İnternet bağlantını kontrol et.",
          "Birkaç dakika bekleyip tekrar dene.",
        ],
      },
      {
        code: "DW-1003",
        title: "Client ID Tanımlı Değil",
        message: "Discord Client ID tanımlı değil (NEXT_PUBLIC_DISCORD_CLIENT_ID).",
        causes: [
          "Sunucu yapılandırmasında NEXT_PUBLIC_DISCORD_CLIENT_ID ortam değişkeni eksik.",
          "Bu bir geliştirici/dağıtım hatasıdır, kullanıcı kaynaklı değildir.",
        ],
        solutions: [
          "Ekrandaki Bildir butonuna basarak geliştiriciyi haberdar et.",
        ],
      },
      {
        code: "DW-1004",
        title: "SDK Kimlik Doğrulaması Başarısız",
        message: "Discord yetkilendirmesi başarısız.",
        causes: [
          "Discord OAuth akışı tamamlanamadı.",
          "Kullanıcı izin penceresini kapattı veya reddetti.",
          "Discord API geçici bir hata döndürdü.",
          "Backend auth endpoint'e ulaşılamadı.",
        ],
        solutions: [
          "Activity penceresini kapatıp tekrar aç; izin ekranı gelirse onayla.",
          "İnternet bağlantını kontrol et.",
          "Birkaç dakika bekleyip tekrar dene.",
        ],
      },
      {
        code: "DW-1005",
        title: "OAuth Token Alınamadı",
        message: "Discord OAuth token alınamadı.",
        causes: [
          "Discord token exchange adımı başarısız oldu.",
          "Backend ile Discord arasındaki iletişimde sorun var.",
        ],
        solutions: [
          "Activity'yi yeniden aç.",
          "Sorun devam ederse geliştiriciyi bildir.",
        ],
      },
    ],
  },
  {
    id: "server",
    label: "Sunucu Yapılandırması",
    prefix: "DW-2xxx",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    icon: <LuTriangleAlert className="w-4 h-4" />,
    description: "Discord sunucusunun DiscoWeb sistemine kayıt ve kurulum sorunları. Genellikle yönetici müdahalesi gerekir.",
    errors: [
      {
        code: "DW-2001",
        title: "Sunucu Kayıtlı Değil",
        message: "Sunucu sisteme kayıtlı değil. Yönetici kurulum yapmalı.",
        causes: [
          "Discord sunucusu DiscoWeb sistemine hiç kaydedilmemiş.",
          "Yönetici setup adımlarını henüz tamamlamamış.",
        ],
        solutions: [
          "Yöneticiler için: discoweb.tech adresine git ve sunucunu kaydet.",
          "Üyeler için: Sunucu yöneticinize bu hatayı bildirin.",
        ],
      },
      {
        code: "DW-2002",
        title: "Kurulum Tamamlanmamış",
        message: "Sunucu kurulumu tamamlanmamış. Yönetici setup'ı bitirmeli.",
        causes: [
          "Sunucu sisteme kayıtlı ama kurulum tamamlanmamış.",
          "Yönetici kurulum sürecini yarıda bırakmış.",
        ],
        solutions: [
          "Yöneticiler için: discoweb.tech adresine git ve kurulumu tamamla.",
          "Üyeler için: Sunucu yöneticinize bu hatayı bildirin.",
        ],
      },
      {
        code: "DW-2003",
        title: "Bot Sunucuda Bulunamıyor",
        message: "Bot sunucuda bulunamıyor. Yönetici botu yeniden davet etmeli.",
        causes: [
          "DiscoWeb botu sunucudan çıkarılmış veya hiç eklenmemiş.",
          "Bot sunucuda bulunuyor ama yetkileri kaldırılmış.",
        ],
        solutions: [
          "Yöneticiler için: Botu sunucuya yeniden davet et ve gerekli yetkileri (Rolleri Yönet, Mesaj Gönder) ver.",
          "Üyeler için: Sunucu yöneticinize bu hatayı bildirin.",
        ],
      },
      {
        code: "DW-2004",
        title: "Discord API Hatası",
        message: "Discord API geçici hata verdi. Birkaç dakika sonra tekrar dene.",
        causes: [
          "Discord'un kendi API'si geçici olarak çalışmıyor.",
          "discordstatus.com'da aktif bir olay var.",
        ],
        solutions: [
          "Birkaç dakika bekleyip tekrar dene.",
          "discordstatus.com adresini kontrol et.",
        ],
      },
      {
        code: "DW-2005",
        title: "Servis Anahtarı Eksik",
        message: "Sunucu yapılandırması eksik (servis anahtarı).",
        causes: [
          "SUPABASE_SERVICE_ROLE_KEY ortam değişkeni eksik veya hatalı.",
          "Bu bir sunucu tarafı yapılandırma hatasıdır.",
        ],
        solutions: [
          "Ekrandaki Bildir butonuna basarak geliştiriciyi haberdar et.",
        ],
      },
      {
        code: "DW-2006",
        title: "Bot Token Eksik",
        message: "Bot token yapılandırması eksik.",
        causes: [
          "DISCORD_BOT_TOKEN ortam değişkeni sunucu tarafında tanımlı değil.",
          "Bu bir geliştirici/dağıtım hatasıdır.",
        ],
        solutions: [
          "Ekrandaki Bildir butonuna basarak geliştiriciyi haberdar et.",
        ],
      },
    ],
  },
  {
    id: "user",
    label: "Kullanıcı / Yetki",
    prefix: "DW-3xxx",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    icon: <LuUser className="w-4 h-4" />,
    description: "Kullanıcı hesabı, oturum ve izin sorunları.",
    errors: [
      {
        code: "DW-3001",
        title: "Oturum Geçersiz",
        message: "Oturum geçersiz veya süresi dolmuş. Yeniden giriş gerekiyor.",
        causes: [
          "Oturum çerezi süresi dolmuş.",
          "Oturum verisi bozulmuş veya silinmiş.",
          "Activity çok uzun süre açık kaldı.",
        ],
        solutions: [
          "Activity penceresini kapatıp yeniden aç; otomatik olarak yeniden giriş yapılır.",
          "Oturumu Sıfırla butonuna basarak tüm session verilerini temizle.",
        ],
      },
      {
        code: "DW-3002",
        title: "Sunucu Üyesi Değilsin",
        message: "Bu sunucuda üye değilsin.",
        causes: [
          "Discord hesabın bu sunucudan çıkarılmış veya hiç katılmamış.",
          "Activity farklı bir hesapla açılmaya çalışılıyor.",
        ],
        solutions: [
          "Önce Discord'da bu sunucuya üye olduğundan emin ol.",
          "Doğru Discord hesabınla giriş yaptığını kontrol et.",
        ],
      },
      {
        code: "DW-3003",
        title: "Kullanıcı Profili Bulunamadı",
        message: "Kullanıcı profili bulunamadı.",
        causes: [
          "Bu sunucu için henüz bir DiscoWeb profili oluşturulmamış.",
          "Profil verisi sistemden silinmiş.",
        ],
        solutions: [
          "İlk kez giriyorsan profil oluşturma ekranı otomatik açılır; formu doldur.",
          "Sorun devam ederse Activity'yi yeniden aç.",
        ],
      },
      {
        code: "DW-3004",
        title: "Gerekli Rol Eksik",
        message: "Bu özellik için gerekli rol eksik.",
        causes: [
          "Bu özelliği kullanmak için gereken Discord rolüne sahip değilsin.",
          "Sunucu yöneticisi bu özelliği belirli rollerle kısıtlamış.",
        ],
        solutions: [
          "Sunucu yöneticinizden gerekli rolü talep edin.",
        ],
      },
      {
        code: "DW-3005",
        title: "Yetersiz Yetki",
        message: "Bu işlem için yetkin yok.",
        causes: [
          "İşlem için gereken sunucu iznine sahip değilsin.",
          "Yönetici paneline üye olarak erişmeye çalışıyorsun.",
        ],
        solutions: [
          "Sunucu yöneticinizle iletişime geçin.",
        ],
      },
    ],
  },
  {
    id: "economy",
    label: "Ekonomi",
    prefix: "DW-4xxx",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    icon: <LuCoins className="w-4 h-4" />,
    description: "Ekonomi sistemi ile ilgili işlem ve bakiye hataları.",
    errors: [
      {
        code: "DW-4001",
        title: "Yüksek Ekonomi Gerekli",
        message: "Bu özellik yüksek ekonomi gerektiriyor.",
        causes: [
          "Erişmeye çalıştığın özellik (Borsa, Hazine, Piyasa vb.) sunucunun yüksek ekonomi planında olmasını gerektiriyor.",
          "Sunucu hâlâ temel ekonomi planında.",
        ],
        solutions: [
          "Sunucu yöneticinizden Yüksek Ekonomi başvurusu yapmasını isteyin.",
          "Yöneticiyseniz sol menüdeki Yüksek Ekonomi Başvurusu bölümünden başvuru yapabilirsiniz.",
        ],
      },
      {
        code: "DW-4002",
        title: "Yetersiz Bakiye",
        message: "İşlem bakiyeniz yetersiz.",
        causes: [
          "Yapmak istediğin işlem için yeterli bakiyen yok.",
        ],
        solutions: [
          "Bakiyeni kontrol et.",
          "Kazanma yollarını (check-in, mesaj, ses vb.) kullanarak bakiye topla.",
        ],
      },
      {
        code: "DW-4003",
        title: "Günlük Transfer Limiti",
        message: "Günlük transfer limitine ulaşıldı.",
        causes: [
          "24 saat içinde transfer yapabileceğin maksimum miktara ulaştın.",
        ],
        solutions: [
          "24 saat bekle ve tekrar dene.",
        ],
      },
    ],
  },
  {
    id: "network",
    label: "Ağ / API",
    prefix: "DW-5xxx",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    icon: <LuWifi className="w-4 h-4" />,
    description: "İnternet bağlantısı ve API iletişim hataları.",
    errors: [
      {
        code: "DW-5001",
        title: "Sunucuya Bağlanılamadı",
        message: "Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.",
        causes: [
          "İnternet bağlantısı yok veya çok yavaş.",
          "DiscoWeb sunucuları geçici olarak erişilemez durumda.",
        ],
        solutions: [
          "İnternet bağlantını kontrol et.",
          "Birkaç saniye bekleyip tekrar dene.",
        ],
      },
      {
        code: "DW-5002",
        title: "API Yanıt Vermedi",
        message: "API yanıt vermedi. Sunucu geçici olarak meşgul olabilir.",
        causes: [
          "DiscoWeb API sunucusu yüksek yük altında.",
          "İstek zaman aşımına uğradı.",
        ],
        solutions: [
          "Birkaç saniye bekleyip tekrar dene.",
          "Sorun devam ederse geliştiriciyi bildir.",
        ],
      },
      {
        code: "DW-5003",
        title: "Geçersiz API Yanıtı",
        message: "Geçersiz API yanıtı alındı.",
        causes: [
          "API beklenmeyen formatta yanıt döndürdü.",
          "Muhtemelen bir deploy veya versiyon uyumsuzluğu.",
        ],
        solutions: [
          "Sayfayı yenile veya Activity'yi yeniden aç.",
          "Sorun devam ederse geliştiriciyi bildir.",
        ],
      },
    ],
  },
  {
    id: "unknown",
    label: "Bilinmeyen",
    prefix: "DW-9xxx",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    icon: <LuBug className="w-4 h-4" />,
    description: "Sistemin otomatik olarak yakaladığı beklenmedik hatalar. Ekranda 'Arka planda bir hata oluştu' bildirimi gösterir.",
    errors: [
      {
        code: "DW-9001",
        title: "Beklenmeyen JavaScript Hatası",
        message: "Beklenmeyen bir JavaScript hatası oluştu.",
        causes: [
          "Uygulama kodunda beklenmedik bir durum oluştu.",
          "Tarayıcı veya Discord istemci uyumsuzluğu.",
        ],
        solutions: [
          "Bildirimi gördüğünde Geliştiricide Bildir butonuna bas.",
          "Activity'yi yeniden aç.",
        ],
      },
      {
        code: "DW-9002",
        title: "İşlenmeyen Promise Hatası",
        message: "İşlenmeyen bir Promise hatası oluştu.",
        causes: [
          "Bir ağ isteği veya asenkron işlem beklenmedik şekilde başarısız oldu.",
        ],
        solutions: [
          "Bildirimi gördüğünde Geliştiricide Bildir butonuna bas.",
          "Activity'yi yeniden aç.",
        ],
      },
      {
        code: "DW-9003",
        title: "Bilinmeyen Hata",
        message: "Bilinmeyen bir hata oluştu.",
        causes: [
          "Hata kaynağı belirlenemedi.",
        ],
        solutions: [
          "Geliştiricide Bildir butonuna basarak geliştiriciyi haberdar et.",
          "Activity'yi yeniden aç.",
        ],
      },
    ],
  },
];

export default function ErrorCodesPage() {
  const [activeSection, setActiveSection] = useState("auth");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Hata Kodları — DiscoWeb";

    const handleScroll = () => {
      for (const cat of CATEGORIES) {
        const el = document.getElementById(cat.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) setActiveSection(cat.id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const query = search.trim().toLowerCase();
  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    errors: query
      ? cat.errors.filter(
          (e) =>
            e.code.toLowerCase().includes(query) ||
            e.title.toLowerCase().includes(query) ||
            e.message.toLowerCase().includes(query)
        )
      : cat.errors,
  })).filter((cat) => !query || cat.errors.length > 0);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">
              HATA KODLARI
            </span>
          </div>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dokümantasyon</span>
          </Link>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">
              Kategoriler
            </p>
            <ul className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = activeSection === cat.id && !query;
                return (
                  <li key={cat.id}>
                    <a
                      href={`#${cat.id}`}
                      onClick={() => setSearch("")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "text-white/40 hover:text-white/70 hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <span className={isActive ? "text-indigo-400" : "text-white/30"}>
                        {cat.icon}
                      </span>
                      <span className="flex-1">{cat.label}</span>
                      <span className={`text-[10px] font-mono ${isActive ? "text-indigo-300/60" : "text-white/20"}`}>
                        {cat.prefix}
                      </span>
                      {isActive && <LuChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-72 px-4 sm:px-10 py-8 sm:py-14">
          <article className="max-w-3xl mx-auto">
            {/* Page header */}
            <header className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Hata Kodları
              </h1>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-6">
                DiscoWeb Activity'de karşılaştığın hata kodunu aşağıdan aratabilirsin.
                Her kod için olası nedenler ve çözüm adımları listelenmiştir.
              </p>

              {/* Search */}
              <div className="relative">
                <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Kod veya anahtar kelime ara… (örn. DW-1001, frame_id, token)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition"
                />
              </div>
            </header>

            {/* Quick reference table */}
            {!query && (
              <section className="mb-12">
                <h2 className="text-lg font-bold text-white mb-4">Hızlı Başvuru Tablosu</h2>
                <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Kod</th>
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Başlık</th>
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CATEGORIES.flatMap((cat) =>
                        cat.errors.map((e, i) => (
                          <tr
                            key={e.code}
                            className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer ${i === cat.errors.length - 1 ? "border-b-white/[0.08]" : ""}`}
                            onClick={() => {
                              document.getElementById(e.code)?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <span className={`font-mono text-xs font-bold ${cat.color}`}>{e.code}</span>
                            </td>
                            <td className="px-4 py-2.5 text-white/70 text-[13px]">{e.title}</td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${cat.bgColor} ${cat.color} border ${cat.borderColor}`}>
                                {cat.icon}
                                {cat.label}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Error categories */}
            {filteredCategories.map((cat) => (
              <section key={cat.id} id={cat.id} className="scroll-mt-24 mb-14">
                <div className={`flex items-center gap-3 mb-2 ${cat.color}`}>
                  {cat.icon}
                  <h2 className="text-xl font-bold text-white">{cat.label}</h2>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${cat.bgColor} border ${cat.borderColor}`}>
                    {cat.prefix}
                  </span>
                </div>
                <p className="text-[13px] text-white/40 mb-6">{cat.description}</p>

                <div className="space-y-4">
                  {cat.errors.map((err) => (
                    <div
                      key={err.code}
                      id={err.code}
                      className={`rounded-xl border ${cat.borderColor} bg-white/[0.015] overflow-hidden`}
                    >
                      {/* Error header */}
                      <div className={`flex items-center justify-between px-4 py-3 ${cat.bgColor} border-b ${cat.borderColor}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => copyCode(err.code)}
                            className={`font-mono text-sm font-bold ${cat.color} flex items-center gap-1.5 hover:opacity-70 transition`}
                          >
                            {err.code}
                            {copiedCode === err.code ? (
                              <LuCheck className="w-3 h-3 text-green-400" />
                            ) : (
                              <LuCopy className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                          <span className="text-white font-semibold text-[13px]">{err.title}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Message */}
                        <div className="rounded-lg bg-black/30 border border-white/[0.05] px-3 py-2">
                          <p className="text-[11px] font-mono text-white/50">{err.message}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Causes */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2">Olası Nedenler</p>
                            <ul className="space-y-1.5">
                              {err.causes.map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-white/55">
                                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${cat.bgColor} border ${cat.borderColor}`} />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Solutions */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2">Çözüm</p>
                            <ul className="space-y-1.5">
                              {err.solutions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-white/55">
                                  <span className="mt-1 text-emerald-400/60 shrink-0">✓</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Report section */}
            {!query && (
              <section className="mb-14 rounded-xl border border-white/[0.08] bg-white/[0.015] p-6">
                <h2 className="text-base font-bold text-white mb-2">Hata mı yaşıyorsun?</h2>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  Activity ekranındaki <strong className="text-white/70">Bildir</strong> butonuna basarak hata detaylarını otomatik olarak bize iletebilirsin.
                  Eğer butona erişemiyorsan, hata kodunu (örn. <span className="font-mono text-indigo-300">DW-1004</span>) Discord sunucusundaki destek kanalına yazabilirsin.
                </p>
              </section>
            )}

            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                DiscoWeb Hata Kodları — Son güncelleme: {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
                <br />
                Tüm hakları saklıdır.
              </p>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}
