'use client';

import { useState, useEffect, useRef } from 'react';
import { LuShield, LuCode, LuLayoutDashboard, LuChevronDown } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';

export type PanelType = 'admin' | 'developer' | 'dashboard';

type PanelSwitcherProps = {
  currentPanel: PanelType;
  availablePanels: PanelType[];
};

export default function PanelSwitcher({ currentPanel, availablePanels }: PanelSwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const panelConfig: Record<PanelType, { label: string; shortLabel: string; href: string; icon: React.ReactNode; color: string }> = {
    admin: {
      label: t('panel_switcher.admin'),
      shortLabel: t('panel_switcher.admin_short'),
      href: '/admin',
      icon: <LuShield className="h-3.5 w-3.5" />,
      color: 'text-[#5865F2]',
    },
    developer: {
      label: t('panel_switcher.developer'),
      shortLabel: t('panel_switcher.developer_short'),
      href: '/developer',
      icon: <LuCode className="h-3.5 w-3.5" />,
      color: 'text-emerald-400',
    },
    dashboard: {
      label: t('panel_switcher.dashboard'),
      shortLabel: t('panel_switcher.dashboard_short'),
      href: '/dashboard',
      icon: <LuLayoutDashboard className="h-3.5 w-3.5" />,
      color: 'text-indigo-400',
    },
  };

  if (availablePanels.length <= 1) return null;

  const current = panelConfig[currentPanel];
  const otherPanels = availablePanels.filter((p) => p !== currentPanel);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
          open
            ? 'border-[#5865F2]/30 bg-[#5865F2]/10 text-white'
            : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-white/[0.15] hover:text-white'
        }`}
      >
        <span className={current.color}>{current.icon}</span>
        <span className="hidden sm:inline">{current.shortLabel}</span>
        <LuChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111114]/95 backdrop-blur-xl shadow-xl shadow-black/40 transition-all duration-150 origin-top-right ${
          open
            ? 'opacity-100 scale-100 visible'
            : 'opacity-0 scale-95 invisible pointer-events-none'
        }`}
      >
        <div className="px-1.5 pt-1.5">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2">
            <span className={current.color}>{current.icon}</span>
            <span className="text-[13px] font-medium text-white">{current.label}</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="mx-3 my-1 h-px bg-white/[0.06]" />

        <div className="px-1.5 pb-1.5">
          {otherPanels.map((panel) => {
            const config = panelConfig[panel];
            return (
              <button
                key={panel}
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.location.href = config.href;
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
              >
                <span className={config.color}>{config.icon}</span>
                <span className="text-[13px] text-white/70">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
