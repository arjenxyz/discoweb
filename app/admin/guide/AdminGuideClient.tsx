'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LuArrowUpRight,
  LuBookOpen,
  LuChevronDown,
  LuCircleCheck,
  LuCompass,
  LuCircleHelp,
  LuLightbulb,
  LuRocket,
  LuSearch,
  LuSparkles,
} from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import {
  FAQ_ITEMS,
  GUIDE_SECTIONS,
  QUICK_LINKS,
  ROADMAP_STEPS,
  type GuideSection,
} from './guideData';

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-indigo-300">
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-white/45">{subtitle}</p>
      </div>
    </div>
  );
}

function FaqAccordion({
  id,
  question,
  answer,
  open,
  onToggle,
}: {
  id: string;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] transition hover:border-white/15">
      <button
        type="button"
        id={`faq-${id}`}
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white">{question}</span>
        <LuChevronDown
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-white/60">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  index,
  t,
}: {
  section: GuideSection;
  index: number;
  t: (key: string) => string;
}) {
  const Icon = section.icon;
  return (
    <article
      id={`guide-${section.id}`}
      className="group relative scroll-mt-28 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] transition hover:border-white/15"
    >
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-3xl ${section.glow}`} />
      <div className="relative p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 ${section.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1 text-xl font-bold text-white">{t(section.titleKey)}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{t(section.descKey)}</p>
            </div>
          </div>
          <Link
            href={section.href}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-white"
          >
            {t('admin.guide.open_page')}
            <LuArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 rounded-xl border border-white/5 bg-black/20 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
            <LuLightbulb className="h-3.5 w-3.5 text-amber-400" />
            {t('admin.guide.tips_label')}
          </p>
          <ul className="space-y-2.5">
            {section.tipKeys.map((tipKey) => (
              <li key={tipKey} className="flex gap-3 text-sm text-white/65">
                <LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
                <span className="leading-relaxed">{t(tipKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default function AdminGuideClient() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.filter((section) => {
      const haystack = [t(section.titleKey), t(section.descKey), ...section.tipKeys.map((key) => t(key))]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, t]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c10]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>

        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
            <LuBookOpen className="h-3.5 w-3.5" />
            {t('admin.guide.eyebrow')}
          </div>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {t('admin.guide.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            {t('admin.guide.subtitle')}
          </p>

          <div className="mt-8 max-w-xl">
            <div className="relative">
              <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('admin.guide.search_placeholder')}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            {[
              { label: t('admin.guide.stat_modules'), value: String(GUIDE_SECTIONS.length) },
              { label: t('admin.guide.stat_steps'), value: String(ROADMAP_STEPS.length) },
              { label: t('admin.guide.stat_faq'), value: String(FAQ_ITEMS.length) },
            ].map((stat) => (
              <GuideStat key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={<LuRocket className="h-4 w-4" />}
          title={t('admin.guide.roadmap_title')}
          subtitle={t('admin.guide.roadmap_subtitle')}
        />
        <div className="relative mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-0 px-1 lg:min-w-0 lg:grid lg:grid-cols-5">
            {ROADMAP_STEPS.map((step, index) => (
              <div key={step.id} className="relative flex w-56 flex-col px-3 lg:w-auto">
                {index < ROADMAP_STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+20px)] top-5 hidden h-px w-[calc(100%-40px)] bg-gradient-to-r from-indigo-500/40 to-transparent lg:block" />
                )}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-300">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-white">{t(step.titleKey)}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/45">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={<LuSparkles className="h-4 w-4" />}
          title={t('admin.guide.quick_title')}
          subtitle={t('admin.guide.quick_subtitle')}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1116] px-4 py-3.5 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/60 transition group-hover:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-white/70 transition group-hover:text-white">
                  {t(link.labelKey)}
                </span>
                <LuArrowUpRight className="ml-auto h-4 w-4 text-white/20 transition group-hover:text-white/50" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3 rounded-2xl border border-white/10 bg-[#0f1116]/80 p-4 backdrop-blur-xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              <LuCompass className="h-3.5 w-3.5" />
              {t('admin.guide.toc_title')}
            </p>
            <nav className="space-y-0.5">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollTo(`guide-${section.id}`)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${section.accent}`} />
                    <span className="truncate">{t(section.titleKey)}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <LuSearch className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-4 text-sm text-white/50">{t('admin.guide.no_results')}</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200"
              >
                {t('admin.guide.clear_search')}
              </button>
            </div>
          ) : (
            filteredSections.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} t={t} />
            ))
          )}
        </div>
      </div>

      <section>
        <SectionHeader
          icon={<LuCircleHelp className="h-4 w-4" />}
          title={t('admin.guide.faq_title')}
          subtitle={t('admin.guide.faq_subtitle')}
        />
        <GuideFaqList t={t} openFaq={openFaq} setOpenFaq={setOpenFaq} />
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/15 via-[#0f1116] to-purple-600/10 p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">{t('admin.guide.cta_title')}</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">{t('admin.guide.cta_desc')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              {t('admin.guide.cta_settings')}
              <LuArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {t('admin.guide.cta_dashboard')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function GuideStat({ stat }: { stat: { label: string; value: string } }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-indigo-300">
        {stat.value}
      </span>
      <span className="text-white/45">{stat.label}</span>
    </div>
  );
}

function GuideFaqList({
  t,
  openFaq,
  setOpenFaq,
}: {
  t: (key: string) => string;
  openFaq: string | null;
  setOpenFaq: (id: string | null) => void;
}) {
  return (
    <div className="mt-5 space-y-2">
      {FAQ_ITEMS.map((item) => (
        <FaqAccordion
          key={item.id}
          id={item.id}
          question={t(item.qKey)}
          answer={t(item.aKey)}
          open={openFaq === item.id}
          onToggle={() => setOpenFaq(openFaq === item.id ? null : item.id)}
        />
      ))}
    </div>
  );
}
