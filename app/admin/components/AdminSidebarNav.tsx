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
  accent = 'indigo',
}: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed?: boolean;
  isMobile?: boolean;
  accent?: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = isPathActive(pathname, href);
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.indigo;
  const showLabel = !collapsed || isMobile;

  return (
    <Link
      href={href}
      title={collapsed && !isMobile ? t(labelKey) : undefined}
      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
        collapsed && !isMobile
          ? 'mx-auto h-11 w-11 justify-center'
          : 'gap-3 px-2.5 py-2'
      } ${active ? `${styles.active} ${styles.glow}` : 'text-white/50 hover:bg-white/[0.04] hover:text-white/85'}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
          collapsed && !isMobile ? 'h-9 w-9' : 'h-8 w-8'
        } ${active ? styles.chip : 'bg-white/[0.04] text-white/45 group-hover:bg-white/[0.07] group-hover:text-white/70'}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      {showLabel && (
        <>
          <span className={`flex-1 truncate text-[13px] font-medium ${active ? 'text-white' : ''}`}>
            {t(labelKey)}
          </span>
          {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />}
        </>
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

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed && !isMobile ? t(item.labelKey) : undefined}
        className={`group relative flex w-full items-center rounded-xl transition-all duration-200 ${
          collapsed && !isMobile
            ? 'mx-auto h-11 w-11 justify-center'
            : 'gap-3 px-2.5 py-2'
        } ${active || isOpen ? `${styles.active}` : 'text-white/50 hover:bg-white/[0.04] hover:text-white/85'}`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
            collapsed && !isMobile ? 'h-9 w-9' : 'h-8 w-8'
          } ${active || isOpen ? styles.chip : 'bg-white/[0.04] text-white/45 group-hover:bg-white/[0.07] group-hover:text-white/70'}`}
        >
          <item.icon className="h-4 w-4" />
        </span>
        {showLabel && (
          <>
            <span className={`flex-1 truncate text-left text-[13px] font-medium ${active || isOpen ? 'text-white' : ''}`}>
              {t(item.labelKey)}
            </span>
            <LuChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-white/70' : 'text-white/25'
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
          <div className="ml-3 space-y-3 border-l border-white/[0.06] py-1 pl-3">
            {item.sections.map((section) => (
              <div key={section.titleKey} className="space-y-0.5">
                <p className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  {t(section.titleKey)}
                </p>
                {section.items.map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive = isPathActive(pathname, sub.href);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-all duration-150 ${
                        subActive
                          ? `${styles.glow} ${styles.active} font-medium text-white`
                          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                    >
                      <SubIcon className={`h-3.5 w-3.5 shrink-0 ${subActive ? 'opacity-100' : 'opacity-50'}`} />
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

function renderItem(
  item: MenuItem,
  props: AdminSidebarNavProps,
) {
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

  return (
    <nav className="space-y-5">
      {ADMIN_MENU.map((group) => (
        <div key={group.id}>
          {showGroups && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
                {t(group.titleKey)}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => renderItem(item, props))}
          </div>
        </div>
      ))}
    </nav>
  );
}
