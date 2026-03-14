"use client";

import { useEffect, useState } from 'react';
import { LuShield, LuDatabase, LuEye, LuShare2, LuClock, LuLock, LuSettings, LuMessageCircle, LuChevronRight, LuArrowLeft } from 'react-icons/lu';

export default function PrivacyPage() {
  const LAST_UPDATED = '14 Mart 2026';
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = 'Gizlilik Politikası - DiscoWeb';

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
    { id: 'intro', label: 'Giriş', icon: LuShield },
    { id: 'about', label: 'Platform Hakkında', icon: LuEye },
    { id: 'what', label: 'Toplanan Veriler', icon: LuDatabase },
    { id: 'how-we-use', label: 'Verilerin Kullanımı', icon: LuSettings },
    { id: 'sharing', label: 'Üçüncü Taraflar', icon: LuShare2 },
    { id: 'retention', label: 'Saklama Süresi', icon: LuClock },
    { id: 'protection', label: 'Güvenlik', icon: LuLock },
    { id: 'control', label: 'Haklarınız', icon: LuSettings },
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
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">GİZLİLİK POLİTİKASI</span>
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
                <LuShield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-semibold text-indigo-400 tracking-wide">GİZLİLİK & VERİ GÜVENLİĞİ</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Gizlilik Politikası
              </h1>
              <p className="text-[15px] text-white/50 leading-relaxed mb-6">
                DiscoWeb olarak kullanıcılarımızın gizliliğine saygı duyar ve verilerinizi korumayı öncelikli tutarız.
                Bu politika, platformumuzu kullanırken hangi verilerin toplandığını, nasıl işlendiğini ve haklarınızı açıklar.
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
                  Bu Gizlilik Politikası, DiscoWeb platformunu (web sitesi ve Discord botu dahil) kullanırken
                  kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.
                  Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.
                </P>
                <InfoCard items={[
                  'Kişisel bilgilerinizi üçüncü taraflara satmayız',
                  'Yalnızca hizmet için gerekli verileri toplarız',
                  'Discord OAuth2 dışında herhangi bir şifre veya hassas kimlik bilgisi saklamayız',
                  'Verilerinizin silinmesini istediğiniz an talep edebilirsiniz',
                ]} />
              </section>

              {/* Platform Hakkında */}
              <section id="about" className="scroll-mt-24">
                <SectionTitle>Platform Hakkında</SectionTitle>
                <P>
                  DiscoWeb, Discord sunucuları için web tabanlı bir yönetim panelidir. Platform aşağıdaki hizmetleri sunar:
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Sunucu üyelerinin aktivitelerini (mesaj sayısı, ses süresi) takip etme',
                    'Sunucu içi sanal ekonomi sistemi (Papel) ile mağaza ve rol satışı',
                    'Sunucu yöneticileri için admin paneli ve istatistik görüntüleme',
                    'Discord botu aracılığıyla otomatik rol yönetimi ve bildirimler',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Toplanan Veriler */}
              <section id="what" className="scroll-mt-24">
                <SectionTitle>Toplanan Veriler</SectionTitle>
                <P>
                  Platformumuzu kullanırken aşağıdaki veriler toplanır veya işlenir:
                </P>

                <DataCategory title="Discord Hesap Bilgileri" description="Discord OAuth2 ile giriş yaptığınızda alınır">
                  {['Discord kullanıcı kimliğiniz (User ID)', 'Kullanıcı adınız ve profil fotoğrafınız', 'Üyesi olduğunuz sunucu listesi (botun bulunduğu sunucular)']}
                </DataCategory>

                <DataCategory title="Sunucu İçi Aktivite Verileri" description="Discord botu tarafından toplanır">
                  {['Mesaj sayısı (mesaj içerikleri saklanmaz)', 'Ses kanalında geçirilen süre', 'Sunucuya katılım tarihi ve rol bilgileri']}
                </DataCategory>

                <DataCategory title="Platform Kullanım Verileri" description="Web paneli kullanımı sırasında oluşur">
                  {['Mağaza satın alım geçmişi ve bakiye hareketleri', 'Posta kutusu bildirimleri', 'Denetim günlükleri (audit log) — IP adresi ve tarayıcı bilgisi dahil']}
                </DataCategory>

                <div className="mt-5 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                  <p className="text-[13px] text-amber-300/80 leading-relaxed">
                    <strong className="text-amber-300">Önemli:</strong> Discord mesaj içeriklerinizi, özel mesajlarınızı veya ses kayıtlarınızı
                    hiçbir koşulda saklamayız. Yalnızca mesaj ve ses aktivite sayıları/süreleri işlenir.
                  </p>
                </div>
              </section>

              {/* Kullanım */}
              <section id="how-we-use" className="scroll-mt-24">
                <SectionTitle>Verilerin Kullanımı</SectionTitle>
                <P>Toplanan veriler yalnızca aşağıdaki amaçlarla kullanılır:</P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Kullanıcı kimliğini doğrulamak ve oturum yönetimi sağlamak',
                    'Sunucu istatistiklerini hesaplamak ve liderlik tablosunu oluşturmak',
                    'Sanal ekonomi (Papel) işlemlerini gerçekleştirmek',
                    'Mağaza siparişlerini işlemek ve satın alınan rolleri atamak',
                    'Yönetici panelindeki özet ve raporları sunmak',
                    'Platformun güvenliğini ve bütünlüğünü korumak',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Üçüncü Taraflar */}
              <section id="sharing" className="scroll-mt-24">
                <SectionTitle>Üçüncü Taraf Hizmetler</SectionTitle>
                <P>
                  Platformumuz çalışmak için aşağıdaki üçüncü taraf hizmetleri kullanır.
                  Bu hizmetlere yalnızca işlevsellik için gerekli olan minimum düzeyde veri aktarılır:
                </P>

                <div className="mt-5 space-y-3">
                  <ThirdPartyCard name="Discord API" purpose="Kullanıcı kimlik doğrulama, rol yönetimi, sunucu bilgileri" />
                  <ThirdPartyCard name="Supabase" purpose="Veritabanı barındırma (kullanıcı verileri, siparişler, bakiyeler)" />
                  <ThirdPartyCard name="Vercel" purpose="Web uygulaması barındırma ve dağıtımı" />
                </div>

                <div className="mt-5 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <p className="text-[13px] text-emerald-300/80 leading-relaxed">
                    Kişisel verilerinizi reklam, pazarlama veya profilleme amacıyla üçüncü taraflarla <strong className="text-emerald-300">asla paylaşmayız ve satmayız</strong>.
                  </p>
                </div>
              </section>

              {/* Saklama Süresi */}
              <section id="retention" className="scroll-mt-24">
                <SectionTitle>Veri Saklama Süresi</SectionTitle>
                <P>Verileriniz aşağıdaki koşullarla saklanır:</P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Hesap verileri — hesabınız aktif olduğu sürece saklanır',
                    'Aktivite istatistikleri — sunucu yöneticisi verileri sıfırlamadıkça saklanır',
                    'Sipariş ve işlem geçmişi — hesap silinene kadar saklanır',
                    'Denetim günlükleri — güvenlik amacıyla 90 güne kadar saklanabilir',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <P className="mt-4">
                  Hesabınızı silmek istediğinizde, Discord sunucumuzdaki destek kanalı üzerinden talepte bulunabilirsiniz.
                  Silme işlemi tüm kişisel verilerinizi ve ilişkili kayıtları kapsar.
                </P>
              </section>

              {/* Güvenlik */}
              <section id="protection" className="scroll-mt-24">
                <SectionTitle>Güvenlik Önlemleri</SectionTitle>
                <P>Verilerinizin güvenliği için aldığımız teknik önlemler:</P>
                <ul className="space-y-2 mt-4">
                  {[
                    'Tüm veri aktarımları HTTPS/TLS şifrelemesi ile korunur',
                    'Veritabanı erişimi service role key ile sınırlandırılmıştır',
                    'Discord OAuth2 token\'ları güvenli httpOnly çerezlerde saklanır',
                    'Admin ve geliştirici panellerine yalnızca yetkili kullanıcılar erişebilir',
                    'Hassas işlemler (bakiye değişikliği, rol atama vb.) denetim günlüğüne kaydedilir',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Haklarınız */}
              <section id="control" className="scroll-mt-24">
                <SectionTitle>Haklarınız</SectionTitle>
                <P>Kullanıcı olarak aşağıdaki haklara sahipsiniz:</P>

                <div className="mt-5 grid gap-3">
                  <RightCard title="Erişim Hakkı" desc="Hakkınızda saklanan verilerin bir kopyasını talep edebilirsiniz." />
                  <RightCard title="Düzeltme Hakkı" desc="Yanlış veya eksik bilgilerin düzeltilmesini isteyebilirsiniz." />
                  <RightCard title="Silme Hakkı" desc="Hesabınızın ve tüm verilerinizin kalıcı olarak silinmesini talep edebilirsiniz." />
                  <RightCard title="İtiraz Hakkı" desc="Verilerinizin işlenmesine herhangi bir zamanda itiraz edebilirsiniz." />
                </div>

                <P className="mt-4">
                  Bu haklarınızı kullanmak için aşağıdaki iletişim kanallarından bize ulaşabilirsiniz.
                  Talepler en geç 30 gün içinde yanıtlanır.
                </P>
              </section>

              {/* İletişim */}
              <section id="contact" className="scroll-mt-24">
                <SectionTitle>İletişim</SectionTitle>
                <P>
                  Bu gizlilik politikası veya verileriniz hakkında sorularınız için:
                </P>
                <div className="mt-5 space-y-3">
                  <ContactCard icon="💬" label="Discord Sunucusu" value="Destek kanalı üzerinden bize ulaşabilirsiniz" />
                  <ContactCard icon="🌐" label="Web Sitesi" value="discoweb.tr iletişim sayfası" />
                </div>

                <div className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    Bu politika zaman zaman güncellenebilir. Önemli değişiklikler yapıldığında platform içi bildirim
                    ve/veya Discord sunucumuz üzerinden duyuru yapılır. Güncel politikayı bu sayfadan takip edebilirsiniz.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                DiscoWeb Gizlilik Politikası — Son güncelleme: {LAST_UPDATED}
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

function DataCategory({ title, description, children }: { title: string; description: string; children: string[] }) {
  return (
    <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <h3 className="text-[14px] font-semibold text-white/90 mb-1">{title}</h3>
      <p className="text-[12px] text-white/30 mb-3">{description}</p>
      <ul className="space-y-1.5">
        {children.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/55 leading-relaxed">
            <span className="mt-1 w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThirdPartyCard({ name, purpose }: { name: string; purpose: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <LuShare2 className="w-4 h-4 text-white/40" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-white/80">{name}</p>
        <p className="text-[12px] text-white/40 mt-0.5">{purpose}</p>
      </div>
    </div>
  );
}

function RightCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <h4 className="text-[13px] font-semibold text-white/80 mb-1">{title}</h4>
      <p className="text-[12px] text-white/40">{desc}</p>
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
