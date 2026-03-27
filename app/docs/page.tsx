"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuBookOpen,
  LuShield,
  LuListChecks,
  LuChartBar,
  LuZap,
  LuCoins,
  LuInfo,
  LuArrowLeft,
  LuChevronRight,
  LuTriangleAlert,
} from "react-icons/lu";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    document.title = "Belgeler - DiscoWeb";

    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      let current = "overview";

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120) current = section.id;
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Yeni nav öğesi eklendi
  const NAV_ITEMS = [
    { id: "overview", label: "Genel Bakış", icon: LuBookOpen },
    { id: "copyright-notice", label: "Telif Hakkı Bildirimi", icon: LuInfo }, // YENİ
    { id: "policy-links", label: "Terimler & Gizlilik", icon: LuShield },
    { id: "economy", label: "Ekonomi Rehberi", icon: LuCoins },
    { id: "paths", label: "Geçiş Yolları", icon: LuArrowLeft },
    { id: "faq", label: "SSS", icon: LuListChecks },
    { id: "error-codes", label: "Hata Kodları", icon: LuTriangleAlert },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">
              DOKÜMANTASYON
            </span>
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
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">
              İçindekiler
            </p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "text-white/40 hover:text-white/70 hover:bg-white/[0.03] border border-transparent"
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

        {/* Main content */}
        <main className="flex-1 lg:ml-72 px-4 sm:px-10 py-8 sm:py-14">
          <article className="max-w-3xl mx-auto">
            <header className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                DiscoWeb Dokümantasyon Merkezi
              </h1>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                DiscoWeb dokümantasyon merkezi, platformumuzun amaçları, teknik mimarisi ve kullanıcı
                taahhütlerine yönelik kapsamlı bir rehber sunar. Misyonumuz, Discord sunucularına
                ölçeklenebilir ekonomi yönetimi, şeffaf yönetim süreçleri ve yasal uyumluluk sağlayarak
                sürdürülebilir dijital ekosistemler inşa etmektir.
                <br />
                <br />
                Bu belge; <strong className="text-white/70">Hizmet Koşulları</strong>, <strong className="text-white/70">Gizlilik Politikası</strong>, <strong className="text-white/70">Basit Ekonomi</strong> ve <strong className="text-white/70">Yüksek Ekonomi</strong> modüllerinin işleyişi ve kriterlerini içerir.
                Sol menü aracılığıyla ilgili başlıklara hızlıca erişebilir ve şirket standardına uygun kontrollü bir inceleme gerçekleştirebilirsiniz.
              </p>
            </header>

            <section id="overview" className="scroll-mt-24 mb-14">
              <SectionTitle>Genel Bakış</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                DiscoWeb, sunucu yönetiminden ekonomi sistemlerine, kurumsal politikaların
                uygulanmasından kullanıcı haklarının korunmasına kadar geniş bir yelpazede hizmet
                sunmaktadır. Bu dokümantasyon, platformumuzu kullanırken karşılaşabileceğiniz tüm
                yasal ve teknik sınırları, ekonomi mekanizmalarının işleyişini ve sıkça sorulan
                soruların yanıtlarını içermektedir. Aşağıda yer alan bağlantılar ve açıklamalar
                sayesinde, hem yeni başlayanlar hem de deneyimli kullanıcılar için rehber niteliğinde
                bir kaynak sunmayı amaçlıyoruz.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DocsCard
                  title="Hizmet Koşulları"
                  href="/terms"
                  description="Kullanıcıların uyması gereken kurallar, sunucu işletimi sorumlulukları, yasaklı eylemler ve hesap iptali süreçleri hakkında kapsamlı bilgi."
                  icon={<LuListChecks className="w-4 h-4" />}
                />
                <DocsCard
                  title="Gizlilik Politikası"
                  href="/privacy"
                  description="Toplanan kullanıcı verileri, saklama süreleri, üçüncü taraflarla paylaşım ilkeleri ve kişisel verilerinizi koruma haklarınız."
                  icon={<LuShield className="w-4 h-4" />}
                />
                <DocsCard
                  title="Basit Ekonomi"
                  href="/economy/basic"
                  description="Yeni sunucular için ön tanımlı olarak gelen, günlük aktivite ve mağaza katına dayalı temel ekonomi modeli. Transfer, çekiliş ve günlük bonusları kapsar."
                  icon={<LuCoins className="w-4 h-4" />}
                />
                <DocsCard
                  title="Yüksek Ekonomi"
                  href="/economy/advanced"
                  description="İleri düzey kullanıcılar için tasarlanmış; hazne sistemi, yakma mekaniği, referral programı, halka arz (IPO) ve temettü dağıtımı içeren gelişmiş ekonomi modeli."
                  icon={<LuZap className="w-4 h-4" />}
                />
                <DocsCard
                  title="Hata Kodları"
                  href="/docs/errors"
                  description="Activity kullanırken aldığın DW-XXXX hata kodlarının açıklamaları, olası nedenleri ve çözüm adımları."
                  icon={<LuTriangleAlert className="w-4 h-4" />}
                />
              </div>
            </section>

            {/* YENİ BÖLÜM: Telif Hakkı Bildirimi */}
            <section id="copyright-notice" className="scroll-mt-24 mb-14">
              <SectionTitle>Telif Hakkı Bildirimi</SectionTitle>
              <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <p className="text-[14px] text-white/70 leading-relaxed">
                  Bu proje, <strong className="text-indigo-300">DiscoWeb</strong>, tamamen kişisel gelişim ve açık kaynak kodlu öğrenme süreçlerini desteklemek amacıyla oluşturulmuştur. Proje kapsamında kullanılan görseller, karakter tasarımları, animasyonlar ve diğer medya öğelerinin bir kısmı, çeşitli anime yapımlarına ait telifli materyaller içerebilmektedir.
                </p>
                <ul className="list-disc list-inside text-[14px] text-white/60 space-y-2 pl-2">
                  <li><strong className="text-white/80">Ticari Amaç Yoktur:</strong> Bu proje, herhangi bir ticari faaliyet, reklam geliri veya doğrudan maddi kazanç elde etmek için tasarlanmamıştır. Tamamen hayranlık duyulan eserleri tanıtma, toplulukla paylaşma ve teknik becerileri geliştirme amacı taşır.</li>
                  <li><strong className="text-white/80">Fan Eseri Niteliği:</strong> Telifli anime içerikleri, yalnızca sanatsal beğeniyi paylaşmak ve “sen de izle” teşvikinde bulunmak için, bir fan eseri kapsamında kullanılmaktadır. Hiçbir şekilde orijinal eser sahiplerinin haklarına zarar verme, onların itibarını zedeleyecek veya eserleri taklit edecek bir kullanım söz konusu değildir.</li>
                  <li><strong className="text-white/80">Yasal Uyum ve İçerik Kaldırma:</strong> Eğer bir içerik sahibi, hak sahibi veya temsilcisi, kullanılan herhangi bir materyalin hak ihlali oluşturduğunu düşünüyorsa, derhal iletişime geçildiğinde söz konusu içerik en kısa sürede projeden kaldırılacaktır. İletişim için <a href="mailto:destek@discoweb.com" className="text-indigo-300 hover:underline">destek@discoweb.com</a> adresini kullanabilirsiniz.</li>
                  <li><strong className="text-white/80">Açık Kaynak ve Öğrenme:</strong> Projenin temel amacı, modern web teknolojilerini (Next.js, Tailwind CSS vb.) öğrenmek, toplulukla deneyim paylaşımında bulunmak ve katkıya açık bir ekosistem oluşturmaktır. Telifli materyaller, bu eğitim sürecinin bir parçası olarak ve popüler kültüre duyulan ilgiyi yansıtmak amacıyla yer almaktadır.</li>
                </ul>
                <p className="text-[12px] text-white/40 italic pt-2">
                  Bu projeyi incelerken, lütfen yukarıda belirtilen niyet ve sınırlamalar çerçevesinde değerlendiriniz. Saygılarımızla.
                </p>
              </div>
            </section>

            <section id="policy-links" className="scroll-mt-24 mb-14">
              <SectionTitle>Terimler & Gizlilik</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                DiscoWeb hizmetlerinden yararlanırken hem sizin hem de diğer kullanıcıların haklarının
                korunması, şeffaf bir iletişim ortamının sağlanması önceliğimizdir. Aşağıdaki
                bağlantılar aracılığıyla hizmet koşullarımızı ve gizlilik politikamızı detaylıca
                inceleyebilir, herhangi bir sorunuz olduğunda iletişim kanallarımızdan bize
                ulaşabilirsiniz.
              </p>

              <ul className="space-y-3">
                <li>
                  <LinkCard
                    title="Hizmet Koşulları"
                    href="/terms"
                    description="DiscoWeb platformunun kullanımına ilişkin hak, yükümlülük ve sorumluluklar; ihlal durumunda uygulanacak yaptırımlar ile hesap askıya alma ve silme prosedürleri."
                  />
                </li>
                <li>
                  <LinkCard
                    title="Gizlilik Politikası"
                    href="/privacy"
                    description="Kişisel verilerin toplanma amacı, hangi verilerin işlendiği, üçüncü taraflarla paylaşım koşulları, çerez kullanımı ve veri sahibi haklarınız (düzeltme, silme, itiraz)."
                  />
                </li>
              </ul>
            </section>

            <section id="economy" className="scroll-mt-24 mb-14">
              <SectionTitle>Ekonomi Rehberi</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                Sunucu deneyiminizi zenginleştirmek için iki farklı ekonomi modu sunuyoruz.
                Hangi modun ihtiyaçlarınıza daha uygun olduğunu değerlendirebilir, geçiş
                yapmadan önce tüm detayları inceleyebilirsiniz.
              </p>

              <div className="space-y-4">
                <InfoBox title="Basit Ekonomi">
                  Basit Ekonomi modu, yeni kurulan sunucular için varsayılan olarak aktif edilir.
                  Kullanıcılar günlük aktiflik, mesaj gönderme ve belirli görevleri tamamlayarak
                  “Papel” kazanır. Kazanılan Papel’ler, sunucu mağazasında çeşitli ürünler, roller
                  veya özel ayrıcalıklar için harcanabilir. Ayrıca kullanıcılar arası transfer,
                  çekiliş sistemleri ve temel liderlik tabloları da bu modda etkindir. Basit Ekonomi,
                  yönetimi kolay, herkesin anlayabileceği sade bir yapı sunar.
                  <Link
                    href="/economy/basic"
                    className="text-indigo-300 hover:text-indigo-200 underline ml-1"
                  >
                    Detayları görüntüle
                  </Link>
                </InfoBox>
                <InfoBox title="Yüksek Ekonomi">
                  Yüksek Ekonomi, daha deneyimli sunucu yöneticileri ve büyük topluluklar için
                  tasarlanmıştır. Bu modda, sunucu haznesi (merkezi bütçe), ekonomiden otomatik
                  yakma sistemi, referral (tavsiye) programı, halka arz (IPO) ile hisse dağıtımı ve
                  temettü gelirleri bulunur. Ekonomi üzerinde gelişmiş denetim araçları, enflasyon
                  kontrol mekanizmaları ve gerçek zamanlı borsa simülasyonu yer alır. Yüksek Ekonomi’ye
                  geçiş kalıcıdır ve tüm bakiye, envanter verileri sıfırlanır; bu nedenle geçiş
                  öncesinde detaylı planlama yapmanızı öneririz.
                  <Link
                    href="/economy/advanced"
                    className="text-indigo-300 hover:text-indigo-200 underline ml-1"
                  >
                    Detayları görüntüle
                  </Link>
                </InfoBox>
              </div>
            </section>

            <section id="paths" className="scroll-mt-24 mb-14">
              <SectionTitle>Geçiş Yolları</SectionTitle>
              <ol className="list-decimal list-inside text-[14px] text-white/60 space-y-2">
                <li>
                  Sunucunuzu kurarken <strong>Basit Ekonomi</strong> modunu seçin. Bu mod, sunucunun
                  ilk günlerinde kullanıcıların sistemi tanıması ve temel ekonomi alışkanlıklarını
                  edinmesi için idealdir.
                </li>
                <li>
                  Sunucunuz en az 3 ay boyunca aktif ve düzenli kullanıcı kitlesine sahip olduktan
                  sonra, yönetim paneli üzerinden <strong>Yüksek Ekonomi</strong> başvurusu yapın.
                  Başvuruda sunucu aktiflik istatistikleri ve beklenen kullanıcı sayısı gibi
                  bilgiler talep edilir.
                </li>
                <li>
                  Başvurunuz değerlendirildikten ve onaylandıktan sonra geçiş süreci başlatılır.
                  Bu sırada tüm kullanıcı bakiyeleri sıfırlanır, hazne sistemi devreye girer,
                  referral ve IPO altyapısı aktifleştirilir. Geçiş tamamlandığında bir bildirim
                  alırsınız ve yeni ekonomi sistemini yönetmeye başlayabilirsiniz.
                </li>
              </ol>
            </section>

            <section id="faq" className="scroll-mt-24 mb-14">
              <SectionTitle>Sıkça Sorulan Sorular</SectionTitle>
              <FaqItem
                question="Hizmet Koşulları ve Gizlilik Politikası hangi yasal dayanaklara sahiptir?"
                answer="DiscoWeb, sunduğu hizmetlerin hukuka uygunluğunu sağlamak amacıyla 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuata uygun şekilde hareket eder. Hizmet koşulları, kullanıcıların platformu güvenli ve adil bir şekilde kullanmasını garanti altına almak için oluşturulmuştur. Detaylı bilgi için ilgili sayfaları inceleyebilir veya destek ekibimize sorularınızı iletebilirsiniz."
              />
              <FaqItem
                question="Verilerimin silinmesini nasıl talep edebilirim?"
                answer="Kişisel verilerinizin silinmesi talebinizi, platform üzerinden veya resmi iletişim adresimizden bize iletebilirsiniz. Talebiniz, KVKK’nın 11. maddesi uyarınca en geç 30 gün içinde sonuçlandırılır. Talebin işleme alınabilmesi için kimlik doğrulama adımları gerekmektedir. Detaylı prosedür için Gizlilik Politikası sayfamızdaki 'Veri Sahibi Hakları' bölümünü ziyaret edin."
              />
              <FaqItem
                question="Yüksek Ekonomi'ye geçtikten sonra eski sisteme geri dönebilir miyim?"
                answer="Hayır, Yüksek Ekonomi'ye geçiş kalıcıdır. Bu nedenle geçiş kararı vermeden önce her iki modun özelliklerini, getirilerini ve olası etkilerini dikkatlice değerlendirmeniz önemlidir. Geçiş sonrasında tüm kullanıcı verileri sıfırlanacağından, yedekleme ve duyuru süreçlerini eksiksiz tamamlamanızı tavsiye ederiz."
              />
            </section>

            <section id="error-codes" className="scroll-mt-24 mb-14">
              <SectionTitle>Hata Kodları</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                Activity kullanırken karşılaştığın <strong className="text-white/70">DW-XXXX</strong> formatındaki hata kodlarının ne anlama geldiğini, neden oluştuğunu ve nasıl çözebileceğini ayrıntılı olarak öğrenebilirsin.
              </p>
              <Link
                href="/docs/errors"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <LuTriangleAlert className="w-4 h-4" />
                Hata Kodları Rehberini Aç
                <LuChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </section>

            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                DiscoWeb Dokümantasyon Sayfası — Son güncelleme: 24 Mart 2026
                <br />
                Tüm hakları saklıdır. İçerikler izinsiz kopyalanamaz veya dağıtılamaz.
              </p>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}

// Yardımcı bileşenler (değişmedi)
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
      <LuChartBar className="w-5 h-5 text-indigo-300" />
      {children}
    </h2>
  );
}

function DocsCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block p-5 rounded-xl border border-white/[0.08] bg-white/[0.015] hover:border-indigo-400/30 hover:bg-indigo-500/10 transition-all"
    >
      <div className="flex items-center gap-3 mb-3 text-indigo-300">
        {icon}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </Link>
  );
}

function LinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-xl border border-white/[0.08] bg-white/[0.015] hover:border-emerald-400/30 hover:bg-emerald-500/10 transition-all"
    >
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </Link>
  );
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.015]">
      <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
      <p className="text-white/60 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.015] p-4">
      <p className="text-sm font-semibold text-white">{question}</p>
      <p className="text-white/60 text-sm mt-1">{answer}</p>
    </div>
  );
}