"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { LuShield, LuDatabase, LuEye, LuShare2, LuClock, LuLock, LuSettings, LuMessageCircle, LuChevronRight, LuArrowLeft } from 'react-icons/lu';

export default function PrivacyPage() {
  const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = t('privacy.page_title');

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
    { id: 'intro', label: t('privacy.nav_intro'), icon: LuShield },
    { id: 'about', label: t('privacy.nav_about'), icon: LuEye },
    { id: 'what', label: t('privacy.nav_what'), icon: LuDatabase },
    { id: 'how-we-use', label: t('privacy.nav_how'), icon: LuSettings },
    { id: 'sharing', label: t('privacy.nav_sharing'), icon: LuShare2 },
    { id: 'retention', label: t('privacy.nav_retention'), icon: LuClock },
    { id: 'protection', label: t('privacy.nav_protection'), icon: LuLock },
    { id: 'control', label: t('privacy.nav_control'), icon: LuSettings },
    { id: 'contact', label: t('privacy.nav_contact'), icon: LuMessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">{t('privacy.badge')}</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('privacy.back')}</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">{t('privacy.toc')}</p>
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
                <span className="text-[11px] font-semibold text-indigo-400 tracking-wide">{t('privacy.hero_badge')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                {t('privacy.title')}
              </h1>
              <p className="text-[15px] text-white/50 leading-relaxed mb-6">
                {t('privacy.intro')}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/30">
                <span>{t('privacy.last_updated_label', { date: t('privacy.date') })}</span>
              </div>
            </header>

            <div className="space-y-14">
              {/* Giriş */}
              <section id="intro" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_intro')}</SectionTitle>
                <P>
                  {t('privacy.intro_body')}
                </P>
                <InfoCard items={[t('privacy.tip_1'), t('privacy.tip_2'), t('privacy.tip_3'), t('privacy.tip_4')]} />
              </section>

              {/* Platform Hakkında */}
              <section id="about" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_about')}</SectionTitle>
                <P>
                  {t('privacy.about_body')}
                </P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('privacy.about_1'),
                    t('privacy.about_2'),
                    t('privacy.about_3'),
                    t('privacy.about_4'),
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
                <SectionTitle>{t('privacy.section_what')}</SectionTitle>
                <P>
                  {t('privacy.what_body')}
                </P>

                <DataCategory title={t('privacy.cat_discord_title')} description={t('privacy.cat_discord_desc')}>
                  {[t('privacy.cat_discord_1'), t('privacy.cat_discord_2'), t('privacy.cat_discord_3')]}
                </DataCategory>

                <DataCategory title={t('privacy.cat_activity_title')} description={t('privacy.cat_activity_desc')}>
                  {[t('privacy.cat_activity_1'), t('privacy.cat_activity_2'), t('privacy.cat_activity_3')]}
                </DataCategory>

                <DataCategory title={t('privacy.cat_usage_title')} description={t('privacy.cat_usage_desc')}>
                  {[t('privacy.cat_usage_1'), t('privacy.cat_usage_2'), t('privacy.cat_usage_3')]}
                </DataCategory>

                <div className="mt-5 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                  <p className="text-[13px] text-amber-300/80 leading-relaxed">
                    {t('privacy.important_note')}
                  </p>
                </div>
              </section>

              {/* Kullanım */}
              <section id="how-we-use" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_how')}</SectionTitle>
                <P>{t('privacy.how_body')}</P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('privacy.how_1'),
                    t('privacy.how_2'),
                    t('privacy.how_3'),
                    t('privacy.how_4'),
                    t('privacy.how_5'),
                    t('privacy.how_6'),
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
                <SectionTitle>{t('privacy.section_sharing')}</SectionTitle>
                <P>
                  {t('privacy.sharing_body')}
                </P>

                <div className="mt-5 space-y-3">
                  <ThirdPartyCard name="Discord API" purpose={t('privacy.tp_discord')} />
                  <ThirdPartyCard name="Supabase" purpose={t('privacy.tp_supabase')} />
                  <ThirdPartyCard name="Vercel" purpose={t('privacy.tp_vercel')} />
                </div>

                <div className="mt-5 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <p className="text-[13px] text-emerald-300/80 leading-relaxed">
                    {t('privacy.never_sell')}
                  </p>
                </div>
              </section>

              {/* Saklama Süresi */}
              <section id="retention" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_retention')}</SectionTitle>
                <P>{t('privacy.retention_body')}</P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('privacy.retention_1'),
                    t('privacy.retention_2'),
                    t('privacy.retention_3'),
                    t('privacy.retention_4'),
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <P className="mt-4">
                  {t('privacy.retention_delete')}
                </P>
              </section>

              {/* Güvenlik */}
              <section id="protection" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_protection')}</SectionTitle>
                <P>{t('privacy.protection_body')}</P>
                <ul className="space-y-2 mt-4">
                  {[
                    t('privacy.protection_1'),
                    t('privacy.protection_2'),
                    t('privacy.protection_3'),
                    t('privacy.protection_4'),
                    t('privacy.protection_5'),
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
                <SectionTitle>{t('privacy.section_control')}</SectionTitle>
                <P>{t('privacy.control_body')}</P>

                <div className="mt-5 grid gap-3">
                  <RightCard title={t('privacy.right_access_t')} desc={t('privacy.right_access_d')} />
                  <RightCard title={t('privacy.right_rect_t')} desc={t('privacy.right_rect_d')} />
                  <RightCard title={t('privacy.right_erase_t')} desc={t('privacy.right_erase_d')} />
                  <RightCard title={t('privacy.right_obj_t')} desc={t('privacy.right_obj_d')} />
                </div>

                <P className="mt-4">
                  {t('privacy.control_response')}
                </P>
              </section>

              {/* İletişim */}
              <section id="contact" className="scroll-mt-24">
                <SectionTitle>{t('privacy.section_contact')}</SectionTitle>
                <P>
                  {t('privacy.contact_body')}
                </P>
                <div className="mt-5 space-y-3">
                  <ContactCard icon="💬" label={t('privacy.contact_discord_label')} value={t('privacy.contact_discord_value')} />
                  <ContactCard icon="📧" label={t('privacy.contact_email_label')} value="destek@discoweb.com" />
                </div>

                <div className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    {t('privacy.contact_update_note')}
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                {t('privacy.footer', { date: t('privacy.date') })}
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
