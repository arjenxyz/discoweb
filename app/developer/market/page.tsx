'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuTrendingUp, LuTriangleAlert, LuZap } from 'react-icons/lu';

interface Listing {
  guild_id: string;
  status: string;
  market_price: number;
  ipo_price: number;
  circuit_breaker_until: string | null;
  server_penalties?: Array<{ type: string; is_active: boolean }>;
}

export default function DeveloperMarketPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/market-listings', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setListings(d.listings ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Borsa Listeleri</h1>
          <p className="text-sm text-white/40 mt-1">Tüm listelenen sunucular</p>
        </div>
        <LuTrendingUp className="w-6 h-6 text-emerald-400" />
      </div>

      <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40">Yükleniyor...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Guild ID</th>
                <th className="px-6 py-4 text-left">Durum</th>
                <th className="px-6 py-4 text-right">Piyasa Fiyatı</th>
                <th className="px-6 py-4 text-right">IPO Fiyatı</th>
                <th className="px-6 py-4 text-center">Ceza</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.guild_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-white/70">{l.guild_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        l.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' :
                        l.status === 'suspended' ? 'bg-amber-500/15 text-amber-300' :
                        l.status === 'delisted' ? 'bg-rose-500/15 text-rose-300' :
                        'bg-white/10 text-white/50'
                      }`}>{l.status}</span>
                      {l.circuit_breaker_until && new Date(l.circuit_breaker_until) > new Date() && (
                        <LuZap className="w-3.5 h-3.5 text-orange-400" title="Circuit Breaker aktif" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white/80">{l.market_price?.toLocaleString('tr-TR')} P</td>
                  <td className="px-6 py-4 text-right text-white/50">{l.ipo_price?.toLocaleString('tr-TR')} P</td>
                  <td className="px-6 py-4 text-center">
                    {l.server_penalties?.some(p => p.is_active) ? (
                      <LuTriangleAlert className="w-4 h-4 text-amber-400 mx-auto" />
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/developer/market/${l.guild_id}`)}
                      className="text-xs text-[#5865F2] hover:text-[#7289DA] font-medium transition-colors"
                    >
                      AI Analiz →
                    </button>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30">Henüz listelenen sunucu yok</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
