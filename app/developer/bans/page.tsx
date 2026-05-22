'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuShield, LuSearch, LuX } from 'react-icons/lu';

type BanScope = 'member' | 'server';

type MemberBan = {
  id: string;
  user_id: string;
  guild_id: string | null;
  reason: string | null;
  created_by: string;
  expires_at: string | null;
  lifted_at: string | null;
  lifted_by: string | null;
  metadata: any;
  created_at: string;
};

type ServerBan = {
  id: string;
  guild_id: string;
  reason: string | null;
  created_by: string;
  expires_at: string | null;
  lifted_at: string | null;
  lifted_by: string | null;
  metadata: any;
  created_at: string;
};

export default function BansPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'server'>('member');
  const [memberBans, setMemberBans] = useState<MemberBan[]>([]);
  const [serverBans, setServerBans] = useState<ServerBan[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [memberForm, setMemberForm] = useState({ userId: '', guildId: '', reason: '', expiresAt: '' });
  const [memberBanMode, setMemberBanMode] = useState<'permanent' | 'temporary'>('permanent');
  const [serverForm, setServerForm] = useState({ guildId: '', reason: '', expiresAt: '' });
  const [serverBanMode, setServerBanMode] = useState<'permanent' | 'temporary'>('permanent');
  const [liftingId, setLiftingId] = useState<string | null>(null);

  const fetchBans = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/bans?type=all&active=${activeOnly}`, { cache: 'no-store' });
      const data = await res.json() as { member?: MemberBan[]; server?: ServerBan[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setMemberBans(data.member ?? []);
      setServerBans(data.server ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const toIsoOrNull = (value: string) => (value ? new Date(value).toISOString() : null);

  const createMemberBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.userId.trim()) return;
    if (memberBanMode === 'temporary' && !memberForm.expiresAt) {
      setError('Geçici üye banı için bitiş tarihi zorunludur.'); return;
    }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/admin/bans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'member',
          userId: memberForm.userId.trim(),
          guildId: memberForm.guildId.trim() || undefined,
          reason: memberForm.reason.trim() || undefined,
          expiresAt: memberBanMode === 'temporary' ? toIsoOrNull(memberForm.expiresAt) : null,
          metadata: { ban_mode: memberBanMode },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? String(res.status));
      setMemberForm({ userId: '', guildId: '', reason: '', expiresAt: '' });
      await fetchBans();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const createServerBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverForm.guildId.trim()) return;
    if (serverBanMode === 'temporary' && !serverForm.expiresAt) {
      setError('Geçici sunucu banı için bitiş tarihi zorunludur.'); return;
    }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/admin/bans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'server',
          guildId: serverForm.guildId.trim(),
          reason: serverForm.reason.trim() || undefined,
          expiresAt: serverBanMode === 'temporary' ? toIsoOrNull(serverForm.expiresAt) : null,
          metadata: { ban_mode: serverBanMode },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? String(res.status));
      setServerForm({ guildId: '', reason: '', expiresAt: '' });
      await fetchBans();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const liftBan = async (type: BanScope, id: string) => {
    if (!window.confirm('Bu yasağı kaldırmak istediğinize emin misiniz?')) return;
    setLiftingId(id); setError(null);
    try {
      const res = await fetch('/api/admin/bans', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? String(res.status));
      await fetchBans();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLiftingId(null);
    }
  };

  const applySearch = <T extends MemberBan | ServerBan>(rows: T[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const keys = ['user_id' in r ? r.user_id : '', r.guild_id ?? '', r.reason ?? ''].join(' ').toLowerCase();
      return keys.includes(q);
    });
  };

  const visibleMemberBans = applySearch(memberBans);
  const visibleServerBans = applySearch(serverBans);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
          <LuShield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Yasaklamalar</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Platformdan uzaklaştırılan kullanıcıları ve sunucuları yönetin.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10">
        <button onClick={() => setActiveTab('member')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'member' ? 'border-[#5865F2] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          Kullanıcı Yasakları
        </button>
        <button onClick={() => setActiveTab('server')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'server' ? 'border-[#5865F2] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          Sunucu Yasakları
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-5">{activeTab === 'member' ? 'Kullanıcı Yasakla' : 'Sunucu Yasakla'}</h2>
          
          {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          {activeTab === 'member' ? (
            <form onSubmit={createMemberBan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Kullanıcı ID (Zorunlu)</label>
                <input required type="text" value={memberForm.userId} onChange={e => setMemberForm(p => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Sunucu ID (Opsiyonel, yerel yasaklama için)</label>
                <input type="text" value={memberForm.guildId} onChange={e => setMemberForm(p => ({ ...p, guildId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Yasaklama Modu</label>
                <select value={memberBanMode} onChange={e => setMemberBanMode(e.target.value as 'permanent' | 'temporary')}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none">
                  <option value="permanent">Süresiz</option>
                  <option value="temporary">Geçici</option>
                </select>
              </div>
              {memberBanMode === 'temporary' && (
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Bitiş Tarihi</label>
                  <input type="datetime-local" required value={memberForm.expiresAt} onChange={e => setMemberForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Sebep</label>
                <textarea value={memberForm.reason} onChange={e => setMemberForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none min-h-[80px]" />
              </div>
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50">
                {submitting ? 'İşleniyor...' : 'Kullanıcıyı Yasakla'}
              </button>
            </form>
          ) : (
            <form onSubmit={createServerBan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Sunucu ID (Zorunlu)</label>
                <input required type="text" value={serverForm.guildId} onChange={e => setServerForm(p => ({ ...p, guildId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Yasaklama Modu</label>
                <select value={serverBanMode} onChange={e => setServerBanMode(e.target.value as 'permanent' | 'temporary')}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none">
                  <option value="permanent">Süresiz</option>
                  <option value="temporary">Geçici</option>
                </select>
              </div>
              {serverBanMode === 'temporary' && (
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Bitiş Tarihi</label>
                  <input type="datetime-local" required value={serverForm.expiresAt} onChange={e => setServerForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Sebep</label>
                <textarea value={serverForm.reason} onChange={e => setServerForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none min-h-[80px]" />
              </div>
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50">
                {submitting ? 'İşleniyor...' : 'Sunucuyu Yasakla'}
              </button>
            </form>
          )}
        </div>

        {/* List Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0b0d12]/80 backdrop-blur-md p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="ID veya sebep ile ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded border-white/10 bg-black/30" />
              <span className="text-sm font-medium text-white/70">Sadece Aktif Yasaklar</span>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-sm text-white/40 text-center py-8">Yükleniyor...</p>
            ) : (activeTab === 'member' ? visibleMemberBans : visibleServerBans).length > 0 ? (
              <div className="flex flex-col gap-3">
                {(activeTab === 'member' ? visibleMemberBans : visibleServerBans).map((ban) => {
                  const isActive = !ban.lifted_at && (!ban.expires_at || new Date(ban.expires_at) > new Date());
                  return (
                    <div key={ban.id} className={`rounded-2xl border p-4 ${isActive ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/5 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-bold text-white">
                            {'user_id' in ban ? `Kullanıcı: ${ban.user_id}` : `Sunucu: ${ban.guild_id}`}
                          </p>
                          {'user_id' in ban && ban.guild_id && <p className="text-[11px] text-white/40">Yerel Sunucu: {ban.guild_id}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Aktif</span>
                          ) : (
                            <span className="bg-white/10 text-white/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Kalkmış</span>
                          )}
                          {isActive && (
                            <button onClick={() => liftBan(activeTab, ban.id)} disabled={liftingId === ban.id}
                              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold transition">
                              {liftingId === ban.id ? '...' : 'Yasağı Kaldır'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {ban.reason && <p className="text-sm text-white/70 bg-black/40 p-3 rounded-xl border border-white/5 mb-3">{ban.reason}</p>}
                      
                      <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
                        <span className="bg-black/30 px-2 py-1 rounded-md">Oluşturan: {ban.created_by}</span>
                        <span className="bg-black/30 px-2 py-1 rounded-md">Tarih: {new Date(ban.created_at).toLocaleString('tr-TR')}</span>
                        {ban.expires_at && <span className="bg-amber-500/10 text-amber-300 px-2 py-1 rounded-md">Bitiş: {new Date(ban.expires_at).toLocaleString('tr-TR')}</span>}
                        {ban.lifted_at && <span className="bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-md">Kaldırılma: {new Date(ban.lifted_at).toLocaleString('tr-TR')} ({ban.lifted_by})</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-8">Yasaklama kaydı bulunamadı.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
