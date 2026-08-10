"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import {
  LuArrowLeft, LuChevronRight, LuCoins, LuShoppingBag, LuGift,
  LuArrowRightLeft, LuUsers, LuZap, LuShield, LuInfo,
} from 'react-icons/lu';

export default function BasicEconomyPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    document.title = t('economy.page_title');

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
    { id: 'intro',     label: t('economy.nav_intro'),             icon: LuInfo },
    { id: 'earning',   label: t('economy.nav_earning'),     icon: LuCoins },
    { id: 'store',     label: t('economy.nav_store'),             icon: LuShoppingBag },
    { id: 'raffles',   label: t('economy.nav_raffles'),         icon: LuGift },
    { id: 'transfer',  label: t('economy.nav_transfer'),           icon: LuArrowRightLeft },
    { id: 'admin',     label: t('economy.nav_admin'),     icon: LuUsers },
    { id: 'limits',    label: t('economy.nav_limits'),       icon: LuShield },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/gif/cat.gif" alt="DiscoWeb" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-base text-white">DiscoWeb</span>
            <span className="text-[11px] text-white/30 font-medium tracking-wide hidden sm:inline">{t('economy.badge')}</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('economy.back')}</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto mt-[60px]">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen fixed top-[60px] left-0 lg:left-auto z-40 border-r border-white/[0.04]">
          <nav className="p-6 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4 px-3">{t('economy.toc')}</p>
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

          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-72 px-4 sm:px-8 lg:px-16 py-12 max-w-3xl">

          {/* Hero */}
          <section id="intro" className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide mb-6">
              <LuCoins className="w-3.5 h-3.5" />
              {t('economy.hero_badge')}
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {t('economy.title')}
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-6">
              {t('economy.intro')}
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[13px] text-emerald-300/80">
              {t('economy.suitable')}
            </div>
          </section>

          {/* Papel Kazanımı */}
          <section id="earning" className="mb-16">
            <h2 className="text-2xl font-bold mb-2">{t('economy.earning_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.earning_sub')}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: LuCoins, title: t('economy.earn_msg_t'), desc: t('economy.earn_msg_d') },
                { icon: LuCoins, title: t('economy.earn_voice_t'), desc: t('economy.earn_voice_d') },
                { icon: LuZap, title: t('economy.earn_halving_t'), desc: t('economy.earn_halving_d') },
                { icon: LuShield, title: t('economy.earn_spam_t'), desc: t('economy.earn_spam_d') },
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
            <h2 className="text-2xl font-bold mb-2">{t('economy.store_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.store_sub')}</p>
            <ul className="space-y-3 text-[14px] text-white/60">
              {[
                t('economy.store_1'),
                t('economy.store_2'),
                t('economy.store_3'),
                t('economy.store_4'),
                t('economy.store_5'),
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
            <h2 className="text-2xl font-bold mb-2">{t('economy.raffles_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.raffles_sub')}</p>
            <ul className="space-y-3 text-[14px] text-white/60">
              {[
                t('economy.raffles_1'),
                t('economy.raffles_2'),
                t('economy.raffles_3'),
                t('economy.raffles_4'),
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
            <h2 className="text-2xl font-bold mb-2">{t('economy.transfer_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.transfer_sub')}</p>
            <div className="space-y-3 text-[14px] text-white/60">
              {[
                { label: t('economy.transfer_tax_t'), desc: t('economy.transfer_tax_d') },
                { label: t('economy.transfer_limit_t'), desc: t('economy.transfer_limit_d') },
                { label: t('economy.transfer_cross_t'), desc: t('economy.transfer_cross_d') },
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
            <h2 className="text-2xl font-bold mb-2">{t('economy.admin_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.admin_sub')}</p>
            <ul className="space-y-2 text-[14px] text-white/60">
              {[
                t('economy.admin_1'),
                t('economy.admin_2'),
                t('economy.admin_3'),
                t('economy.admin_4'),
                t('economy.admin_5'),
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
            <h2 className="text-2xl font-bold mb-2">{t('economy.limits_title')}</h2>
            <p className="text-white/40 text-sm mb-6">{t('economy.limits_sub')}</p>
            <div className="space-y-2">
              {[
                t('economy.limits_1'),
                t('economy.limits_2'),
                t('economy.limits_3'),
                t('economy.limits_4'),
                t('economy.limits_5'),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-white/40">
                  <span className="text-red-400/70 text-lg leading-none">×</span>
                  {item}
                </div>
              ))}
            </div>
          </section>


        </main>
      </div>
    </div>
  );
}
