'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18nContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';
import FlagIcon from './FlagIcon';

type LanguageSwitcherProps = {
  compact?: boolean;
  className?: string;
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

function useIsMobileNav() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

export default function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isTouch = useIsCoarsePointer();
  const isMobile = useIsMobileNav();
  const showLabel = !compact && !isMobile;

  const current = SUPPORTED_LANGUAGES.find((item) => item.code === language) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative group z-[10001] shrink-0 ${className}`}
      onMouseEnter={() => {
        if (!isTouch) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!isTouch) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          // Desktop: hover opens — ignore click. Touch/mobile: toggle.
          if (!isTouch && !isMobile) {
            e.preventDefault();
            return;
          }
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
              isMobile || isTouch ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            aria-hidden
            onClick={() => {
              if (isMobile || isTouch) setOpen(false);
            }}
          />,
          document.body,
        )}

      {open && (
        <div
          className={`z-[10002] animate-langSlideUp origin-top ${
            isMobile
              ? 'fixed left-1/2 top-[7.5rem] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2'
              : 'absolute top-full right-0 w-72 pt-4'
          }`}
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
