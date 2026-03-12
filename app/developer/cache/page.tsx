'use client';

import { useState, useEffect } from 'react';
import { LuHardDrive, LuTrash2, LuRefreshCw, LuDatabase, LuClock, LuActivity, LuCpu } from 'react-icons/lu';

interface CacheStats {
  totalKeys: number;
  memoryUsage: string;
  uptime: string;
  nodeMemory: string;
  heapTotal: string;
  rss: string;
}

interface CacheEntry {
  key: string;
  value: string;
  ttl: number;
  size: number;
  type: string;
}

export default function CachePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [showEntries, setShowEntries] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/cache/stats', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = await res.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/developer/cache/entries', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      // ignore
    }
  };

  const clearCache = async () => {
    try {
      setClearing(true);
      setClearMsg(null);
      const res = await fetch('/api/developer/cache/clear', { method: 'POST', credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Temizlenemedi');
      const data = await res.json();
      setClearMsg(data.message || 'Cache temizlendi.');
      await loadStats();
      if (showEntries) await loadEntries();
    } catch (err) {
      setClearMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const toggleEntries = async () => {
    if (!showEntries) await loadEntries();
    setShowEntries(!showEntries);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTTL = (ttl: number) => {
    if (ttl <= 0) return 'Süresi dolmuş';
    const m = Math.floor(ttl / 60);
    const s = ttl % 60;
    return m > 0 ? `${m}dk ${s}sn` : `${s}sn`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cache Yönetimi</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Sunucu tarafı cache istatistikleri ve yönetimi.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadStats} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all">
            <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          <button type="button" onClick={clearCache} disabled={clearing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300 hover:bg-rose-500/15 disabled:opacity-50 transition-all">
            <LuTrash2 className={`w-4 h-4 ${clearing ? 'animate-spin' : ''}`} /> Temizle
          </button>
        </div>
      </div>

      {clearMsg && (
        <div className="rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/10 p-3">
          <p className="text-sm text-[#5865F2]">{clearMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Cache Anahtarları', value: stats?.totalKeys ?? 0, icon: LuDatabase, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'from-indigo-500/20 to-indigo-600/10' },
              { label: 'Cache Boyutu', value: stats?.memoryUsage ?? '0 MB', icon: LuHardDrive, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/20 to-emerald-600/10' },
              { label: 'Uptime', value: stats?.uptime ?? '—', icon: LuClock, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'from-amber-500/20 to-amber-600/10' },
              { label: 'Heap Kullanımı', value: stats?.nodeMemory ?? '—', icon: LuActivity, color: 'text-violet-400', border: 'border-violet-500/20', bg: 'from-violet-500/20 to-violet-600/10' },
              { label: 'Heap Toplam', value: stats?.heapTotal ?? '—', icon: LuCpu, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'from-cyan-500/20 to-cyan-600/10' },
              { label: 'RSS Bellek', value: stats?.rss ?? '—', icon: LuActivity, color: 'text-pink-400', border: 'border-pink-500/20', bg: 'from-pink-500/20 to-pink-600/10' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.bg} backdrop-blur-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${card.color}`} />
                    <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{card.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Cache Entries */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <button type="button" onClick={toggleEntries} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
              <span className="text-sm font-semibold text-white">Cache Kayıtları</span>
              <span className="text-xs text-white/40">{showEntries ? 'Gizle' : 'Göster'}</span>
            </button>
            {showEntries && (
              <div className="border-t border-white/5">
                {entries.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-white/30 text-center">Cache boş.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {entries.map((entry, i) => (
                      <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-white/70 truncate">{entry.key}</p>
                          <p className="text-[10px] text-white/30 truncate">{entry.value}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className="text-[10px] text-white/30">{formatSize(entry.size)}</span>
                          <span className="text-[10px] text-amber-300/60">{formatTTL(entry.ttl)}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/5 text-white/40 border border-white/10">{entry.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
