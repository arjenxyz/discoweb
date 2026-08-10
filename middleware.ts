import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isLocalDevBypassFromRequest } from '@/lib/localDevBypass';

// Cache iÃ§in basit bir map (production'da Redis kullan)
const roleCheckCache = new Map<string, { roles: string[]; expires: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 dakika
const CACHE_GRACE_DURATION = 30 * 1000; // 30 saniye ekstra (geÃ§ici hata durumlarÄ±nda stale cache kullanmak iÃ§in)
const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';
const SESSION_COOKIE = 'discord_session';

type SessionPayload = {
  sub: string;
  exp: number;
};

const getSecret = () => process.env.SESSION_SECRET;

const base64UrlToBytes = (input: string) => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    base64 = btoa(binary);
  }
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64UrlDecode = (input: string) => {
  return new TextDecoder().decode(base64UrlToBytes(input));
};

const sign = async (data: string, secret: string) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('WebCrypto unavailable');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
};

const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const secret = getSecret();
    if (!secret) return null;
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expected = await sign(encoded, secret);
    if (sig !== expected) return null;
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (!payload?.sub || !payload?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
};

const getSessionUserId = async (request: NextRequest) => {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
};

// Returns array of roles if in server, false if not in server (404), null if API error (e.g. 403)
async function checkUserRoles(userId: string, guildId: string): Promise<string[] | false | null> {
  // Cache kontrolü
  const cacheKey = `${userId}-${guildId}`;
  const cached = roleCheckCache.get(cacheKey);
  const now = Date.now();

  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('Middleware: No bot token available');
      return null;
    }

    if (cached && cached.expires > now) {
      return cached.roles;
    }

    // Discord API'den üyenin rollerini al
    const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!memberResponse.ok) {
      console.error(`Middleware: Failed to fetch member roles: ${memberResponse.status}`);

      // Eğer geçmişte cache'lenmiş roller varsa ve bu süre grace içindeyse, stale cache kullan
      if (cached && now < cached.expires + CACHE_GRACE_DURATION) {
        console.warn('Middleware: Using stale cached roles due to transient fetch failure');
        return cached.roles;
      }

      // 404 -> üye sunucuda değil
      if (memberResponse.status === 404) {
        return false;
      }

      // 429 veya 5xx veya 403 (bot sunucuda değil) gibi geçici/diğer hatalar için null döndür
      return null;
    }

    const member = (await memberResponse.json()) as { roles: string[] };

    // Cache'e kaydet
    roleCheckCache.set(cacheKey, {
      roles: member.roles,
      expires: now + CACHE_DURATION,
    });

    return member.roles;
  } catch (error) {
    console.error('Middleware: Error checking user roles:', error);

    // Geçici hata durumunda cache varsa kullan
    if (cached) {
      console.warn('Middleware: Using stale cached roles due to error');
      return cached.roles;
    }

    return null;
  }
}

type ServerRoleConfig = {
  adminRoleId: string | null;
  verifyRoleId: string | null;
};

async function getServerRoleConfig(guildId: string): Promise<ServerRoleConfig> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('Middleware: Supabase credentials not available, skipping role check');
      return { adminRoleId: null, verifyRoleId: null };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: server } = await supabase
      .from('servers')
      .select('admin_role_id, verify_role_id')
      .eq('discord_id', guildId)
      .maybeSingle();

    console.log('Middleware: Server data from DB:', server);
    return {
      adminRoleId: server?.admin_role_id ?? null,
      verifyRoleId: server?.verify_role_id ?? null,
    };
  } catch (error) {
    console.error('Middleware: Error in getServerRoleConfig:', error);
    return { adminRoleId: null, verifyRoleId: null };
  }
}
async function isDeveloper(userId: string): Promise<boolean> {
	const roleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
	const guildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

	if (!roleId || !guildId) {
		return false;
	}

	const roles = await checkUserRoles(userId, guildId);
	if (roles === null || roles === false) {
		return false;
	}

	return roles.includes(roleId);
}

const IGNORED_PREFIXES = ['/api', '/_next', '/gif', '/images', '/fonts', '/data'];
const IGNORED_PATHS = ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/sw.js', '/manifest.json'];

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;

	// Static dosyalarÄ± ve API'leri atla
	if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || IGNORED_PATHS.includes(pathname)) {
		return NextResponse.next();
	}

	// Localhost + next dev: Discord girişi olmadan tüm sayfaları aç
	if (isLocalDevBypassFromRequest(request)) {
		return NextResponse.next();
	}

	// Maintenance kontrolÃ¼
	try {
		const response = await fetch(new URL('/api/maintenance', origin), { cache: 'no-store' });
		if (response.ok) {
			const data = (await response.json()) as { flags?: Record<string, { is_active?: boolean }> };
			if (data?.flags?.site?.is_active) {
				try {
					const userId = await getSessionUserId(request);
					if (userId) {
						const developer = await isDeveloper(userId);
						if (developer) {
							return NextResponse.next();
						}
					}
				} catch {
					// Developer kontrolÃ¼ baÅŸarÄ±sÄ±z olursa normal bakÄ±m yÃ¶nlendirmesi uygulanÄ±r
				}

				return NextResponse.redirect(new URL('/maintenance', request.url));
			}
		}
	} catch {
		// Maintenance kontrolÃ¼ baÅŸarÄ±sÄ±z olursa devam et
	}

	// Activity sayfalarÄ±nÄ± atla (Discord Embedded App SDK kendi auth'unu kullanÄ±r)
	if (pathname.startsWith('/activity')) {
		return NextResponse.next();
	}

	// Ana sayfa ve public sayfalarÄ± atla
	if (pathname === '/' || pathname.startsWith('/maintenance') || pathname.startsWith('/server-left')) {
		return NextResponse.next();
	}

	// Auth callback ve error sayfalarÄ±nÄ± atla
	if (pathname.includes('/auth/')) {
		return NextResponse.next();
	}

	// Developer sayfalarÄ± iÃ§in Ã¼yelik kontrolÃ¼nÃ¼ atla (yetki kontrolÃ¼ sayfa iÃ§inde yapÄ±lÄ±r)
	if (pathname.startsWith('/developer')) {
		return NextResponse.next();
	}

	// KullanÄ±cÄ±nÄ±n giriÅŸ yapmÄ±ÅŸ olup olmadÄ±ÄŸÄ±nÄ± ve sunucuda Ã¼ye olup olmadÄ±ÄŸÄ±nÄ± kontrol et
	try {
		const userId = await getSessionUserId(request);
		const selectedGuildId = request.cookies.get('selected_guild_id')?.value;

		if (userId && selectedGuildId) {
			console.log('ğŸ” Middleware: Checking server membership for user:', userId, 'guild:', selectedGuildId);

			// KullanÄ±cÄ±nÄ±n sunucuda Ã¼ye olup olmadÄ±ÄŸÄ±nÄ± kontrol et
			const userRoles = await checkUserRoles(userId, selectedGuildId);

			if (userRoles === null) {
				console.warn('🚧 Middleware: Could not verify server membership (transient error), allowing access for now');
			} else if (userRoles === false) {
				console.log('🚪 Middleware: User is not a member of the selected server, redirecting to /server-left');
				// Kullanıcı sunucudan ayrılmış, server-left sayfasına yönlendir
				return NextResponse.redirect(new URL('/server-left', request.url));
			} else {
				console.log('✅ Middleware: User is a member of the server');
			}
		}
	} catch (error) {
		console.error('ğŸ”  Middleware: Error checking server membership:', error);
		// Hata durumunda devam et (fail-safe)
	}

	// Dashboard ve Admin sayfalarına sadece Admin ve Developer yetkisi olanlar girebilir
	if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
		console.log('🔍 Middleware: Protected page access detected:', pathname);
		try {
			const userId = await getSessionUserId(request);
			const selectedGuildId = request.cookies.get('selected_guild_id')?.value;

			if (!userId || !selectedGuildId) {
				console.log('🔍 Middleware: Missing user or guild ID, redirecting to select-server');
				return NextResponse.redirect(new URL('/auth/select-server?error=missing_id', request.url));
			}

			// DEVELOPER BYPASS
			const developer = await isDeveloper(userId);
			if (developer) {
				console.log('✅ Middleware: Developer access granted, bypassing server checks');
				return NextResponse.next();
			}

			const userRoles = await checkUserRoles(userId, selectedGuildId);
			
			if (userRoles === null) {
				console.warn('🔍 Middleware: Could not fetch user roles (transient error), redirecting to select-server');
				return NextResponse.redirect(new URL('/auth/select-server?error=roles_null', request.url));
			}

			if (userRoles === false) {
				console.log('🔍 Middleware: User is not a member of the selected server, redirecting to /server-left');
				return NextResponse.redirect(new URL('/server-left', request.url));
			}

			const roleConfig = await getServerRoleConfig(selectedGuildId);
			const adminRoleId = roleConfig.adminRoleId;

			if (!adminRoleId) {
				console.log('🔍 Middleware: No admin role configured for server, allowing access');
				return NextResponse.next();
			}

			const hasAdminRole = userRoles.includes(adminRoleId);

			if (!hasAdminRole) {
				console.log(`🔍 Middleware: User ${userId} is not Admin. Redirecting to home.`);
				roleCheckCache.delete(`${userId}-${selectedGuildId}`);
				return NextResponse.redirect(new URL('/?error=not_admin', request.url));
			}

			console.log('✅ Middleware: Access granted for protected page');
		} catch (error) {
			console.error('🔍 Middleware: Unexpected error in protected route gate:', error);
			return NextResponse.redirect(new URL('/', request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|gif/|images/|fonts/|data/).*)'],
};

