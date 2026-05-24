/**
 * Quiz event'i için soru kilitleme yardımcısı (multi-language).
 *
 * - Event başlamadan kısa süre önce çağrılır.
 * - `total_questions` adet, event.lang dilinde is_ready=true çevirisi olan soru seçilir.
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
  lang: string;
};

type BankWithTranslation = {
  id: string;
  correct_index: number;
  category: string | null;
  difficulty: string | null;
  is_custom_for_guild_id: string | null;
  last_used_at: string | null;
  question: string;
  options: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * quiz_question_bank'i quiz_question_translations ile JOIN edip event.lang'a göre
 * hazır olan kayıtları getirir. Custom filtresi (guild vs global) ekleyici tarafından verilir.
 */
async function fetchReady(
  supabase: SupabaseClient,
  lang: string,
  options: { guildId?: string | null; globalOnly?: boolean; limit: number },
): Promise<BankWithTranslation[]> {
  let query = supabase
    .from('quiz_question_bank')
    .select(
      'id, correct_index, category, difficulty, is_custom_for_guild_id, last_used_at, quiz_question_translations!inner(question, options, is_ready, lang)'
    )
    .eq('quiz_question_translations.lang', lang)
    .eq('quiz_question_translations.is_ready', true)
    .order('last_used_at', { ascending: true, nullsFirst: true })
    .limit(options.limit);

  if (options.globalOnly) query = query.is('is_custom_for_guild_id', null);
  if (options.guildId) query = query.eq('is_custom_for_guild_id', options.guildId);

  const { data, error } = await query;
  if (error) return [];
  type Row = {
    id: string;
    correct_index: number;
    category: string | null;
    difficulty: string | null;
    is_custom_for_guild_id: string | null;
    last_used_at: string | null;
    quiz_question_translations: Array<{ question: string; options: string[]; is_ready: boolean; lang: string }>;
  };
  return (data as unknown as Row[] | null ?? [])
    .map((r) => {
      const t = r.quiz_question_translations[0];
      if (!t) return null;
      return {
        id: r.id,
        correct_index: r.correct_index,
        category: r.category,
        difficulty: r.difficulty,
        is_custom_for_guild_id: r.is_custom_for_guild_id,
        last_used_at: r.last_used_at,
        question: t.question,
        options: t.options,
      } satisfies BankWithTranslation;
    })
    .filter((r): r is BankWithTranslation => r !== null);
}

export async function lockEventQuestions(
  supabase: SupabaseClient,
  eventId: string,
): Promise<LockResult> {
  const { data: event, error: eventErr } = await supabase
    .from('quiz_events')
    .select('id, scope, guild_id, total_questions, status, questions_locked_at, lang')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    return { ok: false, error: eventErr?.message ?? 'event_not_found' };
  }

  const e = event as EventRow;
  const lang = (e.lang || 'tr').toLowerCase();

  if (e.questions_locked_at) return { ok: true, locked: false, reason: 'already_locked' };
  if (e.status === 'cancelled') return { ok: true, locked: false, reason: 'cancelled' };
  if (e.status !== 'scheduled') return { ok: true, locked: false, reason: 'not_scheduled' };

  const total = e.total_questions;
  const collected: BankWithTranslation[] = [];

  // 1) Per-guild custom sorular
  if (e.scope === 'guild' && e.guild_id) {
    const customs = await fetchReady(supabase, lang, { guildId: e.guild_id, limit: total });
    collected.push(...customs);
  }

  // 2) Ortak banka (rotasyon: en az kullanılanlar önce, sonra shuffle)
  if (collected.length < total) {
    const need = total - collected.length;
    const globals = await fetchReady(supabase, lang, { globalOnly: true, limit: need * 3 });
    const shuffled = shuffle(globals);
    for (const g of shuffled) {
      if (collected.length >= total) break;
      if (collected.some((c) => c.id === g.id)) continue;
      collected.push(g);
    }
  }

  if (collected.length < total) {
    return {
      ok: false,
      error: `Yetersiz soru havuzu. Gerekli: ${total}, '${lang}' dilinde hazır: ${collected.length}. /developer/quiz/questions sayfasından çevirileri tamamlayın veya event dilini değiştirin.`,
    };
  }

  const chosen = collected.slice(0, total);
  const rows = chosen.map((row, idx) => ({
    event_id: eventId,
    position: idx + 1,
    question_bank_id: row.id,
    question_text: row.question,
    options: row.options,
    correct_index: row.correct_index,
    category: row.category,
    difficulty: row.difficulty,
  }));

  await supabase.from('quiz_event_questions').delete().eq('event_id', eventId);

  const { error: insertErr } = await supabase.from('quiz_event_questions').insert(rows);
  if (insertErr) return { ok: false, error: insertErr.message };

  // Bank tablosunda last_used_at + use_count güncelle (RPC varsa onu kullan)
  const bankIds = chosen.map((c) => c.id);
  if (bankIds.length > 0) {
    await supabase.rpc('quiz_bank_mark_used', { p_ids: bankIds }).then(
      () => undefined,
      async () => {
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
