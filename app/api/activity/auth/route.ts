import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';

/**
 * Discord Activity SDK'dan gelen authorization code'u exchange eder.
 * Cookie yerine JSON body'de session token + access_token döndürür.
 */
export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      console.error('Activity auth: eksik parametreler', { code: !!code, clientId: !!clientId, clientSecret: !!clientSecret });
      return NextResponse.json(
        { status: 'error', reason: 'missing_env_or_code' },
        { status: 400 },
      );
    }

    // Token exchange
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenResponse.ok) {
      const discordBody = await tokenResponse.json().catch(() => null);
      console.error('Activity auth: token exchange failed', tokenResponse.status, discordBody);
      return NextResponse.json(
        { status: 'error', reason: 'token_exchange_failed', discordStatus: tokenResponse.status, discordBody },
        { status: 401 },
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
      refresh_token?: string;
      expires_in?: number;
    };

    // Kullanıcı bilgilerini al
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Activity auth: user fetch failed', userResponse.status);
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

    // Session token oluştur
    const sessionToken = createSessionToken(user.id);

    console.log('Activity auth: başarılı, user:', user.id, user.username);

    return NextResponse.json({
      status: 'ok',
      sessionToken,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresIn: tokenData.expires_in ?? null,
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
