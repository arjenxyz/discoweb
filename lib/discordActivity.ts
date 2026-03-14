import { DiscordSDK } from '@discord/embedded-app-sdk';

let discordSdk: DiscordSDK | null = null;

/** Discord Activity SDK singleton */
export function getDiscordSdk(): DiscordSDK {
  if (!discordSdk) {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_DISCORD_CLIENT_ID tanımlı değil');
    }
    discordSdk = new DiscordSDK(clientId);
  }
  return discordSdk;
}

export type ActivityAuth = {
  sessionToken: string;
  userId: string;
  username: string;
  avatar: string | null;
  guildId: string | null;
  channelId: string | null;
};

/**
 * Discord Activity SDK'yı başlatır ve kullanıcı girişi yapar.
 * 1. sdk.ready() — iframe yüklendi sinyali
 * 2. sdk.commands.authorize() — kullanıcıdan izin al (ilk seferde popup)
 * 3. Sunucuya code gönder → session token al
 */
export async function initializeActivity(): Promise<ActivityAuth> {
  const sdk = getDiscordSdk();

  // SDK hazır olana kadar bekle
  await sdk.ready();

  // Kullanıcıdan yetki al (Discord izin popup'ı — sadece ilk seferde)
  const { code } = await sdk.commands.authorize({
    client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
    response_type: 'code',
    scope: ['identify', 'guilds'],
  });

  // Sunucumuza code gönder, session token al
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
    user: { id: string; username: string; avatar: string | null };
  };

  // SDK'dan authenticate çağrısı (access_token'ı SDK'ya bildir)
  // Not: authorize() code döner, authenticate() access_token ister.
  // Sunucu tarafında token exchange yapıldığı için burada tekrar
  // authenticate() çağırmaya gerek yok — session token yeterli.

  return {
    sessionToken: data.sessionToken,
    userId: data.user.id,
    username: data.user.username,
    avatar: data.user.avatar,
    guildId: sdk.guildId ?? null,
    channelId: sdk.channelId ?? null,
  };
}

/** Mevcut ortamın Discord Activity iframe'i olup olmadığını kontrol eder */
export function isInsideDiscordActivity(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Discord Activity iframe'lerinde parent !== self olur
    // ve URLSearchParams'da frame_id bulunur
    const params = new URLSearchParams(window.location.search);
    return params.has('frame_id') || params.has('instance_id') || window.self !== window.top;
  } catch {
    return false;
  }
}
