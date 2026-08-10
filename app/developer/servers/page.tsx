'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { LuDatabase, LuSearch, LuCheck, LuX } from 'react-icons/lu';

type ServerItem = {
  id: string;
  name: string;
  slug: string;
  discord_id: string | null;
  is_setup: boolean;
  created_at: string;
};

export default function DeveloperServersPage() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loadingInvites, setLoadingInvites] = useState<Record<string, boolean>>({});
  const [leavingGuilds, setLeavingGuilds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/developer/servers', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { setError(t('developer.common.load_failed')); return; }
        const data = await res.json();
        setServers(data.items ?? []);
      } catch { setError(t('developer.common.load_failed')); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreateInvite = async (guildId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingInvites[guildId]) return;

    setLoadingInvites(prev => ({ ...prev, [guildId]: true }));
    try {
      const res = await fetch(`/api/developer/invite?guild_id=${guildId}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t('developer.servers.invite_failed'));
        return;
      }
      window.open(data.invite_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(t('developer.common.error_generic'));
    } finally {
      setLoadingInvites(prev => ({ ...prev, [guildId]: false }));
    }
  };

  const handleLeaveGuild = async (guildId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (leavingGuilds[guildId]) return;

    if (!window.confirm(t('developer.servers.confirm_leave'))) {
      return;
    }

    setLeavingGuilds(prev => ({ ...prev, [guildId]: true }));
    try {
      const res = await fetch('/api/developer/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: guildId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t('developer.servers.leave_failed'));
        return;
      }
      alert(t('developer.servers.leave_success'));
    } catch (err) {
      alert(t('developer.common.error_generic'));
    } finally {
      setLeavingGuilds(prev => ({ ...prev, [guildId]: false }));
    }
  };

  const filtered = servers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.discord_id?.includes(search) || s.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('developer.servers.title')}</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{t('developer.servers.subtitle', { count: servers.length })}</p>
        </div>
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={t('developer.servers.search_placeholder')}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((server) => (
            <div key={server.id} className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-white/15 transition-all flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <LuDatabase className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{server.name}</p>
                  <p className="text-[11px] text-white/30 font-mono truncate">{server.discord_id ?? 'N/A'}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                  server.is_setup ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                }`}>
                  {server.is_setup ? <LuCheck className="w-3 h-3" /> : <LuX className="w-3 h-3" />}
                  {server.is_setup ? t('developer.servers.installed') : t('developer.servers.pending')}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {server.discord_id && (
                    <>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleLeaveGuild(server.discord_id!, e)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLeaveGuild(server.discord_id!, e as any) }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                          leavingGuilds[server.discord_id!] 
                            ? 'bg-rose-500/10 text-rose-500/50 border-rose-500/10 cursor-wait'
                            : 'bg-rose-500/15 text-rose-500 border-rose-500/20 hover:bg-rose-500/25 cursor-pointer'
                        }`}
                      >
                        {leavingGuilds[server.discord_id!] ? t('developer.servers.leaving') : t('developer.servers.leave')}
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleCreateInvite(server.discord_id!, e)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateInvite(server.discord_id!, e as any) }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                          loadingInvites[server.discord_id!] 
                            ? 'bg-[#5865F2]/10 text-[#5865F2]/50 border-[#5865F2]/10 cursor-wait'
                            : 'bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/20 hover:bg-[#5865F2]/25 cursor-pointer'
                        }`}
                      >
                        {loadingInvites[server.discord_id!] ? t('developer.servers.getting_invite') : t('developer.servers.get_invite')}
                      </div>
                    </>
                  )}
                  <span className="text-[11px] text-white/30">Slug: {server.slug}</span>
                </div>
                <span className="text-[11px] text-white/30">{new Date(server.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-white/30">{t('developer.common.not_found')}</div>
          )}
        </div>
      )}
    </div>
  );
}
