'use client';

import { useEffect, useState } from 'react';
import { LuUsers, LuSearch, LuArrowUpDown } from 'react-icons/lu';

type UserItem = {
  id: string;
  discord_id: string;
  username: string;
  points: number;
  role_level: number;
  created_at: string;
};

export default function DeveloperUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'username' | 'points' | 'role_level' | 'created_at'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/developer/users', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { setError('Veriler yüklenemedi.'); return; }
        const data = await res.json();
        setUsers(data.items ?? []);
      } catch { setError('Veriler yüklenemedi.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = users
    .filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.discord_id?.includes(search))
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === 'username') return mul * (a.username ?? '').localeCompare(b.username ?? '');
      if (sortKey === 'points') return mul * (a.points - b.points);
      if (sortKey === 'role_level') return mul * (a.role_level - b.role_level);
      return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kullanıcılar</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Sistemdeki tüm kayıtlı kullanıcılar ({users.length})</p>
        </div>
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="İsim veya Discord ID ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:border-[#5865F2]/50 focus:outline-none w-full md:w-72 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {[
                    { key: 'username' as const, label: 'Kullanıcı' },
                    { key: 'points' as const, label: 'Puan' },
                    { key: 'role_level' as const, label: 'Rol Seviyesi' },
                    { key: 'created_at' as const, label: 'Kayıt Tarihi' },
                  ].map(col => (
                    <th key={col.key} className="text-left px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors font-semibold"
                      >
                        {col.label}
                        <LuArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                          <LuUsers className="w-4 h-4 text-[#5865F2]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.username || '—'}</p>
                          <p className="text-[11px] text-white/30 font-mono">{u.discord_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-amber-300">{u.points.toLocaleString('tr-TR')}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        u.role_level >= 999 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' :
                        u.role_level >= 100 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                        'bg-white/5 text-white/50 border border-white/10'
                      }`}>
                        {u.role_level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/40">
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-white/30">
                      Sonuç bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
