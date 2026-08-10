/**
 * Quiz Event ödül dağıtımı (idempotent).
 *
 * - status='finished' AND paid_out_at IS NULL event'ler için çalışır.
 * - Her participant için:
 *    - geçtiği checkpoint pozisyonlarının papel_reward toplamı = checkpoint_papel
 *    - total_correct == total_questions ise perfect_score=true
 *    - prize_pool_papel / perfect_count = perfect bonus
 * - Per-guild event'te credit guild = event.guild_id
 * - Global event'te credit guild = participant.guild_id (kullanıcının katıldığı sunucu)
 * - member_wallets.balance += papel_earned upsert
 * - wallet_ledger insert: type='quiz_reward', metadata={ event_id, checkpoint_papel, perfect_bonus, breakdown }
 * - system_mails insert: category=system (bilgilendirme; cüzdan zaten güncellendi)
 * - event.paid_out_at = now()
 *
 * Auth: ?secret=$QUIZ_CRON_SECRET veya Authorization: Bearer $QUIZ_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendQuizMotivationMail, sendQuizRewardMail } from '@/lib/quiz/sendRewardMail';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

function checkSecret(request: NextRequest): boolean {
  const secret = process.env.QUIZ_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('secret');
  const auth = request.headers.get('authorization');
  const fromHeader = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return fromQuery === secret || fromHeader === secret;
}

type Event = {
  id: string;
  title: string;
  scope: 'global' | 'guild';
  guild_id: string | null;
  total_questions: number;
  prize_pool_papel: number;
};

type Checkpoint = { position: number; papel_reward: number; label: string | null };

type Participant = {
  event_id: string;
  user_id: string;
  guild_id: string | null;
  total_correct: number;
  wrong_count: number;
  last_position: number;
  eliminated_at: string | null;
  paid_out_at: string | null;
};

async function payoutEvent(supabase: SupabaseClient, event: Event) {
  const { data: checkpoints } = await supabase
    .from('quiz_event_checkpoints')
    .select('position, papel_reward, label')
    .eq('event_id', event.id)
    .order('position', { ascending: true });

  const cps: Checkpoint[] = (checkpoints ?? []).map((c) => ({
    position: c.position,
    papel_reward: Number(c.papel_reward),
    label: c.label ?? null,
  }));

  const { data: participants } = await supabase
    .from('quiz_event_participants')
    .select('event_id, user_id, guild_id, total_correct, wrong_count, last_position, eliminated_at, paid_out_at')
    .eq('event_id', event.id);

  const parts = (participants ?? []) as Participant[];
  const perfectScorers = parts.filter((p) => p.total_correct >= event.total_questions);
  const perfectBonus = perfectScorers.length > 0 && Number(event.prize_pool_papel) > 0
    ? Number((Number(event.prize_pool_papel) / perfectScorers.length).toFixed(2))
    : 0;

  let paid = 0;
  let mailsSent = 0;
  for (const p of parts) {
    if (p.paid_out_at) continue;

    let checkpointPapel = 0;
    const breakdown: Array<{ position: number; papel_reward: number; label?: string | null }> = [];
    for (const cp of cps) {
      if (p.last_position >= cp.position) {
        checkpointPapel += cp.papel_reward;
        breakdown.push({
          position: cp.position,
          papel_reward: cp.papel_reward,
          label: cp.label,
        });
      }
    }

    const isPerfect = p.total_correct >= event.total_questions;
    const bonus = isPerfect ? perfectBonus : 0;
    const totalEarn = Number((checkpointPapel + bonus).toFixed(2));

    if (totalEarn <= 0) {
      const creditGuildId =
        event.scope === 'guild' ? event.guild_id : (p.guild_id ?? DEFAULT_GUILD_ID);
      await supabase
        .from('quiz_event_participants')
        .update({
          paid_out_at: new Date().toISOString(),
          perfect_score: isPerfect,
          papel_earned: 0,
        })
        .eq('event_id', event.id)
        .eq('user_id', p.user_id);
      if (creditGuildId) {
        const mailResult = await sendQuizMotivationMail(supabase, {
          guildId: creditGuildId,
          userId: p.user_id,
          eventId: event.id,
          eventTitle: event.title,
          totalCorrect: p.total_correct,
          totalQuestions: event.total_questions,
          wrongCount: p.wrong_count ?? 0,
          lastPosition: p.last_position,
          eliminated: !!p.eliminated_at,
        });
        if (mailResult.ok) mailsSent += 1;
      }
      continue;
    }

    const creditGuildId = event.scope === 'guild'
      ? event.guild_id
      : (p.guild_id ?? DEFAULT_GUILD_ID);
    if (!creditGuildId) continue;

    // Cüzdan upsert
    const { data: wallet } = await supabase
      .from('member_wallets')
      .select('balance')
      .eq('guild_id', creditGuildId)
      .eq('user_id', p.user_id)
      .maybeSingle();

    const currentBalance = Number(wallet?.balance ?? 0);
    const newBalance = Number((currentBalance + totalEarn).toFixed(2));

    const { error: walletErr } = await supabase.from('member_wallets').upsert(
      {
        guild_id: creditGuildId,
        user_id: p.user_id,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'guild_id,user_id' },
    );
    if (walletErr) {
      console.warn('[quiz-payout] wallet upsert failed', p.user_id, walletErr.message);
      continue;
    }

    await supabase.from('wallet_ledger').insert({
      guild_id: creditGuildId,
      user_id: p.user_id,
      amount: totalEarn,
      type: 'quiz_reward',
      balance_after: newBalance,
      metadata: {
        event_id: event.id,
        scope: event.scope,
        checkpoint_papel: checkpointPapel,
        perfect_bonus: bonus,
        perfect_scorers: perfectScorers.length,
        breakdown,
        source: event.scope === 'guild' ? 'guild_event' : 'global_event',
      },
    });

    await supabase
      .from('quiz_event_participants')
      .update({
        paid_out_at: new Date().toISOString(),
        perfect_score: isPerfect,
        papel_earned: totalEarn,
      })
      .eq('event_id', event.id)
      .eq('user_id', p.user_id);

    const mailResult = await sendQuizRewardMail(supabase, {
      guildId: creditGuildId,
      userId: p.user_id,
      eventId: event.id,
      eventTitle: event.title,
      totalEarn,
      checkpointPapel,
      perfectBonus: bonus,
      isPerfect,
      totalCorrect: p.total_correct,
      totalQuestions: event.total_questions,
      wrongCount: p.wrong_count ?? 0,
      breakdown,
    });
    if (mailResult.ok) mailsSent += 1;

    paid += 1;
  }

  await supabase
    .from('quiz_events')
    .update({ paid_out_at: new Date().toISOString() })
    .eq('id', event.id)
    .is('paid_out_at', null);

  return {
    event_id: event.id,
    participants: parts.length,
    perfect_scorers: perfectScorers.length,
    perfect_bonus: perfectBonus,
    paid,
    mails_sent: mailsSent,
  };
}

async function run() {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'no_supabase' };

  const { data: events } = await supabase
    .from('quiz_events')
    .select('id, title, scope, guild_id, total_questions, prize_pool_papel')
    .eq('status', 'finished')
    .is('paid_out_at', null)
    .limit(20);

  const results: Array<unknown> = [];
  for (const ev of (events ?? []) as Event[]) {
    try {
      const r = await payoutEvent(supabase, ev);
      results.push(r);
    } catch (e) {
      console.error('[quiz-payout] event failed', ev.id, e);
      results.push({ event_id: ev.id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { ok: true, results };
}

export async function GET(request: NextRequest) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json(await run());
}

export async function POST(request: NextRequest) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json(await run());
}
