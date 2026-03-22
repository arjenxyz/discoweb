'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuSend, LuLoader } from 'react-icons/lu';

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
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const [applyResults, setApplyResults] = useState<Record<number, string>>({});
  const [remaining, setRemaining] = useState<number | null>(null);

  const analyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setApplyResults({});
    try {
      const res = await fetch('/api/developer/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: action.type, payload: action.payload }),
      });
      const data = await res.json();
      setApplyResults(prev => ({ ...prev, [index]: data.error ? `Hata: ${data.error}` : '✅ Uygulandı' }));
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch {
      setApplyResults(prev => ({ ...prev, [index]: 'İstek başarısız' }));
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
            <LuArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">AI Borsa Analizi</p>
            <h1 className="text-lg font-bold text-white font-mono">{guildId}</h1>
          </div>
        </div>
        {remaining !== null && (
          <span className="text-xs text-white/40">Kalan: <span className="text-white font-bold">{remaining}</span>/5</span>
        )}
      </div>

      <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
        <label className="block text-sm font-medium text-white/60 mb-3">Asistana Sor</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) analyze(); }}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#5865F2]/50 transition-colors"
          placeholder="Bu sunucu için fiyat çok düşüyor, ne yapmalıyım? (Ctrl+Enter)"
        />
        <button
          onClick={analyze}
          disabled={loading || !prompt.trim()}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-white/10 disabled:text-white/30 rounded-2xl text-sm font-semibold transition-all"
        >
          {loading ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuSend className="w-4 h-4" />}
          {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Analiz</h2>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{result.analysis}</p>
          </div>

          {result.suggested_actions.length > 0 && (
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Önerilen Aksiyonlar</h2>
              <div className="space-y-3">
                {result.suggested_actions.map((action, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-white/8 bg-white/[0.02]">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          action.type === 'market_event' ? 'bg-blue-500/20 text-blue-300' :
                          action.type === 'market_penalty' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>{action.type}</span>
                      </div>
                      <p className="text-sm text-white/80">{action.label}</p>
                      <details className="mt-2">
                        <summary className="text-[11px] text-white/30 cursor-pointer hover:text-white/50">Payload</summary>
                        <pre className="text-[11px] text-white/40 mt-1 bg-black/20 p-2 rounded-xl overflow-x-auto">{JSON.stringify(action.payload, null, 2)}</pre>
                      </details>
                    </div>
                    <div className="flex-shrink-0 pt-1">
                      {applyResults[i] ? (
                        <span className={`text-xs ${applyResults[i].startsWith('✅') ? 'text-emerald-400' : 'text-rose-400'}`}>{applyResults[i]}</span>
                      ) : (
                        <button
                          onClick={() => applyAction(i, action)}
                          disabled={applying !== null}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-300 rounded-xl text-xs font-medium transition-colors"
                        >
                          {applying === i ? '...' : 'Uygula'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
