'use client';

import { useEffect, useState } from 'react';
import { LuGlobe, LuUsers, LuChevronDown, LuSearch } from 'react-icons/lu';

type ServerWithMembers = {
  id: string;
  name: string;
  slug: string;
  discord_id: string | null;
  is_setup: boolean;
  created_at: string;
  members: Array<{ id: string; username: string | null }>;
  member_count: number;
};

export default function DeveloperAllServersPage() {
  const [servers, setServers] = useState<ServerWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/developer/servers-members', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { setError('Veriler yüklenemedi.'); return; }
        const data = await res.json();
        setServers(data.items ?? []);
      } catch { setError('Veriler yüklenemedi.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = servers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.discord_id?.includes(search)
  );

  const totalMembers = servers.reduce((sum, s) => sum + s.member_count, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sunucular & Üyeler</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{servers.length} sunucu, {totalMembers} toplam üye</p>
        </div>
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Sunucu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:border-[#5865F2]/50 focus:outline-none w-full md:w-64 transition-all"
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
        <div className="space-y-3">
          {filtered.map((server) => (
            <div key={server.id} className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-all hover:border-white/12">
              <button
                type="button"
                onClick={() => setExpandedServer(expandedServer === server.id ? null : server.id)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                  <LuGlobe className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{server.name}</p>
                  <p className="text-[11px] text-white/30 font-mono">{server.discord_id ?? 'N/A'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <LuUsers className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs font-semibold text-white/70">{server.member_count}</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    server.is_setup ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                  }`}>
                    {server.is_setup ? 'Kurulu' : 'Bekliyor'}
                  </div>
                  <LuChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expandedServer === server.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedServer === server.id && server.members.length > 0 && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {server.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-6 h-6 rounded-md bg-[#5865F2]/20 flex items-center justify-center">
                          <LuUsers className="w-3 h-3 text-[#5865F2]" />
                        </div>
                        <span className="text-xs text-white/70 truncate">{member.username ?? 'Bilinmeyen'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expandedServer === server.id && server.members.length === 0 && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <p className="mt-4 text-xs text-white/30 text-center py-4">Bu sunucuda kayıtlı üye yok.</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">Sonuç bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}
