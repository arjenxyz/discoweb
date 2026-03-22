'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuUsers, LuDatabase, LuSearch, LuWrench, LuShoppingBag, LuBell,
  LuTriangleAlert, LuMail, LuRefreshCw, LuArrowRight, LuActivity,
  LuZap, LuShield, LuGlobe, LuTrendingUp, LuClipboardList,
  LuBrainCircuit, LuSend, LuLoader,
} from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

type SystemStats = {
  totalMembers: number; totalServers: number; totalOrders: number;
  totalNotifications: number; totalErrors: number; totalMails: number;
  maintenanceActive: boolean; maintenanceModules: number; activeMaintenanceCount: number;
};

interface SuggestedAction { type: string; label: string; payload: Record<string, unknown>; }
interface AnalysisResult { analysis: string; suggested_actions: SuggestedAction[]; }
interface ChatMessage {
  id: number; role: 'user' | 'assistant'; guildId: string;
  content: string; actions?: SuggestedAction[]; timestamp: Date;
}

const QUICK_PROMPTS = [
  'Piyasaya genel bakış yap',
  'Fiyat düşüyor, ne yapmalıyım?',
  'Ceza verilmeli mi?',
  'Circuit breaker gerekli mi?',
  'Ekonomi sağlıklı mı?',
];

export default function DeveloperPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // AI State
  const [guildId, setGuildId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyResults, setApplyResults] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  const shimmerStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #fff 0%, #fff 35%, rgba(255,255,255,0.95) 45%, #fff 55%, #fff 100%)',
    backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', animation: 'titleShine 4s ease-in-out infinite',
  };
  const shimmerBlue: React.CSSProperties = {
    backgroundImage: 'linear-gradient(105deg, #5865F2 0%, #5865F2 35%, #a5b4ff 45%, #5865F2 55%, #5865F2 100%)',
    backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', animation: 'titleShine 4s ease-in-out infinite',
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const r = await fetch('/api/developer/system-stats', { credentials: 'include', cache: 'no-store' });
      if (r.ok) { const d = await r.json(); setStats(d.stats); }
    } catch { /* ignore */ } finally { setStatsLoading(false); }
  };

  useEffect(() => { setTimeout(() => setVisible(true), 60); loadStats(); }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiLoading]);

  const analyze = async (overridePrompt?: string) => {
    const p = overridePrompt ?? prompt;
    if (!p.trim() || !guildId.trim() || aiLoading) return;
    const userMsg: ChatMessage = { id: ++msgId.current, role: 'user', guildId, content: p, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/developer/ai-analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ guildId, prompt: p }),
      });
      const data: AnalysisResult & { error?: string; remaining?: number } = await res.json();
      const assistantMsg: ChatMessage = {
        id: ++msgId.current, role: 'assistant', guildId,
        content: data.analysis ?? `Hata: ${data.error}`,
        actions: data.suggested_actions, timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setMessages(prev => [...prev, { id: ++msgId.current, role: 'assistant', guildId, content: 'İstek başarısız oldu.', timestamp: new Date() }]);
    } finally { setAiLoading(false); }
  };

  const applyAction = async (messageId: number, actionIdx: number, action: SuggestedAction) => {
    const key = `${messageId}-${actionIdx}`;
    setApplying(key);
    try {
      const res = await fetch('/api/developer/apply-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ type: action.type, payload: action.payload }),
      });
      const data: { error?: string; remaining?: number } = await res.json();
      setApplyResults(prev => ({ ...prev, [key]: !data.error }));
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch { setApplyResults(prev => ({ ...prev, [key]: false })); }
    finally { setApplying(null); }
  };

  const handleSync = async () => {
    setSyncLoading(true); setSyncMessage(null);
    try {
      const r = await fetch('/api/developer/sync-members', { method: 'POST', credentials: 'include' });
      const d: { message?: string; error?: string } = await r.json();
      setSyncMessage(r.ok ? (d.message || 'Tamamlandı.') : (d.error || 'Başarısız.'));
      loadStats();
    } catch { setSyncMessage('Hata oluştu.'); }
    finally { setSyncLoading(false); }
  };

  const statCards = [
    { label: 'Üye', value: stats?.totalMembers ?? 0, icon: LuUsers, color: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/20', iconColor: 'text-indigo-400' },
    { label: 'Sunucu', value: stats?.totalServers ?? 0, icon: LuDatabase, color: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/20', iconColor: 'text-violet-400' },
    { label: 'Sipariş', value: stats?.totalOrders ?? 0, icon: LuShoppingBag, color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
    { label: 'Bildirim', value: stats?.totalNotifications ?? 0, icon: LuBell, color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
    { label: 'Hata', value: stats?.totalErrors ?? 0, icon: LuTriangleAlert, color: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/20', iconColor: 'text-rose-400' },
    { label: 'Mail', value: stats?.totalMails ?? 0, icon: LuMail, color: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
  ];

  const quickActions = [
    { label: 'Kullanıcı Sorgula', desc: 'Tekil arama', href: '/developer/user-lookup', icon: LuSearch, color: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/20' },
    { label: 'Sunucular', desc: 'Toplu görünüm', href: '/developer/all-servers', icon: LuGlobe, color: 'bg-sky-500/15 text-sky-300 ring-sky-400/20' },
    { label: 'Bakım', desc: 'Modül durumları', href: '/developer/maintenance', icon: LuWrench, color: 'bg-amber-500/15 text-amber-300 ring-amber-400/20' },
    { label: 'Borsa', desc: 'Piyasa yönetimi', href: '/developer/market', icon: LuTrendingUp, color: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20' },
    { label: 'Başvurular', desc: 'Ekonomi & IPO', href: '/developer/applications', icon: LuClipboardList, color: 'bg-orange-500/15 text-orange-300 ring-orange-400/20' },
    { label: 'API Test', desc: 'Endpoint testi', href: '/developer/api-test', icon: LuZap, color: 'bg-pink-500/15 text-pink-300 ring-pink-400/20' },
  ];

  const typeColors: Record<string, string> = {
    market_event: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    market_penalty: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
    listing_update: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  };

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/88 to-[#0a0a0c]/65" />
      <div className="pointer-events-none absolute -top-32 left-1/4 w-96 h-96 bg-[#5865F2]/15 rounded-full blur-[160px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-[140px] animate-pulse" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">Sistem Aktif</span>
              {stats?.maintenanceActive && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-300 font-bold">BAKIM</span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              <span style={shimmerStyle}>Developer</span>
              <span style={shimmerBlue}> Dashboard</span>
            </h1>
            <p className="text-sm text-white/25 mt-1">Sistem sağlığı, istatistikler ve AI komuta merkezi</p>
          </div>
          <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white transition-all backdrop-blur-md">
            <LuRefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
        </div>

        {/* Main Grid: Left stats + Right AI */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3">
              {statCards.map(c => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.color} backdrop-blur-xl p-4 hover:scale-[1.02] transition-transform`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${c.iconColor}`} />
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{c.label}</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                      {statsLoading ? <span className="inline-block w-10 h-6 bg-white/10 rounded animate-pulse" /> : c.value.toLocaleString('tr-TR')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white/70">Hızlı İşlemler</h2>
                <LuActivity className="w-4 h-4 text-[#5865F2]/40" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.href} onClick={() => router.push(a.href)}
                      className="group flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3 text-left hover:border-white/15 hover:bg-white/5 transition-all">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${a.color} ring-1`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{a.label}</p>
                        <p className="text-[10px] text-white/30 truncate">{a.desc}</p>
                      </div>
                      <LuArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 ml-auto flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/8">
                <button onClick={handleSync} disabled={syncLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/10 text-sm font-semibold text-[#5865F2] hover:bg-[#5865F2]/15 transition-all disabled:opacity-50">
                  <LuRefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Senkronize Ediliyor...' : 'Discord Üyelerini Senkronize Et'}
                </button>
                {syncMessage && <p className="mt-2 text-xs text-center text-[#5865F2]/70">{syncMessage}</p>}
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
              <h2 className="text-sm font-bold text-white/70 mb-4">Sistem Durumu</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Veritabanı', warn: false },
                  { label: 'Discord Bot', warn: false },
                  { label: 'OAuth', warn: false },
                  { label: 'Bakım Modu', warn: stats?.maintenanceActive ?? false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.warn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className={`text-[10px] font-medium ${item.warn ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {item.label === 'Bakım Modu' ? (item.warn ? 'Aktif' : 'Kapalı') : 'Çalışıyor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#5865F2]/8 border border-[#5865F2]/15">
                <LuShield className="w-4 h-4 text-[#5865F2] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Güvenli Oturum</p>
                  <p className="text-[10px] text-white/30">Discord Developer rolü doğrulandı</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — AI ASSISTANT */}
          <div className="lg:sticky lg:top-8">
            <div className="relative rounded-3xl border border-[#5865F2]/20 bg-[#5865F2]/5 backdrop-blur-xl overflow-hidden flex flex-col"
              style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#5865F2]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* AI Header */}
              <div className="relative flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-2xl bg-[#5865F2]/25 flex items-center justify-center">
                    <LuBrainCircuit className="w-5 h-5 text-[#5865F2]" />
                    {aiLoading && <div className="absolute inset-0 rounded-2xl border-2 border-[#5865F2]/50 animate-ping" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">AI Piyasa Asistanı</p>
                    <p className="text-[10px] text-white/30">Gemini 2.5 Pro · {aiLoading ? <span className="text-[#5865F2]">Düşünüyor...</span> : 'Hazır'}</p>
                  </div>
                </div>
                {remaining !== null && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <LuZap className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-white/50">{remaining}/5</span>
                  </div>
                )}
              </div>

              {/* Guild ID Input */}
              <div className="relative px-4 pt-4">
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-[#5865F2]/40 transition-colors">
                  <LuDatabase className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <input value={guildId} onChange={e => setGuildId(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/20 focus:outline-none font-mono"
                    placeholder="Guild ID gir (örn: 1465698764453838882)" />
                  {guildId && (
                    <button onClick={() => router.push(`/developer/market/${guildId}`)}
                      className="text-[10px] text-[#5865F2]/60 hover:text-[#5865F2] transition-colors whitespace-nowrap">
                      Detay →
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Prompts */}
              {messages.length === 0 && (
                <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => { if (guildId.trim()) analyze(p); else setPrompt(p); }}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'none' }}>
                {messages.length === 0 && !aiLoading && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/15 flex items-center justify-center">
                      <LuBrainCircuit className="w-7 h-7 text-[#5865F2]/60" />
                    </div>
                    <p className="text-sm text-white/25 max-w-[200px] leading-relaxed">Guild ID girip piyasa hakkında soru sor</p>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-[#5865F2]/20 border border-[#5865F2]/25 rounded-2xl rounded-tr-sm px-4 py-2.5">
                          <p className="text-[11px] text-white/30 mb-1 font-mono">{msg.guildId}</p>
                          <p className="text-sm text-white/90 leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                            <LuBrainCircuit className="w-3 h-3 text-[#5865F2]" />
                          </div>
                          <span className="text-[10px] text-white/30">Gemini · {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-white/25 px-1">Önerilen Aksiyonlar</p>
                            {msg.actions.map((action, i) => {
                              const key = `${msg.id}-${i}`;
                              const applied = applyResults[key];
                              return (
                                <div key={i} className={`rounded-xl border p-3 transition-all ${
                                  applied === true ? 'border-emerald-500/25 bg-emerald-500/8' :
                                  applied === false ? 'border-rose-500/25 bg-rose-500/8' :
                                  'border-white/8 bg-white/[0.03]'
                                }`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border mr-1.5 ${typeColors[action.type] ?? 'bg-white/10 text-white/40 border-white/10'}`}>{action.type}</span>
                                      <span className="text-xs text-white/70">{action.label}</span>
                                    </div>
                                    {applied === true ? <span className="text-[10px] text-emerald-400 whitespace-nowrap">✓ Uygulandı</span> :
                                     applied === false ? <span className="text-[10px] text-rose-400 whitespace-nowrap">✗ Hata</span> : (
                                      <button onClick={() => applyAction(msg.id, i, action)} disabled={applying !== null}
                                        className="group/a relative overflow-hidden flex-shrink-0 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25 disabled:opacity-40 transition-all">
                                        <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover/a:translate-x-full" />
                                        <span className="relative">{applying === key ? '...' : 'Uygula'}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {aiLoading && (
                  <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                        <LuBrainCircuit className="w-3 h-3 text-[#5865F2] animate-pulse" />
                      </div>
                      <span className="text-[10px] text-white/30">Gemini düşünüyor</span>
                    </div>
                    <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5865F2]/60 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="relative p-4 border-t border-white/8">
                <div className="flex gap-2">
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } }}
                    rows={2} placeholder="Piyasa hakkında sor... (Enter ile gönder)"
                    className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#5865F2]/40 transition-colors leading-relaxed" />
                  <button onClick={() => analyze()} disabled={aiLoading || !prompt.trim() || !guildId.trim()}
                    className="group relative overflow-hidden flex-shrink-0 w-10 h-10 self-end rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-white/8 disabled:text-white/20 flex items-center justify-center transition-all shadow-lg shadow-[#5865F2]/20 disabled:shadow-none">
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                    {aiLoading ? <LuLoader className="w-4 h-4 animate-spin relative" /> : <LuSend className="w-4 h-4 relative" />}
                  </button>
                </div>
                {!guildId.trim() && <p className="text-[10px] text-white/20 mt-1.5 px-1">↑ Önce Guild ID gir</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
