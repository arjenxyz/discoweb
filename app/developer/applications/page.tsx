'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuCheck, LuX } from 'react-icons/lu';

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
  const [economy, setEconomy] = useState<EcoApp[]>([]);
  const [ipo, setIpo] = useState<IpoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [starterPkg, setStarterPkg] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    fetch('/api/developer/applications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setEconomy(d.economy ?? []); setIpo(d.ipo ?? []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = async (type: string, id: string, action: string, pkg?: number) => {
    setProcessing(id);
    await fetch('/api/developer/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, id, action, starter_package: pkg }),
    });
    setProcessing(null);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
          <LuArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Bekleyen Başvurular</h1>
          <p className="text-sm text-white/40 mt-0.5">Ekonomi geçiş ve IPO başvuruları</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-12 text-center text-white/40">Yükleniyor...</div>
      ) : (
        <>
          <Section title={`Ekonomi Başvuruları (${economy.length})`}>
            {economy.length === 0 ? (
              <p className="text-white/30 text-sm py-4">Bekleyen başvuru yok.</p>
            ) : economy.map(app => (
              <div key={app.id} className="p-4 rounded-2xl border border-white/8 bg-white/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-mono text-white/80">{app.guild_id}</p>
                    <p className="text-xs text-white/40 mt-1">{app.applicant_user_id} • {new Date(app.created_at).toLocaleDateString('tr-TR')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-xs text-white/40">Başlangıç Paketi:</label>
                      <input
                        type="number"
                        value={starterPkg[app.id] ?? '100000'}
                        onChange={e => setStarterPkg(prev => ({ ...prev, [app.id]: e.target.value }))}
                        className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <span className="text-xs text-white/30">Papel</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handle('economy', app.id, 'approve', parseInt(starterPkg[app.id] ?? '100000'))} disabled={processing === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors">
                      <LuCheck className="w-3.5 h-3.5" /> Onayla
                    </button>
                    <button onClick={() => handle('economy', app.id, 'reject')} disabled={processing === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors">
                      <LuX className="w-3.5 h-3.5" /> Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Section>

          <Section title={`IPO Başvuruları (${ipo.length})`}>
            {ipo.length === 0 ? (
              <p className="text-white/30 text-sm py-4">Bekleyen başvuru yok.</p>
            ) : ipo.map(app => (
              <div key={app.id} className="p-4 rounded-2xl border border-white/8 bg-white/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-mono text-white/80">{app.guild_id}</p>
                    <p className="text-xs text-white/40 mt-1">{app.applicant_user_id} • {new Date(app.created_at).toLocaleDateString('tr-TR')}</p>
                    <p className="text-xs text-white/60 mt-1">
                      Fiyat: <span className="text-white">{app.proposed_price?.toLocaleString()} P/lot</span>
                      {' · '}Founder: <span className="text-white">%{Math.round((app.proposed_founder_ratio ?? 0) * 100)}</span>
                    </p>
                    {app.guild_stats_snapshot && (
                      <details className="mt-2">
                        <summary className="text-[11px] text-white/30 cursor-pointer">Sunucu istatistikleri</summary>
                        <pre className="text-[11px] text-white/40 mt-1 bg-black/20 p-2 rounded-xl">{JSON.stringify(app.guild_stats_snapshot, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handle('ipo', app.id, 'approve')} disabled={processing === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors">
                      <LuCheck className="w-3.5 h-3.5" /> Onayla
                    </button>
                    <button onClick={() => handle('ipo', app.id, 'reject')} disabled={processing === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors">
                      <LuX className="w-3.5 h-3.5" /> Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
      <h2 className="text-base font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}
