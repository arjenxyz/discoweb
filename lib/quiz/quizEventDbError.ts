import type { PostgrestError } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type QuizEventConflict = {
  id: string;
  title: string;
  status: string;
  start_at: string;
};

function formatStartTr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

export function quizEventConflictMessage(
  scope: 'guild' | 'global',
  existing: Pick<QuizEventConflict, 'title' | 'start_at' | 'status'>,
): string {
  const when = formatStartTr(existing.start_at);
  const statusLabel =
    existing.status === 'scheduled'
      ? 'planlanmış'
      : existing.status === 'live'
        ? 'canlı'
        : existing.status === 'finished'
          ? 'bitmiş'
          : existing.status === 'cancelled'
            ? 'iptal edilmiş'
            : existing.status;

  if (scope === 'guild') {
    return `Bu sunucuda ${when} tarihinde zaten bir quiz var («${existing.title}», ${statusLabel}). Başlangıç saatini değiştirin veya çakışan etkinliği iptal edin.`;
  }
  return `Aynı başlangıç saatinde (${when}) zaten bir global quiz var («${existing.title}», ${statusLabel}). Farklı bir saat seçin.`;
}

export async function findGuildQuizStartConflict(
  supabase: SupabaseClient,
  guildId: string,
  startAtIso: string,
  excludeEventId?: string,
): Promise<QuizEventConflict | null> {
  let q = supabase
    .from('quiz_events')
    .select('id, title, status, start_at')
    .eq('scope', 'guild')
    .eq('guild_id', guildId)
    .eq('start_at', startAtIso);
  if (excludeEventId) q = q.neq('id', excludeEventId);
  const { data } = await q.maybeSingle();
  return data ?? null;
}

export async function findGlobalQuizStartConflict(
  supabase: SupabaseClient,
  startAtIso: string,
  excludeEventId?: string,
): Promise<QuizEventConflict | null> {
  let q = supabase
    .from('quiz_events')
    .select('id, title, status, start_at')
    .eq('scope', 'global')
    .eq('start_at', startAtIso);
  if (excludeEventId) q = q.neq('id', excludeEventId);
  const { data } = await q.maybeSingle();
  return data ?? null;
}

/** Ham Postgres/Supabase hatasını admin/developer için anlaşılır mesaja çevir. */
export function mapQuizEventDbError(error: PostgrestError | null | undefined): {
  status: number;
  error: string;
  message: string;
} | null {
  if (!error) return null;
  const detail = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

  if (detail.includes('uniq_quiz_event_guild_start')) {
    return {
      status: 409,
      error: 'duplicate_guild_start',
      message:
        'Bu sunucuda seçtiğiniz başlangıç saatinde zaten bir quiz etkinliği kayıtlı. Başlangıç saatini değiştirin veya mevcut etkinliği iptal edin.',
    };
  }
  if (detail.includes('uniq_quiz_event_global_start')) {
    return {
      status: 409,
      error: 'duplicate_global_start',
      message:
        'Seçtiğiniz başlangıç saatinde zaten bir global quiz var. Farklı bir saat seçin.',
    };
  }
  if (error.code === '23505') {
    return {
      status: 409,
      error: 'duplicate_quiz_event',
      message: 'Bu tarih ve sunucu için zaten bir quiz etkinliği var. Başlangıç saatini değiştirin.',
    };
  }
  return null;
}

export function quizEventDbErrorPayload(error: PostgrestError | null | undefined): {
  status: number;
  body: { error: string; message: string };
} {
  const mapped = mapQuizEventDbError(error);
  if (mapped) {
    return { status: mapped.status, body: { error: mapped.error, message: mapped.message } };
  }
  return {
    status: 500,
    body: { error: 'save_failed', message: 'Quiz etkinliği kaydedilemedi. Lütfen tekrar deneyin.' },
  };
}
