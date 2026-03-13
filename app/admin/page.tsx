import Link from 'next/link';
import { createClient, SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import RemoveSetupButton from './RemoveSetupButton';
import { getSessionUserId } from '@/lib/auth';
import AdminOverviewClient from './AdminOverviewClient';

interface SupabaseQueryResult {
  data: unknown;
  error: { message: string } | null;
  count?: number;
}

export const dynamic = 'force-dynamic';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const MAINTENANCE_ROLE_ID =
  process.env.MAINTENANCE_ROLE_ID ?? process.env.DISCORD_MAINTENANCE_ROLE_ID;
const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';
const REQUIRED_CHANNELS = [
  'main',
  'auth',
  'roles',
  'system',
  'suspicious',
  'store',
  'wallet',
  'notifications',
  'settings',
];

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

// Seçilen sunucu ID'sini al
const getSelectedGuildId = async (): Promise<string> => {
  // Server-side'da cookie'lere erişim için headers kullan
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;

  return selectedGuildId || GUILD_ID; // Varsayılan olarak config'deki guild ID
};

const formatNumber = new Intl.NumberFormat('tr-TR');
const formatShortDate = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

// Admin yetkisi kontrolü
const checkAdminAccess = async (selectedGuildId: string): Promise<boolean> => {
  try {
    console.log('Checking admin access for guild:', selectedGuildId);
    
    const discordUserId = await getSessionUserId();
    
    console.log('Discord user ID:', discordUserId);
    
    if (!discordUserId) {
      console.log('No discord user ID found');
      return false;
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.log('No bot token found');
      return false;
    }

    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

    const developerResponse = await fetch(
      `https://discord.com/api/guilds/${developerGuildId}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );

    if (developerResponse.ok) {
      const developerMember = (await developerResponse.json()) as { roles: string[] };
      if (developerMember.roles.includes(developerRoleId)) {
        return true;
      }
    }

    // Supabase'den admin_role_id'yi al
    const supabase = getSupabase();
    if (!supabase) {
      console.log('No supabase client');
      return false;
    }

    const { data: server } = await supabase
      .from('servers')
      .select('admin_role_id')
      .eq('discord_id', selectedGuildId)
      .maybeSingle();

    console.log('Server data:', server);
    
    if (!server?.admin_role_id) {
      console.log('No admin role ID found for server');
      return false;
    }

    console.log('Admin role ID:', server.admin_role_id);

    // Discord API ile kullanıcının rollerini kontrol et
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${selectedGuildId}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );

    console.log('Member response status:', memberResponse.status);
    
    if (!memberResponse.ok) {
      console.log('Member response not ok');
      return false;
    }

    const member = (await memberResponse.json()) as { roles: string[] };
    console.log('Member roles:', member.roles);
    const hasRole = member.roles.includes(server.admin_role_id);
    console.log('Has admin role:', hasRole);
    
    return hasRole;
  } catch (error) {
    console.error('Admin access check failed:', error);
    return false;
  }
};

const getOverviewData = async () => {
  console.log('Getting overview data...');
  const supabase = getSupabase();
  if (!supabase) {
    console.log('No supabase client');
    return null;
  }

  const selectedGuildId = await getSelectedGuildId();
  console.log('Selected guild ID:', selectedGuildId);

  const { data: server } = await supabase
    .from('servers')
    .select('id,name,admin_role_id,verify_role_id,is_setup')
    .eq('discord_id', selectedGuildId)
    .maybeSingle();

  if (!server) {
    return { server: null, selectedGuildId };
  }

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const activitySince = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const [
    webhookCount,
    channelConfigs,
    auditLogs24h,
    recentLogs,
    logActivityCount,
    publicMetrics,
  ] = await Promise.all([
    supabase
      .from('log_channel_configs')
      .select('id', { count: 'exact', head: true })
      .eq('guild_id', selectedGuildId)
      .eq('is_active', true),
    supabase
      .from('log_channel_configs')
      .select('channel_type,is_active')
      .eq('guild_id', selectedGuildId)
      .eq('is_active', true),
    supabase
      .from('web_audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since24h),
    supabase
      .from('web_audit_logs')
      .select('id,event,status,user_id,created_at')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('web_audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', activitySince),
    supabase
      .from('public_metrics')
      .select('updated_at')
      .eq('server_id', server.id)
      .maybeSingle(),
  ]);

  return {
    server,
    selectedGuildId,
    webhookCount: webhookCount.count ?? 0,
    configuredChannels: channelConfigs.data ?? [],
    auditLogs24h: auditLogs24h.count ?? 0,
    metricsUpdatedAt: publicMetrics.data?.updated_at ?? null,
    recentLogs: recentLogs.data ?? [],
    logActivityCount: logActivityCount.count ?? 0,
  };
};

const checkSupabaseTable = async (tableName: string, query?: (supabase: SupabaseClient) => Promise<PostgrestResponse<SupabaseQueryResult>>): Promise<{ ok: boolean; error?: string; count?: number }> => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return { ok: false, error: 'Supabase client not available' };
    }

    let result: PostgrestResponse<SupabaseQueryResult>;
    if (query) {
      result = await query(supabase);
    } else {
      // Default: count records
      result = await supabase.from(tableName).select('id', { count: 'exact', head: true });
    }

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, count: result.count ?? 0 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const getSupabaseTableStatuses = async (): Promise<Array<{ table: string; ok: boolean; error?: string; count?: number }>> => {
  const tables = [
    { name: 'servers', query: undefined },
    { name: 'log_channel_configs', query: undefined },
    { name: 'web_audit_logs', query: undefined },
    { name: 'public_metrics', query: undefined },
    { name: 'store_items', query: undefined },
    { name: 'store_orders', query: undefined },
    { name: 'users', query: undefined },
    { name: 'promotions', query: undefined },
    { name: 'maintenance_flags', query: undefined },
    { name: 'member_wallets', query: undefined },
    { name: 'wallet_ledger', query: undefined },
    { name: 'daily_earnings', query: undefined },
    { name: 'server_daily_stats', query: undefined },
    { name: 'member_daily_stats', query: undefined },
    { name: 'server_overview_stats', query: undefined },
    { name: 'member_overview_stats', query: undefined },
  ];

  const results = await Promise.all(
    tables.map(async ({ name, query }) => {
      const result = await checkSupabaseTable(name, query);
      return { table: name, ...result };
    })
  );

  return results;
};

export default async function AdminDashboardPage() {
  console.log('AdminDashboardPage called');
  const selectedGuildId = await getSelectedGuildId();
  console.log('Selected guild ID in page:', selectedGuildId);
  
  // Admin yetkisi kontrolü
  const hasAdminAccess = await checkAdminAccess(selectedGuildId);
  console.log('Has admin access:', hasAdminAccess);
  
  if (!hasAdminAccess) {
    console.log('No admin access, showing error page');
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erişim Reddedildi</h1>
          <p className="text-white/70 mb-6">
            Bu sunucuda yönetici yetkiniz yok.
          </p>
          <a 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  console.log('Getting overview data...');
  const overview = await getOverviewData();
  console.log('Overview data:', overview);

  if (!overview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Admin verileri yüklenemedi. Sunucu ayarlarını ve yetkileri kontrol edin.
      </div>
    );
  }

  return (
    <AdminOverviewClient
      serverName={overview.server?.name ?? null}
      serverSetup={overview.server?.is_setup ?? false}
      selectedGuildId={overview.selectedGuildId}
    />
  );
}
