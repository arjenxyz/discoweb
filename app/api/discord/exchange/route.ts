import { NextResponse } from 'next/server';
import { logWebEvent } from '@/lib/serverLogger';
import { createClient } from '@supabase/supabase-js';
import { setSessionCookies } from '@/lib/auth';

interface Guild {
  id: string;
  name: string;
  isAdmin: boolean;
  isSetup: boolean;
  verifyRoleId: string | null;
  isOwner: boolean;
}

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const REQUIRED_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID ?? '1465999952940498975';
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    // Prefer the more explicit env var if present (ensure exact match with Discord app)
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? process.env.NEXT_PUBLIC_REDIRECT_URI;
    // Debug: log presence of values (DO NOT log secrets themselves)
    try {
      console.log('exchange debug:', {
        codePresent: !!code,
        clientIdPresent: !!clientId,
        hasClientSecret: !!clientSecret,
        redirectUri: redirectUri ?? null,
        hasBotToken: !!process.env.DISCORD_BOT_TOKEN,
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // ignore logging failures
    }
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!code || !clientId || !clientSecret || !redirectUri || !botToken) {
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'missing_env_or_code',
      });
      return NextResponse.json({ status: 'error', reason: 'missing_env_or_code' }, { status: 400 });
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      scope: 'identify guilds',
    });

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (e) {
      console.error('discord/exchange token fetch failed', e);
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'token_fetch_error',
        metadata: { error: String(e) },
      });
      return NextResponse.json({ status: 'error', reason: 'token_fetch_error' }, { status: 502 });
    }

    if (!tokenResponse.ok) {
      let discordBody = null;
      try {
        discordBody = await tokenResponse.json();
      } catch {
        try { discordBody = await tokenResponse.text(); } catch { discordBody = null; }
      }
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'token_exchange_failed',
        metadata: { discordStatus: tokenResponse.status, discordBody },
      });
      return NextResponse.json({ status: 'error', reason: 'token_exchange_failed', discordStatus: tokenResponse.status, discordBody }, { status: 401 });
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    let userResponse: Response;
    try {
      userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
    } catch (e) {
      console.error('discord/exchange user fetch failed', e);
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'user_fetch_error',
        metadata: { error: String(e) },
      });
      return NextResponse.json({ status: 'error', reason: 'user_fetch_error' }, { status: 502 });
    }

    if (!userResponse.ok) {
      let discordBody = null;
      try {
        discordBody = await userResponse.json();
      } catch {
        try { discordBody = await userResponse.text(); } catch { discordBody = null; }
      }
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'user_fetch_failed',
        metadata: { discordStatus: userResponse.status, discordBody },
      });
      return NextResponse.json({ status: 'error', reason: 'user_fetch_failed', discordStatus: userResponse.status, discordBody }, { status: 401 });
    }

    const user = (await userResponse.json()) as {
      id: string;
      username: string;
      avatar: string | null;
      discriminator: string;
      email?: string | null;
    };

    // Kullanıcının bulunduğu tüm sunucuları al
    let guildsResponse: Response;
    try {
      guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
    } catch (e) {
      console.error('discord/exchange guilds fetch failed', e);
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'guilds_fetch_error',
        metadata: { error: String(e) },
      });
      return NextResponse.json({ status: 'error', reason: 'guilds_fetch_error' }, { status: 502 });
    }

    if (!guildsResponse.ok) {
      let discordBody = null;
      try {
        discordBody = await guildsResponse.json();
      } catch {
        try { discordBody = await guildsResponse.text(); } catch { discordBody = null; }
      }
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'guilds_fetch_failed',
        metadata: { discordStatus: guildsResponse.status, discordBody },
      });
      return NextResponse.json({ status: 'error', reason: 'guilds_fetch_failed', discordStatus: guildsResponse.status, discordBody }, { status: 401 });
    }

    const guilds = (await guildsResponse.json()) as Array<{
      id: string;
      name: string;
      permissions: string;
      owner?: boolean;
    }>;

    const supabase = getSupabase();

    if (supabase) {
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;
      await (supabase.from('users') as unknown as {
        upsert: (values: Array<Record<string, unknown>>, options?: { onConflict?: string }) => Promise<unknown>;
      }).upsert(
        [
          {
            discord_id: user.id,
            username: user.username,
            avatar: user.avatar ?? null,
            email: user.email ?? null,
            oauth_access_token: tokenData.access_token,
            oauth_refresh_token: tokenData.refresh_token ?? null,
            oauth_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'discord_id' },
      );
    }

    // OAuth ile gelen sunucuları sakla (kullanıcı izin verdiyse)
    if (supabase && guilds.length > 0) {
      await (supabase.from('user_guilds') as unknown as {
        upsert: (values: Array<Record<string, unknown>>, options?: { onConflict?: string }) => Promise<unknown>;
      }).upsert(
        guilds.map((guild) => ({
          user_id: user.id,
          guild_id: guild.id,
          guild_name: guild.name,
          guild_icon: (guild as { icon?: string | null }).icon ?? null,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,guild_id' },
      );
    }

    // Kullanıcının erişebildiği ve botun bulunduğu sunucuları döndür
    const adminGuilds: Guild[] = [];

    if (supabase) {
      // Supabase'den bilinen sunucuları çek (setup şartı yok)
      const { data: knownServers } = await supabase
        .from('servers')
        .select('discord_id, name, admin_role_id, verify_role_id, is_setup')
        .in('discord_id', guilds.map((g) => g.id));

      const serverByGuildId = new Map((knownServers ?? []).map((server) => [server.discord_id, server]));

      for (const userGuild of guilds) {
        const server = serverByGuildId.get(userGuild.id);

        // Daha detaylı loglama ekle
        console.log(`Admin kontrolü başlatıldı: Sunucu=${userGuild.name}, Kullanıcı=${user.id}`);

        try {
          const memberResponse = await fetch(
            `https://discord.com/api/guilds/${userGuild.id}/members/${user.id}`,
            {
              headers: { Authorization: `Bot ${botToken}` },
            },
          );

          if (memberResponse.ok) {
            const member = (await memberResponse.json()) as { roles: string[] };
            const adminRoleId = server?.admin_role_id ?? null;
            const isAdmin = adminRoleId ? member.roles.includes(adminRoleId) : false;

            console.log(`Sunucu ${userGuild.name}: admin_role_id=${adminRoleId}, user_roles=${member.roles}, isAdmin=${isAdmin}`);

            adminGuilds.push({
              id: userGuild.id,
              name: server?.name ?? userGuild.name,
              isAdmin: isAdmin,
              isSetup: Boolean(server?.is_setup),
              verifyRoleId: server?.verify_role_id ?? null,
              isOwner: Boolean(userGuild.owner)
            });
          } else {
            // Bot bu sunucuda değilse veya kullanıcı bilgisi alınamıyorsa listeye ekleme
            console.log(`Discord API isteği başarısız: Sunucu=${userGuild.name}, Kullanıcı=${user.id}, Status=${memberResponse.status}`);
            let memberBody = null;
            try { memberBody = await memberResponse.json(); } catch { try { memberBody = await memberResponse.text(); } catch {} }
            await logWebEvent(request, {
              event: 'discord_exchange_failed',
              status: 'member_fetch_failed',
              userId: user.id,
              guildId: userGuild.id,
              metadata: { status: memberResponse.status, body: memberBody },
            });
          }
        } catch (error) {
          console.log(`Sunucu ${userGuild.name} kontrol edilemedi:`, error);
        }
      }
    }

    // Ana sunucudaki rol kontrolü (mevcut sistem için)
    let mainGuildMemberResponse: Response;
    try {
      mainGuildMemberResponse = await fetch(
        `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        },
      );
    } catch (e) {
      console.error('discord/exchange main guild member fetch failed', e);
      await logWebEvent(request, {
        event: 'discord_exchange_failed',
        status: 'main_guild_member_fetch_error',
        metadata: { error: String(e) },
      });
      // continue with hasRole = false; isAdmin = false; // we'll just treat as missing
      mainGuildMemberResponse = { ok: false, status: 0} as unknown as Response;
    }

    let hasRole = false;
    let isAdmin = false;

    if (mainGuildMemberResponse.ok) {
      const member = (await mainGuildMemberResponse.json()) as { roles: string[] };
      hasRole = member.roles.includes(REQUIRED_ROLE_ID);
      
      // Supabase'den admin_role_id'yi çek
      let adminRoleId = ADMIN_ROLE_ID; // fallback
      if (supabase) {
        const { data: serverData } = await supabase
          .from('servers')
          .select('admin_role_id')
          .eq('discord_id', GUILD_ID)
          .single();
        if (serverData?.admin_role_id) {
          adminRoleId = serverData.admin_role_id;
        }
      }
      
      isAdmin = adminRoleId ? member.roles.includes(adminRoleId) : false;

      console.log(`Ana sunucu kontrolü: user_roles=${member.roles}, required_role=${REQUIRED_ROLE_ID}, hasRole=${hasRole}, admin_role=${adminRoleId}, isAdmin=${isAdmin}`);
    }

    // Status'u belirle
    let status: 'ok' | 'needs_rules' | 'no_guilds' = 'no_guilds';
    
    if (adminGuilds.length > 0) {
      // Admin olan sunucu varsa, OK
      const hasAdminGuild = adminGuilds.some(g => g.isAdmin);
      if (hasAdminGuild) {
        status = 'ok';
      } else {
        // Admin olmayan ama verify rolü olan sunucu varsa, rules gerekli
        // const needsRules = adminGuilds.some(g => g.verifyRoleId);
        // status = needsRules ? 'needs_rules' : 'ok';
        // Kurallar adımını atla - direkt dashboard'a git
        status = 'ok';
      }
    }

    console.log('Final status determination:', { adminGuilds, hasAdminGuild: adminGuilds.some(g => g.isAdmin), status, isAdmin });

    const response = NextResponse.json({ 
      status, 
      isAdmin,
      adminGuilds,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        discriminator: user.discriminator
      }
    });
    
    console.log('Exchange response:', { status, isAdmin, adminGuilds }); // Debug log
    
    setSessionCookies(response, user.id);

    response.cookies.set('discord_access_token', tokenData.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const cookieHeader = request.headers.get('cookie') || '';
    const guildIdMatch = cookieHeader.match(/selected_guild_id=([^;]+)/);
    const selectedGuildId = guildIdMatch ? guildIdMatch[1] : GUILD_ID;

    await logWebEvent(request, {
      event: 'discord_role_check',
      status: hasRole ? 'has_role' : 'missing_role',
      userId: user.id,
      guildId: selectedGuildId,
      roleId: REQUIRED_ROLE_ID,
      metadata: { username: user.username },
    });

    return response;
  } catch (err) {
    // log to console so developers can see stack during local development
    console.error('discord/exchange unhandled error', err);
    await logWebEvent(request, {
      event: 'discord_exchange_failed',
      status: 'unhandled_exception',
      metadata: {
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    });

    // include the error message in the response body during development
    const responseBody: Record<string, unknown> = {
      status: 'error',
      reason: 'unhandled_exception',
    };
    if (process.env.NODE_ENV !== 'production') {
      responseBody.error = String(err);
    }

    return NextResponse.json(responseBody, { status: 500 });
  }
}
