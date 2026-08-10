'use client';

import { useState, useEffect } from 'react';
import { LuScrollText } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';
import { getLocaleTag } from '@/lib/i18n/languages';

type DeveloperLog = {
  id: string;
  type: string;
  title: string;
  data: any;
  created_at: string;
};

export default function LogsPage() {
  const { t, language } = useTranslation();
  const [logs, setLogs] = useState<DeveloperLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<DeveloperLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dev-panel?section=logs', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setLogs(data.logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.type === filter);

  const prettyJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
          <LuScrollText className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('developer.logs.title')}</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{t('developer.logs.subtitle')}</p>
        </div>
      </div>

      <div className="grid h-[calc(100vh-140px)] min-h-[600px] gap-6 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-5 overflow-hidden">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
            {['all','auth_login','auth_logout','ban_added','ban_removed','new_user','new_server','bug','suggestion','error_log','client_error', 'api_error'].map((type) => (
              <button key={type} onClick={() => setFilter(type)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${filter === type ? 'border-[#5865F2]/50 bg-[#5865F2]/20 text-white' : 'border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
            {loading ? (
              <p className="text-sm text-white/40 text-center py-4">{t('developer.common.loading')}</p>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <button key={log.id} onClick={() => setSelectedLog(log)}
                  className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all ${selectedLog?.id === log.id ? 'border-[#5865F2]/50 bg-[#5865F2]/10 shadow-[0_0_15px_rgba(88,101,242,0.15)]' : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06]'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white truncate">{log.title}</p>
                    <span className="shrink-0 text-[10px] text-white/30">{new Date(log.created_at).toLocaleString(getLocaleTag(language))}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-bold text-white/50 uppercase">{log.type}</p>
                </button>
              ))
            ) : (
              <p className="text-sm text-white/40 text-center py-8">{t('developer.logs.empty')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6 h-full overflow-hidden">
          {selectedLog ? (
            <div className="flex flex-col h-full">
              <div className="border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white/70">{selectedLog.type}</span>
                  <p className="text-sm font-medium text-white/40">{new Date(selectedLog.created_at).toLocaleString(getLocaleTag(language))}</p>
                </div>
                <h2 className="text-xl font-black text-white">{selectedLog.title}</h2>
              </div>
              
              <div className="flex-1 rounded-2xl bg-black/60 border border-white/[0.08] p-5 overflow-y-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                  {prettyJson(selectedLog.data)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-white/30">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                <LuScrollText className="h-10 w-10 text-white/20" />
              </div>
              <p className="text-sm font-medium">{t('developer.logs.pick')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
