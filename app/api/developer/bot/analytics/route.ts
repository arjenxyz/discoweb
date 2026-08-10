import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

async function checkDeveloperAccess() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;
  const auth = await requireSessionUser();
  if (!auth.ok) return false;
  
  const discordUserId = auth.userId;
  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${developerGuildId}/members/${discordUserId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.roles.includes(developerRoleId);
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await checkDeveloperAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { count: totalServers } = await supabase.from('servers').select('*', { count: 'exact', head: true });
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // Son 7 günün tarihi
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Bugün dahil 7 gün
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data: rawStats } = await supabase
      .from('server_daily_stats')
      .select('stat_date, message_count, voice_minutes')
      .gte('stat_date', startDate);

    // Group by date
    const groupedData: Record<string, { messages: number, voice: number }> = {};
    
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      groupedData[dateStr] = { messages: 0, voice: 0 };
    }

    let todayMessages = 0;
    let todayVoice = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    if (rawStats) {
      for (const row of rawStats) {
        if (!groupedData[row.stat_date]) {
          groupedData[row.stat_date] = { messages: 0, voice: 0 };
        }
        groupedData[row.stat_date].messages += (row.message_count || 0);
        groupedData[row.stat_date].voice += (row.voice_minutes || 0);

        if (row.stat_date === todayStr) {
          todayMessages += (row.message_count || 0);
          todayVoice += (row.voice_minutes || 0);
        }
      }
    }

    // Convert to array and sort chronologically
    const trend = Object.entries(groupedData)
      .map(([date, stats]) => ({
        date,
        messages: stats.messages,
        voice: stats.voice
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalServers: totalServers || 0,
      totalUsers: totalUsers || 0,
      todayMessages,
      todayVoice,
      trend
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
