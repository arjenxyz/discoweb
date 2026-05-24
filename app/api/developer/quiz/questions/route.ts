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

type Translation = {
  lang: string;
  question: string;
  options: string[];
  is_ready: boolean;
};

type QuestionWithTranslations = {
  id: string;
  source: string;
  source_external_id: string | null;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  correct_index: number;
  is_custom_for_guild_id: string | null;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
  translations: Translation[];
};

/**
 * GET /api/developer/quiz/questions
 *   ?lang=tr|en|pt-br      -> sadece o dilin çevirilerini içeren listeyi döner
 *   ?onlyReady=1           -> sadece seçili dilde is_ready=true olanlar
 *   ?onlyMissing=1         -> seçili dilde hiç çevirisi olmayan (veya is_ready=false) olanlar
 *   ?difficulty=easy
 *   ?limit=200&offset=0
 *   ?guildId=global|<id>
 */
export async function GET(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') ?? 'tr';
  const onlyReady = url.searchParams.get('onlyReady') === '1';
  const onlyMissing = url.searchParams.get('onlyMissing') === '1';
  const difficulty = url.searchParams.get('difficulty');
  const guildId = url.searchParams.get('guildId');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200', 10) || 200, 1000);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

  // Mevcut diller (UI sekmesi için)
  const { data: langRows } = await supabase
    .from('quiz_question_translations')
    .select('lang')
    .limit(1000);
  const availableLangs = Array.from(new Set((langRows ?? []).map((r) => r.lang))).sort();
  if (!availableLangs.includes(lang)) availableLangs.push(lang);

  let bankQuery = supabase
    .from('quiz_question_bank')
    .select('*, quiz_question_translations(lang, question, options, is_ready)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (difficulty) bankQuery = bankQuery.eq('difficulty', difficulty);
  if (guildId === 'global') bankQuery = bankQuery.is('is_custom_for_guild_id', null);
  else if (guildId) bankQuery = bankQuery.eq('is_custom_for_guild_id', guildId);

  const { data, error, count } = await bankQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RowWithTr = QuestionWithTranslations & {
    quiz_question_translations: Translation[];
  };

  let items: QuestionWithTranslations[] = (data ?? []).map((r) => {
    const row = r as unknown as RowWithTr;
    return {
      id: row.id,
      source: row.source,
      source_external_id: row.source_external_id,
      category: row.category,
      difficulty: row.difficulty,
      correct_index: row.correct_index,
      is_custom_for_guild_id: row.is_custom_for_guild_id,
      last_used_at: row.last_used_at,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      translations: row.quiz_question_translations ?? [],
    };
  });

  // Lang filtresi: onlyReady / onlyMissing
  if (onlyReady) {
    items = items.filter((q) => q.translations.some((t) => t.lang === lang && t.is_ready));
  } else if (onlyMissing) {
    items = items.filter((q) => {
      const t = q.translations.find((x) => x.lang === lang);
      return !t || !t.is_ready;
    });
  }

  return NextResponse.json({
    questions: items,
    total: count ?? 0,
    limit,
    offset,
    available_langs: availableLangs,
    current_lang: lang,
  });
}

type ImportBankPayload = {
  action: 'import_bank';
  questions: Array<{
    id?: string;                  // bank.json'daki id (source_external_id olarak da kullanılır)
    source_external_id?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    correct_index: number;
  }>;
};

type ImportTranslationPayload = {
  action: 'import_translation';
  lang: string;
  questions: Array<{
    id: string;                   // bank id
    question: string;
    options: string[];
    is_ready?: boolean;
  }>;
};

type UpsertTranslationPayload = {
  action: 'upsert_translation';
  question_id: string;
  lang: string;
  question: string;
  options: string[];
  is_ready?: boolean;
  // İsteğe bağlı: correct_index'i de güncelleyebilir (bank tablosunda)
  correct_index?: number;
};

type DeletePayload = { action: 'delete'; id: string };

type Payload = ImportBankPayload | ImportTranslationPayload | UpsertTranslationPayload | DeletePayload;

const LANG_RE = /^[a-z]{2}(-[a-z0-9]{2,8})?$/i;

/**
 * POST /api/developer/quiz/questions
 *   action=import_bank          -> bank.json formatında soru kayıtlarını upsert eder
 *   action=import_translation   -> lang-XX.json formatında çevirileri upsert eder
 *   action=upsert_translation   -> tek bir çeviriyi günceller (panel editörü)
 *   action=delete               -> bank kaydını siler (çeviriler cascade ile silinir)
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

  // ----- IMPORT BANK -----
  if (body.action === 'import_bank') {
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: 'questions_required' }, { status: 400 });
    }
    const rows = body.questions
      .filter((q) => q && typeof q.correct_index === 'number' && q.correct_index >= 0 && q.correct_index <= 3)
      .map((q) => ({
        source: 'opentdb' as const,
        source_external_id: q.source_external_id ?? q.id ?? null,
        category: q.category ?? null,
        difficulty: q.difficulty ?? null,
        correct_index: q.correct_index,
      }));

    if (rows.length === 0) return NextResponse.json({ error: 'no_valid_rows' }, { status: 400 });

    const { data, error } = await supabase
      .from('quiz_question_bank')
      .upsert(rows, { onConflict: 'source,source_external_id', ignoreDuplicates: false })
      .select('id, source_external_id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, imported: data?.length ?? 0 });
  }

  // ----- IMPORT TRANSLATION -----
  if (body.action === 'import_translation') {
    if (!body.lang || !LANG_RE.test(body.lang)) {
      return NextResponse.json({ error: 'invalid_lang' }, { status: 400 });
    }
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: 'questions_required' }, { status: 400 });
    }

    // Bank id'leri (source_external_id'ye eşle)
    const externalIds = body.questions.map((q) => q.id).filter(Boolean);
    if (externalIds.length === 0) return NextResponse.json({ error: 'no_ids' }, { status: 400 });

    const { data: bankRows, error: bErr } = await supabase
      .from('quiz_question_bank')
      .select('id, source_external_id')
      .in('source_external_id', externalIds);
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

    const extToBank = new Map<string, string>();
    for (const r of bankRows ?? []) {
      if (r.source_external_id) extToBank.set(r.source_external_id, r.id);
    }

    const lang = body.lang.toLowerCase();
    const trRows = body.questions
      .filter((q) => q && Array.isArray(q.options) && q.options.length === 4 && q.question)
      .map((q) => {
        const bankId = extToBank.get(q.id);
        if (!bankId) return null;
        return {
          question_id: bankId,
          lang,
          question: q.question,
          options: q.options,
          is_ready: q.is_ready === true,
          translator_user_id: session.userId,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (trRows.length === 0) {
      return NextResponse.json({
        error: 'no_matching_bank_rows',
        hint: 'Önce bank.json import edilmeli',
      }, { status: 400 });
    }

    const { error: upErr } = await supabase
      .from('quiz_question_translations')
      .upsert(trRows, { onConflict: 'question_id,lang' });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      imported: trRows.length,
      skipped: body.questions.length - trRows.length,
      lang,
    });
  }

  // ----- UPSERT TRANSLATION (panel inline editor) -----
  if (body.action === 'upsert_translation') {
    if (!body.question_id || !body.lang || !LANG_RE.test(body.lang)) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }
    if (!body.question || !Array.isArray(body.options) || body.options.length !== 4) {
      return NextResponse.json({ error: 'invalid_translation' }, { status: 400 });
    }

    if (typeof body.correct_index === 'number') {
      if (body.correct_index < 0 || body.correct_index > 3) {
        return NextResponse.json({ error: 'invalid_correct_index' }, { status: 400 });
      }
      await supabase
        .from('quiz_question_bank')
        .update({ correct_index: body.correct_index })
        .eq('id', body.question_id);
    }

    const { error } = await supabase
      .from('quiz_question_translations')
      .upsert(
        {
          question_id: body.question_id,
          lang: body.lang.toLowerCase(),
          question: body.question,
          options: body.options,
          is_ready: body.is_ready === true,
          translator_user_id: session.userId,
        },
        { onConflict: 'question_id,lang' },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ----- DELETE BANK (cascade'tan dolayı çeviriler de silinir) -----
  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
    const { error } = await supabase.from('quiz_question_bank').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
