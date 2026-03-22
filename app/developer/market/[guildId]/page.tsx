'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuBrainCircuit, LuSend, LuZap, LuCircleCheck, LuCircleX, LuLoader } from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

interface SuggestedAction {
  type: string;
  label: string;
  payload: Record<string, unknown>;
}
interface AnalysisResult {
  analysis: string;
  suggested_actions: SuggestedAction[];
}

export default function DeveloperGuildDetailPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const [applyResults, setApplyResults] = useState<Record<number, boolean>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

  const analyze = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setApplyResults({});
    try {
      const res = await fetch('/api/developer/ai-analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ guildId, prompt }),
      });
      const data = await res.json();
      setResult(data.error ? { analysis: `Hata: ${data.error}`, suggested_actions: [] } : data);
    } catch {
      setResult({ analysis: 'İstek başarısız oldu.', suggested_actions: [] });
    } finally {
      setLoading(false);
    }
  };

  const applyAction = async (index: number, action: SuggestedAction) => {
    setApplying(index);
    try {
      const res = await fetch('/api/developer/apply-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ type: action.type, payload: action.payload }),
      });
      const data = await res.json();
      setApplyResults(prev => ({ ...prev, [index]: !data.error }));
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setApplyResults(prev => ({ ...prev, [index]: false }));
    } finally {
      setApplying(null);
    }
  };

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

  const typeColors: Record<string, string> = {
    market_event: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    market_penalty: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    listing_update: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  };

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

      {/* Video Background */}
      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-[#0a0a0c]/70" />

      {/* Glow Orbs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-[#5865F2]/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[160px]" />

      {/* Content */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-3xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>

        {/* Back + Header */}
        <div className="flex items-center justify-between mb-8">
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

        {/* AI Input Panel */}
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/5 via-transparent to-transparent pointer-events-none rounded-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                <LuBrainCircuit className="w-3.5 h-3.5 text-[#5865F2]" />
              </div>
              <span className="text-sm font-semibold text-white/70">Asistana Sor</span>
              <span className="text-[10px] text-white/20 ml-1">Ctrl+Enter ile gönder</span>
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) analyze(); }}
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#5865F2]/40 transition-all leading-relaxed"
              placeholder="Bu sunucu için fiyat düşüyor, ne yapmalıyım? Piyasaya müdahale etmeli miyim?"
            />
            <div className="mt-3 flex justify-end">
              <button onClick={analyze} disabled={loading || !prompt.trim()}
                className="group relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-white/8 disabled:text-white/20 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-[#5865F2]/20 disabled:shadow-none">
                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                {loading ? <LuLoader className="w-4 h-4 animate-spin relative" /> : <LuSend className="w-4 h-4 relative" />}
                <span className="relative">{loading ? 'Analiz ediliyor...' : 'Analiz Et'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !result && (
          <div className="rounded-3xl border border-[#5865F2]/15 bg-[#5865F2]/5 backdrop-blur-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center">
                <LuBrainCircuit className="w-6 h-6 text-[#5865F2] animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-white/50">Gemini sunucu verileri analiz ediyor...</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5865F2]/60 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4"
            style={{ animation: 'fadeIn 0.5s ease forwards' }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Analysis */}
            <div className="relative rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/8 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#5865F2] to-[#7289DA]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Gemini Analizi</span>
              </div>
              <p className="text-sm text-white/80 leading-7 whitespace-pre-wrap">{result.analysis}</p>
            </div>

            {/* Suggested Actions */}
            {result.suggested_actions.length > 0 && (
              <div className="relative rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Önerilen Aksiyonlar</span>
                  <span className="ml-auto text-[10px] text-white/20">{result.suggested_actions.length} öneri</span>
                </div>
                <div className="space-y-3">
                  {result.suggested_actions.map((action, i) => (
                    <div key={i} className={`rounded-2xl border p-4 transition-all ${
                      applyResults[i] === true ? 'border-emerald-500/30 bg-emerald-500/8' :
                      applyResults[i] === false ? 'border-rose-500/30 bg-rose-500/8' :
                      'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${typeColors[action.type] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                              {action.type}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 font-medium">{action.label}</p>
                          <details className="mt-2">
                            <summary className="text-[11px] text-white/25 cursor-pointer hover:text-white/40 transition-colors select-none">Payload göster</summary>
                            <pre className="text-[10px] text-white/35 mt-2 bg-black/30 p-3 rounded-xl overflow-x-auto leading-relaxed">{JSON.stringify(action.payload, null, 2)}</pre>
                          </details>
                        </div>
                        <div className="flex-shrink-0 pt-0.5">
                          {applyResults[i] === true ? (
                            <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                          ) : applyResults[i] === false ? (
                            <LuCircleX className="w-5 h-5 text-rose-400" />
                          ) : (
                            <button onClick={() => applyAction(i, action)} disabled={applying !== null}
                              className="group/apply relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-40 transition-all">
                              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover/apply:translate-x-full" />
                              {applying === i ? <LuLoader className="w-3 h-3 animate-spin relative" /> : null}
                              <span className="relative">{applying === i ? 'Uygulanıyor...' : 'Uygula'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
