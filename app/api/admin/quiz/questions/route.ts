import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminOrDeveloper, getSelectedGuildId } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type UpsertPayload = {
  action: 'upsert';
  question: {
    id?: string;
    category?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
    question_tr: string;
    options_tr: string[];
    correct_index: number;
    is_ready?: boolean;
  };
};

type DeletePayload = { action: 'delete'; id: string };

type Payload = UpsertPayload | DeletePayload;

export async function GET() {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  const { data, error } = await supabase
    .from('quiz_question_bank')
    .select('*')
    .eq('is_custom_for_guild_id', guildId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (body.action === 'upsert') {
    const q = body.question;
    if (!q?.question_tr || !Array.isArray(q.options_tr) || q.options_tr.length !== 4) {
      return NextResponse.json({ error: 'invalid_question_payload' }, { status: 400 });
    }
    if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) {
      return NextResponse.json({ error: 'invalid_correct_index' }, { status: 400 });
    }

    const row = {
      ...(q.id ? { id: q.id } : {}),
      source: 'custom',
      category: q.category ?? null,
      difficulty: q.difficulty ?? null,
      question_tr: q.question_tr,
      options_tr: q.options_tr,
      correct_index: q.correct_index,
      is_ready: q.is_ready ?? true,
      is_custom_for_guild_id: guildId,
    };

    if (q.id) {
      // Sahiplik kontrolü
      const { data: existing } = await supabase
        .from('quiz_question_bank')
        .select('id, is_custom_for_guild_id')
        .eq('id', q.id)
        .single();
      if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
      if (existing.is_custom_for_guild_id !== guildId) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data, error } = await supabase
        .from('quiz_question_bank')
        .update(row)
        .eq('id', q.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, question: data });
    }

    const { data, error } = await supabase.from('quiz_question_bank').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, question: data });
  }

  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
    const { data: existing } = await supabase
      .from('quiz_question_bank')
      .select('id, is_custom_for_guild_id')
      .eq('id', body.id)
      .single();
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (existing.is_custom_for_guild_id !== guildId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const { error } = await supabase.from('quiz_question_bank').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
