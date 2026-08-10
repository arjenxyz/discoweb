'use client';

import { useState } from 'react';
import { LuSearch, LuUsers, LuGlobe, LuMail, LuShield } from 'react-icons/lu';

type UserItem = {
  id: string;
  discord_id: string;
  username: string;
  email?: string | null;
  points: number;
  role_level: number;
  created_at: string;
};

type ServerInfo = {
  discord_id: string | null;
  name: string;
  slug: string;
  invite_link?: string | null;
};

type GuildInfo = {
  discord_id: string;
  name: string;
  icon_url?: string | null;
  owner?: boolean;
  permissions?: string;
};

export default function DeveloperUserLookupPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [targetGuilds, setTargetGuilds] = useState<GuildInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) { setError('Lütfen arama terimi girin.'); return; }
    if (!/^\d{10,}$/.test(q) && q.length < 3) { setError('En az 3 karakter girin.'); return; }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setUsers([]);
    setServers([]);
    setTargetGuilds([]);

    try {
      const res = await fetch(`/api/developer/user-lookup?query=${encodeURIComponent(q)}`, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === 'not_found' ? 'Kullanıcı bulunamadı.' : data.error || 'Arama başarısız.');
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setServers(data.servers ?? []);
      setTargetGuilds(data.targetGuilds ?? data.target_guilds ?? []);
    } catch {
      setError('Arama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kullanıcı Sorgula</h1>
        <p className="text-sm text-[#99AAB5] mt-1">Discord ID veya kullanıcı adı ile arama yapın.</p>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
            <input
              type="text"
              placeholder="Discord ID veya kullanıcı adı..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:border-[#5865F2]/50 focus:outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-[#5865F2] text-white font-semibold text-sm hover:bg-[#4752C4] disabled:opacity-50 transition-all shadow-lg shadow-[#5865F2]/20"
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && !error && (
        <div className="space-y-4">
          {/* User Profiles */}
          {users.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <LuUsers className="w-4 h-4 text-[#5865F2]" />
                Kullanıcı Bilgileri
              </h2>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                        <LuUsers className="w-5 h-5 text-[#5865F2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.username || '—'}</p>
                        <p className="text-[11px] text-white/30 font-mono">{u.discord_id}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/20 font-semibold">
                        {u.points} puan
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        u.role_level >= 999 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' :
                        u.role_level >= 100 ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' :
                        'bg-white/5 text-white/50 border border-white/10'
                      }`}>
                        Seviye {u.role_level}
                      </span>
                      {u.email && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-semibold flex items-center gap-1">
                          <LuMail className="w-3 h-3" /> {u.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Servers */}
          {servers.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <LuGlobe className="w-4 h-4 text-cyan-400" />
                Uygulama Sunucuları ({servers.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {servers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <LuGlobe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{s.name}</p>
                      <p className="text-[10px] text-white/30">{s.slug}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discord Guilds */}
          {targetGuilds.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <LuShield className="w-4 h-4 text-violet-400" />
                Discord Sunucuları ({targetGuilds.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {targetGuilds.map((g) => (
                  <div key={g.discord_id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    {g.icon_url ? (
                      <img src={g.icon_url} alt="" className="w-7 h-7 rounded-lg" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-violet-300">{g.name?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white truncate">{g.name}</p>
                      {g.owner && <span className="text-[10px] text-amber-300">Sahip</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && servers.length === 0 && targetGuilds.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">Sonuç bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}
