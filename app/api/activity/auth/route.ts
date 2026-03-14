import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';

/**
 * Discord Activity SDK'dan gelen authorization code'u exchange eder.
 * Cookie yerine JSON body'de session token döndürür (iframe uyumu).
 */
export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return NextResponse.json(
        { status: 'error', reason: 'missing_env_or_code' },
        { status: 400 },
      );
    }

    // Discord Activity SDK authorize() özel redirect_uri kullanmaz,
    // ancak token exchange için boş string veya uygulama URL'i gerekebilir.
    // Embedded App SDK code exchange'inde redirect_uri olarak
    // uygulamanın Activity URL'i kullanılır.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      // Activity SDK authorize() tarafından üretilen code için redirect_uri gerekli değil
      // ama Discord API bunu zorunlu kılıyor — boş bırakılamaz.
      // Activity proxy URL'ini kullanıyoruz.
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenResponse.ok) {
      const discordBody = await tokenResponse.json().catch(() => null);
      console.error('Activity auth: token exchange failed', discordBody);
      return NextResponse.json(
        { status: 'error', reason: 'token_exchange_failed', discordBody },
        { status: 401 },
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
    };

    // Kullanıcı bilgilerini al
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { status: 'error', reason: 'user_fetch_failed' },
        { status: 401 },
      );
    }

    const user = (await userResponse.json()) as {
      id: string;
      username: string;
      avatar: string | null;
    };

    // Session token oluştur (cookie yerine body'de döndür)
    const sessionToken = createSessionToken(user.id);

    return NextResponse.json({
      status: 'ok',
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Activity auth: unhandled error', err);
    return NextResponse.json(
      { status: 'error', reason: 'unhandled_exception' },
      { status: 500 },
    );
  }
}
