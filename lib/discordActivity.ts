// Dynamic import — SDK sadece Discord iframe içinde yüklenecek
let discordSdk: any = null;

const STORAGE_KEY = 'discoweb_activity_auth';

export type ActivityAuth = {
  sessionToken: string;
  userId: string;
  username: string;
  avatar: string | null;
  guildId: string | null;
  channelId: string | null;
};

type StoredActivityAuth = ActivityAuth & {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms timestamp
  createdAt: number;
};

const loadSavedAuth = (): StoredActivityAuth | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActivityAuth;
    if (!parsed || typeof parsed !== 'object' || !parsed.sessionToken || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveAuth = (auth: ActivityAuth, accessToken: string, refreshToken: string, expiresIn: number) => {
  if (typeof window === 'undefined') return;
  const item: StoredActivityAuth = {
    ...auth,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    createdAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
  } catch {
    // ignore
  }
};

const clearSavedAuth = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/** Discord Activity SDK singleton (lazy load) */
async function getDiscordSdk() {
  if (!discordSdk) {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_DISCORD_CLIENT_ID tanımlı değil');
    }
    const { DiscordSDK } = await import('@discord/embedded-app-sdk');
    discordSdk = new DiscordSDK(clientId);
  }
  return discordSdk;
}

/**
 * Discord Activity SDK'yı başlatır ve kullanıcı girişi yapar.
 * 1. sdk.ready() — iframe yüklendi sinyali
 * 2. sdk.commands.authorize() — OAuth code al
 * 3. Sunucuya code gönder → access_token + session token al
 * 4. sdk.commands.authenticate() — SDK'ya access_token bildir
 */
export async function initializeActivity(): Promise<ActivityAuth> {
  const sdk = await getDiscordSdk();

  // SDK hazır olana kadar bekle
  await sdk.ready();

  // Eğer daha önce bir oturum kaydedildiyse, önce onu dene
  const saved = loadSavedAuth();
  if (saved) {
    const needsRefresh = Date.now() >= saved.expiresAt - 30_000; // 30s önce yenile

    // Eğer token halen geçerliyse, doğrudan authenticate et
    if (!needsRefresh) {
      try {
        await sdk.commands.authenticate({ access_token: saved.accessToken });
        return {
          sessionToken: saved.sessionToken,
          userId: saved.userId,
          username: saved.username,
          avatar: saved.avatar,
          guildId: sdk.guildId ?? saved.guildId,
          channelId: sdk.channelId ?? saved.channelId,
        };
      } catch {
        // Authenticate başarısızsa, refresh akışına geç
      }
    }

    // Token refresh et (refresh token varsa)
    if (saved.refreshToken) {
      try {
        const res = await fetch('/api/activity/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: saved.refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.status === 'ok') {
            // SDK'ya yeni access token bildir
            await sdk.commands.authenticate({ access_token: data.accessToken });

            const auth: ActivityAuth = {
              sessionToken: saved.sessionToken,
              userId: saved.userId,
              username: saved.username,
              avatar: saved.avatar,
              guildId: sdk.guildId ?? saved.guildId,
              channelId: sdk.channelId ?? saved.channelId,
            };

            saveAuth(auth, data.accessToken, data.refreshToken, data.expiresIn);
            return auth;
          }
        }
      } catch {
        // Refresh başarısızsa devam et ve authorize() çağır
      }
    }

    // Her iki durumda da temizle ve aşağıdaki authorize akışına geç
    clearSavedAuth();
  }

  // Kullanıcıdan yetki al (Discord izin popup'ı — sadece ilk seferde)
  const { code } = await sdk.commands.authorize({
    client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
    response_type: 'code',
    scope: ['identify', 'guilds'],
  });

  // Sunucumuza code gönder, access_token + session token al
  const response = await fetch('/api/activity/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.reason ?? 'Activity auth başarısız');
  }

  const data = (await response.json()) as {
    sessionToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; username: string; avatar: string | null };
  };

  // SDK'ya access_token bildir — bu adım zorunlu!
  // authenticate() SDK'nın kullanıcıyı tanımasını sağlar
  await sdk.commands.authenticate({ access_token: data.accessToken });

  const auth: ActivityAuth = {
    sessionToken: data.sessionToken,
    userId: data.user.id,
    username: data.user.username,
    avatar: data.user.avatar,
    guildId: sdk.guildId ?? null,
    channelId: sdk.channelId ?? null,
  };

  saveAuth(auth, data.accessToken, data.refreshToken, data.expiresIn);

  // Discord Activity iframe içindeki boşluklar bazen Discord tarafındaki boyut ayarından kaynaklanır.
  // Eğer SDK destekliyorsa iframe boyutunu pencere boyutuna göre yeniden iste.
  try {
    const resizeCmd = (sdk as any).commands?.resize ?? (sdk as any).commands?.setSize;
    if (typeof resizeCmd === 'function' && typeof window !== 'undefined') {
      await resizeCmd({ width: window.innerWidth, height: window.innerHeight });
    }
  } catch {
    // ignore
  }

  return auth;
}

/** Mevcut ortamın Discord Activity iframe'i olup olmadığını kontrol eder */
export function isInsideDiscordActivity(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has('frame_id') || params.has('instance_id') || window.self !== window.top;
  } catch {
    return false;
  }
}
