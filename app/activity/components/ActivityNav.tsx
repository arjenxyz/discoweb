'use client';

import { LuStore, LuLayoutDashboard, LuMail } from 'react-icons/lu';

export type ActivityTab = 'store' | 'dashboard' | 'mail';

type ActivityNavProps = {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
};

const tabs: { id: ActivityTab; label: string; icon: React.ReactNode }[] = [
  { id: 'store', label: 'Mağaza', icon: <LuStore size={16} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LuLayoutDashboard size={16} /> },
  { id: 'mail', label: 'Mail', icon: <LuMail size={16} /> },
];

export default function ActivityNav({ activeTab, onTabChange }: ActivityNavProps) {
  return (
    <nav className="flex items-center gap-1 bg-[#1e1f22] border-b border-[#3f4147] px-3 py-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all
            ${activeTab === tab.id
              ? 'bg-[#5865F2] text-white'
              : 'text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#3f4147]'
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
