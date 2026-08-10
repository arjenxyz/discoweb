'use client';

import type { ReactNode } from 'react';
import type { LanguageCode } from '@/lib/i18n/languages';

type FlagIconProps = {
  code: LanguageCode;
  size?: number;
  className?: string;
  title?: string;
};

function CircleClip({ id, children }: { id: string; children: ReactNode }) {
  return (
    <>
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      <circle cx="12" cy="12" r="11.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </>
  );
}

function FlagSvg({ code }: { code: LanguageCode }) {
  const clipId = `flag-clip-${code}`;

  switch (code) {
    case 'en':
      // USA
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#B22234" />
          {[2.2, 4.8, 7.4, 10, 12.6, 15.2, 17.8, 20.4].map((y) => (
            <rect key={y} y={y} width="24" height="1.3" fill="#fff" />
          ))}
          <rect width="11.5" height="12.5" fill="#3C3B6E" />
          {[2, 4.5, 7, 9.5].map((y, row) =>
            [1.5, 3.5, 5.5, 7.5, 9.5].slice(0, row % 2 === 0 ? 5 : 4).map((x, i) => (
              <circle key={`${y}-${i}`} cx={row % 2 === 0 ? x : x + 1} cy={y} r="0.55" fill="#fff" />
            )),
          )}
        </CircleClip>
      );
    case 'pt':
      // Brazil
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#009C3B" />
          <polygon points="12,3.5 21,12 12,20.5 3,12" fill="#FFDF00" />
          <circle cx="12" cy="12" r="4.2" fill="#002776" />
          <path d="M8.2 12.4c1.4-1.3 3.4-2 5.8-1.7" fill="none" stroke="#fff" strokeWidth="0.7" />
        </CircleClip>
      );
    case 'id':
      // Indonesia
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="12" fill="#CE1126" />
          <rect y="12" width="24" height="12" fill="#fff" />
        </CircleClip>
      );
    case 'es':
      // Mexico
      return (
        <CircleClip id={clipId}>
          <rect width="8" height="24" fill="#006847" />
          <rect x="8" width="8" height="24" fill="#fff" />
          <rect x="16" width="8" height="24" fill="#CE1126" />
          <circle cx="12" cy="12" r="2.2" fill="#8B5A2B" />
        </CircleClip>
      );
    case 'de':
      // Germany
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="8" fill="#000" />
          <rect y="8" width="24" height="8" fill="#DD0000" />
          <rect y="16" width="24" height="8" fill="#FFCE00" />
        </CircleClip>
      );
    case 'tr':
      // Turkey
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#E30A17" />
          <circle cx="9.5" cy="12" r="4.4" fill="#fff" />
          <circle cx="10.9" cy="12" r="3.5" fill="#E30A17" />
          <polygon points="14.2,12 15.35,12.7 15,11.4 16.1,10.6 14.75,10.55 14.2,9.3 13.65,10.55 12.3,10.6 13.4,11.4 13.05,12.7" fill="#fff" />
        </CircleClip>
      );
    case 'fr':
      // France
      return (
        <CircleClip id={clipId}>
          <rect width="8" height="24" fill="#002395" />
          <rect x="8" width="8" height="24" fill="#fff" />
          <rect x="16" width="8" height="24" fill="#ED2939" />
        </CircleClip>
      );
    case 'ja':
      // Japan
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#fff" />
          <circle cx="12" cy="12" r="4.5" fill="#BC002D" />
        </CircleClip>
      );
    case 'ko':
      // South Korea (simplified taegeuk)
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#fff" />
          <path d="M12 5.5a6.5 6.5 0 0 1 0 13 6.5 6.5 0 0 1 0-13z" fill="#CD2E3A" />
          <path d="M12 5.5a6.5 6.5 0 0 0 0 13" fill="#0047A0" />
          <circle cx="12" cy="9" r="2.1" fill="#0047A0" />
          <circle cx="12" cy="15" r="2.1" fill="#CD2E3A" />
          <g stroke="#000" strokeWidth="1.1" strokeLinecap="round">
            <path d="M5.2 7.2l2.1-2.1M4.4 8.4l2.9-2.9" />
            <path d="M16.7 18.9l2.1-2.1M15.9 20.1l2.9-2.9" />
            <path d="M16.7 5.1l2.1 2.1M15.9 3.9l2.9 2.9" />
            <path d="M5.2 16.8l2.1 2.1M4.4 15.6l2.9 2.9" />
          </g>
        </CircleClip>
      );
    case 'ru':
      // Russia
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="8" fill="#fff" />
          <rect y="8" width="24" height="8" fill="#0039A6" />
          <rect y="16" width="24" height="8" fill="#D52B1E" />
        </CircleClip>
      );
    default:
      return (
        <CircleClip id={clipId}>
          <rect width="24" height="24" fill="#5865F2" />
        </CircleClip>
      );
  }
}

export default function FlagIcon({ code, size = 20, className = '', title }: FlagIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <title>{title}</title>
      <FlagSvg code={code} />
    </svg>
  );
}
