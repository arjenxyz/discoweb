/**
 * Quiz sonrası bilgilendirme mailleri (sistem mesajları).
 * category=system — cüzdan zaten güncellendi; claim-rewards ile tekrar ödenmez.
 * UI localizes via metadata.kind (quiz_reward | quiz_motivation).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type QuizRewardBreakdownLine = {
  position: number;
  papel_reward: number;
  label?: string | null;
};

export type QuizRewardMailParams = {
  guildId: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  totalEarn: number;
  checkpointPapel: number;
  perfectBonus: number;
  isPerfect: boolean;
  totalCorrect: number;
  totalQuestions: number;
  wrongCount: number;
  breakdown: QuizRewardBreakdownLine[];
};

export type QuizMotivationMailParams = {
  guildId: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  totalCorrect: number;
  totalQuestions: number;
  wrongCount: number;
  lastPosition: number;
  eliminated: boolean;
};

function formatPapel(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

async function fetchDiscordUser(userId: string) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) return null;
    const res = await fetch(`https://discord.com/api/users/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { id: string; username?: string; avatar?: string | null };
    return {
      username: u.username ?? null,
      avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
    };
  } catch {
    return null;
  }
}

/** Plain-text fallback body (structured UI uses metadata). */
export function buildQuizMotivationMailBody(params: QuizMotivationMailParams) {
  return [
    `Etkinlik: ${params.eventTitle}`,
    `Doğru: ${params.totalCorrect}/${params.totalQuestions}`,
    `Yanlış: ${params.wrongCount}`,
    `Ulaşılan soru: ${params.lastPosition}/${params.totalQuestions}`,
    params.eliminated ? 'Durum: elendi' : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Plain-text fallback body (structured UI uses metadata). */
export function buildQuizRewardMailBody(params: QuizRewardMailParams) {
  const lines = [
    `Etkinlik: ${params.eventTitle}`,
    `Toplam: ${formatPapel(params.totalEarn)} Papel`,
    `Doğru: ${params.totalCorrect}/${params.totalQuestions}`,
    `Yanlış: ${params.wrongCount}`,
  ];
  for (const b of params.breakdown) {
    const label = b.label ? ` (${b.label})` : '';
    lines.push(`Checkpoint ${b.position}${label}: +${formatPapel(b.papel_reward)} Papel`);
  }
  if (params.perfectBonus > 0) {
    lines.push(`Mükemmel bonus: +${formatPapel(params.perfectBonus)} Papel`);
  }
  return lines.join('\n');
}

async function insertQuizMail(
  supabase: SupabaseClient,
  opts: {
    guildId: string;
    userId: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
    avatarUrl?: string | null;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('system_mails').insert({
    guild_id: opts.guildId,
    user_id: opts.userId,
    title: opts.title,
    body: opts.body,
    category: 'system',
    status: 'published',
    created_at: new Date().toISOString(),
    author_name: 'DiscoWeb',
    author_avatar_url: opts.avatarUrl ?? null,
    metadata: opts.metadata,
  });
  if (error) {
    console.warn('[quiz-payout] mail insert failed', opts.userId, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendQuizMotivationMail(
  supabase: SupabaseClient,
  params: QuizMotivationMailParams,
): Promise<{ ok: boolean; error?: string }> {
  const userInfo = await fetchDiscordUser(params.userId);
  const body = buildQuizMotivationMailBody(params);
  const title = `${params.eventTitle} — Katıldığın İçin Teşekkürler`;

  return insertQuizMail(supabase, {
    guildId: params.guildId,
    userId: params.userId,
    title,
    body,
    avatarUrl: userInfo?.avatar ?? null,
    metadata: {
      kind: 'quiz_motivation',
      i18nKey: 'quiz_motivation',
      source: 'quiz_motivation',
      event_id: params.eventId,
      quiz_title: params.eventTitle,
      total_earned: 0,
      already_credited: true,
      total_correct: params.totalCorrect,
      total_questions: params.totalQuestions,
      wrong_count: params.wrongCount,
      last_position: params.lastPosition,
      eliminated: params.eliminated,
    },
  });
}

export async function sendQuizRewardMail(
  supabase: SupabaseClient,
  params: QuizRewardMailParams,
): Promise<{ ok: boolean; error?: string }> {
  const userInfo = await fetchDiscordUser(params.userId);
  const body = buildQuizRewardMailBody(params);
  const title = `${params.eventTitle} — ${formatPapel(params.totalEarn)} Papel Kazandınız`;

  return insertQuizMail(supabase, {
    guildId: params.guildId,
    userId: params.userId,
    title,
    body,
    avatarUrl: userInfo?.avatar ?? null,
    metadata: {
      kind: 'quiz_reward',
      i18nKey: 'quiz_reward',
      source: 'quiz_reward',
      event_id: params.eventId,
      quiz_title: params.eventTitle,
      total_earned: params.totalEarn,
      checkpoint_papel: params.checkpointPapel,
      perfect_bonus: params.perfectBonus,
      already_credited: true,
      total_correct: params.totalCorrect,
      total_questions: params.totalQuestions,
      wrong_count: params.wrongCount,
      is_perfect: params.isPerfect,
      breakdown: params.breakdown,
    },
  });
}
