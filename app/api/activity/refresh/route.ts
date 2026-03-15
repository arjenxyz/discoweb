import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { refreshToken } = (await request.json()) as { refreshToken?: string };
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
      console.error('Activity refresh: eksik parametreler', { refreshToken: !!refreshToken, clientId: !!clientId, clientSecret: !!clientSecret });
      return NextResponse.json(
        { status: 'error', reason: 'missing_env_or_token' },
        { status: 400 },
      );
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenResponse.ok) {
      const discordBody = await tokenResponse.json().catch(() => null);
      console.error('Activity refresh: token refresh failed', tokenResponse.status, discordBody);
      return NextResponse.json(
        { status: 'error', reason: 'token_refresh_failed', discordStatus: tokenResponse.status, discordBody },
        { status: 401 },
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    return NextResponse.json({
      status: 'ok',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? refreshToken,
      expiresIn: tokenData.expires_in,
    });
  } catch (err) {
    console.error('Activity refresh: unhandled error', err);
    return NextResponse.json(
      { status: 'error', reason: 'unhandled_exception' },
      { status: 500 },
    );
  }
}
