'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import FishingGame from '@/components/play-earn/FishingGame';
import type { SpawnEntry } from '@/lib/playEarn/types';
import { LuCoins, LuFish, LuLoader, LuPlay } from 'react-icons/lu';

type WalletData = {
  fishTokenBalance: number;
  papelBalance: number;
  remainingPapelCap: number;
  jetonPerPapel: number;
  minConvertJeton: number;
};

type GameConfig = {
  gameEnabled: boolean;
  sessionDurationSec: number;
  sessionCooldownSec: number;
  jetonPerPapel: number;
  dailyPapelCap: number;
  minConvertJeton: number;
};

type SessionData = {
  sessionId: string;
  startedAt: string;
  durationSec: number;
  manifest: SpawnEntry[];
};

export default function PlayEarnPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ tokensEarned: number; catches: number } | null>(null);
  const [convertAmount, setConvertAmount] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        fetch('/api/member/play-earn/wallet', { cache: 'no-store' }),
        fetch('/api/member/play-earn/config', { cache: 'no-store' }),
      ]);
      if (wRes.ok) setWallet(await wRes.json());
      if (cRes.ok) setConfig(await cRes.json());
    } catch {
      setError('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startGame = async () => {
    setStarting(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch('/api/member/play-earn/session/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'cooldown') {
          setError(`Bekleme süresi: ${data.retryAfterSec ?? '?'} sn`);
        } else if (data.error === 'daily_session_limit') {
          setError('Günlük tur limitine ulaştın.');
        } else if (data.error === 'game_disabled') {
          setError('Oyun şu an kapalı.');
        } else {
          setError('Tur başlatılamadı.');
        }
        return;
      }
      setSession({
        sessionId: data.sessionId,
        startedAt: data.startedAt,
        durationSec: data.durationSec,
        manifest: data.manifest,
      });
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setStarting(false);
    }
  };

  const handleConvert = async () => {
    const amount = Math.floor(Number(convertAmount));
    if (!amount || amount <= 0) return;
    setConverting(true);
    setError(null);
    try {
      const res = await fetch('/api/member/play-earn/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountJeton: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'daily_papel_cap') {
          setError(`Günlük Papel limiti. Kalan: ${data.remaining ?? 0}`);
        } else if (data.error === 'below_minimum') {
          setError(`Minimum dönüşüm: ${data.min} jeton`);
        } else {
          setError('Dönüşüm başarısız.');
        }
        return;
      }
      setConvertAmount('');
      await refresh();
    } catch {
      setError('Dönüşüm hatası.');
    } finally {
      setConverting(false);
    }
  };

  if (session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#041018]">
        <FishingGame
          session={session}
          onEnd={(s) => {
            setSession(null);
            setSummary(s);
            refresh();
          }}
          onCancel={() => {
            setSession(null);
            fetch('/api/member/play-earn/session/end', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: session.sessionId }),
            }).finally(refresh);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400/70">Play & Earn</p>
            <h1 className="text-2xl font-black">Balık Avı</h1>
          </div>
          <Link href="/" className="text-sm text-white/50 hover:text-white">Ana sayfa</Link>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <LuLoader className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <LuFish className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Balık Jetonu</span>
                </div>
                <p className="mt-2 text-2xl font-black">{wallet?.fishTokenBalance ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <LuCoins className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Papel</span>
                </div>
                <p className="mt-2 text-2xl font-black">{wallet?.papelBalance ?? 0}</p>
              </div>
            </div>

            {config && (
              <p className="text-xs text-white/40">
                {config.jetonPerPapel} jeton = 1 Papel · Günlük max {config.dailyPapelCap} Papel dönüşümü
                · Tur {config.sessionDurationSec}s
              </p>
            )}

            {summary && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm">
                Tur bitti: <strong>{summary.catches}</strong> balık, <strong>{summary.tokensEarned}</strong> jeton!
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
            )}

            <button
              type="button"
              onClick={startGame}
              disabled={starting || config?.gameEnabled === false}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 py-4 text-sm font-black uppercase tracking-wider disabled:opacity-50"
            >
              {starting ? <LuLoader className="h-5 w-5 animate-spin" /> : <LuPlay className="h-5 w-5" />}
              Oyna
            </button>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold">Jeton → Papel</p>
              <p className="mt-1 text-xs text-white/40">
                Min {wallet?.minConvertJeton ?? 100} jeton · Kalan günlük tavan: {wallet?.remainingPapelCap ?? 0} Papel
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="Jeton miktarı"
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-500/40"
                />
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold disabled:opacity-50"
                >
                  {converting ? '...' : 'Çevir'}
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-white/30">
              Zaman geçtikçe balıklar hızlanır — refleks ve isabet önemli.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
