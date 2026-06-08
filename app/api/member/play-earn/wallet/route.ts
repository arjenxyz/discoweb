import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import { getOrCreateConfig, getSelectedGuildId, getServerRow, getSupabase, getTodayStats } from '@/lib/playEarn/db';

export async function GET() {
  const maintenance = await checkMaintenance(['site']);
  if (maintenance.blocked) {
    return NextResponse.json({ error: 'maintenance', key: maintenance.key }, { status: 503 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const guildId = await getSelectedGuildId();
  const server = await getServerRow(supabase, guildId);
  if (!server) return NextResponse.json({ error: 'server_not_found' }, { status: 404 });

  const config = await getOrCreateConfig(supabase, server.id);
  const stats = await getTodayStats(supabase, server.id, userId);

  const { data: wallet } = await supabase
    .from('member_wallets')
    .select('fish_token_balance, balance')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .maybeSingle();

  const papelConvertedToday = Number(stats?.papel_converted_today ?? 0);
  const remainingPapelCap = Math.max(0, config.daily_papel_cap - papelConvertedToday);

  return NextResponse.json({
    fishTokenBalance: Number(wallet?.fish_token_balance ?? 0),
    papelBalance: Number(wallet?.balance ?? 0),
    papelConvertedToday,
    remainingPapelCap,
    jetonPerPapel: config.jeton_per_papel,
    minConvertJeton: config.min_convert_jeton,
  });
}
