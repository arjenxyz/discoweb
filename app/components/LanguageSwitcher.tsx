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
    className={`w-3 h-3 ml-1.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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

export default function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isTouch = useIsCoarsePointer();

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
      className={`relative group z-[10001] ${className}`}
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
          // Desktop: hover opens — ignore click. Touch: toggle.
          if (!isTouch) {
            e.preventDefault();
            return;
          }
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Change language"
        className={`flex items-center font-medium transition-all duration-200 rounded-full ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
        } ${
          open
            ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 scale-105'
            : 'text-white/80 hover:text-white hover:bg-white/5'
        }`}
      >
        <FlagIcon code={current.code} size={compact ? 16 : 18} title={current.country} />
        {!compact && <span className="ml-2">{current.nativeLabel}</span>}
        <ChevronIcon isOpen={open} />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[12px] transition-all duration-500 pointer-events-none"
            aria-hidden
          />,
          document.body,
        )}

      {open && (
        <div className="absolute top-full right-0 pt-4 w-72 animate-langSlideUp origin-top z-[10002]">
          <div className="bg-[#5865F2] border border-white/20 rounded-[32px] shadow-[0_20px_50px_rgba(88,101,242,0.4)] p-5 pb-16 relative overflow-visible">
            <div
              id={listId}
              role="listbox"
              aria-label="Languages"
              className="lang-scroll relative z-20 max-h-[280px] space-y-1 overflow-y-auto pr-1"
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
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-200 ${
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

            <div className="absolute -bottom-6 -right-6 w-40 h-40 pointer-events-none drop-shadow-2xl z-10 transform rotate-[-10deg] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105">
              <img src="/gif/Patickstar.gif" alt="" className="w-full h-full object-contain" draggable={false} />
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
