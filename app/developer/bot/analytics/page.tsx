'use client';

import { useState, useEffect } from 'react';
import { LuRefreshCw, LuServer, LuUsers, LuMessageSquare, LuMic, LuTrendingUp, LuTriangleAlert } from 'react-icons/lu';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

type AnalyticsData = {
  totalServers: number;
  totalUsers: number;
  todayMessages: number;
  todayVoice: number;
  trend: {
    date: string;
    messages: number;
    voice: number;
  }[];
};

export default function BotAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/bot/analytics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Veriler alınamadı');
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LuRefreshCw className="w-8 h-8 text-[#5865F2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight">
            Sistem Analizi
          </h1>
          <p className="text-white/40 text-sm mt-1">Botun aktif büyüme ve kullanım istatistikleri.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
        >
          <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
          <LuTriangleAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-200 text-sm">{error}</div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LuServer className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#5865F2]/20 text-[#5865F2] rounded-lg">
              <LuServer className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-white/50">Toplam Sunucu</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data?.totalServers.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LuUsers className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <LuUsers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-white/50">Kayıtlı Kullanıcı</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data?.totalUsers.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LuMessageSquare className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <LuMessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-white/50">Bugünkü Mesajlar</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data?.todayMessages.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LuMic className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <LuMic className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-white/50">Bugünkü Ses (Dk)</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data?.todayVoice.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      {/* Charts */}
      {data && data.trend && data.trend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages Trend */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-6">
              <LuTrendingUp className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">Mesaj Aktivitesi (Son 7 Gün)</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelFormatter={(label) => formatDate(label as string)}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="messages" name="Mesajlar" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Voice Trend */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-6">
              <LuMic className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Ses Aktivitesi (Son 7 Gün)</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    labelFormatter={(label) => formatDate(label as string)}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="voice" name="Ses (Dakika)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
