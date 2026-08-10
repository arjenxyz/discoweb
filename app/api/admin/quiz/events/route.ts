import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminOrDeveloper, getSelectedGuildId } from '@/lib/adminAuth';
import {
  findGuildQuizStartConflict,
  quizEventConflictMessage,
  quizEventDbErrorPayload,
} from '@/lib/quiz/quizEventDbError';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type Checkpoint = { position: number; papel_reward: number; label?: string };

type CreatePayload = {
  title: string;
  description?: string;
  start_at: string;
  lang?: string;
  total_questions?: number;
  seconds_per_question?: number;
  wrong_allowed?: number;
  prize_pool_papel?: number;
  checkpoints?: Checkpoint[];
};

type UpdatePayload = {
  id: string;
  title?: string;
  description?: string;
  start_at?: string;
  lang?: string;
  prize_pool_papel?: number;
  status?: 'cancelled';
  checkpoints?: Checkpoint[];
};

const LANG_RE = /^[a-z]{2}(-[a-z0-9]{2,8})?$/i;

export async function GET() {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  const { data: events, error } = await supabase
    .from('quiz_events')
    .select('*')
    .eq('scope', 'guild')
    .eq('guild_id', guildId)
    .order('start_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eventIds = (events ?? []).map((e) => e.id);
  let cps: Array<{ event_id: string; position: number; papel_reward: number; label: string | null }> = [];
  if (eventIds.length) {
    const { data: cpData } = await supabase
      .from('quiz_event_checkpoints')
      .select('event_id, position, papel_reward, label')
      .in('event_id', eventIds);
    cps = cpData ?? [];
  }
  const cpsByEvent = new Map<string, Checkpoint[]>();
  for (const c of cps) {
    const list = cpsByEvent.get(c.event_id) ?? [];
    list.push({ position: c.position, papel_reward: Number(c.papel_reward), label: c.label ?? undefined });
    cpsByEvent.set(c.event_id, list);
  }

  return NextResponse.json({
    events: (events ?? []).map((e) => ({
      ...e,
      checkpoints: (cpsByEvent.get(e.id) ?? []).sort((a, b) => a.position - b.position),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  let body: CreatePayload;
  try {
    body = (await request.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.title || !body.start_at) {
    return NextResponse.json({ error: 'title, start_at zorunlu' }, { status: 400 });
  }

  const total = body.total_questions ?? 25;
  const sec = body.seconds_per_question ?? 20;
  const startAt = new Date(body.start_at);
  if (Number.isNaN(startAt.getTime())) return NextResponse.json({ error: 'invalid_start_at' }, { status: 400 });
  const endAt = new Date(startAt.getTime() + total * (sec + 2) * 1000);

  const lang = (body.lang ?? 'tr').toLowerCase();
  if (!LANG_RE.test(lang)) return NextResponse.json({ error: 'invalid_lang' }, { status: 400 });

  const startAtIso = startAt.toISOString();
  const conflict = await findGuildQuizStartConflict(supabase, guildId, startAtIso);
  if (conflict) {
    return NextResponse.json(
      {
        error: 'duplicate_guild_start',
        message: quizEventConflictMessage('guild', conflict),
      },
      { status: 409 },
    );
  }

  const { data: event, error } = await supabase.from('quiz_events').insert({
    scope: 'guild',
    guild_id: guildId,
    title: body.title,
    description: body.description ?? null,
    lang,
    start_at: startAtIso,
    end_at: endAt.toISOString(),
    total_questions: total,
    seconds_per_question: sec,
    reveal_seconds: 2,
    wrong_allowed: body.wrong_allowed ?? 3,
    prize_pool_papel: body.prize_pool_papel ?? 50000,
    status: 'scheduled',
  }).select().single();
  if (error) {
    const err = quizEventDbErrorPayload(error);
    return NextResponse.json(err.body, { status: err.status });
  }

  const checkpoints = body.checkpoints && body.checkpoints.length
    ? body.checkpoints
    : [
        { position: Math.max(1, Math.floor(total / 3)), papel_reward: 50, label: 'Checkpoint 1' },
        { position: Math.max(2, Math.floor((total * 2) / 3)), papel_reward: 100, label: 'Checkpoint 2' },
        { position: total, papel_reward: 250, label: 'Final' },
      ];

  await supabase.from('quiz_event_checkpoints').insert(
    checkpoints.map((c) => ({
      event_id: event.id,
      position: c.position,
      papel_reward: c.papel_reward,
      label: c.label ?? null,
    })),
  );

  return NextResponse.json({ ok: true, event });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  let body: UpdatePayload;
  try {
    body = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

  const { data: existing } = await supabase
    .from('quiz_events')
    .select('id, status, guild_id, total_questions, seconds_per_question')
    .eq('id', body.id)
    .single();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.guild_id !== guildId) {
    return NextResponse.json({ error: 'wrong_guild' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (existing.status === 'scheduled') {
    if (body.start_at) {
      const startAt = new Date(body.start_at);
      if (Number.isNaN(startAt.getTime())) return NextResponse.json({ error: 'invalid_start_at' }, { status: 400 });
      const startAtIso = startAt.toISOString();
      const conflict = await findGuildQuizStartConflict(supabase, guildId, startAtIso, body.id);
      if (conflict) {
        return NextResponse.json(
          {
            error: 'duplicate_guild_start',
            message: quizEventConflictMessage('guild', conflict),
          },
          { status: 409 },
        );
      }
      patch.start_at = startAtIso;
      patch.end_at = new Date(startAt.getTime() + existing.total_questions * (existing.seconds_per_question + 2) * 1000).toISOString();
    }
    if (body.prize_pool_papel !== undefined) patch.prize_pool_papel = body.prize_pool_papel;
    if (body.lang !== undefined) {
      const lang = body.lang.toLowerCase();
      if (!LANG_RE.test(lang)) return NextResponse.json({ error: 'invalid_lang' }, { status: 400 });
      patch.lang = lang;
    }
  }
  if (body.status === 'cancelled') {
    patch.status = 'cancelled';
    patch.cancelled_at = new Date().toISOString();
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('quiz_events').update(patch).eq('id', body.id);
    if (error) {
      const err = quizEventDbErrorPayload(error);
      return NextResponse.json(err.body, { status: err.status });
    }
  }
  if (body.checkpoints && existing.status === 'scheduled') {
    await supabase.from('quiz_event_checkpoints').delete().eq('event_id', body.id);
    if (body.checkpoints.length > 0) {
      await supabase.from('quiz_event_checkpoints').insert(
        body.checkpoints.map((c) => ({
          event_id: body.id,
          position: c.position,
          papel_reward: c.papel_reward,
          label: c.label ?? null,
        })),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
