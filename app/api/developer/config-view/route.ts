import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

interface ConfigItem {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'secret';
  description: string;
  category: string;
}

async function checkDeveloperAccess(userId: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;

  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? '1465698764453838882';

  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${developerGuildId}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!res.ok) return false;
    const member = (await res.json()) as { roles: string[] };
    return member.roles.includes(developerRoleId);
  } catch {
    return false;
  }
}

function maskValue(val: string): string {
  if (val.length <= 8) return '••••••••';
  return val.substring(0, 4) + '••••' + val.substring(val.length - 4);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) return auth.response;
    if (!(await checkDeveloperAccess(auth.userId))) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    const configs: ConfigItem[] = [];

    // Environment
    configs.push(
      { key: 'NODE_ENV', value: process.env.NODE_ENV ?? 'unknown', type: 'string', description: 'Node.js çalışma ortamı', category: 'Environment' },
      { key: 'NEXT_PUBLIC_BASE_URL', value: process.env.NEXT_PUBLIC_BASE_URL ?? '(tanımlı değil)', type: 'string', description: 'Uygulama ana URL', category: 'Environment' },
      { key: 'VERCEL_ENV', value: process.env.VERCEL_ENV ?? '(tanımlı değil)', type: 'string', description: 'Vercel ortamı', category: 'Environment' },
    );

    // Database
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    configs.push(
      { key: 'SUPABASE_URL', value: supabaseUrl || '(tanımlı değil)', type: 'string', description: 'Supabase proje URL', category: 'Database' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY ? maskValue(process.env.SUPABASE_SERVICE_ROLE_KEY) : '(tanımlı değil)', type: 'secret', description: 'Supabase service role key', category: 'Database' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? maskValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : '(tanımlı değil)', type: 'secret', description: 'Supabase anon key', category: 'Database' },
    );

    // API Keys
    configs.push(
      { key: 'DISCORD_BOT_TOKEN', value: process.env.DISCORD_BOT_TOKEN ? maskValue(process.env.DISCORD_BOT_TOKEN) : '(tanımlı değil)', type: 'secret', description: 'Discord bot token', category: 'API Keys' },
      { key: 'DISCORD_CLIENT_ID', value: process.env.DISCORD_CLIENT_ID ?? process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '(tanımlı değil)', type: 'string', description: 'Discord uygulama client ID', category: 'API Keys' },
      { key: 'DISCORD_CLIENT_SECRET', value: process.env.DISCORD_CLIENT_SECRET ? maskValue(process.env.DISCORD_CLIENT_SECRET) : '(tanımlı değil)', type: 'secret', description: 'Discord client secret', category: 'API Keys' },
    );

    // Security
    configs.push(
      { key: 'DEVELOPER_ROLE_ID', value: process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013', type: 'string', description: 'Developer rol ID', category: 'Security' },
      { key: 'DEVELOPER_GUILD_ID', value: process.env.DEVELOPER_GUILD_ID ?? '1465698764453838882', type: 'string', description: 'Developer sunucu ID', category: 'Security' },
      { key: 'JWT_SECRET', value: process.env.JWT_SECRET ? '(tanımlı)' : '(tanımlı değil)', type: 'secret', description: 'JWT secret token', category: 'Security' },
    );

    // Server
    configs.push(
      { key: 'NEXT_PUBLIC_DISCORD_REDIRECT_URI', value: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? '(tanımlı değil)', type: 'string', description: 'Discord OAuth redirect URI', category: 'Server' },
      { key: 'NEXT_PUBLIC_REDIRECT_URI', value: process.env.NEXT_PUBLIC_REDIRECT_URI ?? '(tanımlı değil)', type: 'string', description: 'Genel redirect URI', category: 'Server' },
    );

    // Status checks
    const dbConnected = !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const botConfigured = !!process.env.DISCORD_BOT_TOKEN;
    const oauthConfigured = !!(process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) && !!process.env.DISCORD_CLIENT_SECRET;

    configs.push(
      { key: 'DATABASE_STATUS', value: dbConnected, type: 'boolean', description: 'Veritabanı bağlantısı hazır mı', category: 'Environment' },
      { key: 'BOT_STATUS', value: botConfigured, type: 'boolean', description: 'Discord bot yapılandırılmış mı', category: 'Environment' },
      { key: 'OAUTH_STATUS', value: oauthConfigured, type: 'boolean', description: 'Discord OAuth yapılandırılmış mı', category: 'Environment' },
    );

    return NextResponse.json({
      configs,
      total: configs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config view error:', error);
    return NextResponse.json({ error: 'Failed to get configuration data' }, { status: 500 });
  }
}
