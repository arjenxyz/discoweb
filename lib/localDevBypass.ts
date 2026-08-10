/**
 * Local development auth bypass.
 * Active only when NODE_ENV=development AND the request host is loopback.
 * Production builds never enable this.
 */

export const LOCAL_DEV_USER_ID = 'local-dev-bypass';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

export function isLoopbackHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, '');
  return LOOPBACK_HOSTS.has(host);
}

export function isLocalDevEnvironment(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.ALLOW_LOCAL_DEV_BYPASS === '0' || process.env.ALLOW_LOCAL_DEV_BYPASS === 'false') {
    return false;
  }
  return true;
}

/** Edge / middleware / route handlers with a Request. */
export function isLocalDevBypassFromRequest(request: Request): boolean {
  if (!isLocalDevEnvironment()) return false;

  try {
    const urlHost = new URL(request.url).hostname;
    if (isLoopbackHostname(urlHost)) return true;
  } catch {
    // ignore
  }

  const forwarded = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host');
  const candidate = (forwarded || host || '').split(',')[0]?.trim() ?? '';
  return isLoopbackHostname(candidate);
}

/** App Router server code using next/headers. */
export async function isLocalDevBypass(): Promise<boolean> {
  if (!isLocalDevEnvironment()) return false;

  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const forwarded = h.get('x-forwarded-host');
    const host = h.get('host');
    const candidate = (forwarded || host || '').split(',')[0]?.trim() ?? '';
    return isLoopbackHostname(candidate);
  } catch {
    return false;
  }
}

/** Browser-side guard (navbar / client layouts). */
export function isLocalDevBypassClient(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV === 'production') return false;
  return isLoopbackHostname(window.location.hostname);
}
