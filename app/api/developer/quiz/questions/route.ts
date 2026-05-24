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

type QuestionRow = {
  id: string;
  source: string;
  source_external_id: string | null;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  question_en: string | null;
  options_en: string[] | null;
  question_tr: string | null;
  options_tr: string[] | null;
  correct_index: number;
  is_ready: boolean;
  is_custom_for_guild_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * GET /api/developer/quiz/questions
 *   ?onlyReady=1
 *   ?difficulty=easy
 *   ?limit=200&offset=0
 *   ?guildId=<id>   (custom sorular için)
 */
export async function GET(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const url = new URL(request.url);
  const onlyReady = url.searchParams.get('onlyReady') === '1';
  const difficulty = url.searchParams.get('difficulty');
  const guildId = url.searchParams.get('guildId');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200', 10) || 200, 1000);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

  let query = supabase
    .from('quiz_question_bank')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (onlyReady) query = query.eq('is_ready', true);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (guildId === 'global') {
    query = query.is('is_custom_for_guild_id', null);
  } else if (guildId) {
    query = query.eq('is_custom_for_guild_id', guildId);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    questions: (data ?? []) as QuestionRow[],
    total: count ?? 0,
    limit,
    offset,
  });
}

type ImportPayload = {
  action: 'import';
  questions: Array<{
    source_external_id?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    question_en: string;
    options_en: string[];
    correct_index: number;
    question_tr?: string;
    options_tr?: string[];
    is_ready?: boolean;
  }>;
};

type UpsertPayload = {
  action: 'upsert';
  question: {
    id?: string;
    source?: string;
    category?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
    question_en?: string | null;
    options_en?: string[] | null;
    question_tr: string;
    options_tr: string[];
    correct_index: number;
    is_ready?: boolean;
    is_custom_for_guild_id?: string | null;
  };
};

type DeletePayload = { action: 'delete'; id: string };

type Payload = ImportPayload | UpsertPayload | DeletePayload;

/**
 * POST /api/developer/quiz/questions
 *   action=import   -> Open Trivia JSON'undan bulk insert (idempotent: source_external_id ile)
 *   action=upsert   -> Tek soru güncelleme / oluşturma
 *   action=delete   -> Tek soru silme
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (body.action === 'import') {
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: 'questions_required' }, { status: 400 });
    }

    const rows = body.questions
      .filter((q) => q && q.question_en && Array.isArray(q.options_en) && q.options_en.length === 4)
      .map((q) => ({
        source: 'opentdb',
        source_external_id: q.source_external_id ?? null,
        category: q.category ?? null,
        difficulty: q.difficulty ?? null,
        question_en: q.question_en,
        options_en: q.options_en,
        question_tr: q.question_tr || null,
        options_tr: Array.isArray(q.options_tr) && q.options_tr.length === 4 ? q.options_tr : null,
        correct_index: q.correct_index,
        is_ready: q.is_ready === true,
      }));

    if (rows.length === 0) return NextResponse.json({ error: 'no_valid_rows' }, { status: 400 });

    const { data, error } = await supabase
      .from('quiz_question_bank')
      .upsert(rows, { onConflict: 'source,source_external_id', ignoreDuplicates: false })
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, imported: data?.length ?? 0 });
  }

  if (body.action === 'upsert') {
    const q = body.question;
    if (!q || !q.question_tr || !Array.isArray(q.options_tr) || q.options_tr.length !== 4) {
      return NextResponse.json({ error: 'invalid_question_payload' }, { status: 400 });
    }
    if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) {
      return NextResponse.json({ error: 'invalid_correct_index' }, { status: 400 });
    }

    const row = {
      ...(q.id ? { id: q.id } : {}),
      source: q.source ?? (q.is_custom_for_guild_id ? 'custom' : 'opentdb'),
      category: q.category ?? null,
      difficulty: q.difficulty ?? null,
      question_en: q.question_en ?? null,
      options_en: q.options_en ?? null,
      question_tr: q.question_tr,
      options_tr: q.options_tr,
      correct_index: q.correct_index,
      is_ready: q.is_ready ?? false,
      is_custom_for_guild_id: q.is_custom_for_guild_id ?? null,
    };

    if (q.id) {
      const { data, error } = await supabase
        .from('quiz_question_bank')
        .update(row)
        .eq('id', q.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, question: data });
    }

    const { data, error } = await supabase
      .from('quiz_question_bank')
      .insert(row)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, question: data });
  }

  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
    const { error } = await supabase.from('quiz_question_bank').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
