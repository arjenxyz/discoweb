'use client';

import { LuHouse, LuStore, LuLayoutDashboard } from 'react-icons/lu';

export type ActivityTab = 'home' | 'store' | 'dashboard';

type ActivityNavProps = {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
};

const tabs: { id: ActivityTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Ana Sayfa', icon: <LuHouse size={18} /> },
  { id: 'store', label: 'Mağaza', icon: <LuStore size={18} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LuLayoutDashboard size={18} /> },
];

export default function ActivityNav({ activeTab, onTabChange }: ActivityNavProps) {
  return (
    <nav className="flex items-center justify-center gap-1 bg-[#1a1a2e]/80 backdrop-blur-md border-b border-white/10 px-2 py-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${activeTab === tab.id
              ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25'
              : 'text-[#99AAB5] hover:text-white hover:bg-white/5'
            }
          `}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
