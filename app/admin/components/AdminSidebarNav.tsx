'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuChevronDown } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import {
  ACCENT_STYLES,
  ADMIN_MENU,
  isExpandableActive,
  isPathActive,
  type MenuExpandable,
  type MenuItem,
} from './adminMenuConfig';

type AdminSidebarNavProps = {
  collapsed?: boolean;
  isMobile?: boolean;
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
};

function NavLinkItem({
  href,
  labelKey,
  icon: Icon,
  collapsed,
  isMobile,
}: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed?: boolean;
  isMobile?: boolean;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = isPathActive(pathname, href);
  const showLabel = !collapsed || isMobile;

  if (isMobile) {
    return (
      <Link
        href={href}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-200 ${
          active
            ? 'bg-[#5865F2]/12 text-white'
            : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#5865F2]"
          />
        )}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
            active
              ? 'bg-[#5865F2]/25 text-[#c7d0ff]'
              : 'bg-white/[0.04] text-white/40 group-hover:bg-white/[0.08] group-hover:text-white/75'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className={`truncate text-[15px] ${active ? 'font-semibold' : 'font-medium'}`}>
          {t(labelKey)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? t(labelKey) : undefined}
      className={`group relative flex items-center rounded-2xl transition-all duration-200 ${
        collapsed ? 'mx-auto h-11 w-11 justify-center' : 'gap-3 px-2.5 py-2'
      } ${
        active
          ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30'
          : 'text-white/55 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl transition-colors ${
          collapsed ? 'h-9 w-9' : 'h-8 w-8'
        } ${
          active
            ? 'bg-white/15 text-white'
            : 'bg-white/[0.04] text-white/45 group-hover:bg-white/[0.08] group-hover:text-white/80'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      {showLabel && (
        <span className={`flex-1 truncate text-[13px] font-medium ${active ? 'text-white' : ''}`}>
          {t(labelKey)}
        </span>
      )}
    </Link>
  );
}

function NavExpandableItem({
  item,
  collapsed,
  isMobile,
  isOpen,
  onToggle,
}: {
  item: MenuExpandable;
  collapsed?: boolean;
  isMobile?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = isExpandableActive(pathname, item);
  const styles = ACCENT_STYLES[item.accent] ?? ACCENT_STYLES.indigo;
  const showLabel = !collapsed || isMobile;
  const highlighted = active || isOpen;

  if (isMobile) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={onToggle}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-200 ${
            highlighted
              ? 'bg-[#5865F2]/10 text-white'
              : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#5865F2]"
            />
          )}
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              highlighted
                ? styles.chip
                : 'bg-white/[0.04] text-white/40 group-hover:bg-white/[0.08] group-hover:text-white/75'
            }`}
          >
            <item.icon className="h-4 w-4" />
          </span>
          <span className={`flex-1 truncate text-left text-[15px] ${highlighted ? 'font-semibold' : 'font-medium'}`}>
            {t(item.labelKey)}
          </span>
          <LuChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#a5b4ff]' : 'text-white/25'
            }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-3 space-y-0.5 border-l border-white/[0.06] py-1 pl-3">
              {item.sections.flatMap((section) =>
                section.items.map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive = isPathActive(pathname, sub.href);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                        subActive
                          ? 'bg-[#5865F2]/12 font-semibold text-white'
                          : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <SubIcon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          subActive ? 'text-[#a5b4ff]' : 'opacity-50'
                        }`}
                      />
                      <span className="truncate">{t(sub.labelKey)}</span>
                    </Link>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? t(item.labelKey) : undefined}
        className={`group relative flex w-full items-center rounded-2xl transition-all duration-200 ${
          collapsed ? 'mx-auto h-11 w-11 justify-center' : 'gap-3 px-2.5 py-2'
        } ${
          highlighted
            ? 'bg-[#5865F2]/15 text-white ring-1 ring-[#5865F2]/35'
            : 'text-white/55 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl transition-colors ${
            collapsed ? 'h-9 w-9' : 'h-8 w-8'
          } ${
            highlighted
              ? styles.chip
              : 'bg-white/[0.04] text-white/45 group-hover:bg-white/[0.08] group-hover:text-white/80'
          }`}
        >
          <item.icon className="h-4 w-4" />
        </span>
        {showLabel && (
          <>
            <span
              className={`flex-1 truncate text-left text-[13px] font-medium ${
                highlighted ? 'text-white' : ''
              }`}
            >
              {t(item.labelKey)}
            </span>
            <LuChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#a5b4ff]' : 'text-white/25'
              }`}
            />
          </>
        )}
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen && showLabel ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-2 space-y-2.5 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-sm">
            {item.sections.map((section) => (
              <div key={section.titleKey} className="space-y-0.5">
                <p className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5865F2]/70">
                  {t(section.titleKey)}
                </p>
                {section.items.map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive = isPathActive(pathname, sub.href);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-150 ${
                        subActive
                          ? 'bg-[#5865F2] font-medium text-white shadow-md shadow-[#5865F2]/25'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <SubIcon
                        className={`h-3.5 w-3.5 shrink-0 ${subActive ? 'opacity-100' : 'opacity-50'}`}
                      />
                      <span className="truncate">{t(sub.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderItem(item: MenuItem, props: AdminSidebarNavProps) {
  if (item.kind === 'link') {
    return (
      <NavLinkItem
        key={item.href}
        href={item.href}
        labelKey={item.labelKey}
        icon={item.icon}
        collapsed={props.collapsed}
        isMobile={props.isMobile}
      />
    );
  }

  return (
    <NavExpandableItem
      key={item.id}
      item={item}
      collapsed={props.collapsed}
      isMobile={props.isMobile}
      isOpen={Boolean(props.openSections[item.id])}
      onToggle={() => props.onToggleSection(item.id)}
    />
  );
}

export default function AdminSidebarNav(props: AdminSidebarNavProps) {
  const { t } = useTranslation();
  const showGroups = !props.collapsed || props.isMobile;

  if (props.isMobile) {
    return (
      <nav className="space-y-5">
        {ADMIN_MENU.map((group) => (
          <div key={group.id}>
            {showGroups && (
              <div className="mb-2 flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5865F2]/75">
                  {t(group.titleKey)}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#5865F2]/25 to-transparent" />
              </div>
            )}
            <div className="space-y-1">{group.items.map((item) => renderItem(item, props))}</div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-5">
      {ADMIN_MENU.map((group) => (
        <div key={group.id}>
          {showGroups && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5865F2]/75">
                {t(group.titleKey)}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#5865F2]/25 to-transparent" />
            </div>
          )}
          <div className="space-y-1">{group.items.map((item) => renderItem(item, props))}</div>
        </div>
      ))}
    </nav>
  );
}
