'use client';

import { useEffect, useState } from 'react';
import { initializeActivity, type ActivityAuth } from '../../lib/discordActivity';
import { ActivityProvider } from '../../lib/activityContext';
import { CartProvider } from '../../lib/cart';

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<ActivityAuth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Yükleme animasyonu
        const timer = setInterval(() => {
          setProgress((p) => Math.min(p + 5, 90));
        }, 200);

        const result = await initializeActivity();

        clearInterval(timer);
        if (!cancelled) {
          setProgress(100);
          // Kısa bir gecikme ile tamamlanma hissi ver
          setTimeout(() => {
            if (!cancelled) setAuth(result);
          }, 300);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Activity başlatma hatası:', err);
          const msg = err instanceof Error ? err.message : String(err);
          // Discord iframe dışında açılınca anlamlı bir mesaj göster
          if (msg.includes('postMessage') || msg.includes('iframe') || msg.includes('origin') || msg.includes('ready')) {
            setError('Bu sayfa sadece Discord Activity olarak çalışır. Lütfen Discord üzerinden açın.');
          } else {
            setError(msg || 'Bağlantı kurulamadı');
          }
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // Hata durumu
  if (error) {
    return (
      <div className="h-screen bg-[#0d0d1a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">😿</div>
          <h2 className="text-white text-lg font-bold mb-2">Bağlantı Hatası</h2>
          <p className="text-[#99AAB5] text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#5865F2] text-white text-sm rounded-lg hover:bg-[#4752C4] transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Yükleme durumu
  if (!auth) {
    return (
      <div className="h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white mb-6">DiscoWeb</h1>
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#5865F2] to-[#7289DA] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#99AAB5] text-xs animate-pulse">
            Discord&apos;a bağlanılıyor... {progress}%
          </p>
        </div>
      </div>
    );
  }

  // Başarılı — Activity içeriğini göster
  return (
    <ActivityProvider
      sessionToken={auth.sessionToken}
      userId={auth.userId}
      username={auth.username}
      avatar={auth.avatar}
      guildId={auth.guildId}
      channelId={auth.channelId}
    >
      <CartProvider>
        <div className="h-screen bg-[#0d0d1a] text-white overflow-hidden flex flex-col">
          {children}
        </div>
      </CartProvider>
    </ActivityProvider>
  );
}
