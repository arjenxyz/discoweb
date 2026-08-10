"use client";

import { useEffect, useState } from "react";
import { useTranslation } from '@/lib/i18nContext';
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
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    document.title = t('docs.page_title');

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
    { id: "overview", label: t('docs.nav_overview'), icon: LuBookOpen },
    { id: "copyright-notice", label: t('docs.nav_copyright'), icon: LuInfo },
    { id: "policy-links", label: t('docs.nav_policy'), icon: LuShield },
    { id: "economy", label: t('docs.nav_economy'), icon: LuCoins },
    { id: "paths", label: t('docs.nav_paths'), icon: LuArrowLeft },
    { id: "faq", label: t('docs.nav_faq'), icon: LuListChecks },
    { id: "error-codes", label: t('docs.nav_errors'), icon: LuTriangleAlert },
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
              {t('docs.badge')}
            </span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('docs.back')}</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">
              {t('docs.toc')}
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
                {t('docs.hero_title')}
              </h1>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                {t('docs.hero_p1')}
                <br />
                <br />
                {t('docs.hero_p2_before')}<strong className="text-white/70">{t('docs.hero_terms')}</strong>{t('docs.hero_p2_mid')}<strong className="text-white/70">{t('docs.hero_privacy')}</strong>{t('docs.hero_p2_and')}<strong className="text-white/70">{t('docs.hero_economy')}</strong>{t('docs.hero_p2_after')}
              </p>
            </header>

            <section id="overview" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.overview_title')}</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                {t('docs.overview_body')}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DocsCard
                  title={t('docs.card_terms_t')}
                  href="/terms"
                  description={t('docs.card_terms_d')}
                  icon={<LuListChecks className="w-4 h-4" />}
                />
                <DocsCard
                  title={t('docs.card_privacy_t')}
                  href="/privacy"
                  description={t('docs.card_privacy_d')}
                  icon={<LuShield className="w-4 h-4" />}
                />
                <DocsCard
                  title={t('docs.card_economy_t')}
                  href="/economy/basic"
                  description={t('docs.card_economy_d')}
                  icon={<LuCoins className="w-4 h-4" />}
                />
                <DocsCard
                  title={t('docs.card_errors_t')}
                  href="/docs/errors"
                  description={t('docs.card_errors_d')}
                  icon={<LuTriangleAlert className="w-4 h-4" />}
                />
              </div>
            </section>

            {/* YENİ BÖLÜM: Telif Hakkı Bildirimi */}
            <section id="copyright-notice" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.copyright_title')}</SectionTitle>
              <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <p className="text-[14px] text-white/70 leading-relaxed">
                  {t('docs.copyright_intro')}
                </p>
                <ul className="list-disc list-inside text-[14px] text-white/60 space-y-2 pl-2">
                  <li><strong className="text-white/80">{t('docs.copyright_commercial_t')}</strong>{t('docs.copyright_commercial')}</li>
                  <li><strong className="text-white/80">{t('docs.copyright_fan_t')}</strong>{t('docs.copyright_fan')}</li>
                  <li><strong className="text-white/80">{t('docs.copyright_legal_t')}</strong>{t('docs.copyright_legal')}</li>
                  <li><strong className="text-white/80">{t('docs.copyright_oss_t')}</strong>{t('docs.copyright_oss')}</li>
                </ul>
                <p className="text-[12px] text-white/40 italic pt-2">
                  {t('docs.copyright_footer')}
                </p>
              </div>
            </section>

            <section id="policy-links" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.policy_title')}</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                {t('docs.policy_body')}
              </p>

              <ul className="space-y-3">
                <li>
                  <LinkCard
                    title={t('docs.card_terms_t')}
                    href="/terms"
                    description={t('docs.policy_terms_d')}
                  />
                </li>
                <li>
                  <LinkCard
                    title={t('docs.card_privacy_t')}
                    href="/privacy"
                    description={t('docs.policy_privacy_d')}
                  />
                </li>
              </ul>
            </section>

            <section id="economy" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.economy_title')}</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                {t('docs.economy_body')}
              </p>

              <div className="space-y-4">
                <InfoBox title={t('docs.economy_box_title')}>
                  {t('docs.economy_box_body')}
                  <Link
                    href="/economy/basic"
                    className="text-indigo-300 hover:text-indigo-200 underline ml-1"
                  >
                    {t('docs.economy_details')}
                  </Link>
                </InfoBox>
              </div>
            </section>

            <section id="paths" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.paths_title')}</SectionTitle>
              <ol className="list-decimal list-inside text-[14px] text-white/60 space-y-2">
                <li>{t('docs.paths_1')}</li>
                <li>{t('docs.paths_2')}</li>
              </ol>
            </section>

            <section id="faq" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.faq_title')}</SectionTitle>
              <FaqItem
                question={t('docs.faq_q1')}
                answer={t('docs.faq_a1')}
              />
              <FaqItem
                question={t('docs.faq_q2')}
                answer={t('docs.faq_a2')}
              />
            </section>

            <section id="error-codes" className="scroll-mt-24 mb-14">
              <SectionTitle>{t('docs.errors_title')}</SectionTitle>
              <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                {t('docs.errors_body')}
              </p>
              <Link
                href="/docs/errors"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <LuTriangleAlert className="w-4 h-4" />
                {t('docs.errors_cta')}
                <LuChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </section>

            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                {t('docs.footer_line1')}
                <br />
                {t('docs.footer_line2')}
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