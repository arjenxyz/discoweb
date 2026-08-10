"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
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
  const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = t('terms.page_title');

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
    { id: 'intro', label: t('terms.nav_intro'), icon: LuBookOpen },
    { id: 'scope', label: t('terms.nav_scope'), icon: LuShield },
    { id: 'use', label: t('terms.nav_use'), icon: LuListChecks },
    { id: 'responsibilities', label: t('terms.nav_responsibilities'), icon: LuTriangleAlert },
    { id: 'termination', label: t('terms.nav_termination'), icon: LuClipboardCheck },
    { id: 'changes', label: t('terms.nav_changes'), icon: LuLock },
    { id: 'contact', label: t('terms.nav_contact'), icon: LuMessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">{t('terms.badge')}</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('terms.back')}</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">{t('terms.toc')}</p>
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
                <span className="text-[11px] font-semibold text-indigo-400 tracking-wide">{t('terms.badge')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                {t('terms.title')}
              </h1>
              <p className="text-[15px] text-white/50 leading-relaxed mb-6">
                {t('terms.intro')}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/30">
                <span>{t('terms.last_updated_label', { date: t('terms.date') })}</span>
              </div>
            </header>

            <div className="space-y-14">
              {/* Giriş */}
              <section id="intro" className="scroll-mt-24">
                <SectionTitle>{t('terms.section_intro')}</SectionTitle>
                <P>
                  {t('terms.intro_body')}
                </P>
                <InfoCard items={[t('terms.tip_1'), t('terms.tip_2'), t('terms.tip_3'), t('terms.tip_4')]} />
              </section>

              {/* Kapsam */}
              <section id="scope" className="scroll-mt-24">
                <SectionTitle>{t('terms.section_scope')}</SectionTitle>
                <P>
                  {t('terms.scope_1')}
                </P>
                <P>
                  {t('terms.scope_2')}
                </P>
              </section>

              {/* Kullanım Şartları */}
              <section id="use" className="scroll-mt-24">
                <SectionTitle>{t('terms.section_use')}</SectionTitle>
                <ul className="space-y-2 mt-4">
                  {[
                    t('terms.use_1'),
                    t('terms.use_2'),
                    t('terms.use_3'),
                    t('terms.use_4'),
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
                <SectionTitle>{t('terms.section_responsibilities')}</SectionTitle>
                <P>
                  {t('terms.resp_body')}
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('terms.resp_1'),
                    t('terms.resp_2'),
                    t('terms.resp_3'),
                    t('terms.resp_4'),
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
                <SectionTitle>{t('terms.section_termination')}</SectionTitle>
                <P>
                  {t('terms.term_body')}
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('terms.term_1'),
                    t('terms.term_2'),
                    t('terms.term_3'),
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <P className="mt-4">
                  {t('terms.term_privacy')}
                </P>
              </section>

              {/* Değişiklikler */}
              <section id="changes" className="scroll-mt-24">
                <SectionTitle>{t('terms.section_changes')}</SectionTitle>
                <P>
                  {t('terms.changes_1')}
                </P>
                <P>
                  {t('terms.changes_2')}
                </P>
              </section>

              {/* İletişim */}
              <section id="contact" className="scroll-mt-24">
                <SectionTitle>{t('terms.section_contact')}</SectionTitle>
                <P>
                  {t('terms.contact_body')}
                </P>
                <div className="mt-5 space-y-3">
                  <ContactCard icon="💬" label={t('terms.contact_discord_label')} value={t('terms.contact_discord_value')} />
                  <ContactCard icon="📧" label={t('terms.contact_email_label')} value="destek@discoweb.com" />
                </div>

                <div className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    {t('terms.contact_note')}
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                {t('terms.footer', { date: t('terms.date') })}
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
