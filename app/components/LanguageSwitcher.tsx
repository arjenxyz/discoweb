'use client';

import { useEffect, useRef, useState } from 'react';
import { LuChevronDown, LuGlobe } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';

type LanguageSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export default function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((item) => item.code === language) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <LuGlobe className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span className="font-semibold">{current.flag}</span>
        {!compact && <span className="font-medium">{current.nativeLabel}</span>}
        <LuChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-[10000] min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#0d0f14]/95 shadow-2xl backdrop-blur-xl"
        >
          {SUPPORTED_LANGUAGES.map((item) => {
            const active = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(item.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'bg-[#5865F2]/15 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base">{item.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.nativeLabel}</p>
                  <p className="text-xs text-white/40">{item.label}</p>
                </div>
                {active && <span className="h-2 w-2 rounded-full bg-[#5865F2]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
