import type { IconType } from 'react-icons';
import {
  LuLayoutGrid,
  LuStore,
  LuCoins,
  LuWallet,
  LuDatabase,
  LuAward,
  LuSettings,
  LuRocket,
  LuPackage,
} from 'react-icons/lu';

export type GuideSection = {
  id: string;
  href: string;
  icon: IconType;
  accent: string;
  glow: string;
  titleKey: string;
  descKey: string;
  tipKeys: string[];
};

export type RoadmapStep = {
  id: string;
  titleKey: string;
  descKey: string;
};

export type FaqItem = {
  id: string;
  qKey: string;
  aKey: string;
};

export const ROADMAP_STEPS: RoadmapStep[] = [
  { id: 'login', titleKey: 'admin.guide.roadmap.login.title', descKey: 'admin.guide.roadmap.login.desc' },
  { id: 'roles', titleKey: 'admin.guide.roadmap.roles.title', descKey: 'admin.guide.roadmap.roles.desc' },
  { id: 'logs', titleKey: 'admin.guide.roadmap.logs.title', descKey: 'admin.guide.roadmap.logs.desc' },
  { id: 'economy', titleKey: 'admin.guide.roadmap.economy.title', descKey: 'admin.guide.roadmap.economy.desc' },
  { id: 'launch', titleKey: 'admin.guide.roadmap.launch.title', descKey: 'admin.guide.roadmap.launch.desc' },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    href: '/admin',
    icon: LuLayoutGrid,
    accent: 'text-indigo-300',
    glow: 'bg-indigo-500',
    titleKey: 'admin.guide.sections.dashboard.title',
    descKey: 'admin.guide.sections.dashboard.desc',
    tipKeys: [
      'admin.guide.sections.dashboard.tip1',
      'admin.guide.sections.dashboard.tip2',
      'admin.guide.sections.dashboard.tip3',
    ],
  },
  {
    id: 'store',
    href: '/admin/store/products',
    icon: LuStore,
    accent: 'text-emerald-300',
    glow: 'bg-emerald-500',
    titleKey: 'admin.guide.sections.store.title',
    descKey: 'admin.guide.sections.store.desc',
    tipKeys: [
      'admin.guide.sections.store.tip1',
      'admin.guide.sections.store.tip2',
      'admin.guide.sections.store.tip3',
      'admin.guide.sections.store.tip4',
    ],
  },
  {
    id: 'earn',
    href: '/admin/earn-settings',
    icon: LuCoins,
    accent: 'text-amber-300',
    glow: 'bg-amber-500',
    titleKey: 'admin.guide.sections.earn.title',
    descKey: 'admin.guide.sections.earn.desc',
    tipKeys: [
      'admin.guide.sections.earn.tip1',
      'admin.guide.sections.earn.tip2',
      'admin.guide.sections.earn.tip3',
      'admin.guide.sections.earn.tip4',
    ],
  },
  {
    id: 'wallet',
    href: '/admin/wallet',
    icon: LuWallet,
    accent: 'text-blue-300',
    glow: 'bg-blue-500',
    titleKey: 'admin.guide.sections.wallet.title',
    descKey: 'admin.guide.sections.wallet.desc',
    tipKeys: [
      'admin.guide.sections.wallet.tip1',
      'admin.guide.sections.wallet.tip2',
      'admin.guide.sections.wallet.tip3',
    ],
  },
  {
    id: 'logs',
    href: '/admin/log-channels',
    icon: LuDatabase,
    accent: 'text-cyan-300',
    glow: 'bg-cyan-500',
    titleKey: 'admin.guide.sections.logs.title',
    descKey: 'admin.guide.sections.logs.desc',
    tipKeys: [
      'admin.guide.sections.logs.tip1',
      'admin.guide.sections.logs.tip2',
      'admin.guide.sections.logs.tip3',
      'admin.guide.sections.logs.tip4',
    ],
  },
  {
    id: 'community',
    href: '/admin/badges',
    icon: LuAward,
    accent: 'text-pink-300',
    glow: 'bg-pink-500',
    titleKey: 'admin.guide.sections.community.title',
    descKey: 'admin.guide.sections.community.desc',
    tipKeys: [
      'admin.guide.sections.community.tip1',
      'admin.guide.sections.community.tip2',
      'admin.guide.sections.community.tip3',
    ],
  },
  {
    id: 'settings',
    href: '/admin/settings',
    icon: LuSettings,
    accent: 'text-violet-300',
    glow: 'bg-violet-500',
    titleKey: 'admin.guide.sections.settings.title',
    descKey: 'admin.guide.sections.settings.desc',
    tipKeys: [
      'admin.guide.sections.settings.tip1',
      'admin.guide.sections.settings.tip2',
      'admin.guide.sections.settings.tip3',
    ],
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  { id: 'access', qKey: 'admin.guide.faq.access.q', aKey: 'admin.guide.faq.access.a' },
  { id: 'roles', qKey: 'admin.guide.faq.roles.q', aKey: 'admin.guide.faq.roles.a' },
  { id: 'logs', qKey: 'admin.guide.faq.logs.q', aKey: 'admin.guide.faq.logs.a' },
  { id: 'orders', qKey: 'admin.guide.faq.orders.q', aKey: 'admin.guide.faq.orders.a' },
  { id: 'earn', qKey: 'admin.guide.faq.earn.q', aKey: 'admin.guide.faq.earn.a' },
  { id: 'wallet', qKey: 'admin.guide.faq.wallet.q', aKey: 'admin.guide.faq.wallet.a' },
];

export const QUICK_LINKS = [
  { href: '/admin/store/products/new', icon: LuPackage, labelKey: 'admin.guide.quick.new_product' },
  { href: '/admin/wallet', icon: LuWallet, labelKey: 'admin.guide.quick.wallet' },
  { href: '/admin/earn-settings', icon: LuCoins, labelKey: 'admin.guide.quick.earn' },
  { href: '/admin/log-channels', icon: LuDatabase, labelKey: 'admin.guide.quick.logs' },
  { href: '/admin/settings', icon: LuSettings, labelKey: 'admin.guide.quick.settings' },
];
