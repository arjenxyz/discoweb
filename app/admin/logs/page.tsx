'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { getLocaleTag } from '@/lib/i18n/languages';

type AuditLog = {
  id: string;
  event: string;
  status: string | null;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export default function AdminLogsPage() {
  const { t, language } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/admin/audit-logs');
      if (response.ok) {
        const data = (await response.json()) as AuditLog[];
        setLogs(data);
      }
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
          {t('admin.logs_page.eyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{t('admin.logs_page.title')}</h1>
        <p className="mt-1 text-sm text-white/60">{t('admin.logs_page.subtitle')}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {loading ? (
          <p className="text-sm text-white/60">{t('admin.logs_page.loading')}</p>
        ) : (
          <div className="space-y-3 text-sm">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/10 bg-[#0b0d12]/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-white/80">{log.event}</p>
                  <span className="text-xs text-white/40">
                    {new Date(log.created_at).toLocaleString(getLocaleTag(language))}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                  {log.status && <span>{t('admin.logs_page.status', { status: log.status })}</span>}
                  {log.user_id && <span>{t('admin.logs_page.user', { id: log.user_id })}</span>}
                  {log.ip_address && <span>{t('admin.logs_page.ip', { ip: log.ip_address })}</span>}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[11px] text-white/70">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
