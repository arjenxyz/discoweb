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
    id?: string;                  // bank id (var ise update)
    category?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
    correct_index: number;
    // Çeviriler: { tr: { question, options, is_ready }, en: {...}, ... }
    translations: Record<string, { question: string; options: string[]; is_ready?: boolean }>;
  };
};

type DeletePayload = { action: 'delete'; id: string };

type Payload = UpsertPayload | DeletePayload;

const LANG_RE = /^[a-z]{2}(-[a-z0-9]{2,8})?$/i;

export async function GET() {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'guild_required' }, { status: 400 });

  const { data, error } = await supabase
    .from('quiz_question_bank')
    .select('*, quiz_question_translations(lang, question, options, is_ready)')
    .eq('is_custom_for_guild_id', guildId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    questions: (data ?? []).map((r) => ({
      ...r,
      translations: (r as { quiz_question_translations?: unknown[] }).quiz_question_translations ?? [],
    })),
  });
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
    if (typeof q?.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) {
      return NextResponse.json({ error: 'invalid_correct_index' }, { status: 400 });
    }
    if (!q.translations || typeof q.translations !== 'object') {
      return NextResponse.json({ error: 'translations_required' }, { status: 400 });
    }

    // En az bir dil dolu olmalı
    const langKeys = Object.keys(q.translations);
    if (langKeys.length === 0) {
      return NextResponse.json({ error: 'at_least_one_language_required' }, { status: 400 });
    }
    for (const lang of langKeys) {
      if (!LANG_RE.test(lang)) {
        return NextResponse.json({ error: `invalid_lang_${lang}` }, { status: 400 });
      }
      const t = q.translations[lang];
      if (!t?.question || !Array.isArray(t.options) || t.options.length !== 4) {
        return NextResponse.json({ error: `invalid_translation_${lang}` }, { status: 400 });
      }
    }

    let bankId = q.id;

    if (bankId) {
      // Sahiplik kontrolü
      const { data: existing } = await supabase
        .from('quiz_question_bank')
        .select('id, is_custom_for_guild_id')
        .eq('id', bankId)
        .single();
      if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
      if (existing.is_custom_for_guild_id !== guildId) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      await supabase
        .from('quiz_question_bank')
        .update({
          category: q.category ?? null,
          difficulty: q.difficulty ?? null,
          correct_index: q.correct_index,
        })
        .eq('id', bankId);
    } else {
      const { data: created, error: insErr } = await supabase
        .from('quiz_question_bank')
        .insert({
          source: 'custom',
          category: q.category ?? null,
          difficulty: q.difficulty ?? null,
          correct_index: q.correct_index,
          is_custom_for_guild_id: guildId,
        })
        .select('id')
        .single();
      if (insErr || !created) return NextResponse.json({ error: insErr?.message ?? 'insert_failed' }, { status: 500 });
      bankId = created.id;
    }

    // Çevirileri upsert et
    const trRows = langKeys.map((lang) => {
      const t = q.translations[lang];
      return {
        question_id: bankId!,
        lang: lang.toLowerCase(),
        question: t.question,
        options: t.options,
        is_ready: t.is_ready !== false, // admin tarafından eklenirse default true
      };
    });
    const { error: trErr } = await supabase
      .from('quiz_question_translations')
      .upsert(trRows, { onConflict: 'question_id,lang' });
    if (trErr) return NextResponse.json({ error: trErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: bankId });
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
