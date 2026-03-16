"use client";

import { useEffect, useState } from 'react';
import {
  LuBookOpen,
  LuShield,
  LuListChecks,
  LuTriangleAlert,
  LuClipboardCheck,
  LuLock,
  LuMessageCircle,
  LuChevronRight,
  LuArrowLeft,
} from 'react-icons/lu';

export default function TermsPage() {
  const LAST_UPDATED = '16 Mart 2026';
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = 'Hizmet Koşulları - DiscoWeb';

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
    { id: 'intro', label: 'Giriş', icon: LuBookOpen },
    { id: 'scope', label: 'Kapsam', icon: LuShield },
    { id: 'use', label: 'Kullanım Şartları', icon: LuListChecks },
    { id: 'responsibilities', label: 'Sorumluluklar', icon: LuTriangleAlert },
    { id: 'termination', label: 'Fesih', icon: LuClipboardCheck },
    { id: 'changes', label: 'Değişiklikler', icon: LuLock },
    { id: 'contact', label: 'İletişim', icon: LuMessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">HİZMET KOŞULLARI</span>
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
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 lg:ml-72">
          <article className="max-w-3xl px-5 sm:px-10 py-8 sm:py-14">
            {/* Hero */}
            <header className="mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <LuBookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-semibold text-indigo-400 tracking-wide">HİZMET KOŞULLARI</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Hizmet Koşulları
              </h1>
              <p className="text-[15px] text-white/50 leading-relaxed mb-6">
                DiscoWeb platformunu kullanmanız için gerekli kurallar, kullanıcı yükümlülükleri ve hizmetin nasıl yürütüldüğüne dair genel çerçeve bu sayfada yer alır.
              </p>
              <div className="flex items-center gap-3 text-xs text-white/30">
                <span>Son güncelleme: {LAST_UPDATED}</span>
              </div>
            </header>

            <div className="space-y-14">
              {/* Giriş */}
              <section id="intro" className="scroll-mt-24">
                <SectionTitle>Giriş</SectionTitle>
                <P>
                  Bu Hizmet Koşulları, DiscoWeb web sitesi ve ilgili Discord botu hizmetlerinin kullanımına ilişkin şartları belirler.
                  Platforma erişim sağladığınızda bu koşulları kabul etmiş sayılırsınız.
                </P>
                <InfoCard items={[
                  'Hizmet yalnızca yasal amaçlarla kullanılmalıdır',
                  'Kullanıcı hesap bilgileri gizli tutulmalıdır',
                  'Hizmet kurallarına uymayan hesaplar kısıtlanabilir veya silinebilir',
                  'Bu sayfada yer alan değişiklikler size bildirimde bulunularak güncellenebilir',
                ]} />
              </section>

              {/* Kapsam */}
              <section id="scope" className="scroll-mt-24">
                <SectionTitle>Kapsam</SectionTitle>
                <P>
                  Bu maddeler, DiscoWeb tarafından sağlanan tüm web arayüzleri, Discord botu komutları,
                  sunucu yönetimi özellikleri ve her türlü ilgili hizmet için geçerlidir.
                </P>
                <P>
                  Hizmetin bazı bileşenleri üçüncü taraf sağlayıcılar (Discord, Supabase, Vercel vb.) üzerinden yürütülür ve
                  bu bileşenlerin kullanımında ilgili üçüncü tarafın kendi koşulları da geçerli olabilir.
                </P>
              </section>

              {/* Kullanım Şartları */}
              <section id="use" className="scroll-mt-24">
                <SectionTitle>Kullanım Şartları</SectionTitle>
                <ul className="space-y-2 mt-4">
                  {[
                    'Hizmet yalnızca Discord tarafından izin verilen kullanım sınırları içinde kullanılmalıdır.',
                    'Hesap bilgilerinizi paylaşmayın; başkalarının hesabına erişim sağlamak yasaktır.',
                    'Botu veya paneli kötüye kullanmak (spam, rıza dışı veri toplama, suistimal) yasaktır.',
                    'Politika ihlalleri durumunda Discord tarafından uygulanan yaptırımlar da dikkate alınır.',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Sorumluluklar */}
              <section id="responsibilities" className="scroll-mt-24">
                <SectionTitle>Kullanıcı Sorumlulukları</SectionTitle>
                <P>
                  Kullanıcılar, hizmeti kullanırken aşağıdaki hususlarda sorumludur:
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Hesap bilgilerini güvenli tutmak ve başkalarına vermemek',
                    'Hizmet kurallarına uymak ve Discord hizmet şartlarına riayet etmek',
                    'Sunucu yöneticileri varsa, sunucu kurallarına saygı göstermek',
                    'Oluşan hataları veya şüpheli aktiviteleri bildirmek',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Fesih */}
              <section id="termination" className="scroll-mt-24">
                <SectionTitle>Hesap ve Hizmet Feshi</SectionTitle>
                <P>
                  DiscoWeb, aşağıdaki durumlarda kullanıcı hesabını veya hizmet erişimini sonlandırma hakkını saklı tutar:
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Kullanım şartlarının veya Discord politikalarının ihlali',
                    'Hizmetin güvenliğini tehdit eden davranışlar',
                    'Hukuki bir zorunluluk veya resmi talep',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <P className="mt-4">
                  Hesabınız sonlandırıldığında, verilerinizin nasıl işlendiği ve saklandığı konusunda Gizlilik Politikasını inceleyiniz.
                </P>
              </section>

              {/* Değişiklikler */}
              <section id="changes" className="scroll-mt-24">
                <SectionTitle>Koşullardaki Değişiklikler</SectionTitle>
                <P>
                  Bu hizmet koşulları zaman zaman güncellenebilir. Önemli değişiklikler yapıldığında platform üzerinde veya Discord
                  sunucumuz üzerinden duyuru yapılabilir.
                </P>
                <P>
                  Koşullarda yapılan değişiklikleri takip etmek sizin sorumluluğunuzdadır. Hizmete erişiminizi sürdürmeniz, güncellenmiş
                  koşulları kabul ettiğiniz anlamına gelir.
                </P>
              </section>

              {/* İletişim */}
              <section id="contact" className="scroll-mt-24">
                <SectionTitle>İletişim</SectionTitle>
                <P>
                  Hizmet koşulları veya platform hakkında sorularınız için lütfen aşağıdaki kanallardan bize ulaşın:
                </P>
                <div className="mt-5 space-y-3">
                  <ContactCard icon="💬" label="Discord Sunucusu" value="Destek kanalı üzerinden bize ulaşabilirsiniz" />
                  <ContactCard icon="🌐" label="Web Sitesi" value="discoweb.tr iletişim sayfası" />
                </div>

                <div className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    Bu sayfa, DiscoWeb hizmetinin kullanım koşullarını özetler. Resmi ve bağlayıcı olmayan bir çerçeve sağlar.
                    Daha fazla ayrıntı veya özel durumlar için bizimle iletişime geçin.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                DiscoWeb Hizmet Koşulları — Son güncelleme: {LAST_UPDATED}
              </p>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}

/* ─── Yardımcı bileşenler ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

function P({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[14px] text-white/55 leading-relaxed ${className}`}>{children}</p>;
}

function InfoCard({ items }: { items: string[] }) {
  return (
    <div className="mt-5 p-5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/10">
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[13px] text-indigo-300/80 leading-relaxed">
            <span className="mt-1 text-indigo-400">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-white/80">{label}</p>
        <p className="text-[12px] text-white/40">{value}</p>
      </div>
    </div>
  );
}
