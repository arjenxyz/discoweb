import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import { getSelectedGuildId, getServerRow, getSupabase } from '@/lib/playEarn/db';

export async function POST(request: Request) {
  const maintenance = await checkMaintenance(['site']);
  if (maintenance.blocked) {
    return NextResponse.json({ error: 'maintenance', key: maintenance.key }, { status: 503 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json()) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const guildId = await getSelectedGuildId();
  const server = await getServerRow(supabase, guildId);
  if (!server) return NextResponse.json({ error: 'server_not_found' }, { status: 404 });

  const { data: session } = await supabase
    .from('play_earn_sessions')
    .select('id, status, tokens_earned, caught_spawn_ids')
    .eq('id', sessionId)
    .eq('server_id', server.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: 'invalid_session' }, { status: 404 });
  if (session.status === 'completed') {
    return NextResponse.json({
      tokensEarned: session.tokens_earned,
      catches: (session.caught_spawn_ids ?? []).length,
    });
  }

  await supabase
    .from('play_earn_sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  const { data: wallet } = await supabase
    .from('member_wallets')
    .select('fish_token_balance')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({
    tokensEarned: session.tokens_earned,
    catches: (session.caught_spawn_ids ?? []).length,
    fishTokenBalance: Number(wallet?.fish_token_balance ?? 0),
  });
}
