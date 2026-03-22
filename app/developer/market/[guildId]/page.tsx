'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LuArrowLeft, LuBrainCircuit, LuSend, LuZap, LuCircleCheck, LuCircleX,
  LuLoader, LuTrendingUp, LuTrendingDown, LuShield, LuTriangleAlert,
  LuDatabase, LuFlame, LuSettings,
} from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

interface SuggestedAction { type: string; label: string; payload: Record<string, unknown>; }
interface AnalysisResult { analysis: string; suggested_actions: SuggestedAction[]; }
interface ChatMessage {
  id: number; role: 'user' | 'assistant'; content: string;
  actions?: SuggestedAction[]; timestamp: Date;
}
interface Listing {
  guild_id: string; status: string; market_price: number; ipo_price: number;
  circuit_breaker_until: string | null; founder_lots: number; founder_vested_lots: number;
  server_penalties?: Array<{ type: string; is_active: boolean; reason?: string }>;
}
interface AppliedAction { type: string; label: string; at: Date; }

type ActiveTab = 'ai' | 'detail' | 'actions';

const QUICK_PROMPTS = [
  'Bu sunucunun genel durumu nasıl?',
  'Fiyat düşüyor, ne yapmalıyım?',
  'Ceza verilmeli mi?',
  'Circuit breaker gerekli mi?',
  'Ekonomi sağlıklı mı?',
];

const EVENT_TYPES = ['news', 'price_adjustment', 'freeze', 'unfreeze'] as const;
const PENALTY_TYPES = ['warning', 'fine', 'suspension', 'delist'] as const;
const EXPIRES_OPTIONS = [
  { label: '1 Saat', value: 1 },
  { label: '6 Saat', value: 6 },
  { label: '24 Saat', value: 24 },
  { label: '7 Gün', value: 168 },
];

export default function DeveloperGuildDetailPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai');

  // AI state
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyResults, setApplyResults] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [appliedActions, setAppliedActions] = useState<AppliedAction[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  // Listing state
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);

  // Direct action forms
  const [eventForm, setEventForm] = useState({ type: 'news' as typeof EVENT_TYPES[number], title: '', description: '', price_impact: 0, expires_in: 1 });
  const [penaltyForm, setPenaltyForm] = useState({ type: 'warning' as typeof PENALTY_TYPES[number], reason: '', fine_amount: '' });
  const [listingForm, setListingForm] = useState({ market_price: '', status: '', circuit_breaker_until: '' });
  const [formLoading, setFormLoading] = useState<string | null>(null);
  const [formResults, setFormResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiLoading]);

  // Load listing
  useEffect(() => {
    setListingLoading(true);
    fetch('/api/admin/market-listings', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const found = (d.listings ?? []).find((l: Listing) => l.guild_id === guildId);
        setListing(found ?? null);
      })
      .finally(() => setListingLoading(false));
  }, [guildId]);

  const analyze = async (overridePrompt?: string) => {
    const p = overridePrompt ?? prompt;
    if (!p.trim() || aiLoading) return;
    const userMsg: ChatMessage = { id: ++msgId.current, role: 'user', content: p, timestamp: new Date() };
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
        id: ++msgId.current, role: 'assistant',
        content: data.analysis ?? `Hata: ${data.error}`,
        actions: data.suggested_actions, timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setMessages(prev => [...prev, { id: ++msgId.current, role: 'assistant', content: 'İstek başarısız oldu.', timestamp: new Date() }]);
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
      const ok = !data.error;
      setApplyResults(prev => ({ ...prev, [key]: ok }));
      if (ok) setAppliedActions(prev => [...prev.slice(-4), { type: action.type, label: action.label, at: new Date() }]);
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch { setApplyResults(prev => ({ ...prev, [key]: false })); }
    finally { setApplying(null); }
  };

  const submitDirectAction = async (formType: string, payload: Record<string, unknown>) => {
    setFormLoading(formType);
    try {
      const res = await fetch('/api/developer/apply-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ type: formType, payload }),
      });
      const data: { error?: string; remaining?: number; message?: string } = await res.json();
      const ok = !data.error;
      setFormResults(prev => ({ ...prev, [formType]: { ok, msg: ok ? (data.message ?? 'Uygulandı!') : (data.error ?? 'Hata') } }));
      if (ok) setAppliedActions(prev => [...prev.slice(-4), { type: formType, label: formType, at: new Date() }]);
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setFormResults(prev => ({ ...prev, [formType]: { ok: false, msg: 'İstek başarısız' } }));
    } finally { setFormLoading(null); }
  };

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

  const typeColors: Record<string, string> = {
    market_event: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    market_penalty: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    listing_update: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  };

  const priceChange = listing && listing.ipo_price > 0
    ? ((listing.market_price - listing.ipo_price) / listing.ipo_price) * 100
    : null;
  const priceUp = priceChange !== null && priceChange >= 0;
  const vestingPct = listing && listing.founder_lots > 0
    ? Math.round((listing.founder_vested_lots / listing.founder_lots) * 100)
    : 0;
  const cbActive = listing?.circuit_breaker_until && new Date(listing.circuit_breaker_until) > new Date();
  const activePenalties = listing?.server_penalties?.filter(p => p.is_active) ?? [];

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'ai', label: 'AI Analiz', icon: LuBrainCircuit },
    { id: 'detail', label: 'Sunucu Detayı', icon: LuDatabase },
    { id: 'actions', label: 'Aksiyonlar', icon: LuZap },
  ];

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}} @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-[#0a0a0c]/70" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-[#5865F2]/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[160px]" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>

        {/* Back + Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md">
              <LuArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <LuBrainCircuit className="w-3.5 h-3.5 text-[#5865F2]/60" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-semibold">AI Borsa Analizi</span>
              </div>
              <h1 className="text-xl font-black tracking-tight">
                <span style={shimmerStyle}>Komuta</span>
                <span style={shimmerBlue}> Merkezi</span>
              </h1>
              <p className="text-[11px] font-mono text-white/30 mt-0.5">{guildId}</p>
            </div>
          </div>
          {remaining !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <LuZap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-white/50">Kalan: <span className="text-white font-bold">{remaining}</span>/5</span>
            </div>
          )}
        </div>

        {/* Server Stats Panel */}
        {listingLoading ? (
          <div className="h-28 bg-white/5 rounded-3xl animate-pulse mb-6" />
        ) : listing ? (
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Market Price */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Piyasa Fiyatı</p>
              <p className="text-2xl font-black text-white">{listing.market_price?.toLocaleString('tr-TR')}<span className="text-sm text-white/30 ml-1">P</span></p>
              {priceChange !== null && (
                <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${priceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {priceUp ? <LuTrendingUp className="w-3 h-3" /> : <LuTrendingDown className="w-3 h-3" />}
                  {priceUp ? '+' : ''}{priceChange.toFixed(1)}% IPO&apos;dan
                </div>
              )}
            </div>
            {/* IPO Price */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">IPO Fiyatı</p>
              <p className="text-2xl font-black text-white/60">{listing.ipo_price?.toLocaleString('tr-TR')}<span className="text-sm text-white/20 ml-1">P</span></p>
              <p className={`text-[10px] mt-1 font-semibold ${
                listing.status === 'approved' ? 'text-emerald-400' :
                listing.status === 'suspended' ? 'text-amber-400' :
                listing.status === 'delisted' ? 'text-rose-400' : 'text-white/30'
              }`}>{listing.status}</p>
            </div>
            {/* Circuit Breaker */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Circuit Breaker</p>
              <div className={`flex items-center gap-2 ${cbActive ? 'text-orange-400' : 'text-white/30'}`}>
                <LuZap className={`w-4 h-4 ${cbActive ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-bold">{cbActive ? 'Aktif' : 'Kapalı'}</span>
              </div>
              {activePenalties.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <LuTriangleAlert className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400">{activePenalties.length} aktif ceza</span>
                </div>
              )}
            </div>
            {/* Vesting */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Kurucu Vesting</p>
              <p className="text-sm font-bold text-white mb-1.5">{listing.founder_vested_lots ?? 0} / {listing.founder_lots ?? 0} lot</p>
              <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#5865F2] to-[#a5b4ff] transition-all duration-700"
                  style={{ width: `${vestingPct}%` }} />
              </div>
              <p className="text-[10px] text-white/30 mt-1">{vestingPct}% tamamlandı</p>
            </div>
          </div>
        ) : null}

        {/* Recent Applied Actions (session) */}
        {appliedActions.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 mb-6 flex items-center gap-3">
            <LuShield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-1">Bu Oturumda Uygulanan</p>
              <div className="flex flex-wrap gap-2">
                {appliedActions.map((a, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                    {a.type} · {a.at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-white/[0.04] border border-white/8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/20'
                    : 'text-white/40 hover:text-white/70'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab: AI Analiz */}
        {activeTab === 'ai' && (
          <div className="relative rounded-3xl border border-[#5865F2]/20 bg-[#5865F2]/5 backdrop-blur-xl overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 420px)', minHeight: '400px' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none" />

            {/* AI Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <div className="relative w-8 h-8 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                <LuBrainCircuit className="w-4 h-4 text-[#5865F2]" />
                {aiLoading && <div className="absolute inset-0 rounded-xl border-2 border-[#5865F2]/50 animate-ping" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">AI Piyasa Asistanı</p>
                <p className="text-[10px] text-white/30">Gemini 2.5 Pro · {aiLoading ? <span className="text-[#5865F2]">Düşünüyor...</span> : 'Hazır'}</p>
              </div>
            </div>

            {/* Quick Prompts */}
            {messages.length === 0 && (
              <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => analyze(p)}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Chat */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'none' }}>
              {messages.length === 0 && !aiLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/15 flex items-center justify-center">
                    <LuBrainCircuit className="w-7 h-7 text-[#5865F2]/60" />
                  </div>
                  <p className="text-sm text-white/25 max-w-[200px] leading-relaxed">Piyasa hakkında soru sor</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-[#5865F2]/20 border border-[#5865F2]/25 rounded-2xl rounded-tr-sm px-4 py-2.5">
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
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${typeColors[action.type] ?? 'bg-white/10 text-white/40 border-white/10'}`}>{action.type}</span>
                                    </div>
                                    <p className="text-sm text-white/80">{action.label}</p>
                                    <details className="mt-2">
                                      <summary className="text-[10px] text-white/25 cursor-pointer hover:text-white/40 transition-colors select-none">Payload</summary>
                                      <pre className="text-[10px] text-white/35 mt-1 bg-black/30 p-2 rounded-xl overflow-x-auto">{JSON.stringify(action.payload, null, 2)}</pre>
                                    </details>
                                  </div>
                                  <div className="flex-shrink-0 pt-1">
                                    {applied === true ? (
                                      <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                                    ) : applied === false ? (
                                      <LuCircleX className="w-5 h-5 text-rose-400" />
                                    ) : (
                                      <button onClick={() => applyAction(msg.id, i, action)} disabled={applying !== null}
                                        className="group/apply relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-40 transition-all">
                                        <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover/apply:translate-x-full" />
                                        {applying === key ? <LuLoader className="w-3 h-3 animate-spin relative" /> : null}
                                        <span className="relative">{applying === key ? '...' : 'Uygula'}</span>
                                      </button>
                                    )}
                                  </div>
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
                    <span className="text-[10px] text-white/30">Gemini düşünüyor...</span>
                  </div>
                  <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5865F2]/60 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/8">
              <div className="flex gap-2">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } }}
                  rows={2} placeholder="Piyasa hakkında sor... (Enter)"
                  className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#5865F2]/40 transition-colors leading-relaxed" />
                <button onClick={() => analyze()} disabled={aiLoading || !prompt.trim()}
                  className="group relative overflow-hidden flex-shrink-0 w-10 h-10 self-end rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-white/8 disabled:text-white/20 flex items-center justify-center transition-all shadow-lg shadow-[#5865F2]/20 disabled:shadow-none">
                  <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                  {aiLoading ? <LuLoader className="w-4 h-4 animate-spin relative" /> : <LuSend className="w-4 h-4 relative" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Sunucu Detayı */}
        {activeTab === 'detail' && (
          <div className="space-y-4" style={{ animation: 'fadeIn 0.4s ease forwards' }}>
            {listingLoading ? (
              <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
            ) : listing ? (
              <>
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#5865F2] to-[#7289DA]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Listeleme Detayları</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Guild ID', value: listing.guild_id, mono: true },
                      { label: 'Durum', value: listing.status },
                      { label: 'Piyasa Fiyatı', value: `${listing.market_price?.toLocaleString('tr-TR')} P` },
                      { label: 'IPO Fiyatı', value: `${listing.ipo_price?.toLocaleString('tr-TR')} P` },
                      { label: 'Fiyat Değişimi', value: priceChange !== null ? `${priceUp ? '+' : ''}${priceChange.toFixed(2)}%` : '—' },
                      { label: 'Circuit Breaker', value: cbActive ? 'Aktif' : 'Kapalı' },
                      { label: 'Kurucu Lot', value: `${listing.founder_vested_lots ?? 0} / ${listing.founder_lots ?? 0}` },
                      { label: 'Vesting', value: `${vestingPct}%` },
                    ].map(item => (
                      <div key={item.label} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] text-white/30 mb-1">{item.label}</p>
                        <p className={`text-sm font-semibold text-white ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {activePenalties.length > 0 && (
                  <div className="rounded-3xl border border-rose-500/15 bg-rose-500/5 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LuTriangleAlert className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-bold text-rose-300">Aktif Cezalar ({activePenalties.length})</span>
                    </div>
                    <div className="space-y-2">
                      {activePenalties.map((p, i) => (
                        <div key={i} className="px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/15">
                          <p className="text-xs font-bold text-rose-300">{p.type}</p>
                          {p.reason && <p className="text-xs text-white/40 mt-0.5">{p.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-white/30 text-sm">Bu sunucu için listing bulunamadı.</div>
            )}
          </div>
        )}

        {/* Tab: Aksiyonlar */}
        {activeTab === 'actions' && (
          <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease forwards' }}>

            {/* Market Event Form */}
            <div className="rounded-3xl border border-blue-500/15 bg-blue-500/5 backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <LuFlame className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">Piyasa Olayı Oluştur</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-300">market_event</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Tip</label>
                    <select value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value as typeof EVENT_TYPES[number] }))}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-colors">
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Süre</label>
                    <select value={eventForm.expires_in} onChange={e => setEventForm(f => ({ ...f, expires_in: Number(e.target.value) }))}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-colors">
                      {EXPIRES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Başlık</label>
                  <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Olay başlığı..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Açıklama</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Olay açıklaması..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-blue-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">
                    Fiyat Etkisi: <span className={`font-bold ${eventForm.price_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{eventForm.price_impact >= 0 ? '+' : ''}{(eventForm.price_impact * 100).toFixed(0)}%</span>
                  </label>
                  <input type="range" min={-50} max={50} step={1}
                    value={Math.round(eventForm.price_impact * 100)}
                    onChange={e => setEventForm(f => ({ ...f, price_impact: Number(e.target.value) / 100 }))}
                    className="w-full accent-blue-500" />
                  <div className="flex justify-between text-[10px] text-white/20 mt-1"><span>-50%</span><span>0%</span><span>+50%</span></div>
                </div>
                <button
                  onClick={() => {
                    const expires_at = new Date(Date.now() + eventForm.expires_in * 3600000).toISOString();
                    submitDirectAction('market_event', { guild_id: guildId, type: eventForm.type, title: eventForm.title, description: eventForm.description, price_impact: eventForm.price_impact, expires_at });
                  }}
                  disabled={formLoading !== null || !eventForm.title.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-bold hover:bg-blue-500/30 disabled:opacity-40 transition-all">
                  {formLoading === 'market_event' ? 'Uygulanıyor...' : 'Olayı Uygula'}
                </button>
                {formResults['market_event'] && (
                  <p className={`text-xs text-center ${formResults['market_event'].ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formResults['market_event'].ok ? '✓ ' : '✗ '}{formResults['market_event'].msg}
                  </p>
                )}
              </div>
            </div>

            {/* Market Penalty Form */}
            <div className="rounded-3xl border border-rose-500/15 bg-rose-500/5 backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <LuTriangleAlert className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold text-white">Ceza Uygula</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-300">market_penalty</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Ceza Tipi</label>
                  <select value={penaltyForm.type} onChange={e => setPenaltyForm(f => ({ ...f, type: e.target.value as typeof PENALTY_TYPES[number] }))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/40 transition-colors">
                    {PENALTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Sebep</label>
                  <textarea value={penaltyForm.reason} onChange={e => setPenaltyForm(f => ({ ...f, reason: e.target.value }))}
                    rows={2} placeholder="Ceza sebebi..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-rose-500/40 transition-colors" />
                </div>
                {penaltyForm.type === 'fine' && (
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Para Cezası Miktarı (P)</label>
                    <input type="number" value={penaltyForm.fine_amount} onChange={e => setPenaltyForm(f => ({ ...f, fine_amount: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/40 transition-colors" />
                  </div>
                )}
                <button
                  onClick={() => {
                    const payload: Record<string, unknown> = { guild_id: guildId, type: penaltyForm.type, reason: penaltyForm.reason };
                    if (penaltyForm.type === 'fine' && penaltyForm.fine_amount) payload.fine_amount = Number(penaltyForm.fine_amount);
                    submitDirectAction('market_penalty', payload);
                  }}
                  disabled={formLoading !== null || !penaltyForm.reason.trim()}
                  className="w-full py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-bold hover:bg-rose-500/30 disabled:opacity-40 transition-all">
                  {formLoading === 'market_penalty' ? 'Uygulanıyor...' : 'Cezayı Uygula'}
                </button>
                {formResults['market_penalty'] && (
                  <p className={`text-xs text-center ${formResults['market_penalty'].ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formResults['market_penalty'].ok ? '✓ ' : '✗ '}{formResults['market_penalty'].msg}
                  </p>
                )}
              </div>
            </div>

            {/* Listing Update Form */}
            <div className="rounded-3xl border border-purple-500/15 bg-purple-500/5 backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <LuSettings className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Listeleme Güncelle</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-purple-300">listing_update</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Yeni Piyasa Fiyatı (P)</label>
                    <input type="number" value={listingForm.market_price} onChange={e => setListingForm(f => ({ ...f, market_price: e.target.value }))}
                      placeholder={listing?.market_price?.toString() ?? '0'}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Durum</label>
                    <select value={listingForm.status} onChange={e => setListingForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-colors">
                      <option value="">Değiştirme</option>
                      <option value="approved">approved</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Circuit Breaker Bitiş (opsiyonel)</label>
                  <input type="datetime-local" value={listingForm.circuit_breaker_until}
                    onChange={e => setListingForm(f => ({ ...f, circuit_breaker_until: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-colors" />
                </div>
                <button
                  onClick={() => {
                    const payload: Record<string, unknown> = { guild_id: guildId };
                    if (listingForm.market_price) payload.market_price = Number(listingForm.market_price);
                    if (listingForm.status) payload.status = listingForm.status;
                    if (listingForm.circuit_breaker_until) payload.circuit_breaker_until = new Date(listingForm.circuit_breaker_until).toISOString();
                    submitDirectAction('listing_update', payload);
                  }}
                  disabled={formLoading !== null || (!listingForm.market_price && !listingForm.status && !listingForm.circuit_breaker_until)}
                  className="w-full py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold hover:bg-purple-500/30 disabled:opacity-40 transition-all">
                  {formLoading === 'listing_update' ? 'Uygulanıyor...' : 'Listeyi Güncelle'}
                </button>
                {formResults['listing_update'] && (
                  <p className={`text-xs text-center ${formResults['listing_update'].ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formResults['listing_update'].ok ? '✓ ' : '✗ '}{formResults['listing_update'].msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
