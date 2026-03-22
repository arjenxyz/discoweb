'use client';

import { useEffect, useState } from 'react';
import { LuBanknote, LuFlame, LuCoins, LuRefreshCw, LuCalendar } from 'react-icons/lu';

type TreasuryData = {
  balance: number;
  total_collected: number;
  total_burned: number;
  total_dividends_paid: number;
  burn_rate: number;
  treasury_rate: number;
  recent_dividends: Array<{
    week_id: string;
    total_amount: number;
    per_lot_amount: number;
    distributed_at: string;
    triggered_by: string;
  }>;
};

const fmt = new Intl.NumberFormat('tr-TR');
const fmtPct = (n: number) => `%${(n * 100).toFixed(0)}`;

export default function AdminTreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAdvanced, setNotAdvanced] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/market/treasury');
      if (res.status === 403) { setNotAdvanced(true); return; }
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40 text-sm">Yükleniyor...</div>;

  if (notAdvanced) return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <p className="text-white/50 text-sm">Bu özellik yalnızca Yüksek Ekonomi sunucularında kullanılabilir.</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hazine</h1>
          <p className="text-white/40 text-sm mt-0.5">Sunucu hazinesi ve ekonomik akışlar</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white text-sm transition-colors">
          <LuRefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Mevcut Bakiye', value: `${fmt.format(Math.round(data.balance))} Papel`, icon: LuBanknote, color: 'text-emerald-400' },
          { label: 'Toplam Toplanan', value: `${fmt.format(Math.round(data.total_collected))} Papel`, icon: LuCoins, color: 'text-indigo-400' },
          { label: 'Toplam Yakılan', value: `${fmt.format(Math.round(data.total_burned))} Papel`, icon: LuFlame, color: 'text-red-400' },
          { label: 'Dağıtılan Temettü', value: `${fmt.format(Math.round(data.total_dividends_paid))} Papel`, icon: LuCoins, color: 'text-amber-400' },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <item.icon className={`w-5 h-5 mb-3 ${item.color}`} />
            <p className="text-[11px] text-white/40 mb-1">{item.label}</p>
            <p className="text-base font-bold text-white leading-tight">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Oranlar */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <h3 className="text-sm font-semibold text-white mb-4">Mevcut Oranlar</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-2 text-white/60">
              <LuFlame className="w-4 h-4 text-red-400" />
              Yakma Oranı
            </div>
            <span className="text-red-300 font-semibold font-mono">{fmtPct(data.burn_rate)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2 text-white/60">
              <LuBanknote className="w-4 h-4 text-emerald-400" />
              Hazine Kesintisi
            </div>
            <span className="text-emerald-300 font-semibold font-mono">{fmtPct(data.treasury_rate)}</span>
          </div>
        </div>
        <p className="text-[11px] text-white/30 mt-3">
          Her satın alımda toplam <strong className="text-white/50">{fmtPct(data.burn_rate + data.treasury_rate)}</strong> kesinti uygulanır.
          Oranları değiştirmek için <a href="/admin/economy/settings" className="text-indigo-400 hover:underline">Ekonomi Ayarları</a> sayfasını kullanın.
        </p>
      </div>

      {/* Temettü geçmişi */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <h3 className="text-sm font-semibold text-white mb-4">Temettü Geçmişi</h3>
        {data.recent_dividends.length === 0 ? (
          <p className="text-white/30 text-sm">Henüz temettü dağıtılmadı. Her Pazar 00:00 UTC'de otomatik dağıtım yapılır.</p>
        ) : (
          <div className="space-y-2">
            {data.recent_dividends.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[13px]">
                <div className="flex items-center gap-2 text-white/60">
                  <LuCalendar className="w-3.5 h-3.5" />
                  <span>{d.week_id}</span>
                  <span className="text-white/25 text-[10px] capitalize">{d.triggered_by}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium font-mono">{fmt.format(Math.round(d.total_amount))} Papel</p>
                  <p className="text-white/30 text-[11px]">{fmt.format(Math.round(d.per_lot_amount))} Papel/lot</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
