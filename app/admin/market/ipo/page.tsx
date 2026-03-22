'use client';

import { useEffect, useState } from 'react';
import { LuTrendingUp, LuClock, LuCheck, LuX, LuLoader, LuExternalLink } from 'react-icons/lu';

type IpoStatus = {
  listing_status: string | null;  // 'pending' | 'approved' | 'suspended' | 'delisted' | null
  application: {
    id: string;
    status: string;
    proposed_price: number;
    proposed_founder_ratio: number;
    created_at: string;
    reviewed_at: string | null;
  } | null;
};

const STATUS_INFO: Record<string, { label: string; desc: string; color: string }> = {
  pending:   { label: 'İnceleniyor', desc: 'Başvurunuz developer tarafından inceleniyor.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  approved:  { label: 'Onaylandı',   desc: 'Başvurunuz onaylandı. Sunucunuz borsada aktif.',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected:  { label: 'Reddedildi',  desc: 'Başvurunuz reddedildi. Yeni başvuru yapabilirsiniz.', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const fmt = new Intl.NumberFormat('tr-TR');

export default function AdminIpoPage() {
  const [status, setStatus] = useState<IpoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAdvanced, setNotAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [proposedPrice, setProposedPrice] = useState('100');
  const [founderRatio, setFounderRatio] = useState('55');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/member/ipo-status');
      if (res.status === 403) { setNotAdvanced(true); return; }
      if (!res.ok) return;
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const price = Number(proposedPrice);
    const ratio = Number(founderRatio) / 100;
    if (price <= 0 || ratio < 0.51 || ratio > 0.80) {
      setError('Geçersiz değer. Fiyat > 0, Founder oranı %51–80 arası olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/member/ipo-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposed_price: price, proposed_founder_ratio: ratio }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Başvuru başarısız');
      setSuccess('Başvurunuz alındı. Developer incelemesini bekliyorsunuz.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40 text-sm">Yükleniyor...</div>;

  if (notAdvanced) return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <p className="text-white/50 text-sm">Bu özellik yalnızca Yüksek Ekonomi sunucularında kullanılabilir.</p>
    </div>
  );

  const app = status?.application;
  const appStatus = app?.status ?? null;
  const alreadyListed = status?.listing_status === 'approved';
  const pendingApp = appStatus === 'pending';
  const canApply = !alreadyListed && appStatus !== 'pending';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">IPO Başvurusu</h1>
        <p className="text-white/40 text-sm mt-0.5">Sunucunuzu yatırım borsasına ekleyin</p>
      </div>

      {/* Mevcut durum */}
      {app && appStatus && STATUS_INFO[appStatus] && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${STATUS_INFO[appStatus].color}`}>
          {appStatus === 'approved' ? <LuCheck className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
           appStatus === 'rejected' ? <LuX className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
           <LuClock className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold">{STATUS_INFO[appStatus].label}</p>
            <p className="opacity-80 text-xs mt-0.5">{STATUS_INFO[appStatus].desc}</p>
            <p className="text-xs opacity-50 mt-1">
              Başvuru: {new Date(app.created_at).toLocaleDateString('tr-TR')}
              {app.reviewed_at && ` · İnceleme: ${new Date(app.reviewed_at).toLocaleDateString('tr-TR')}`}
            </p>
          </div>
        </div>
      )}

      {alreadyListed && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-300 text-sm">
            <LuTrendingUp className="w-4 h-4" />
            <span>Sunucunuz borsada aktif.</span>
          </div>
          <a href="/admin/market" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Durumu gör <LuExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Başvuru formu */}
      {canApply && (
        <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <LuTrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Yeni IPO Başvurusu</h2>
              <p className="text-xs text-white/40">Toplam arz: 1.000.000 lot (sabit)</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">
                Önerilen Başlangıç Fiyatı (Papel/lot)
              </label>
              <input
                type="number" min="1" step="1" value={proposedPrice}
                onChange={e => setProposedPrice(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-white/30 mt-1">Developer nihai fiyatı belirler</p>
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">
                Founder Hisse Oranı (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="51" max="80" step="1"
                  value={founderRatio}
                  onChange={e => setFounderRatio(e.target.value)}
                  className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-indigo-500"
                />
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 min-w-[52px] text-center">
                  <span className="text-sm font-mono font-semibold text-indigo-400">%{founderRatio}</span>
                </div>
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                Founder: {fmt.format(Math.round(Number(founderRatio) * 10000))} lot ·
                Halka: {fmt.format(Math.round((100 - Number(founderRatio)) * 10000))} lot
              </p>
            </div>
          </div>

          {/* Vesting bilgisi */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[12px] text-amber-300/80 space-y-1">
            <p><strong className="text-amber-300">Founder Vesting:</strong> İlk 30 gün lot satamazsınız (cliff).</p>
            <p>30. günden itibaren her ay %10 lot serbest bırakılır (~11 ayda tam özgürlük).</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <><LuLoader className="w-4 h-4 animate-spin" /> Gönderiliyor...</> : <><LuTrendingUp className="w-4 h-4" /> Başvuruyu Gönder</>}
          </button>
        </form>
      )}

      {pendingApp && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[13px] text-white/50">
          Başvurunuz incelenirken yeni başvuru yapamazsınız. Developer onay/red kararı verdikten sonra tekrar başvurabilirsiniz.
        </div>
      )}

      {/* Bilgi kutusu */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[12px] text-white/40 space-y-1">
        <p>• IPO onaylandığında sunucunuz yatırım borsasında görünür hale gelir.</p>
        <p>• Yatırımcılar lot alıp satabilir; her işlemden %2 platform komisyonu alınır.</p>
        <p>• Lot sahiplerine her Pazar hazineden otomatik temettü dağıtılır.</p>
        <a href="/economy/advanced#market" target="_blank" className="flex items-center gap-1 text-indigo-400/70 hover:text-indigo-300 mt-2 transition-colors">
          <LuExternalLink className="w-3 h-3" /> Borsa sistemini detaylı incele
        </a>
      </div>
    </div>
  );
}
