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

type Checkpoint = { position: number; papel_reward: number; label?: string };

type CreatePayload = {
  scope: 'global' | 'guild';
  guild_id?: string | null;
  title: string;
  description?: string;
  start_at: string;            // ISO
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
  prize_pool_papel?: number;
  total_questions?: number;
  seconds_per_question?: number;
  wrong_allowed?: number;
  status?: 'scheduled' | 'cancelled';
  checkpoints?: Checkpoint[];
};

const DEFAULT_CHECKPOINTS = (total: number, pool: number): Checkpoint[] => {
  // 25 soru için: 8, 16, 25 pozisyonlarında 50 / 100 / 250 papel (örnek değerler)
  if (total >= 25) {
    return [
      { position: 8, papel_reward: 50, label: 'Checkpoint 1' },
      { position: 16, papel_reward: 100, label: 'Checkpoint 2' },
      { position: 25, papel_reward: 250, label: 'Final (Tüm sorular)' },
    ];
  }
  // Genel: total/3, 2*total/3, total
  const a = Math.max(1, Math.floor(total / 3));
  const b = Math.max(a + 1, Math.floor((total * 2) / 3));
  return [
    { position: a, papel_reward: Math.round(pool * 0.002), label: 'Checkpoint 1' },
    { position: b, papel_reward: Math.round(pool * 0.004), label: 'Checkpoint 2' },
    { position: total, papel_reward: Math.round(pool * 0.01), label: 'Final' },
  ];
};

export async function GET(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope');
  const guildId = url.searchParams.get('guild_id');

  let query = supabase
    .from('quiz_events')
    .select('*')
    .order('start_at', { ascending: false })
    .limit(100);

  if (scope === 'global') query = query.eq('scope', 'global');
  else if (scope === 'guild') query = query.eq('scope', 'guild');
  if (guildId) query = query.eq('guild_id', guildId);

  const { data: events, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Checkpoint'leri batch çek
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
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  let body: CreatePayload;
  try {
    body = (await request.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.scope || !body.title || !body.start_at) {
    return NextResponse.json({ error: 'scope, title, start_at zorunlu' }, { status: 400 });
  }
  if (body.scope === 'guild' && !body.guild_id) {
    return NextResponse.json({ error: 'guild_id (scope=guild için zorunlu)' }, { status: 400 });
  }

  const total = body.total_questions ?? 25;
  const sec = body.seconds_per_question ?? 20;
  const reveal = 2;
  const startAt = new Date(body.start_at);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: 'invalid_start_at' }, { status: 400 });
  }
  const endAt = new Date(startAt.getTime() + total * (sec + reveal) * 1000);

  const insertRow = {
    scope: body.scope,
    guild_id: body.scope === 'guild' ? body.guild_id : null,
    title: body.title,
    description: body.description ?? null,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    total_questions: total,
    seconds_per_question: sec,
    reveal_seconds: reveal,
    wrong_allowed: body.wrong_allowed ?? 3,
    prize_pool_papel: body.prize_pool_papel ?? 50000,
    status: 'scheduled',
    created_by: session.userId,
  };

  const { data: event, error } = await supabase.from('quiz_events').insert(insertRow).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const checkpoints = body.checkpoints && body.checkpoints.length > 0
    ? body.checkpoints
    : DEFAULT_CHECKPOINTS(total, insertRow.prize_pool_papel);

  if (checkpoints.length > 0) {
    await supabase.from('quiz_event_checkpoints').insert(
      checkpoints.map((c) => ({
        event_id: event.id,
        position: c.position,
        papel_reward: c.papel_reward,
        label: c.label ?? null,
      })),
    );
  }

  return NextResponse.json({ ok: true, event });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  let body: UpdatePayload;
  try {
    body = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

  // Mevcut event'i çek (live ise belirli alanları kilitleyelim)
  const { data: existing } = await supabase
    .from('quiz_events')
    .select('id, status, total_questions, seconds_per_question, start_at')
    .eq('id', body.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;

  if (existing.status === 'scheduled') {
    if (body.start_at) {
      const startAt = new Date(body.start_at);
      if (Number.isNaN(startAt.getTime())) return NextResponse.json({ error: 'invalid_start_at' }, { status: 400 });
      const total = body.total_questions ?? existing.total_questions;
      const sec = body.seconds_per_question ?? existing.seconds_per_question;
      patch.start_at = startAt.toISOString();
      patch.end_at = new Date(startAt.getTime() + total * (sec + 2) * 1000).toISOString();
    }
    if (body.total_questions !== undefined) patch.total_questions = body.total_questions;
    if (body.seconds_per_question !== undefined) patch.seconds_per_question = body.seconds_per_question;
    if (body.wrong_allowed !== undefined) patch.wrong_allowed = body.wrong_allowed;
    if (body.prize_pool_papel !== undefined) patch.prize_pool_papel = body.prize_pool_papel;
  }

  if (body.status === 'cancelled') {
    patch.status = 'cancelled';
    patch.cancelled_at = new Date().toISOString();
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('quiz_events').update(patch).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
