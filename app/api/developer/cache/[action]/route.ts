import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/serverCache';

// Access the internal Map via the class – we cast to read private field
function getCacheMap(): Map<string, { value: unknown; expiresAt: number }> {
  return (serverCache as any).map as Map<string, { value: unknown; expiresAt: number }>;
}

// GET /api/developer/cache/[action]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  try {
    switch (action) {
      case 'stats': {
        const map = getCacheMap();
        const now = Date.now();
        let activeKeys = 0;
        let expiredKeys = 0;
        let totalBytes = 0;

        for (const [, entry] of map) {
          if (now > entry.expiresAt) {
            expiredKeys++;
          } else {
            activeKeys++;
          }
          try {
            totalBytes += JSON.stringify(entry.value).length * 2; // rough byte estimate
          } catch {
            totalBytes += 64;
          }
        }

        const mem = process.memoryUsage();
        const uptimeSec = process.uptime();
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const mins = Math.floor((uptimeSec % 3600) / 60);

        return NextResponse.json({
          success: true,
          stats: {
            totalKeys: map.size,
            activeKeys,
            expiredKeys,
            memoryUsage: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
            cacheBytes: totalBytes,
            uptime: days > 0 ? `${days}g ${hours}s ${mins}dk` : `${hours}s ${mins}dk`,
          },
        });
      }

      case 'entries': {
        const map = getCacheMap();
        const now = Date.now();
        const entries: { key: string; value: string; ttlRemaining: number; size: number; expired: boolean }[] = [];

        for (const [key, entry] of map) {
          const expired = now > entry.expiresAt;
          let valStr: string;
          try {
            valStr = JSON.stringify(entry.value);
          } catch {
            valStr = String(entry.value);
          }
          entries.push({
            key,
            value: valStr.length > 200 ? valStr.slice(0, 200) + '…' : valStr,
            ttlRemaining: expired ? 0 : Math.round((entry.expiresAt - now) / 1000),
            size: valStr.length * 2,
            expired,
          });
        }

        return NextResponse.json({ success: true, entries });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/developer/cache/[action]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  try {
    switch (action) {
      case 'clear': {
        const map = getCacheMap();
        const clearedKeys = map.size;
        serverCache.clear();

        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          clearedKeys,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}