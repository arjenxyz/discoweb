"use client";

import { useEffect, useState } from 'react';
import {
  LuArrowLeft, LuChevronRight, LuCoins, LuShoppingBag, LuGift,
  LuArrowRightLeft, LuUsers, LuZap, LuShield, LuInfo,
} from 'react-icons/lu';

export default function BasicEconomyPage() {
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = 'Basit Ekonomi - DiscoWeb';

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
    { id: 'earning',   label: 'Papel Kazanımı',     icon: LuCoins },
    { id: 'store',     label: 'Mağaza',             icon: LuShoppingBag },
    { id: 'raffles',   label: 'Çekilişler',         icon: LuGift },
    { id: 'transfer',  label: 'Transfer',           icon: LuArrowRightLeft },
    { id: 'admin',     label: 'Admin Araçları',     icon: LuUsers },
    { id: 'limits',    label: 'Kısıtlamalar',       icon: LuShield },
    { id: 'upgrade',   label: 'Yükseltme',          icon: LuZap },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">BASİT EKONOMİ</span>
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
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
            <div className="mt-8 mx-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <p className="text-[11px] font-semibold text-indigo-400 mb-2">Karşılaştır</p>
              <a
                href="/economy/advanced"
                className="flex items-center gap-2 text-[12px] text-white/50 hover:text-indigo-300 transition-colors"
              >
                <LuZap className="w-3.5 h-3.5" />
                Yüksek Ekonomi'yi incele
              </a>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-72 px-4 sm:px-8 lg:px-16 py-12 max-w-3xl">

          {/* Hero */}
          <section id="intro" className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide mb-6">
              <LuCoins className="w-3.5 h-3.5" />
              VARSAYILAN SİSTEM
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Basit Ekonomi
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-6">
              Her Discord sunucusu DiscoWeb'e katıldığında otomatik olarak <strong className="text-white/80">Basit Ekonomi</strong> ile başlar.
              Kullanıcılar mesaj atarak ve sesli kanallarda vakit geçirerek <strong className="text-white/80">Papel</strong> kazanır.
              Kazanılan Papel mağazada harcanabilir, çekilişlere katılım için kullanılabilir ve sunucu içinde transfer edilebilir.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[13px] text-emerald-300/80">
              <strong className="text-emerald-300">Kimler için uygundur?</strong> Yeni kurulan veya büyüyen sunucular, aktivite ekonomisini basit tutmak isteyen topluluklar.
            </div>
          </section>

          {/* Papel Kazanımı */}
          <section id="earning" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Papel Kazanımı</h2>
            <p className="text-white/40 text-sm mb-6">Papel yalnızca aktivite ile kazanılır. Bedava dağıtılmaz.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: LuCoins, title: 'Mesaj Kazanımı', desc: 'Her mesajda belirli bir Papel kazanılır. Admin tarafından yapılandırılır.' },
                { icon: LuCoins, title: 'Ses Kazanımı', desc: 'Sesli kanalda geçirilen her dakika için Papel kazanılır.' },
                { icon: LuZap, title: 'Halving', desc: 'Sunucudaki toplam Papel arzı büyüdükçe kazanım oranı otomatik düşer. Ekonomiyi dengede tutar.' },
                { icon: LuShield, title: 'Spam Koruması', desc: 'Art arda gelen mesajlar azalan oranda kazandırır. Beleş para yolu yok.' },
              ].map(item => (
                <div key={item.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <item.icon className="w-5 h-5 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mağaza */}
          <section id="store" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Mağaza</h2>
            <p className="text-white/40 text-sm mb-6">Kazanılan Papel sunucu mağazasında harcanabilir.</p>
            <ul className="space-y-3 text-[14px] text-white/60">
              {[
                'Admin, mağazaya Discord rolleri ekler (fiyat + süre ile).',
                'Kullanıcı satın alırken Papel anında düşer.',
                'Satın alınan rol süresi dolunca otomatik geri alınır.',
                'Promosyon kodu desteği: belirli ürünlerde indirim.',
                'Mağaza web panelinden ve Discord botundan yönetilir.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Çekilişler */}
          <section id="raffles" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Çekilişler</h2>
            <p className="text-white/40 text-sm mb-6">Papel biriktirmenin ötesinde eğlenceli bir kullanım alanı.</p>
            <ul className="space-y-3 text-[14px] text-white/60">
              {[
                'Admin çekilişler oluşturur (Papel ödülü, rol veya özel ödül).',
                'Kullanıcılar belirli bir eşiği geçen Papel ile katılabilir.',
                'Rozet günü gereksinimi olan çekilişler de tanımlanabilir.',
                'Kazananlar otomatik belirlenir ve rol/Papel otomatik dağıtılır.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Transfer */}
          <section id="transfer" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Kullanıcıdan Kullanıcıya Transfer</h2>
            <p className="text-white/40 text-sm mb-6">Papel sunucu içinde ve sunucular arası transfer edilebilir.</p>
            <div className="space-y-3 text-[14px] text-white/60">
              {[
                { label: 'Vergi', desc: 'Her transferden küçük bir vergi kesilir. Admin tarafından ayarlanır.' },
                { label: 'Günlük Limit', desc: 'Spam transferi önlemek için günlük maksimum transfer miktarı belirlenir.' },
                { label: 'Sunucular Arası', desc: 'Farklı sunuculara transfer edilebilir. Papel değer çarpanı otomatik uygulanır.' },
              ].map(item => (
                <div key={item.label} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-emerald-400 font-semibold text-sm flex-shrink-0">{item.label}</span>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Admin Araçları */}
          <section id="admin" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Admin Araçları</h2>
            <p className="text-white/40 text-sm mb-6">Sunucu yöneticileri için temel kontrol araçları.</p>
            <ul className="space-y-2 text-[14px] text-white/60">
              {[
                'Kullanıcı bakiyesi görüntüleme ve düzenleme',
                'Mağaza ürünü ekleme / kaldırma',
                'Çekiliş oluşturma ve yönetme',
                'Kazanım oranlarını yapılandırma',
                'Duyuru ve bildirim gönderme',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Kısıtlamalar */}
          <section id="limits" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Kısıtlamalar</h2>
            <p className="text-white/40 text-sm mb-6">Basit Ekonomi'de aşağıdaki özellikler <strong className="text-white/70">bulunmaz</strong>.</p>
            <div className="space-y-2">
              {[
                'Sunucu hazinesi ve yakma mekanizması',
                'Yatırım borsası (IPO / lot alım-satım)',
                'Referral / pasif gelir sistemi',
                'Temettü dağıtımı',
                'Developer piyasa müdahalesi',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-white/40">
                  <span className="text-red-400/70 text-lg leading-none">×</span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Yükseltme */}
          <section id="upgrade" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Yüksek Ekonomi'ye Geçiş</h2>
            <p className="text-white/40 text-sm mb-6">Hazır hissettiğinde bir üst kademeye geçebilirsin.</p>
            <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[13px] text-white/60 space-y-3 mb-6">
              <p>⚠️ <strong className="text-white/80">Geri dönüş yoktur.</strong> Yüksek Ekonomi'ye geçiş kalıcıdır.</p>
              <p>⚠️ Geçiş onaylandığında tüm üyelerin Papel bakiyeleri <strong className="text-white/80">sıfırlanır</strong>.</p>
              <p>✅ Developer onayından sonra sunucuna bir başlangıç hazine paketi yüklenir.</p>
            </div>
            <a
              href="/economy/advanced"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-colors"
            >
              <LuZap className="w-4 h-4" />
              Yüksek Ekonomi'yi incele
            </a>
          </section>

        </main>
      </div>
    </div>
  );
}
