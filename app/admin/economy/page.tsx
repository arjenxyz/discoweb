'use client';

import { useEffect, useState } from 'react';
import {
  LuCoins,
  LuTrendingUp,
  LuTrendingDown,
  LuWallet,
  LuUsers,
  LuRefreshCw,
  LuChartBar,
  LuActivity,
} from 'react-icons/lu';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

type EconomyData = {
  totalCirculation: number;
  totalWallets: number;
  avgBalance: number;
  gini: number;
  todayEarnings: number;
  todaySpending: number;
  distribution: Array<{ range: string; count: number }>;
  topWallets: Array<{ userId: string; balance: number }>;
  trend: Array<{ date: string; earnings: number; spending: number }>;
  inflationRate: number | null;
  participationRate: number;
  earningSpendingRatio: number | null;
  trendDays: number;
};

const fmt = new Intl.NumberFormat('tr-TR');
const fmtDecimal = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116] p-5 transition hover:border-white/20">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl ${color}`} />
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.replace('bg-', 'bg-').replace('500', '500/15')} ${color.replace('bg-', 'text-').replace('500', '300')}`}>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
}

function HealthBadge({ value, label, good, warning }: { value: number | null; label: string; good: string; warning: string }) {
  if (value == null) return null;
  const isGood = value <= 1.5;
  const isWarning = value > 1.5 && value <= 3;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
      isGood ? 'border-emerald-500/20 bg-emerald-500/5' : isWarning ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'
    }`}>
      <div className={`h-2.5 w-2.5 rounded-full ${isGood ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-red-400'}`} />
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className={`text-xs ${isGood ? 'text-emerald-300/70' : isWarning ? 'text-amber-300/70' : 'text-red-300/70'}`}>
          {isGood ? good : warning}
        </p>
      </div>
    </div>
  );
}

export default function EconomyOverviewPage() {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendDays, setTrendDays] = useState(7);

  const fetchData = async (days: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/economy?trendDays=${days}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.warn('Ekonomi verisi alınamadı:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData(trendDays);
  }, [trendDays]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#5865F2]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/50">
        Ekonomi verileri yüklenemedi.
      </div>
    );
  }

  const giniLabel = data.gini < 0.3 ? 'Eşit dağılım' : data.gini < 0.5 ? 'Orta eşitsizlik' : 'Yüksek eşitsizlik';
  const giniColor = data.gini < 0.3 ? 'text-emerald-400' : data.gini < 0.5 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ekonomi Paneli</h1>
          <p className="mt-1 text-sm text-white/40">Sunucu ekonomisinin genel durumu ve analizi</p>
        </div>
        <button
          onClick={() => fetchData(trendDays, true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
        >
          <LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<LuCoins className="h-5 w-5" />}
          label="Toplam Dolaşım"
          value={`${fmtDecimal.format(data.totalCirculation)} ₽`}
          color="bg-yellow-500"
        />
        <StatCard
          icon={<LuTrendingUp className="h-5 w-5" />}
          label="Bugünkü Kazanç"
          value={`+${fmtDecimal.format(data.todayEarnings)} ₽`}
          sub="Mesaj + ses kazançları"
          color="bg-emerald-500"
        />
        <StatCard
          icon={<LuTrendingDown className="h-5 w-5" />}
          label="Bugünkü Harcama"
          value={`-${fmtDecimal.format(data.todaySpending)} ₽`}
          sub="Mağaza alımları"
          color="bg-red-500"
        />
        <StatCard
          icon={<LuWallet className="h-5 w-5" />}
          label="Aktif Cüzdan"
          value={fmt.format(data.totalWallets)}
          sub={`Ort: ${fmtDecimal.format(data.avgBalance)} ₽`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<LuChartBar className="h-5 w-5" />}
          label="Gini Katsayısı"
          value={data.gini.toFixed(3)}
          sub={giniLabel}
          color={data.gini < 0.3 ? 'bg-emerald-500' : data.gini < 0.5 ? 'bg-amber-500' : 'bg-red-500'}
        />
      </div>

      {/* Sağlık Göstergeleri */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.inflationRate != null && (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            data.inflationRate <= 5 ? 'border-emerald-500/20 bg-emerald-500/5' :
            data.inflationRate <= 15 ? 'border-amber-500/20 bg-amber-500/5' :
            'border-red-500/20 bg-red-500/5'
          }`}>
            <div className={`h-2.5 w-2.5 rounded-full ${
              data.inflationRate <= 5 ? 'bg-emerald-400' : data.inflationRate <= 15 ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <div>
              <p className="text-sm font-medium text-white">Haftalık Enflasyon: %{data.inflationRate.toFixed(1)}</p>
              <p className={`text-xs ${data.inflationRate <= 5 ? 'text-emerald-300/70' : data.inflationRate <= 15 ? 'text-amber-300/70' : 'text-red-300/70'}`}>
                {data.inflationRate <= 5 ? 'Sağlıklı seviyede' : data.inflationRate <= 15 ? 'Takip edilmeli' : 'Müdahale gerekebilir'}
              </p>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          data.participationRate >= 30 ? 'border-emerald-500/20 bg-emerald-500/5' :
          data.participationRate >= 10 ? 'border-amber-500/20 bg-amber-500/5' :
          'border-red-500/20 bg-red-500/5'
        }`}>
          <LuUsers className={`h-4 w-4 ${
            data.participationRate >= 30 ? 'text-emerald-400' : data.participationRate >= 10 ? 'text-amber-400' : 'text-red-400'
          }`} />
          <div>
            <p className="text-sm font-medium text-white">Katılım Oranı: %{data.participationRate.toFixed(1)}</p>
            <p className={`text-xs ${data.participationRate >= 30 ? 'text-emerald-300/70' : data.participationRate >= 10 ? 'text-amber-300/70' : 'text-red-300/70'}`}>
              Son 7 günde aktif kullanıcı oranı
            </p>
          </div>
        </div>
        {data.earningSpendingRatio != null && (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            data.earningSpendingRatio <= 2 ? 'border-emerald-500/20 bg-emerald-500/5' :
            data.earningSpendingRatio <= 5 ? 'border-amber-500/20 bg-amber-500/5' :
            'border-red-500/20 bg-red-500/5'
          }`}>
            <LuActivity className={`h-4 w-4 ${
              data.earningSpendingRatio <= 2 ? 'text-emerald-400' : data.earningSpendingRatio <= 5 ? 'text-amber-400' : 'text-red-400'
            }`} />
            <div>
              <p className="text-sm font-medium text-white">Kazanç/Harcama: {data.earningSpendingRatio.toFixed(2)}x</p>
              <p className={`text-xs ${data.earningSpendingRatio <= 2 ? 'text-emerald-300/70' : data.earningSpendingRatio <= 5 ? 'text-amber-300/70' : 'text-red-300/70'}`}>
                {data.earningSpendingRatio <= 2 ? 'Dengeli ekonomi' : 'Enflasyonist eğilim'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trend Grafiği */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Günlük Kazanç vs Harcama Trendi</h2>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  trendDays === d ? 'bg-[#5865F2] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {d} gün
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={v => v.slice(5)}
                stroke="rgba(255,255,255,0.1)"
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip
                contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                formatter={(v, name) => [fmtDecimal.format(Number(v)) + ' ₽', name === 'earnings' ? 'Kazanç' : 'Harcama']}
                labelFormatter={v => v}
              />
              <Legend formatter={v => v === 'earnings' ? 'Kazanç' : 'Harcama'} />
              <Line type="monotone" dataKey="earnings" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="spending" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alt Grid: Bakiye Dağılımı + En Zenginler */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bakiye Dağılımı Histogram */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Bakiye Dağılımı</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip
                  contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                  formatter={(v) => [fmt.format(Number(v)) + ' kullanıcı', 'Sayı']}
                />
                <Bar dataKey="count" fill="#5865F2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* En Zengin 10 Kullanıcı */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">En Zengin 10 Kullanıcı</h2>
          <div className="space-y-2">
            {data.topWallets.map((w, i) => (
              <div key={w.userId} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-amber-600/20 text-amber-400' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-mono text-sm text-white/70">{w.userId}</span>
                </div>
                <span className="font-semibold text-white">{fmtDecimal.format(w.balance)} ₽</span>
              </div>
            ))}
            {data.topWallets.length === 0 && (
              <p className="py-8 text-center text-sm text-white/30">Henüz cüzdan verisi yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
