'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuCheck, LuX, LuClipboardList, LuRefreshCw } from 'react-icons/lu';

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? '';

interface EcoApp {
  id: string;
  guild_id: string;
  applicant_user_id: string;
  created_at: string;
}
interface IpoApp {
  id: string;
  guild_id: string;
  applicant_user_id: string;
  proposed_price: number;
  proposed_founder_ratio: number;
  guild_stats_snapshot: Record<string, unknown>;
  created_at: string;
}

export default function DeveloperApplicationsPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [economy, setEconomy] = useState<EcoApp[]>([]);
  const [ipo, setIpo] = useState<IpoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [starterPkg, setStarterPkg] = useState<Record<string, string>>({});

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

  const load = () => {
    setLoading(true);
    fetch('/api/developer/applications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setEconomy(d.economy ?? []); setIpo(d.ipo ?? []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
    load();
  }, []);

  const handle = async (type: string, id: string, action: 'approve' | 'reject', pkg?: number) => {
    const doneValue: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';
    setProcessing(id);
    await fetch('/api/developer/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ type, id, action, starter_package: pkg }),
    });
    setDone(prev => ({ ...prev, [id]: doneValue }));
    setProcessing(null);
  };

  const total = economy.length + ipo.length;

  return (
    <div className="relative min-h-screen -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      <style>{`@keyframes titleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

      {VIDEO_URL && (
        <video autoPlay loop muted playsInline disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15" src={VIDEO_URL} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/88 to-[#0a0a0c]/65" />
      <div className="pointer-events-none absolute top-0 right-1/3 w-96 h-64 bg-[#5865F2]/12 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/8 rounded-full blur-[120px]" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <LuArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LuClipboardList className="w-3.5 h-3.5 text-white/20" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-semibold">Başvuru Yönetimi</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                <span style={shimmerStyle}>Bekleyen</span>
                <span style={shimmerBlue}> Başvurular</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {total > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25">
                <span className="text-xs font-bold text-amber-300">{total} bekliyor</span>
              </div>
            )}
            <button onClick={load} disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
              <LuRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Economy Applications */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#5865F2] to-[#7289DA]" />
              <h2 className="text-sm font-bold text-white/70">Ekonomi Başvuruları</h2>
              <span className="text-xs text-white/30">({economy.length})</span>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            ) : economy.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-white/25 text-sm">Bekleyen ekonomi başvurusu yok</div>
            ) : (
              <div className="space-y-3">
                {economy.map(app => {
                  const result = done[app.id];
                  return (
                    <div key={app.id} className={`rounded-2xl border backdrop-blur-xl p-5 transition-all ${
                      result === 'approved' ? 'border-emerald-500/25 bg-emerald-500/8' :
                      result === 'rejected' ? 'border-rose-500/25 bg-rose-500/8' :
                      'border-white/8 bg-white/[0.04]'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-white/80 font-semibold">{app.guild_id}</p>
                          <p className="text-xs text-white/35 mt-1">{app.applicant_user_id} · {new Date(app.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          {!result && (
                            <div className="flex items-center gap-2 mt-3">
                              <label className="text-[11px] text-white/40">Başlangıç Paketi</label>
                              <input type="number" value={starterPkg[app.id] ?? '100000'}
                                onChange={e => setStarterPkg(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="w-28 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#5865F2]/40" />
                              <span className="text-[11px] text-white/25">Papel</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {result ? (
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${result === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {result === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handle('economy', app.id, 'approve', parseInt(starterPkg[app.id] ?? '100000'))}
                                disabled={processing === app.id}
                                className="group relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-40 transition-all">
                                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
                                <LuCheck className="w-3.5 h-3.5 relative" /><span className="relative">Onayla</span>
                              </button>
                              <button onClick={() => handle('economy', app.id, 'reject')}
                                disabled={processing === app.id}
                                className="group relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 disabled:opacity-40 transition-all">
                                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
                                <LuX className="w-3.5 h-3.5 relative" /><span className="relative">Reddet</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* IPO Applications */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              <h2 className="text-sm font-bold text-white/70">IPO Başvuruları</h2>
              <span className="text-xs text-white/30">({ipo.length})</span>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            ) : ipo.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-white/25 text-sm">Bekleyen IPO başvurusu yok</div>
            ) : (
              <div className="space-y-3">
                {ipo.map(app => {
                  const result = done[app.id];
                  return (
                    <div key={app.id} className={`rounded-2xl border backdrop-blur-xl p-5 transition-all ${
                      result === 'approved' ? 'border-emerald-500/25 bg-emerald-500/8' :
                      result === 'rejected' ? 'border-rose-500/25 bg-rose-500/8' :
                      'border-white/8 bg-white/[0.04]'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-white/80 font-semibold">{app.guild_id}</p>
                          <p className="text-xs text-white/35 mt-1">{app.applicant_user_id} · {new Date(app.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/30">Fiyat</span>
                              <span className="text-xs font-bold text-amber-300">{app.proposed_price?.toLocaleString('tr-TR')} P/lot</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/30">Founder</span>
                              <span className="text-xs font-bold text-white/70">%{Math.round((app.proposed_founder_ratio ?? 0) * 100)}</span>
                            </div>
                          </div>
                          {app.guild_stats_snapshot && !result && (
                            <details className="mt-2">
                              <summary className="text-[11px] text-white/25 cursor-pointer hover:text-white/40 transition-colors select-none">Sunucu istatistikleri</summary>
                              <pre className="text-[10px] text-white/30 mt-2 bg-black/30 p-3 rounded-xl">{JSON.stringify(app.guild_stats_snapshot, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {result ? (
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${result === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {result === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handle('ipo', app.id, 'approve')}
                                disabled={processing === app.id}
                                className="group relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-40 transition-all">
                                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
                                <LuCheck className="w-3.5 h-3.5 relative" /><span className="relative">Onayla</span>
                              </button>
                              <button onClick={() => handle('ipo', app.id, 'reject')}
                                disabled={processing === app.id}
                                className="group relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 disabled:opacity-40 transition-all">
                                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
                                <LuX className="w-3.5 h-3.5 relative" /><span className="relative">Reddet</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
