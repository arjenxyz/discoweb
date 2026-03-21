'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuTicket, LuLoader, LuClock, LuUsers, LuTrophy, LuCoins, LuShield, LuGift, LuCheckCircle, LuAlertCircle, LuCalendar } from 'react-icons/lu';
import type { Raffle } from '../types';

type RaffleSectionProps = {
  renderPapelAmount: (value: number) => React.ReactNode;
};

function useCountdown(endDate: string | null): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!endDate) {
      setLabel('Süresiz');
      return;
    }

    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setLabel('Sona erdi'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setLabel(`${d}g ${h}s kaldı`);
      else if (h > 0) setLabel(`${h}s ${m}d kaldı`);
      else setLabel(`${m} dakika kaldı`);
    };

    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [endDate]);

  return label;
}

function RaffleCard({
  raffle,
  renderPapelAmount,
  onEnter,
  entering,
  feedback,
}: {
  raffle: Raffle;
  renderPapelAmount: (v: number) => React.ReactNode;
  onEnter: (id: string) => void;
  entering: boolean;
  feedback: { ok: boolean; message: string } | null;
}) {
  const countdown = useCountdown(raffle.end_date);

  const prizeLabel = () => {
    if (raffle.prize_type === 'papel' && raffle.prize_papel_amount) {
      return renderPapelAmount(raffle.prize_papel_amount);
    }
    if (raffle.prize_type === 'role') {
      return (
        <span className="inline-flex items-center gap-1.5 text-violet-300">
          <LuShield className="w-4 h-4" />
          Özel Rol
        </span>
      );
    }
    // custom — show prizes list
    return (
      <span className="text-amber-300">
        {raffle.prizes?.join(', ') ?? 'Özel Ödül'}
      </span>
    );
  };

  const prizeBg =
    raffle.prize_type === 'papel'
      ? 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30'
      : raffle.prize_type === 'role'
      ? 'from-violet-500/20 to-purple-500/10 border-violet-500/30'
      : 'from-blue-500/20 to-indigo-500/10 border-blue-500/30';

  const isEnded = raffle.end_date ? new Date(raffle.end_date) < new Date() : false;
  const canEnter = !raffle.user_entered && !isEnded && !raffle.drawn_at;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0d12] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(88,101,242,0.2)] hover:border-[#5865F2]/40">

      {/* Glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/60 to-transparent" />

      {/* Prize banner */}
      <div className={`relative flex items-center gap-3 px-5 py-4 bg-gradient-to-r ${prizeBg} border-b border-white/5`}>
        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
          {raffle.prize_type === 'papel' ? (
            <LuCoins className="w-5 h-5 text-yellow-400" />
          ) : raffle.prize_type === 'role' ? (
            <LuShield className="w-5 h-5 text-violet-400" />
          ) : (
            <LuGift className="w-5 h-5 text-blue-400" />
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Ödül</p>
          <div className="text-sm font-bold">{prizeLabel()}</div>
        </div>
        {raffle.winner_count > 1 && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-white/70">
            <LuTrophy className="w-3.5 h-3.5 text-amber-400" />
            {raffle.winner_count} kazanan
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white leading-snug group-hover:text-[#5865F2] transition-colors">
            {raffle.title}
          </h3>
          {raffle.description && (
            <p className="text-sm text-white/50 mt-1.5 leading-relaxed line-clamp-3">
              {raffle.description}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/60 font-medium">
            <LuUsers className="w-3.5 h-3.5" />
            {raffle.entry_count ?? 0} katılımcı
          </span>

          {raffle.end_date && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              isEnded
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}>
              <LuClock className="w-3.5 h-3.5" />
              {countdown}
            </span>
          )}

          {!raffle.end_date && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <LuCalendar className="w-3.5 h-3.5" />
              Süresiz
            </span>
          )}

          {raffle.min_tag_days > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium">
              <LuTicket className="w-3.5 h-3.5" />
              Min. {raffle.min_tag_days} gün etiket
            </span>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
            feedback.ok
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}>
            {feedback.ok ? <LuCheckCircle className="w-4 h-4 flex-shrink-0" /> : <LuAlertCircle className="w-4 h-4 flex-shrink-0" />}
            {feedback.message}
          </div>
        )}

        {/* Action */}
        <div className="mt-auto">
          {raffle.drawn_at ? (
            <div className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/40 font-medium">
              <LuTrophy className="w-4 h-4" />
              Çekiliş Yapıldı
            </div>
          ) : isEnded ? (
            <div className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/40 font-medium">
              <LuClock className="w-4 h-4" />
              Süre Doldu
            </div>
          ) : raffle.user_entered ? (
            <div className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 font-bold">
              <LuCheckCircle className="w-4 h-4" />
              Katıldınız
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEnter(raffle.id)}
              disabled={entering || !canEnter}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#5865F2]/20"
            >
              {entering ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LuTicket className="w-4 h-4" />
                  Katıl
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RaffleSection({ renderPapelAmount }: RaffleSectionProps) {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, { ok: boolean; message: string } | null>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/member/raffles');
      if (res.ok) {
        const data = await res.json();
        setRaffles(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnter = async (raffleId: string) => {
    setEnteringId(raffleId);
    try {
      const res = await fetch('/api/member/raffles/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffleId }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; required?: number };

      if (res.ok) {
        setFeedbacks(prev => ({ ...prev, [raffleId]: { ok: true, message: 'Çekilişe katıldınız!' } }));
        setRaffles(prev => prev.map(r => r.id === raffleId ? { ...r, user_entered: true, entry_count: (r.entry_count ?? 0) + 1 } : r));
      } else {
        const errorMessages: Record<string, string> = {
          unauthorized: 'Giriş yapmanız gerekiyor.',
          raffle_not_found: 'Çekiliş bulunamadı.',
          raffle_inactive: 'Bu çekiliş aktif değil.',
          raffle_already_drawn: 'Bu çekilişin kazananları belirlendi.',
          raffle_ended: 'Bu çekilişin süresi doldu.',
          already_entered: 'Bu çekilişe zaten katıldınız.',
          tag_required: 'Katılmak için etikete ihtiyacınız var.',
          tag_days_insufficient: `Katılmak için en az ${data.required ?? '?'} gün etikete sahip olmanız gerekiyor.`,
        };
        setFeedbacks(prev => ({ ...prev, [raffleId]: { ok: false, message: errorMessages[data.error ?? ''] ?? 'Katılım başarısız.' } }));
      }
    } catch {
      setFeedbacks(prev => ({ ...prev, [raffleId]: { ok: false, message: 'Bir hata oluştu.' } }));
    }
    setEnteringId(null);
    setTimeout(() => setFeedbacks(prev => ({ ...prev, [raffleId]: null })), 4000);
  };

  return (
    <section className="relative overflow-hidden rounded-none sm:rounded-[32px] border-0 sm:border border-white/10 bg-white/5 backdrop-blur-2xl p-3 sm:p-8 shadow-2xl flex flex-col">

      {/* Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#5865F2]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
          <LuTrophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Çekilişler</h2>
          <p className="text-[11px] text-white/50 font-medium hidden sm:block">Şansını dene, ödülünü kap</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/60">
            <LuLoader className="w-10 h-10 animate-spin text-[#5865F2] mb-3" />
            <p className="text-sm font-medium">Yükleniyor...</p>
          </div>
        ) : raffles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 rounded-full bg-white/5 border border-white/10 mb-4">
              <LuTrophy className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-base font-bold text-white">Aktif Çekiliş Yok</h3>
            <p className="text-white/40 text-xs mt-1.5 max-w-[240px]">Şu an aktif çekiliş bulunmuyor. Yakında yeni çekilişler eklenecek!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {raffles.map(raffle => (
              <RaffleCard
                key={raffle.id}
                raffle={raffle}
                renderPapelAmount={renderPapelAmount}
                onEnter={handleEnter}
                entering={enteringId === raffle.id}
                feedback={feedbacks[raffle.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
