'use client';

import { useEffect, useState } from 'react';
import {
  LuCalculator,
  LuRefreshCw,
  LuTriangleAlert,
  LuCircleCheck,
  LuInfo,
  LuCoins,
  LuMessageSquare,
  LuMic,
  LuUsers,
  LuArrowRight,
} from 'react-icons/lu';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type SimulationData = {
  currentState: {
    circulation: number;
    walletCount: number;
    earnPerMessage: number;
    earnPerVoice: number;
    tagCount: number;
    boosterCount: number;
    transferTaxRate: number;
    transferDailyLimit: number;
  };
  averages: {
    dailyMessages: number;
    dailyVoiceMinutes: number;
    dailyEarnings: number;
    dailySpending: number;
  };
  simulation: {
    days: number;
    projectedEarnings: number;
    projectedSpending: number;
    netChange: number;
    projectedCirculation: number;
  };
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
  }>;
};

const fmt = new Intl.NumberFormat('tr-TR');
const fmtDecimal = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REC_ICONS = {
  warning: <LuTriangleAlert className="h-5 w-5 text-amber-400" />,
  info: <LuInfo className="h-5 w-5 text-blue-400" />,
  success: <LuCircleCheck className="h-5 w-5 text-emerald-400" />,
};

const REC_STYLES = {
  warning: 'border-amber-500/20 bg-amber-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
  success: 'border-emerald-500/20 bg-emerald-500/5',
};

export default function EconomySettingsPage() {
  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSimulation = async (d: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/economy/simulate?days=${d}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.warn('Simülasyon verisi alınamadı:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadSimulation = async () => {
      await fetchSimulation(days);
    };
    void loadSimulation();
  }, [days]);

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
        Simülasyon verileri yüklenemedi.
      </div>
    );
  }

  const { currentState, averages, simulation, recommendations } = data;

  // Projeksiyon grafiği verisi oluştur
  const projectionData = Array.from({ length: simulation.days + 1 }, (_, i) => ({
    day: i,
    circulation: Math.round((currentState.circulation + (simulation.netChange / simulation.days) * i) * 100) / 100,
    earnings: Math.round((averages.dailyEarnings * i) * 100) / 100,
    spending: Math.round((averages.dailySpending * i) * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Simülasyon & Öneriler</h1>
          <p className="mt-1 text-sm text-white/40">Ekonomi projeksiyonu ve akıllı öneriler</p>
        </div>
        <button
          onClick={() => fetchSimulation(days, true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
        >
          <LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Mevcut Ayarlar Özeti */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Mevcut Ekonomi Ayarları</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-white/40">
              <LuMessageSquare className="h-4 w-4" />
              <span className="text-xs">Mesaj Başına</span>
            </div>
            <p className="mt-1 text-lg font-bold text-white">{currentState.earnPerMessage} ₽</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-white/40">
              <LuMic className="h-4 w-4" />
              <span className="text-xs">Ses Dakikası</span>
            </div>
            <p className="mt-1 text-lg font-bold text-white">{currentState.earnPerVoice} ₽</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-white/40">
              <LuCoins className="h-4 w-4" />
              <span className="text-xs">Transfer Vergisi</span>
            </div>
            <p className="mt-1 text-lg font-bold text-white">%{currentState.transferTaxRate}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-white/40">
              <LuUsers className="h-4 w-4" />
              <span className="text-xs">Tag / Booster</span>
            </div>
            <p className="mt-1 text-lg font-bold text-white">{currentState.tagCount} / {currentState.boosterCount}</p>
          </div>
        </div>
      </div>

      {/* Günlük Ortalamalar */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Son 14 Gün Ortalamaları</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-white/40">Günlük Mesaj</p>
            <p className="mt-1 text-xl font-bold text-white">{fmt.format(averages.dailyMessages)}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-white/40">Günlük Ses (dk)</p>
            <p className="mt-1 text-xl font-bold text-white">{fmt.format(averages.dailyVoiceMinutes)}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-white/40">Günlük Kazanç</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">+{fmtDecimal.format(averages.dailyEarnings)} ₽</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-white/40">Günlük Harcama</p>
            <p className="mt-1 text-xl font-bold text-red-400">-{fmtDecimal.format(averages.dailySpending)} ₽</p>
          </div>
        </div>
      </div>

      {/* Simülasyon */}
      <div className="rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LuCalculator className="h-5 w-5 text-[#5865F2]" />
            <h2 className="text-lg font-semibold text-white">Ekonomi Projeksiyonu</h2>
          </div>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {[7, 14, 30, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  days === d ? 'bg-[#5865F2] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {d}g
              </button>
            ))}
          </div>
        </div>

        {/* Projeksiyon Sonuçları */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1116] p-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Tahmini Üretim</p>
              <p className="text-lg font-bold text-emerald-400">+{fmtDecimal.format(simulation.projectedEarnings)} ₽</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1116] p-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Tahmini Harcama</p>
              <p className="text-lg font-bold text-red-400">-{fmtDecimal.format(simulation.projectedSpending)} ₽</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1116] p-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Net Değişim</p>
              <p className={`text-lg font-bold ${simulation.netChange >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {simulation.netChange >= 0 ? '+' : ''}{fmtDecimal.format(simulation.netChange)} ₽
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1116] p-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Tahmini Dolaşım</p>
              <p className="text-lg font-bold text-white">{fmtDecimal.format(simulation.projectedCirculation)} ₽</p>
            </div>
          </div>
        </div>

        {/* Akış göstergesi */}
        <div className="mb-5 flex items-center justify-center gap-4 rounded-xl border border-white/5 bg-[#0f1116] p-4">
          <div className="text-center">
            <p className="text-xs text-white/40">Şu an</p>
            <p className="text-lg font-bold text-white">{fmtDecimal.format(currentState.circulation)} ₽</p>
          </div>
          <LuArrowRight className="h-5 w-5 text-white/20" />
          <div className="text-center">
            <p className="text-xs text-white/40">{simulation.days} gün sonra</p>
            <p className={`text-lg font-bold ${simulation.projectedCirculation > currentState.circulation ? 'text-amber-400' : 'text-emerald-400'}`}>
              {fmtDecimal.format(simulation.projectedCirculation)} ₽
            </p>
          </div>
        </div>

        {/* Projeksiyon Grafiği */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData.filter((_, i) => i % Math.max(1, Math.floor(projectionData.length / 60)) === 0 || i === projectionData.length - 1)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={v => `${v}. gün`}
                stroke="rgba(255,255,255,0.1)"
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip
                contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                formatter={(v) => [fmtDecimal.format(Number(v)) + ' ₽', 'Dolaşım']}
                labelFormatter={v => `${v}. gün`}
              />
              <Area
                type="monotone"
                dataKey="circulation"
                stroke="#5865F2"
                fill="url(#circGrad)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="circGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5865F2" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5865F2" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Öneriler */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Öneriler</h2>
          {recommendations.map((rec, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${REC_STYLES[rec.type]}`}>
              {REC_ICONS[rec.type]}
              <p className="text-sm text-white/80">{rec.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
