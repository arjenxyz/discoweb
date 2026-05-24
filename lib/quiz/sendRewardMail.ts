/**
 * Quiz sonrası bilgilendirme mailleri (sistem mesajları).
 * category=system — cüzdan zaten güncellendi; claim-rewards ile tekrar ödenmez.
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

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statRow(label: string, value: string) {
  return `<li style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;">
    <span style="color:rgba(148,163,184,0.95);font-size:14px;">${escapeHtml(label)}</span>
    <span style="color:#f8fafc;font-weight:700;font-size:14px;">${escapeHtml(value)}</span>
  </li>`;
}

function quizMailShell(opts: {
  greeting: string;
  intro: string;
  sections: Array<{ title: string; rows: string; footer?: string }>;
  closing: string;
}) {
  const sectionsHtml = opts.sections
    .map(
      (s) => `
    <div style="margin:20px 0 0;">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:rgba(129,140,248,0.95);">${escapeHtml(s.title)}</h3>
      <ul style="margin:0;padding:0;list-style:none;">${s.rows}</ul>
      ${s.footer ? `<p style="margin:12px 0 0;font-size:13px;color:rgba(148,163,184,0.9);line-height:1.55;">${s.footer}</p>` : ''}
    </div>`,
    )
    .join('');

  return `<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;color:rgba(226,232,240,0.92);">
  <p style="margin:0 0 14px;font-size:15px;">${opts.greeting}</p>
  <p style="margin:0 0 4px;font-size:14px;color:rgba(203,213,225,0.88);line-height:1.65;">${opts.intro}</p>
  ${sectionsHtml}
  <p style="margin:24px 0 0;font-size:14px;color:rgba(148,163,184,0.95);line-height:1.6;">${opts.closing}</p>
</div>`;
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

export function buildQuizMotivationMailBody(
  params: QuizMotivationMailParams & { username?: string | null },
) {
  const displayName = params.username ? `@${params.username}` : params.userId;
  const summaryRows = [
    statRow('Doğru cevap', `${params.totalCorrect} / ${params.totalQuestions}`),
    statRow('Yanlış', String(params.wrongCount)),
    statRow('Ulaştığın soru', `${params.lastPosition} / ${params.totalQuestions}`),
  ];
  if (params.eliminated) {
    summaryRows.push(
      statRow('Durum', 'Bu turda elendin'),
    );
  }

  return quizMailShell({
    greeting: `Sayın <strong style="color:#f8fafc;">${escapeHtml(displayName)}</strong>,`,
    intro: `<strong style="color:#f8fafc;">${escapeHtml(params.eventTitle)}</strong> quiz etkinliği tamamlandı. Bu turda papel kazanamadın; katılımın için teşekkürler.`,
    sections: [
      {
        title: 'Sonuç özeti',
        rows: summaryRows.join(''),
        footer: params.eliminated
          ? 'Bir sonraki etkinlikte checkpoint sorularına ulaşarak papel kazanabilirsin.'
          : undefined,
      },
    ],
    closing:
      'Yeni quiz duyurulduğunda tekrar görüşmek üzere. Başarılar — <strong style="color:#c7d2fe;">DiscoWeb Quiz Ekibi</strong>',
  });
}

export function buildQuizRewardMailBody(params: QuizRewardMailParams & { username?: string | null }) {
  const paidAt = new Date().toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  const displayName = params.username ? `@${params.username}` : params.userId;

  const payoutRows: string[] = [];
  if (params.breakdown.length > 0) {
    for (const b of params.breakdown) {
      const label = b.label ? ` (${b.label})` : '';
      payoutRows.push(
        statRow(`Checkpoint — soru ${b.position}${label}`, `+${formatPapel(b.papel_reward)} Papel`),
      );
    }
  } else if (params.checkpointPapel > 0) {
    payoutRows.push(statRow('Checkpoint ödülleri', `${formatPapel(params.checkpointPapel)} Papel`));
  }
  if (params.perfectBonus > 0) {
    payoutRows.push(statRow('Mükemmel skor bonusu', `+${formatPapel(params.perfectBonus)} Papel`));
  }
  payoutRows.push(
    statRow('Toplam yatırılan', `${formatPapel(params.totalEarn)} Papel`),
  );

  return quizMailShell({
    greeting: `Sayın <strong style="color:#f8fafc;">${escapeHtml(displayName)}</strong>,`,
    intro: `<strong style="color:#f8fafc;">${escapeHtml(params.eventTitle)}</strong> quiz etkinliği tamamlandı. Kazancın doğrudan cüzdanına yatırıldı.`,
    sections: [
      {
        title: 'Sonuç özeti',
        rows: [
          statRow('Doğru cevap', `${params.totalCorrect} / ${params.totalQuestions}`),
          statRow('Yanlış', String(params.wrongCount)),
          statRow('Mükemmel skor', params.isPerfect ? 'Evet' : 'Hayır'),
        ].join(''),
      },
      {
        title: 'Ödeme detayı',
        rows: payoutRows.join(''),
        footer: `Ödeme tarihi: ${escapeHtml(paidAt)} · Etkinlik No: ${escapeHtml(params.eventId)}`,
      },
    ],
    closing: 'Teşekkür ederiz — iyi günlerde kullan.',
  });
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
      total_correct: params.totalCorrect,
      total_questions: params.totalQuestions,
      wrong_count: params.wrongCount,
      is_perfect: params.isPerfect,
      breakdown: params.breakdown,
    },
  });
}
