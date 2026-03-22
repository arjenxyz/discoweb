'use client';

import { useEffect, useState } from 'react';
import {
  LuTrendingUp, LuTrendingDown, LuUsers, LuCoins, LuRefreshCw,
  LuTriangleAlert, LuShield, LuClock, LuArrowUpRight, LuArrowDownRight,
} from 'react-icons/lu';

type ListingData = {
  status: string;
  market_price: number | null;
  base_price: number | null;
  ipo_price: number | null;
  total_lots: number;
  founder_lots: number;
  public_lots: number;
  founder_vested_lots: number;
  listed_at: string | null;
  circuit_breaker_until: string | null;
  investor_count: number;
  total_traded_volume: number;
  price_change_24h: number | null;
  active_penalties: Array<{ type: string; reason: string; issued_at: string }>;
  active_events: Array<{ title: string; type: string; price_impact: number }>;
  recent_trades: Array<{ lot_count: number; price_per_lot: number; traded_at: string; type: 'buy' | 'sell' }>;
};

const fmt = new Intl.NumberFormat('tr-TR');
const fmtPrice = (n: number | null) => n != null ? fmt.format(Math.round(n)) : '—';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved:  { label: 'Aktif',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  pending:   { label: 'Onay Bekliyor', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  suspended: { label: 'Askıya Alındı', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  delisted:  { label: 'Delist',      color: 'text-white/30 bg-white/5 border-white/10' },
};

export default function AdminMarketPage() {
  const [data, setData] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAdvanced, setNotAdvanced] = useState(false);
  const [noListing, setNoListing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/market/listing');
      if (res.status === 403) { setNotAdvanced(true); return; }
      if (res.status === 404) { setNoListing(true); return; }
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/40 text-sm">Yükleniyor...</div>
  );

  if (notAdvanced) return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
        <LuTrendingUp className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Yüksek Ekonomi Gerekli</h2>
      <p className="text-white/50 text-sm mb-6">Borsa özelliklerini kullanmak için Yüksek Ekonomi'ye geçmeniz gerekiyor.</p>
      <a href="/admin/settings" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-colors">
        Başvuru Yap
      </a>
    </div>
  );

  if (noListing) return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <LuTrendingUp className="w-8 h-8 text-white/30" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Henüz Borsada Değilsiniz</h2>
      <p className="text-white/50 text-sm mb-6">IPO başvurusu yaparak sunucunuzu yatırım borsasına ekleyin.</p>
      <a href="/admin/market/ipo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-colors">
        IPO Başvurusu Yap
      </a>
    </div>
  );

  if (!data) return null;

  const statusInfo = STATUS_LABELS[data.status] ?? { label: data.status, color: 'text-white/40 bg-white/5 border-white/10' };
  const priceChangeUp = (data.price_change_24h ?? 0) >= 0;
  const circuitActive = data.circuit_breaker_until && new Date(data.circuit_breaker_until) > new Date();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Borsa Durumu</h1>
          <p className="text-white/40 text-sm mt-0.5">Sunucunuzun piyasa bilgileri</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white text-sm transition-colors">
          <LuRefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Uyarılar */}
      {circuitActive && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-300">
          <LuTriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Devre kesici aktif — alım/satım duraklatıldı. <strong>{new Date(data.circuit_breaker_until!).toLocaleString('tr-TR')}</strong> tarihinde kaldırılacak.</span>
        </div>
      )}
      {data.active_penalties.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-300">
          <LuShield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><strong>{data.active_penalties.length}</strong> aktif ceza uygulanıyor. Lot fiyatını olumsuz etkiliyor.</span>
        </div>
      )}

      {/* Ana istatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Piyasa Fiyatı', value: `${fmtPrice(data.market_price)} Papel`, sub: data.price_change_24h != null ? `24s: ${priceChangeUp ? '+' : ''}${data.price_change_24h.toFixed(1)}%` : null, icon: priceChangeUp ? LuTrendingUp : LuTrendingDown, color: priceChangeUp ? 'text-emerald-400' : 'text-red-400' },
          { label: 'IPO Fiyatı', value: `${fmtPrice(data.ipo_price)} Papel`, sub: 'başlangıç fiyatı', icon: LuCoins, color: 'text-indigo-400' },
          { label: 'Yatırımcı', value: fmt.format(data.investor_count), sub: 'aktif yatırımcı', icon: LuUsers, color: 'text-purple-400' },
          { label: 'Toplam Hacim', value: `${fmt.format(data.total_traded_volume)} lot`, sub: 'tüm zamanlar', icon: LuArrowUpRight, color: 'text-cyan-400' },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <item.icon className={`w-5 h-5 mb-3 ${item.color}`} />
            <p className="text-[11px] text-white/40 mb-1">{item.label}</p>
            <p className="text-lg font-bold text-white leading-tight">{item.value}</p>
            {item.sub && <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Lot dağılımı */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white mb-4">Lot Dağılımı</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Toplam Arz', value: fmt.format(data.total_lots), color: 'bg-white/20' },
              { label: 'Founder Payı', value: fmt.format(data.founder_lots), pct: data.founder_lots / data.total_lots, color: 'bg-indigo-500' },
              { label: 'Halka Açık', value: fmt.format(data.public_lots), pct: data.public_lots / data.total_lots, color: 'bg-emerald-500' },
              { label: 'Vested (Satılabilir)', value: fmt.format(data.founder_vested_lots), pct: data.founder_vested_lots / data.total_lots, color: 'bg-amber-500' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-white/50">{row.label}</span>
                  <span className="text-white font-medium font-mono">{row.value}</span>
                </div>
                {row.pct != null && (
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.pct * 100).toFixed(1)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Son işlemler */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white mb-4">Son İşlemler</h3>
          {data.recent_trades.length === 0 ? (
            <p className="text-white/30 text-sm">Henüz işlem yok.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_trades.slice(0, 6).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    {t.type === 'buy'
                      ? <LuArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      : <LuArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                    <span className="text-white/60">{fmt.format(t.lot_count)} lot</span>
                  </div>
                  <span className="text-white font-mono">{fmtPrice(t.price_per_lot)} Papel</span>
                  <span className="text-white/30"><LuClock className="w-3 h-3 inline mr-1" />{new Date(t.traded_at).toLocaleDateString('tr-TR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aktif cezalar */}
      {data.active_penalties.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white mb-4">Aktif Cezalar</h3>
          <div className="space-y-2">
            {data.active_penalties.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[13px]">
                <LuShield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-300 font-medium capitalize">{p.type}</span>
                  {p.reason && <span className="text-white/50 ml-2">— {p.reason}</span>}
                  <p className="text-white/30 text-[11px] mt-0.5">{new Date(p.issued_at).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aktif olaylar */}
      {data.active_events.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white mb-4">Aktif Piyasa Olayları</h3>
          <div className="space-y-2">
            {data.active_events.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[13px]">
                <span className="text-white/70">{e.title}</span>
                <span className={`font-mono font-medium ${e.price_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {e.price_impact >= 0 ? '+' : ''}{(e.price_impact * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Durum badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {data.listed_at && (
          <span className="text-white/30 text-xs">
            <LuClock className="w-3 h-3 inline mr-1" />
            Listede: {new Date(data.listed_at).toLocaleDateString('tr-TR')}
          </span>
        )}
      </div>
    </div>
  );
}
