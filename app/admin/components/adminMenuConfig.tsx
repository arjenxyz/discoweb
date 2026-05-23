import type { IconType } from 'react-icons';
import {
  LuAward,
  LuBadgePercent,
  LuChartBar,
  LuClipboardList,
  LuCoins,
  LuLayoutGrid,
  LuPackage,
  LuStore,
  LuTag,
  LuWallet,
  LuZap,
} from 'react-icons/lu';

export type MenuLink = {
  kind: 'link';
  href: string;
  labelKey: string;
  icon: IconType;
};

export type MenuSubItem = {
  href: string;
  labelKey: string;
  icon: IconType;
};

export type MenuSubSection = {
  titleKey: string;
  items: MenuSubItem[];
};

export type MenuExpandable = {
  kind: 'expandable';
  id: string;
  labelKey: string;
  icon: IconType;
  pathPrefix: string;
  accent: string;
  sections: MenuSubSection[];
};

export type MenuItem = MenuLink | MenuExpandable;

export type MenuGroup = {
  id: string;
  titleKey: string;
  items: MenuItem[];
};

export const ADMIN_MENU: MenuGroup[] = [
  {
    id: 'general',
    titleKey: 'admin.menu.group_general',
    items: [
      {
        kind: 'link',
        href: '/admin',
        labelKey: 'sidebar.dashboard',
        icon: LuLayoutGrid,
      },
    ],
  },
  {
    id: 'store',
    titleKey: 'admin.menu.group_store',
    items: [
      {
        kind: 'expandable',
        id: 'store',
        labelKey: 'sidebar.store',
        icon: LuStore,
        pathPrefix: '/admin/store',
        accent: 'emerald',
        sections: [
          {
            titleKey: 'admin.menu.section_create',
            items: [
              { href: '/admin/store/products/new', labelKey: 'admin.menu.new_product', icon: LuPackage },
              { href: '/admin/store/promos/new', labelKey: 'admin.menu.new_promo', icon: LuTag },
              { href: '/admin/store/discounts/new', labelKey: 'admin.menu.new_discount', icon: LuBadgePercent },
            ],
          },
          {
            titleKey: 'admin.menu.section_lists',
            items: [
              { href: '/admin/store/products', labelKey: 'admin.menu.product_list', icon: LuClipboardList },
              { href: '/admin/store/promos', labelKey: 'admin.menu.promo_list', icon: LuTag },
              { href: '/admin/store/discounts', labelKey: 'admin.menu.discount_list', icon: LuBadgePercent },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'community',
    titleKey: 'admin.menu.group_community',
    items: [
      {
        kind: 'expandable',
        id: 'community',
        labelKey: 'admin.menu.tag_booster',
        icon: LuAward,
        pathPrefix: '/admin/badges',
        accent: 'violet',
        sections: [
          {
            titleKey: 'admin.menu.section_badges',
            items: [
              { href: '/admin/badges', labelKey: 'admin.menu.tag_settings', icon: LuAward },
              { href: '/admin/boosters', labelKey: 'admin.menu.booster_settings', icon: LuZap },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'management',
    titleKey: 'admin.menu.group_management',
    items: [
      { kind: 'link', href: '/admin/wallet', labelKey: 'sidebar.wallet', icon: LuWallet },
      { kind: 'link', href: '/admin/earn-settings', labelKey: 'sidebar.earn_settings', icon: LuCoins },
      { kind: 'link', href: '/admin/log-channels', labelKey: 'sidebar.channels_logs', icon: LuChartBar },
    ],
  },
];

export const ACCENT_STYLES: Record<string, { chip: string; active: string; glow: string }> = {
  indigo: {
    chip: 'bg-indigo-500/15 text-indigo-300',
    active: 'bg-indigo-500/12 text-indigo-200',
    glow: 'shadow-[inset_3px_0_0_0_#818cf8]',
  },
  emerald: {
    chip: 'bg-emerald-500/15 text-emerald-300',
    active: 'bg-emerald-500/12 text-emerald-200',
    glow: 'shadow-[inset_3px_0_0_0_#34d399]',
  },
  violet: {
    chip: 'bg-violet-500/15 text-violet-300',
    active: 'bg-violet-500/12 text-violet-200',
    glow: 'shadow-[inset_3px_0_0_0_#a78bfa]',
  },
  cyan: {
    chip: 'bg-cyan-500/15 text-cyan-300',
    active: 'bg-cyan-500/12 text-cyan-200',
    glow: 'shadow-[inset_3px_0_0_0_#22d3ee]',
  },
};

export function isPathActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isExpandableActive(pathname: string, item: MenuExpandable) {
  if (pathname.startsWith(item.pathPrefix)) return true;
  if (item.id === 'community') {
    return pathname.startsWith('/admin/badges') || pathname.startsWith('/admin/boosters');
  }
  return false;
}
