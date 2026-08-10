"use client";

import { useEffect, useState } from "react";
import { useTranslation } from '@/lib/i18nContext';
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


function tList(t: (k: string, p?: Record<string, string | number>) => string, prefix: string, kind: 'cause' | 'solution', max = 8): string[] {
  const out: string[] = [];
  for (let i = 1; i <= max; i++) {
    const key = `${prefix}.${kind}${i}`;
    const val = t(key);
    if (val === key) break;
    out.push(val);
  }
  return out;
}

function buildCategories(t: (k: string, p?: Record<string, string | number>) => string): ErrorCategory[] {
  const code = (id: string) => ({
    code: `DW-${id}`,
    title: t(`docs.errors.code.${id}.title`),
    message: t(`docs.errors.code.${id}.message`),
    causes: tList(t, `docs.errors.code.${id}`, 'cause'),
    solutions: tList(t, `docs.errors.code.${id}`, 'solution'),
  });

  return [
    {
      id: "auth",
      label: t('docs.errors.cat.auth.label'),
      prefix: "DW-1xxx",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      icon: <LuShieldAlert className="w-4 h-4" />,
      description: t('docs.errors.cat.auth.description'),
      errors: ["1001","1002","1003","1004","1005"].map(code),
    },
    {
      id: "server",
      label: t('docs.errors.cat.server.label'),
      prefix: "DW-2xxx",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      icon: <LuTriangleAlert className="w-4 h-4" />,
      description: t('docs.errors.cat.server.description'),
      errors: ["2001","2002","2003","2004","2005","2006"].map(code),
    },
    {
      id: "user",
      label: t('docs.errors.cat.user.label'),
      prefix: "DW-3xxx",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      icon: <LuUser className="w-4 h-4" />,
      description: t('docs.errors.cat.user.description'),
      errors: ["3001","3002","3003","3004","3005"].map(code),
    },
    {
      id: "economy",
      label: t('docs.errors.cat.economy.label'),
      prefix: "DW-4xxx",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      icon: <LuCoins className="w-4 h-4" />,
      description: t('docs.errors.cat.economy.description'),
      errors: ["4002","4003"].map(code),
    },
    {
      id: "network",
      label: t('docs.errors.cat.network.label'),
      prefix: "DW-5xxx",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      icon: <LuWifi className="w-4 h-4" />,
      description: t('docs.errors.cat.network.description'),
      errors: ["5001","5002","5003"].map(code),
    },
    {
      id: "unknown",
      label: t('docs.errors.cat.unknown.label'),
      prefix: "DW-9xxx",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      icon: <LuBug className="w-4 h-4" />,
      description: t('docs.errors.cat.unknown.description'),
      errors: ["9001","9002","9003"].map(code),
    },
  ];
}

export default function ErrorCodesPage() {
  const { t, language } = useTranslation();
  const CATEGORIES = buildCategories(t);
  const [activeSection, setActiveSection] = useState("auth");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    document.title = t('docs.errors.page_title');

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
              {t('docs.errors.badge')}
            </span>
          </div>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('docs.errors.back_docs')}</span>
          </Link>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">
              {t('docs.errors.categories')}
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
                {t('docs.errors.title')}
              </h1>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-6">
                {t('docs.errors.intro')}
              </p>

              {/* Search */}
              <div className="relative">
                <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('docs.errors.search_ph')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition"
                />
              </div>
            </header>

            {/* Quick reference table */}
            {!query && (
              <section className="mb-12">
                <h2 className="text-lg font-bold text-white mb-4">{t('docs.errors.quick_ref')}</h2>
                <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider">{t('docs.errors.col_code')}</th>
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider">{t('docs.errors.col_title')}</th>
                        <th className="text-left px-4 py-3 text-white/40 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">{t('docs.errors.col_category')}</th>
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
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2">{t('docs.errors.causes')}</p>
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
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2">{t('docs.errors.solutions')}</p>
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
                <h2 className="text-base font-bold text-white mb-2">{t('docs.errors.report_title')}</h2>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  {t('docs.errors.report_body_before')}<strong className="text-white/70">{t('docs.errors.report_strong')}</strong>{t('docs.errors.report_body_after')}
                </p>
              </section>
            )}

            <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/25">
                {t('docs.errors.footer', { date: new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : language, { year: 'numeric', month: 'long', day: 'numeric' }) })}
                <br />
                {t('docs.errors.rights')}
              </p>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}
