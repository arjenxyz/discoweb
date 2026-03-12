'use client';

import AdminMaintenancePage from '../../admin/maintenance/page';

export default function DeveloperMaintenancePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bakım Yönetimi</h1>
        <p className="text-sm text-[#99AAB5] mt-1">Sistem modüllerinin bakım durumlarını yönetin.</p>
      </div>
      <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
        <AdminMaintenancePage />
      </div>
    </div>
  );
}
