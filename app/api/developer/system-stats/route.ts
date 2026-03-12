import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const auth = await requireSessionUser();
    if (!auth.ok) return auth.response;

    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? '1465698764453838882';

    const devRes = await fetch(
      `https://discord.com/api/guilds/${developerGuildId}/members/${auth.userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!devRes.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

    const devMember = (await devRes.json()) as { roles: string[] };
    if (!devMember.roles.includes(developerRoleId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Parallel real queries
    const [
      membersRes,
      serversRes,
      ordersRes,
      notifsRes,
      errorsRes,
      maintenanceRes,
      mailsRes,
    ] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact', head: true }),
      supabase.from('servers').select('id', { count: 'exact', head: true }),
      supabase.from('store_orders').select('id', { count: 'exact', head: true }),
      supabase.from('notifications').select('id', { count: 'exact', head: true }),
      supabase.from('error_logs').select('id', { count: 'exact', head: true }),
      supabase.from('maintenance_flags').select('*'),
      supabase.from('system_mails').select('id', { count: 'exact', head: true }),
    ]);

    const maintenance = maintenanceRes.data ?? [];
    const activeMaintenanceCount = maintenance.filter((m: { enabled?: boolean }) => m.enabled === true).length;

    return NextResponse.json({
      stats: {
        totalMembers: membersRes.count ?? 0,
        totalServers: serversRes.count ?? 0,
        totalOrders: ordersRes.count ?? 0,
        totalNotifications: notifsRes.count ?? 0,
        totalErrors: errorsRes.count ?? 0,
        totalMails: mailsRes.count ?? 0,
        maintenanceActive: activeMaintenanceCount > 0,
        maintenanceModules: maintenance.length,
        activeMaintenanceCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('System stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
