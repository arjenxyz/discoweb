'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18nContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';
import { lockBodyScroll } from '@/lib/lockBodyScroll';
import FlagIcon from './FlagIcon';

type LanguageSwitcherProps = {
  compact?: boolean;
  className?: string;
  /** Inline list for mobile sheet menus (no dropdown / portal). */
  variant?: 'dropdown' | 'menu';
};

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`h-3 w-3 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return coarse;
}

function useShowLanguageLabel() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return show;
}

export default function LanguageSwitcher({
  compact = false,
  className = '',
  variant = 'dropdown',
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isTouch = useIsCoarsePointer();
  const wideEnoughForLabel = useShowLanguageLabel();
  const showLabel = !compact && wideEnoughForLabel;

  const current = SUPPORTED_LANGUAGES.find((item) => item.code === language) ?? SUPPORTED_LANGUAGES[0];

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 220);
  };

  useEffect(() => {
    setMounted(true);
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open || variant === 'menu') return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', handleKey);
      unlock();
    };
  }, [open, variant]);

  if (variant === 'menu') {
    return (
      <div className={`w-full ${className}`}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Language
        </p>
        <div
          id={listId}
          role="listbox"
          aria-label="Languages"
          className="grid grid-cols-2 gap-2"
        >
          {SUPPORTED_LANGUAGES.map((item) => {
            const active = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => setLanguage(item.code)}
                className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-[#5865F2]/50 bg-[#5865F2]/25 text-white'
                    : 'border-white/10 bg-white/[0.04] text-white/75 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <FlagIcon code={item.code} size={20} title={item.country} />
                <span className="min-w-0 truncate text-sm font-semibold">{item.country}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative group z-[10001] shrink-0 ${className}`}
      onMouseEnter={() => {
        if (!isTouch) openMenu();
      }}
      onMouseLeave={() => {
        if (!isTouch) scheduleClose();
      }}
    >
      <button
        type="button"
        onClick={() => {
          clearCloseTimer();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Change language (${current.nativeLabel})`}
        className={`inline-flex h-10 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-all duration-200 md:h-auto ${
          showLabel ? 'px-4 py-2 text-sm md:px-5 md:py-2.5' : 'px-2.5 py-2'
        } ${
          open
            ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
            : 'text-white/80 hover:text-white hover:bg-white/5'
        }`}
      >
        <FlagIcon code={current.code} size={showLabel ? 18 : 18} title={current.country} />
        {showLabel ? (
          <span className="ml-0.5 max-w-[9rem] truncate">{current.nativeLabel}</span>
        ) : (
          <span className="max-w-[6.5rem] truncate text-xs font-semibold text-white/85">
            {current.country}
          </span>
        )}
        <ChevronIcon isOpen={open} />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[12px] transition-all duration-500 ${
              isTouch ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            aria-hidden
            onClick={() => {
              if (isTouch) setOpen(false);
            }}
          />,
          document.body,
        )}

      {open && (
        <div
          className="absolute top-full right-0 z-[10002] w-[min(18rem,calc(100vw-2rem))] pt-2 animate-langSlideUp origin-top md:w-72"
          onMouseEnter={() => {
            if (!isTouch) openMenu();
          }}
          onMouseLeave={() => {
            if (!isTouch) scheduleClose();
          }}
        >
          <div className="relative overflow-visible rounded-[28px] border border-white/20 bg-[#5865F2] p-4 pb-14 shadow-[0_20px_50px_rgba(88,101,242,0.4)] md:rounded-[32px] md:p-5 md:pb-16">
            <div
              id={listId}
              role="listbox"
              aria-label="Languages"
              className="lang-scroll relative z-20 max-h-[min(280px,50vh)] space-y-1 overflow-y-auto pr-1"
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 md:px-4 ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <FlagIcon code={item.code} size={22} title={item.country} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">{item.nativeLabel}</p>
                      <p className="truncate text-xs text-white/55">{item.country}</p>
                    </div>
                    {active && <span className="h-2 w-2 shrink-0 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>

            <div className="pointer-events-none absolute -bottom-5 -right-4 z-10 h-28 w-28 -rotate-[10deg] drop-shadow-2xl transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105 md:-bottom-6 md:-right-6 md:h-40 md:w-40">
              <img src="/gif/Patickstar.gif" alt="" className="h-full w-full object-contain" draggable={false} />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes langSlideUp {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-langSlideUp {
          animation: langSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lang-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
        }
        .lang-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .lang-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 6px 0;
        }
        .lang-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.35);
          border-radius: 999px;
        }
        .lang-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.55);
        }
        .lang-scroll::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}
