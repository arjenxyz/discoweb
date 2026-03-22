"use client";

import { useEffect, useState } from 'react';
import {
  LuArrowLeft, LuChevronRight, LuZap, LuCoins, LuTrendingUp, LuUsers,
  LuShield, LuInfo, LuLink, LuChartBar, LuTriangleAlert, LuBanknote,
} from 'react-icons/lu';

export default function AdvancedEconomyPage() {
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = 'Yüksek Ekonomi - DiscoWeb';

    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = 'intro';
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120) current = section.id;
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NAV_ITEMS = [
    { id: 'intro',     label: 'Giriş',             icon: LuInfo },
    { id: 'treasury',  label: 'Hazine',             icon: LuBanknote },
    { id: 'burn',      label: 'Yakma Mekanizması',  icon: LuZap },
    { id: 'referral',  label: 'Referral',           icon: LuLink },
    { id: 'market',    label: 'Yatırım Borsası',    icon: LuTrendingUp },
    { id: 'dividend',  label: 'Temettü',            icon: LuCoins },
    { id: 'oversight', label: 'Developer Denetimi', icon: LuShield },
    { id: 'risks',     label: 'Riskler',            icon: LuTriangleAlert },
    { id: 'apply',     label: 'Başvuru',            icon: LuChartBar },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">YÜKSEK EKONOMİ</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Geri Dön</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">İçindekiler</p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.label}
                      {isActive && <LuChevronRight className="w-3 h-3 ml-auto" />}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Compare box */}
            <div className="mt-8 mx-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-[11px] font-semibold text-emerald-400 mb-2">Karşılaştır</p>
              <a
                href="/economy/basic"
                className="flex items-center gap-2 text-[12px] text-white/50 hover:text-emerald-300 transition-colors"
              >
                <LuCoins className="w-3.5 h-3.5" />
                Basit Ekonomi'yi incele
              </a>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-72 px-4 sm:px-8 lg:px-16 py-12 max-w-3xl">

          {/* Hero */}
          <section id="intro" className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold tracking-wide mb-6">
              <LuZap className="w-3.5 h-3.5" />
              OPT-IN — GERİ DÖNÜLEMEz
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Yüksek Ekonomi
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-6">
              Yüksek Ekonomi, Discord sunucunuzu gerçek bir <strong className="text-white/80">ekonomik sisteme</strong> dönüştürür.
              Hazine, yakma mekanizması, referral pasif geliri ve yatırım borsası ile sunucunuz kendi ekonomik kimliğine kavuşur.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[13px] text-amber-300/80 mb-4">
              ⚠️ <strong className="text-amber-300">Bu geçiş geri alınamaz.</strong> Yüksek Ekonomi'ye geçişte tüm üye bakiyeleri sıfırlanır.
              Developer onayı gerektirir. Onay sonrası sunucuya başlangıç hazine paketi yüklenir.
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[13px] text-indigo-300/80">
              <strong className="text-indigo-300">Kimler için uygundur?</strong> Aktif ve büyük topluluğu olan, ekonomisini ciddiye alan, yatırım ve pasif gelir mekanizmaları kurmak isteyen sunucular.
            </div>
          </section>

          {/* Hazine */}
          <section id="treasury" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Hazine Sistemi</h2>
            <p className="text-white/40 text-sm mb-6">Her satın alımda otomatik kesinti sunucu hazinesini besler.</p>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[13px] text-white/60 mb-6 font-mono">
              <p className="text-white/30 mb-2">// Satın alım akışı</p>
              <p>Kullanıcı X Papel harcar</p>
              <p className="pl-4 text-red-400/70">├── %5 → Yanar (arz azalır)</p>
              <p className="pl-4 text-indigo-400/70">├── %10 → Hazine</p>
              <p className="pl-4 text-white/40">└── Kalan → Sistemden silinir</p>
            </div>
            <ul className="space-y-2 text-[14px] text-white/60">
              {[
                'Oranlar admin tarafından ayarlanabilir.',
                'Hazine bakiyesi herkese açık olarak web\'de gösterilir.',
                'Sunucu sahibi hazineden doğrudan para çekemez.',
                'Hazine yalnızca temettü, ödül ve referral ödemeleri için kullanılır.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Yakma */}
          <section id="burn" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Yakma Mekanizması</h2>
            <p className="text-white/40 text-sm mb-6">Yakılan Papel kalıcı olarak dolaşımdan çıkar. Deflasyonist etki yaratır.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Satın Alım Yakması', desc: 'Her satın alımda belirlenen oran (%5 varsayılan) yakılır.' },
                { title: 'Ceza Yakması', desc: 'Developer tarafından verilen para cezaları hazineden kesilip yakılır.' },
                { title: 'Toplam Yakılan', desc: 'Web\'de herkese açık olarak görüntülenir. Şeffaf ekonomi.' },
                { title: 'Etki', desc: 'Arz azaldıkça Papel değer çarpanı yükselir. Erken kazananlar avantajlı.' },
              ].map(item => (
                <div key={item.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="font-semibold text-sm mb-1 text-red-400/80">{item.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Referral */}
          <section id="referral" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Referral Sistemi</h2>
            <p className="text-white/40 text-sm mb-6">Tek seferlik bonus yoktur. Yerine pasif gelir modeli uygulanır.</p>
            <ol className="space-y-4">
              {[
                { step: '1', text: 'Kullanıcı web panelinden kendi referral kodunu oluşturur.' },
                { step: '2', text: 'Davet ettiği kişi bu kodla sunucuya katılır.' },
                { step: '3', text: 'Davet edilen kişi aktif hale gelince (ilk harcama) 3 aylık pasif gelir süresi başlar.' },
                { step: '4', text: 'Davet edilenin ilk 3 ay yaptığı harcamaların %10\'u sunucu hazinesinden davet edene akar.' },
                { step: '5', text: '3 ay sonra pasif gelir kesilir. Yeni davet yeni süreç.' },
              ].map(item => (
                <li key={item.step} className="flex gap-4 text-[14px] text-white/60">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{item.step}</span>
                  {item.text}
                </li>
              ))}
            </ol>
            <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[12px] text-white/40">
              Hazine yetersizse ödemeler bekletilir, hazine dolduğunda FIFO sırasıyla karşılanır.
            </div>
          </section>

          {/* Yatırım Borsası */}
          <section id="market" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Yatırım Borsası</h2>
            <p className="text-white/40 text-sm mb-6">Sunucunuz IPO ile borsaya girerek dış yatırım çekebilir.</p>
            <div className="space-y-4">
              {[
                {
                  title: 'IPO (İlk Halka Arz)',
                  items: [
                    'Yüksek Ekonomi\'deki sunucular IPO başvurusu yapabilir.',
                    'Toplam 1.000.000 lot — founder payı %51–80 arasında seçilir.',
                    'Developer başvuruyu inceler; onaylanırsa listing oluşturulur.',
                  ],
                },
                {
                  title: 'Lot Alım-Satım (P2P Borsa)',
                  items: [
                    'Kullanıcılar birbirinden lot alıp satabilir.',
                    'Fiyat-zaman öncelikli eşleştirme motoru (kısmi dolum destekli).',
                    'Her işlemde %2 platform komisyonu alınır.',
                    'Bir kullanıcı maksimum 3 farklı sunucuya yatırım yapabilir.',
                    'Kendi sunucuna yatırım yapamazsın.',
                  ],
                },
                {
                  title: 'Founder Vesting (Rug Pull Koruması)',
                  items: [
                    'İlk 30 gün: founder hiç lot satamaz (cliff).',
                    '30. günden itibaren her ay %10 lot serbest bırakılır.',
                    '~11 ayın sonunda tüm founder lotları satılabilir hale gelir.',
                  ],
                },
              ].map(group => (
                <div key={group.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="font-semibold text-sm mb-3 text-indigo-300">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Temettü */}
          <section id="dividend" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Temettü</h2>
            <p className="text-white/40 text-sm mb-6">Her Pazar 00:00 UTC'de otomatik dağıtım.</p>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[13px] text-white/60 font-mono mb-5">
              <p className="text-white/30 mb-1">// Temettü formülü</p>
              <p>hissedara_düşen =</p>
              <p className="pl-4">(kendi_lot / toplam_lot)</p>
              <p className="pl-4">× (hazine × temettü_oranı)</p>
            </div>
            <ul className="space-y-2 text-[14px] text-white/60">
              {[
                'Varsayılan temettü oranı: hazine bakiyesinin %1\'i.',
                'Admin oranı artırabilir.',
                'Aynı hafta çift ödeme imkânsızdır (idempotency).',
                'Delist durumunda hazine tamamı yatırımcılara dağıtılır.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Developer Denetimi */}
          <section id="oversight" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Developer Denetimi</h2>
            <p className="text-white/40 text-sm mb-6">Yüksek Ekonomi sunucuları platform genelinde developer denetimine tabidir.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-white/60">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/30 text-[11px] uppercase tracking-wider">
                    <th className="text-left pb-3 pr-4">Yetki</th>
                    <th className="text-left pb-3">Etki</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[
                    ['Piyasa Duyurusu', 'Lot fiyatına geçici çarpan uygulanır'],
                    ['Uyarı', 'Fiyat ×0.90 — borsada ⚠️ rozeti görünür'],
                    ['Para Cezası', 'Hazineden belirtilen Papel yakılır, fiyat ×0.80'],
                    ['Askıya Alma', 'Alım-satım durur, fiyat sabitlenir'],
                    ['Delist', 'Kalıcı tasfiye — hazine yatırımcılara dağıtılır'],
                    ['Global Dondurma', 'Tüm işlemler durdurulur'],
                  ].map(([yetki, etki]) => (
                    <tr key={yetki} className="border-b border-white/[0.03]">
                      <td className="py-2.5 pr-4 font-medium text-white/70">{yetki}</td>
                      <td className="py-2.5">{etki}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Riskler */}
          <section id="risks" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Riskler ve Sorumluluklar</h2>
            <p className="text-white/40 text-sm mb-6">Bu sisteme geçmeden önce dikkat etmen gereken önemli noktalar.</p>
            <div className="space-y-3">
              {[
                { color: 'amber', text: 'Geçiş geri alınamaz. Tüm üye bakiyeleri sıfırlanır.' },
                { color: 'amber', text: 'Lot değeri her zaman artmaz. Piyasa koşullarına bağlıdır.' },
                { color: 'amber', text: 'Developer sunucunu herhangi bir kural ihlalinde delist edebilir.' },
                { color: 'red', text: 'Yatırımcıların kaybından sunucu sahibi değil, piyasa koşulları sorumludur.' },
                { color: 'red', text: 'Hazine, sunucu sahibi tarafından doğrudan çekilemez veya kullanılamaz.' },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border text-[13px] ${
                  item.color === 'red'
                    ? 'bg-red-500/5 border-red-500/15 text-red-300/70'
                    : 'bg-amber-500/5 border-amber-500/15 text-amber-300/70'
                }`}>
                  <LuTriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {item.text}
                </div>
              ))}
            </div>
          </section>

          {/* Başvuru */}
          <section id="apply" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Başvuru Süreci</h2>
            <p className="text-white/40 text-sm mb-6">Her sunucu başvurabilir — minimum kriter yoktur.</p>
            <ol className="space-y-4 mb-8">
              {[
                'Web panelinde Ayarlar → Yüksek Ekonomi Başvurusu formunu doldur.',
                'Başvuru developer kanalına düşer, incelenir.',
                'Onay verilirse bakiyeler sıfırlanır ve başlangıç hazine paketi yüklenir.',
                'Sunucuna sistem bildirimi gönderilir, Yüksek Ekonomi aktif olur.',
              ].map((item, i) => (
                <li key={i} className="flex gap-4 text-[14px] text-white/60">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            <a
              href="/economy/basic"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              <LuCoins className="w-4 h-4" />
              Önce Basit Ekonomi'ye bak
            </a>
          </section>

        </main>
      </div>
    </div>
  );
}
