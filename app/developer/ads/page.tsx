'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { LuMegaphone, LuTrash2 } from 'react-icons/lu';

type Ad = {
  id: string;
  invite_url: string;
  server_name: string;
  server_description?: string | null;
  server_icon?: string | null;
  member_count?: number | null;
  online_count?: number | null;
  active: boolean;
};

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [adFetching, setAdFetching] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [adSuccess, setAdSuccess] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [preview, setPreview] = useState<Omit<Ad, 'id' | 'active'> | null>(null);

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ads');
      const data = await res.json();
      if (res.ok) setAds(data.ads ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const fetchInviteInfo = async (url: string) => {
    const match = url.match(/discord(?:\.gg|app\.com\/invite|\.com\/invite)\/([A-Za-z0-9-]+)/);
    if (!match) { setPreview(null); return; }
    const code = match[1];
    setAdFetching(true);
    setAdError(null);
    try {
      const res = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`);
      if (!res.ok) throw new Error('Geçersiz veya süresi dolmuş davet linki.');
      const data = await res.json() as {
        guild?: { name?: string; description?: string | null; icon?: string | null; id?: string };
        approximate_member_count?: number;
        approximate_presence_count?: number;
      };
      const guild = data.guild;
      if (!guild) throw new Error('Sunucu bilgisi alınamadı.');
      setPreview({
        invite_url: url,
        server_name: guild.name ?? '',
        server_description: guild.description ?? null,
        server_icon: guild.icon && guild.id
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=128`
          : null,
        member_count: data.approximate_member_count ?? null,
        online_count: data.approximate_presence_count ?? null,
      });
    } catch (e) {
      setAdError(e instanceof Error ? e.message : 'Davet bilgisi alınırken hata oluştu.');
      setPreview(null);
    } finally {
      setAdFetching(false);
    }
  };

  const submitAd = async () => {
    if (!preview) return;
    setAdLoading(true); setAdError(null); setAdSuccess(false);
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      const data = await res.json() as { ad?: Ad; error?: string };
      if (!res.ok) throw new Error(data.error ?? `${res.status}`);
      setAdSuccess(true); setInviteUrl(''); setPreview(null);
      if (data.ad) setAds(prev => [data.ad!, ...prev.map(a => ({ ...a, active: false }))]);
    } catch (e) {
      setAdError(e instanceof Error ? e.message : String(e));
    } finally { setAdLoading(false); }
  };

  const deleteAd = async (id: string) => {
    if (!window.confirm('Bu reklamı silmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/api/admin/ads?id=${id}`, { method: 'DELETE' });
      setAds(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20">
          <LuMegaphone className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reklamlar</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Platformdaki vitrin sunucu reklamlarını yönetin.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Yeni Ekle */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5">
          <p className="text-sm font-semibold text-white mb-3">Yeni Reklam Ekle</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Discord Davet Linki" value={inviteUrl}
              onChange={e => { setInviteUrl(e.target.value); setAdSuccess(false); setAdError(null); setPreview(null); }}
              onBlur={e => { if (e.target.value) fetchInviteInfo(e.target.value); }}
              className="flex-1 min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#5865F2]/40" />
            <button onClick={() => fetchInviteInfo(inviteUrl)} disabled={adFetching || !inviteUrl}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs text-white/60 transition hover:text-white disabled:opacity-40">
              {adFetching ? '...' : 'Sorgula'}
            </button>
          </div>

          {preview && (
            <div className="mt-3 rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/5 p-3 flex flex-wrap items-center gap-3">
              {preview.server_icon ? (
                <Image src={preview.server_icon} alt={preview.server_name} width={40} height={40} className="rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-white/40 text-xs">Yok</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{preview.server_name}</p>
                <div className="flex gap-3 text-[10px] text-white/50 mt-1">
                  <span>{preview.member_count} Üye</span>
                  <span>{preview.online_count} Çevrimiçi</span>
                </div>
              </div>
              <button onClick={submitAd} disabled={adLoading}
                className="shrink-0 rounded-xl bg-[#5865F2] hover:bg-[#5865F2]/90 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
                {adLoading ? 'Ekleniyor...' : 'Ekle ve Aktif Et'}
              </button>
            </div>
          )}

          {adError && <p className="mt-3 text-xs text-red-400">{adError}</p>}
          {adSuccess && <p className="mt-3 text-xs text-emerald-400">Reklam eklendi ve aktif edildi.</p>}
        </div>

        {/* Liste */}
        <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
          {ads.map((ad) => (
            <div key={ad.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 transition-all ${ad.active ? 'border-pink-500/30 bg-pink-500/10' : 'border-white/10 bg-[#0b0d12]'}`}>
              {ad.server_icon ? (
                <Image src={ad.server_icon} alt={ad.server_name} width={40} height={40} className="rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-white/40 text-xs">Yok</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{ad.server_name}</p>
                  {ad.active && <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-300 uppercase">Aktif</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-white/50 mt-1">
                  <span>{ad.member_count} Üye</span>
                  <span>{ad.online_count} Çevrimiçi</span>
                  <a href={ad.invite_url} target="_blank" rel="noreferrer" className="text-[#5865F2] hover:underline">Davet Linki</a>
                </div>
              </div>
              <button onClick={() => deleteAd(ad.id)}
                className="shrink-0 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition">
                <LuTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {ads.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-white/25">
              <LuMegaphone className="w-8 h-8" />
              <p className="text-xs">Hiç reklam yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
