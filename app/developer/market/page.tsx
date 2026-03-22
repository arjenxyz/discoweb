'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuTrendingUp, LuTrendingDown, LuTriangleAlert, LuZap, LuRefreshCw,
  LuBrainCircuit, LuSearch, LuUsers, LuChartBar, LuArrowUpRight,
} from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

interface Listing {
  guild_id: string;
  status: string;
  market_price: number;
  ipo_price: number;
  circuit_breaker_until: string | null;
  server_penalties?: Array<{ type: string; is_active: boolean }>;
  investor_count?: number;
}

export default function DeveloperMarketPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [countdown, setCountdown] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    setCountdown(30);
    fetch('/api/admin/market-listings', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setListings(d.listings ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
    load();
  }, [load]);

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { load(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = listings.filter(l =>
    search.trim() === '' || l.guild_id.toLowerCase().includes(search.toLowerCase())
  );

  const active = listings.filter(l => l.status === 'approved').length;
  const suspended = listings.filter(l => l.status === 'suspended').length;

  // Platform stats
  const totalMarketCap = listings.reduce((sum, l) => sum + (l.market_price ?? 0), 0);
  const avgPrice = listings.length > 0 ? Math.round(totalMarketCap / listings.length) : 0;
  const totalInvestors = listings.reduce((sum, l) => sum + (l.investor_count ?? 0), 0);

  const shimmerStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #fff 0%, #fff 35%, rgba(255,255,255,0.95) 45%, #fff 55%, #fff 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'titleShine 4s ease-in-out infinite',
  };
  const shimmerBlue: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #5865F2 0%, #5865F2 35%, #a5b4ff 45%, #5865F2 55%, #5865F2 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'titleShine 4s ease-in-out infinite',
  };

  const getPriceChange = (market: number, ipo: number) => {
    if (!ipo || ipo === 0) return null;
    return ((market - ipo) / ipo) * 100;
  };

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/85 to-[#0a0a0c]/60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 via-transparent to-emerald-500/5" />
      <div className="pointer-events-none absolute -top-32 left-1/4 w-96 h-96 bg-[#5865F2]/20 rounded-full blur-[140px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Borsa Komuta Merkezi</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              <span style={shimmerStyle}>Piyasa</span>
              <span style={shimmerBlue}> Yönetimi</span>
            </h1>
            <p className="text-sm text-white/30 mt-1">Tüm listelenen sunucular ve anlık durum</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/8 transition-all backdrop-blur-md">
            <LuRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yükleniyor...' : `Tümünü Yenile (${countdown}s)`}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Toplam Liste', value: listings.length, color: 'from-[#5865F2]/20 to-[#5865F2]/5', border: 'border-[#5865F2]/20', glow: 'bg-[#5865F2]/30' },
            { label: 'Aktif', value: active, color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', glow: 'bg-emerald-500/30' },
            { label: 'Askıya Alındı', value: suspended, color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', glow: 'bg-amber-500/30' },
          ].map(s => (
            <div key={s.label} className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} backdrop-blur-xl p-5`}>
              <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${s.glow} blur-2xl`} />
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">{s.label}</p>
              <p className="text-3xl font-black text-white">
                {loading ? <span className="inline-block w-8 h-8 bg-white/10 rounded animate-pulse" /> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Platform Stats Bar */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl px-5 py-4 mb-6 grid grid-cols-3 divide-x divide-white/8">
          <div className="flex items-center gap-3 pr-5">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2]/15 flex items-center justify-center flex-shrink-0">
              <LuChartBar className="w-4 h-4 text-[#5865F2]" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Toplam Piyasa Hacmi</p>
              <p className="text-lg font-black text-white">{loading ? '—' : totalMarketCap.toLocaleString('tr-TR')} <span className="text-xs text-white/30 font-normal">P</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <LuUsers className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Toplam Yatırımcı</p>
              <p className="text-lg font-black text-white">{loading ? '—' : totalInvestors.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <LuTrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Ortalama Fiyat</p>
              <p className="text-lg font-black text-white">{loading ? '—' : avgPrice.toLocaleString('tr-TR')} <span className="text-xs text-white/30 font-normal">P</span></p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-2.5 focus-within:border-white/15 transition-colors">
          <LuSearch className="w-4 h-4 text-white/25 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Guild ID ile filtrele..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none font-mono"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-white/30 hover:text-white/60 transition-colors">Temizle</button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          {loading ? (
            <div className="p-12 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <LuTrendingUp className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-white/30 text-sm">{search ? 'Arama sonucu bulunamadı' : 'Henüz listelenen sunucu yok'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Guild ID', 'Durum', 'Piyasa Fiyatı', 'IPO Fiyatı', 'Değişim', 'Yatırımcı', 'Ceza', ''].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] uppercase tracking-[0.18em] text-white/30 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const hasPenalty = l.server_penalties?.some(p => p.is_active);
                  const cbActive = l.circuit_breaker_until && new Date(l.circuit_breaker_until) > new Date();
                  const leftColor = l.status === 'approved' ? '#10b981' : l.status === 'suspended' ? '#f59e0b' : l.status === 'delisted' ? '#ef4444' : '#ffffff33';
                  const priceChange = getPriceChange(l.market_price, l.ipo_price);
                  const priceUp = priceChange !== null && priceChange >= 0;
                  return (
                    <tr key={l.guild_id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all group"
                      style={{ borderLeft: `2px solid ${leftColor}30` }}>
                      <td className="px-5 py-4 font-mono text-xs text-white/60 group-hover:text-white/90 transition-colors">{l.guild_id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                            l.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                            l.status === 'suspended' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                            l.status === 'delisted' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' :
                            'bg-white/10 text-white/40 border border-white/10'
                          }`}>{l.status}</span>
                          {cbActive && <LuZap className="w-3.5 h-3.5 text-orange-400 animate-pulse" title="Circuit Breaker" />}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-white font-semibold">{l.market_price?.toLocaleString('tr-TR')}</span>
                        <span className="text-white/30 text-xs ml-1">P</span>
                      </td>
                      <td className="px-5 py-4 text-white/40 text-xs">{l.ipo_price?.toLocaleString('tr-TR')} P</td>
                      <td className="px-5 py-4">
                        {priceChange !== null ? (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${priceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {priceUp ? <LuTrendingUp className="w-3.5 h-3.5" /> : <LuTrendingDown className="w-3.5 h-3.5" />}
                            {priceUp ? '+' : ''}{priceChange.toFixed(1)}%
                          </div>
                        ) : (
                          <span className="text-white/15">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-white/50">{(l.investor_count ?? 0).toLocaleString('tr-TR')}</span>
                      </td>
                      <td className="px-5 py-4">
                        {hasPenalty ? <LuTriangleAlert className="w-4 h-4 text-amber-400" /> : <span className="text-white/15">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => router.push(`/developer/market/${l.guild_id}`)}
                          className="group/btn relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/35 text-[#a5b4ff] text-xs font-bold hover:bg-[#5865F2]/35 hover:text-white transition-all">
                          <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover/btn:translate-x-full" />
                          <LuBrainCircuit className="w-3.5 h-3.5 relative" />
                          <span className="relative">AI Detay</span>
                          <LuArrowUpRight className="w-3 h-3 relative opacity-60" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="mt-3 text-[11px] text-white/20 text-center">
            {filtered.length} sonuç gösteriliyor{search ? ` · "${search}" araması` : ''} · Otomatik yenileme: {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}
