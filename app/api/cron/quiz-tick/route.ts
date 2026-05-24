/**
 * Quiz Event tick cron endpoint.
 *
 * Tetikleyici (öneri): Vercel Cron 1dk'da bir veya bot içinden 5sn'de bir.
 * Bu endpoint state-machine'i her çağrıda tek geçişte günceller:
 *   - scheduled + start_at <= now()  -> live, position=1, current_question_started_at=now
 *   - live + tick süresi geçtiyse     -> position++ (cevap vermeyenleri wrong say); position > total ise finished
 *   - 5dk kala henüz lock'lanmamış scheduled event'lerin 25 sorusunu lock'la
 *
 * Auth: ?secret=$QUIZ_CRON_SECRET veya Authorization: Bearer $QUIZ_CRON_SECRET
 * (yoksa endpoint hâlâ çalışır ama loglar uyarı verir — dev ortamında manuel test için.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lockEventQuestions } from '@/lib/quiz/lockQuestions';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

function checkSecret(request: NextRequest): boolean {
  const secret = process.env.QUIZ_CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[quiz-tick] QUIZ_CRON_SECRET tanımlı değil; production için ekle');
    }
    return true; // dev / kurulum öncesi açık bırak
  }
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('secret');
  const auth = request.headers.get('authorization');
  const fromHeader = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return fromQuery === secret || fromHeader === secret;
}

type Event = {
  id: string;
  scope: 'global' | 'guild';
  guild_id: string | null;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  start_at: string;
  end_at: string | null;
  total_questions: number;
  seconds_per_question: number;
  reveal_seconds: number;
  current_position: number;
  current_question_started_at: string | null;
  questions_locked_at: string | null;
  paid_out_at: string | null;
};

async function run() {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'no_supabase' };

  const now = new Date();
  const summary = {
    locked: 0,
    started: 0,
    advanced: 0,
    finished: 0,
    lock_failures: [] as { event_id: string; error: string }[],
    elapsed_ms: 0,
  };
  const t0 = Date.now();

  // 1) Yakında başlayacak (≤ 5 dk) ve henüz lock'lanmamış scheduled event'leri lock'la
  const lockWindow = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const { data: toLock } = await supabase
    .from('quiz_events')
    .select('id')
    .eq('status', 'scheduled')
    .is('questions_locked_at', null)
    .lte('start_at', lockWindow)
    .limit(50);

  for (const ev of toLock ?? []) {
    const result = await lockEventQuestions(supabase, ev.id);
    if (result.ok && 'locked' in result && result.locked) summary.locked += 1;
    if (!result.ok) {
      console.warn('[quiz-tick] lock failed', ev.id, result.error);
      summary.lock_failures.push({ event_id: ev.id, error: result.error });
    }
  }

  // 2) Başlama vakti gelmiş scheduled event'leri live'a al
  const { data: toStart } = await supabase
    .from('quiz_events')
    .select('id, total_questions, questions_locked_at')
    .eq('status', 'scheduled')
    .lte('start_at', now.toISOString())
    .limit(50);

  for (const ev of toStart ?? []) {
    if (!ev.questions_locked_at) {
      // son şans lock denemesi
      const result = await lockEventQuestions(supabase, ev.id);
      if (!result.ok) {
        console.warn('[quiz-tick] start-time lock failed', ev.id, result.error);
        summary.lock_failures.push({ event_id: ev.id, error: result.error });
        continue;
      }
    }
    const { error } = await supabase
      .from('quiz_events')
      .update({
        status: 'live',
        current_position: 1,
        current_question_started_at: now.toISOString(),
      })
      .eq('id', ev.id)
      .eq('status', 'scheduled'); // race guard
    if (!error) summary.started += 1;
  }

  // 3) Live event'leri ilerlet
  const { data: live } = await supabase
    .from('quiz_events')
    .select('*')
    .eq('status', 'live')
    .limit(100);

  for (const ev of (live ?? []) as Event[]) {
    const startedAt = ev.current_question_started_at ? new Date(ev.current_question_started_at).getTime() : 0;
    if (!startedAt) continue;
    const tickMs = (ev.seconds_per_question + (ev.reveal_seconds ?? 2)) * 1000;
    if (now.getTime() - startedAt < tickMs) continue;

    const nextPos = ev.current_position + 1;
    if (nextPos > ev.total_questions) {
      // Bitir
      const { error } = await supabase
        .from('quiz_events')
        .update({ status: 'finished', current_question_started_at: null })
        .eq('id', ev.id)
        .eq('status', 'live')
        .eq('current_position', ev.current_position);
      if (!error) {
        summary.finished += 1;
        // Cevap vermeyenleri eliminate et / wrong say
        await missedAsWrong(supabase, ev);
      }
      continue;
    }

    // Önce şu anki pozisyonu kaçıranları "yanlış" say
    await missedAsWrong(supabase, ev);

    const { error } = await supabase
      .from('quiz_events')
      .update({
        current_position: nextPos,
        current_question_started_at: now.toISOString(),
      })
      .eq('id', ev.id)
      .eq('status', 'live')
      .eq('current_position', ev.current_position);
    if (!error) summary.advanced += 1;
  }

  summary.elapsed_ms = Date.now() - t0;
  return { ok: true, summary };
}

/**
 * Aktif (eliminate olmamış) ve bu pozisyonda cevap girmemiş katılımcılar için
 * `wrong_count++` ve gerekirse eliminate et.
 */
async function missedAsWrong(supabase: ReturnType<typeof getSupabase>, ev: Event) {
  if (!supabase) return;
  const { data: participants } = await supabase
    .from('quiz_event_participants')
    .select('user_id, wrong_count, last_position, eliminated_at')
    .eq('event_id', ev.id)
    .is('eliminated_at', null);

  if (!participants || participants.length === 0) return;

  const missed = participants.filter((p) => p.last_position < ev.current_position);
  if (missed.length === 0) return;

  // Wrong allowed alanını çek
  const { data: fullEv } = await supabase
    .from('quiz_events')
    .select('wrong_allowed')
    .eq('id', ev.id)
    .single();
  const wrongAllowed = fullEv?.wrong_allowed ?? 3;

  const now = new Date().toISOString();
  for (const p of missed) {
    const nextWrong = (p.wrong_count ?? 0) + 1;
    const patch: Record<string, unknown> = {
      wrong_count: nextWrong,
      last_position: ev.current_position,
    };
    if (nextWrong >= wrongAllowed) patch.eliminated_at = now;
    await supabase
      .from('quiz_event_participants')
      .update(patch)
      .eq('event_id', ev.id)
      .eq('user_id', p.user_id);

    // Audit
    await supabase.from('quiz_event_attempts').upsert(
      {
        event_id: ev.id,
        user_id: p.user_id,
        position: ev.current_position,
        selected_index: null,
        is_correct: false,
        ms_elapsed: null,
        answered_at: now,
      },
      { onConflict: 'event_id,user_id,position' },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json(await run());
}

export async function POST(request: NextRequest) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json(await run());
}
