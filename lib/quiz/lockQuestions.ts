/**
 * Quiz event'i için soru kilitleme yardımcısı.
 *
 * - Event başlamadan kısa süre önce çağrılır.
 * - `total_questions` adet hazır (is_ready=true) soru seçilir.
 * - Global event'ler sadece ortak bankayı (is_custom_for_guild_id is null) kullanır.
 * - Per-guild event'ler önce o sunucunun custom sorularını (en yenisinden eskisine),
 *   sonra eksik kalanı ortak bankadan tamamlar.
 * - Seçilen sorular `quiz_event_questions` tablosuna yazılır ve event row'unda
 *   `questions_locked_at` set edilir.
 * - Tekrar çağrılırsa (zaten kilitlenmişse) noop'tur.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type LockResult =
  | { ok: true; locked: true; count: number }
  | { ok: true; locked: false; reason: 'already_locked' | 'not_scheduled' | 'cancelled' }
  | { ok: false; error: string };

type EventRow = {
  id: string;
  scope: 'global' | 'guild';
  guild_id: string | null;
  total_questions: number;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  questions_locked_at: string | null;
};

type BankRow = {
  id: string;
  question_tr: string | null;
  question_en: string | null;
  options_tr: string[] | null;
  options_en: string[] | null;
  correct_index: number;
  category: string | null;
  difficulty: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestionContent(row: BankRow) {
  // TR varsa TR, yoksa EN'e fallback yap
  const question = row.question_tr?.trim()
    ? row.question_tr
    : (row.question_en ?? '');
  const optsRaw = row.options_tr && row.options_tr.length === 4 && row.options_tr.every((o) => o)
    ? row.options_tr
    : row.options_en;
  return {
    question_text: question,
    options: optsRaw && optsRaw.length === 4 ? optsRaw : null,
  };
}

export async function lockEventQuestions(
  supabase: SupabaseClient,
  eventId: string,
): Promise<LockResult> {
  const { data: event, error: eventErr } = await supabase
    .from('quiz_events')
    .select('id, scope, guild_id, total_questions, status, questions_locked_at')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    return { ok: false, error: eventErr?.message ?? 'event_not_found' };
  }

  const e = event as EventRow;

  if (e.questions_locked_at) {
    return { ok: true, locked: false, reason: 'already_locked' };
  }
  if (e.status === 'cancelled') {
    return { ok: true, locked: false, reason: 'cancelled' };
  }
  if (e.status !== 'scheduled') {
    return { ok: true, locked: false, reason: 'not_scheduled' };
  }

  const total = e.total_questions;
  const collected: BankRow[] = [];

  // 1) Per-guild custom sorular
  if (e.scope === 'guild' && e.guild_id) {
    const { data: customs } = await supabase
      .from('quiz_question_bank')
      .select('id, question_tr, question_en, options_tr, options_en, correct_index, category, difficulty')
      .eq('is_custom_for_guild_id', e.guild_id)
      .eq('is_ready', true)
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(total);
    if (customs) collected.push(...(customs as BankRow[]));
  }

  // 2) Ortak banka (rotasyon: en az kullanılanlar önce)
  if (collected.length < total) {
    const need = total - collected.length;
    const { data: globals } = await supabase
      .from('quiz_question_bank')
      .select('id, question_tr, question_en, options_tr, options_en, correct_index, category, difficulty')
      .is('is_custom_for_guild_id', null)
      .eq('is_ready', true)
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(need * 3); // shuffle için fazla çek
    if (globals) {
      const shuffled = shuffle(globals as BankRow[]);
      for (const g of shuffled) {
        if (collected.length >= total) break;
        if (collected.some((c) => c.id === g.id)) continue;
        collected.push(g);
      }
    }
  }

  if (collected.length < total) {
    return { ok: false, error: `Yetersiz soru havuzu. Gerekli: ${total}, mevcut hazır: ${collected.length}` };
  }

  const chosen = collected.slice(0, total);
  const rows = chosen.map((row, idx) => {
    const content = pickQuestionContent(row);
    if (!content.question_text || !content.options) {
      return null;
    }
    return {
      event_id: eventId,
      position: idx + 1,
      question_bank_id: row.id,
      question_text: content.question_text,
      options: content.options,
      correct_index: row.correct_index,
      category: row.category,
      difficulty: row.difficulty,
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length < total) {
    return { ok: false, error: 'Seçilen sorulardan bazılarının metni eksik (çevirisi tamamlanmamış olabilir)' };
  }

  // Eski (varsa) lock kayıtlarını temizle
  await supabase.from('quiz_event_questions').delete().eq('event_id', eventId);

  const { error: insertErr } = await supabase.from('quiz_event_questions').insert(rows);
  if (insertErr) return { ok: false, error: insertErr.message };

  // Bank tablosunda last_used_at + use_count güncelle
  const bankIds = chosen.map((c) => c.id);
  if (bankIds.length > 0) {
    await supabase.rpc('quiz_bank_mark_used', { p_ids: bankIds }).then(
      () => undefined,
      async () => {
        // RPC yoksa fallback olarak son kullanma update'i yap
        await supabase
          .from('quiz_question_bank')
          .update({ last_used_at: new Date().toISOString() })
          .in('id', bankIds);
      },
    );
  }

  const { error: updateErr } = await supabase
    .from('quiz_events')
    .update({ questions_locked_at: new Date().toISOString() })
    .eq('id', eventId);
  if (updateErr) return { ok: false, error: updateErr.message };

  return { ok: true, locked: true, count: rows.length };
}
