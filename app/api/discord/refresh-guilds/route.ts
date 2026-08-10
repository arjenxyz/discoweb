import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import {
  buildAdminGuilds,
  fetchUserGuilds,
  getServiceSupabase,
} from '@/lib/discord/buildAdminGuilds';

type TokenRefreshResult = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

async function refreshDiscordAccessToken(
  refreshToken: string,
): Promise<TokenRefreshResult | null> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) return null;
  return (await response.json()) as TokenRefreshResult;
}

function setAccessTokenCookie(response: NextResponse, accessToken: string) {
  response.cookies.set('discord_access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function POST(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: 'unauthorized', needsReauth: true }, { status: 401 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'bot_token_missing' }, { status: 500 });
    }

    const cookieStore = await cookies();
    let accessToken = cookieStore.get('discord_access_token')?.value ?? null;
    const supabase = getServiceSupabase();
    let refreshed = false;

    const tryRefreshFromDb = async (): Promise<boolean> => {
      if (!supabase) return false;
      const { data } = await supabase
        .from('users')
        .select('oauth_refresh_token')
        .eq('discord_id', auth.userId)
        .maybeSingle();

      const refreshToken = (data as { oauth_refresh_token?: string | null } | null)
        ?.oauth_refresh_token;
      if (!refreshToken) return false;

      const tokenData = await refreshDiscordAccessToken(refreshToken);
      if (!tokenData?.access_token) return false;

      accessToken = tokenData.access_token;
      refreshed = true;

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      await supabase
        .from('users')
        .update({
          oauth_access_token: tokenData.access_token,
          oauth_refresh_token: tokenData.refresh_token ?? refreshToken,
          oauth_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('discord_id', auth.userId);

      return true;
    };

    if (!accessToken) {
      const ok = await tryRefreshFromDb();
      if (!ok) {
        return NextResponse.json({ error: 'unauthorized', needsReauth: true }, { status: 401 });
      }
    }

    let guildsResult = await fetchUserGuilds(accessToken!);
    if (!guildsResult.ok && (guildsResult.status === 401 || guildsResult.status === 403)) {
      const ok = await tryRefreshFromDb();
      if (!ok) {
        return NextResponse.json({ error: 'unauthorized', needsReauth: true }, { status: 401 });
      }
      guildsResult = await fetchUserGuilds(accessToken!);
    }

    if (!guildsResult.ok) {
      if (guildsResult.status === 401 || guildsResult.status === 403) {
        return NextResponse.json({ error: 'unauthorized', needsReauth: true }, { status: 401 });
      }
      return NextResponse.json(
        { error: 'failed_to_fetch_guilds', needsReauth: false },
        { status: 502 },
      );
    }

    const { adminGuilds } = await buildAdminGuilds({
      userId: auth.userId,
      botToken,
      guilds: guildsResult.guilds,
      supabase,
    });

    const updatedAt = new Date().toISOString();
    const response = NextResponse.json({ adminGuilds, updatedAt });

    if (refreshed && accessToken) {
      setAccessTokenCookie(response, accessToken);
    }

    return response;
  } catch (error) {
    console.error('refresh-guilds error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
