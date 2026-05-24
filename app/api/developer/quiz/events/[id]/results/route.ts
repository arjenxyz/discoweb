import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/developer/quiz/events/[id]/results
 * Tamamlanmış (veya devam eden) etkinliğin katılımcı sonuçları.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data: event, error: eventErr } = await supabase
    .from('quiz_events')
    .select(
      'id, title, scope, guild_id, lang, status, start_at, end_at, total_questions, prize_pool_papel, paid_out_at, current_position',
    )
    .eq('id', id)
    .maybeSingle();

  if (eventErr) return NextResponse.json({ error: eventErr.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: checkpoints } = await supabase
    .from('quiz_event_checkpoints')
    .select('position, papel_reward, label')
    .eq('event_id', id)
    .order('position', { ascending: true });

  const { data: participants, error: partErr } = await supabase
    .from('quiz_event_participants')
    .select(
      'user_id, guild_id, joined_at, wrong_count, total_correct, last_position, eliminated_at, perfect_score, papel_earned, paid_out_at',
    )
    .eq('event_id', id);

  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 });

  const sortedParticipants = (participants ?? []).slice().sort((a, b) => {
    const papelDiff = Number(b.papel_earned ?? 0) - Number(a.papel_earned ?? 0);
    if (papelDiff !== 0) return papelDiff;
    return (b.total_correct ?? 0) - (a.total_correct ?? 0);
  });

  const userIds = Array.from(new Set((participants ?? []).map((p) => p.user_id)));
  const usernameById = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('discord_id, username').in('discord_id', userIds);
    for (const u of users ?? []) {
      if (u.discord_id) usernameById.set(u.discord_id, u.username ?? u.discord_id);
    }
  }

  const rows = sortedParticipants.map((p) => ({
    user_id: p.user_id,
    username: usernameById.get(p.user_id) ?? p.user_id,
    guild_id: p.guild_id,
    joined_at: p.joined_at,
    total_correct: p.total_correct ?? 0,
    wrong_count: p.wrong_count ?? 0,
    last_position: p.last_position ?? 0,
    eliminated_at: p.eliminated_at,
    perfect_score: p.perfect_score === true,
    papel_earned: Number(p.papel_earned ?? 0),
    paid_out_at: p.paid_out_at,
  }));

  const totalPapel = rows.reduce((sum, r) => sum + r.papel_earned, 0);
  const perfectCount = rows.filter((r) => r.perfect_score).length;
  const eliminatedCount = rows.filter((r) => r.eliminated_at).length;

  return NextResponse.json({
    event,
    checkpoints: checkpoints ?? [],
    summary: {
      participant_count: rows.length,
      perfect_count: perfectCount,
      eliminated_count: eliminatedCount,
      total_papel_distributed: Number(totalPapel.toFixed(2)),
      rewards_paid: !!event.paid_out_at,
    },
    participants: rows,
  });
}
