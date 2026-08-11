'use client';

import { useTranslation } from '@/lib/i18nContext';
import MaintenancePanel from './MaintenancePanel';

export default function DeveloperMaintenancePage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t('developer.maintenance.title')}</h1>
        <p className="text-sm text-[#99AAB5] mt-1">{t('developer.maintenance.subtitle')}</p>
      </div>
      <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
        <MaintenancePanel />
      </div>
    </div>
  );
}
