/**
 * Quiz ödülü yatırıldıktan sonra kullanıcıya bilgilendirme maili (fiş formatı).
 * category=order — cüzdan zaten güncellendi; claim-rewards ile tekrar ödenmez.
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

export function buildQuizMotivationMailBody(
  params: QuizMotivationMailParams & { username?: string | null },
) {
  const lines: string[] = [];
  lines.push(`Sayın @${params.username ?? params.userId},`);
  lines.push('');
  lines.push(`"${params.eventTitle}" quiz etkinliği tamamlandı. Bu turda papel kazanamadın, ama katılımın için teşekkürler!`);
  lines.push('');
  lines.push('Senin özeti:');
  lines.push(`• Doğru cevap: ${params.totalCorrect}/${params.totalQuestions}`);
  lines.push(`• Yanlış: ${params.wrongCount}`);
  lines.push(`• Ulaştığın soru: ${params.lastPosition}/${params.totalQuestions}`);
  if (params.eliminated) {
    lines.push('• Bu etkinlikte elendin — bir sonrakinde checkpoint ödüllerine odaklan.');
  }
  lines.push('');
  lines.push('Bir sonraki quizde checkpoint’lere ulaşarak papel kazanabilir, mükemmel skorla havuz bonusunu paylaşabilirsin.');
  lines.push('Yeni etkinlik duyurulduğunda tekrar görüşmek üzere!');
  lines.push('');
  lines.push('Başarılar — DiscoWeb Quiz Ekibi');
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
    category: 'order',
    status: 'published',
    created_at: new Date().toISOString(),
    author_name: 'Quiz Etkinliği',
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
  const body = buildQuizMotivationMailBody({ ...params, username: userInfo?.username ?? null });
  const title = `${params.eventTitle} — Katıldığın İçin Teşekkürler`;

  return insertQuizMail(supabase, {
    guildId: params.guildId,
    userId: params.userId,
    title,
    body,
    avatarUrl: userInfo?.avatar ?? null,
    metadata: {
      source: 'quiz_motivation',
      event_id: params.eventId,
      quiz_title: params.eventTitle,
      total_earned: 0,
      already_credited: true,
    },
  });
}

export function buildQuizRewardMailBody(params: QuizRewardMailParams & { username?: string | null }) {
  const paidAt = new Date().toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  const lines: string[] = [];

  lines.push(`Sayın @${params.username ?? params.userId},`);
  lines.push('');
  lines.push(`"${params.eventTitle}" quiz etkinliği tamamlandı. Kazancınız doğrudan cüzdanınıza yatırıldı.`);
  lines.push('');
  lines.push(`Ödeme tarihi: ${paidAt}`);
  lines.push(`Etkinlik No: ${params.eventId}`);
  lines.push('');
  lines.push('Sonuç özeti:');
  lines.push(`• Doğru cevap: ${params.totalCorrect}/${params.totalQuestions}`);
  lines.push(`• Yanlış: ${params.wrongCount}`);
  lines.push(`• Mükemmel skor: ${params.isPerfect ? 'Evet' : 'Hayır'}`);
  lines.push('');
  lines.push('Ödeme detayı:');
  if (params.breakdown.length > 0) {
    for (const b of params.breakdown) {
      const label = b.label ? ` (${b.label})` : '';
      lines.push(`• Checkpoint soru ${b.position}${label}: +${formatPapel(b.papel_reward)} Papel`);
    }
  } else if (params.checkpointPapel > 0) {
    lines.push(`• Checkpoint ödülleri: ${formatPapel(params.checkpointPapel)} Papel`);
  }
  if (params.perfectBonus > 0) {
    lines.push(`• Mükemmel skor bonusu: ${formatPapel(params.perfectBonus)} Papel`);
  }
  lines.push(`• Toplam yatırılan: ${formatPapel(params.totalEarn)} Papel`);
  lines.push('');
  lines.push('Teşekkür ederiz — iyi günlerde kullanın.');

  return lines.join('\n');
}

export async function sendQuizRewardMail(
  supabase: SupabaseClient,
  params: QuizRewardMailParams,
): Promise<{ ok: boolean; error?: string }> {
  const userInfo = await fetchDiscordUser(params.userId);
  const body = buildQuizRewardMailBody({ ...params, username: userInfo?.username ?? null });
  const title = `${params.eventTitle} — ${formatPapel(params.totalEarn)} Papel Kazandınız`;

  return insertQuizMail(supabase, {
    guildId: params.guildId,
    userId: params.userId,
    title,
    body,
    avatarUrl: userInfo?.avatar ?? null,
    metadata: {
      source: 'quiz_reward',
      event_id: params.eventId,
      quiz_title: params.eventTitle,
      total_earned: params.totalEarn,
      checkpoint_papel: params.checkpointPapel,
      perfect_bonus: params.perfectBonus,
      already_credited: true,
      breakdown: params.breakdown,
    },
  });
}
