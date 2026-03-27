'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight, LuLoader, LuShield } from 'react-icons/lu';

const RULES = [
  'Topluluk içinde saygılı dil kullanın; hakaret ve taciz kabul edilmez.',
  'Hesap bilgileri, token ve özel erişim verilerini paylaşmayın.',
  'Mağaza, cüzdan ve transfer araçlarını kötüye kullanmayın.',
  'Çoklu hesap, otomasyon ve manipülasyon denemeleri yaptırıma tabidir.',
  'Sunucu yönetiminin kararları web erişiminizi de etkileyebilir.',
];

const QUICK_FLOW = [
  'Kuralları onayla',
  'Sistem giriş rolünü versin',
  'Paneli kullanmaya başla',
];

function RulesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const pendingGuildId = searchParams.get('pendingGuildId');

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      if (pendingGuildId) {
        document.cookie = `selected_guild_id=${pendingGuildId}; path=/; max-age=86400; samesite=lax`;
      }

      const response = await fetch('/api/discord/assign-role', { method: 'POST' });
      if (response.status === 401) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError('Giriş rolü verilemedi. Birkaç saniye sonra tekrar deneyin.');
        setLoading(false);
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('Beklenmeyen bir hata oluştu. Lütfen yeniden deneyin.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060914] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#5865F2]/20 blur-[120px]" />
        <div className="absolute -bottom-20 -right-8 h-80 w-80 rounded-full bg-sky-400/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07),_transparent_45%)]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_70px_rgba(4,8,20,0.55)] backdrop-blur-xl sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cfd7ff]">
            <LuShield className="h-3.5 w-3.5" />
            Üyelik Onayı
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
            Hızlı kurallar onayı
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Sayfayı uzatmadan, kısa bir özetle ilerleyelim. Onaydan sonra giriş rolünüz otomatik verilir.
          </p>

          <ul className="mt-5 space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8ea0ff]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-white/85">
              Daha fazla bilgi (opsiyonel)
            </summary>
            <p className="mt-2 text-xs leading-6 text-white/65">
              Güvenlik, rol ve işlem kayıtları hizmet kalitesi için tutulabilir. İhlal durumunda uyarı, rol iptali,
              işlem kısıtı veya erişim kapatma uygulanabilir.
            </p>
          </details>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_FLOW.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <label htmlFor="rules-accept" className="flex cursor-pointer items-start gap-3">
              <input
                id="rules-accept"
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-[#5865F2]"
              />
              <span className="text-sm leading-6 text-white/78">
                Kuralları okudum, kabul ediyorum.
              </span>
            </label>
            <p className="mt-2 text-xs text-white/55">
              Detaylar için{' '}
              <Link href="/privacy" className="text-[#9eb0ff] hover:text-white">
                Gizlilik
              </Link>{' '}
              ve{' '}
              <Link href="/terms" className="text-[#9eb0ff] hover:text-white">
                Kullanım Koşulları
              </Link>{' '}
              sayfalarını inceleyebilirsiniz.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/auth/select-server"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Geri dön
            </Link>
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading || !accepted}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5865F2] to-[#7289DA] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LuLoader className="h-4 w-4 animate-spin" />
                  Rol veriliyor...
                </>
              ) : (
                <>
                  Kabul et ve devam et
                  <LuArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DiscordRulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060914] text-white">
          <div className="text-center">
            <LuLoader className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8ea0ff]" />
            <p className="text-sm text-white/70">Kurallar yükleniyor...</p>
          </div>
        </div>
      }
    >
      <RulesPageContent />
    </Suspense>
  );
}
