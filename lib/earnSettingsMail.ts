/**
 * Kazanç / ekonomi ayarları güncelleme mailleri.
 * UI localizes via metadata.kind = earn_settings.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type EarnSettingsChange =
  | { type: 'toggle'; key: string; enabled: boolean }
  | { type: 'value'; key: string; from: number; to: number; dir: 'up' | 'down' };

export type EarnSettingsGroupKey = 'general' | 'tag' | 'boost';

export type EarnSettingsGroups = Partial<Record<EarnSettingsGroupKey, EarnSettingsChange[]>>;

type InsertEarnSettingsMailParams = {
  guildId: string;
  /** null = guild-wide broadcast */
  userId?: string | null;
  groups?: EarnSettingsGroups;
  /** Free-form change lines (developer send-earnings) */
  summaryLines?: string[];
  effectiveDate?: string | null;
  reason?: string | null;
  targetAudience?: string | null;
  impactEstimate?: string | null;
  supportLink?: string | null;
  title?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  createdBy?: string | null;
  category?: 'update' | 'system';
};

const SETTING_LABEL_TR: Record<string, string> = {
  message_earn: 'Mesaj Kazancı',
  voice_earn: 'Ses Kazancı',
  tag_system: 'Tag Bonusu Sistemi',
  per_message: 'Mesaj Kazancı',
  per_voice: 'Ses Kazancı',
  tag_bonus_message: 'Tag Bonusu (Mesaj)',
  tag_bonus_voice: 'Tag Bonusu (Ses)',
  boost_bonus_message: 'Boost Bonusu (Mesaj)',
  boost_bonus_voice: 'Boost Bonusu (Ses)',
};

function plainBody(params: InsertEarnSettingsMailParams): string {
  const lines: string[] = ['Ekonomi güncellemesi'];
  if (params.effectiveDate) lines.push(`Tarih: ${params.effectiveDate}`);

  const groups = params.groups ?? {};
  for (const [group, items] of Object.entries(groups)) {
    if (!items?.length) continue;
    lines.push(`[${group}]`);
    for (const it of items) {
      const label = SETTING_LABEL_TR[it.key] ?? it.key;
      if (it.type === 'toggle') {
        lines.push(`${label}: ${it.enabled ? 'aktif' : 'devre dışı'}`);
      } else {
        lines.push(`${label}: ${it.from} -> ${it.to} Papel`);
      }
    }
  }

  for (const line of params.summaryLines ?? []) {
    if (line.trim()) lines.push(line.trim());
  }

  return lines.join('\n');
}

export async function insertEarnSettingsMail(
  supabase: SupabaseClient,
  params: InsertEarnSettingsMailParams,
): Promise<{ ok: boolean; error?: string }> {
  const title = params.title ?? 'Ekonomi Güncellemesi';
  const { error } = await supabase.from('system_mails').insert({
    guild_id: params.guildId,
    user_id: params.userId ?? null,
    title,
    body: plainBody(params),
    category: params.category ?? 'update',
    status: 'published',
    created_at: new Date().toISOString(),
    created_by: params.createdBy ?? null,
    author_name: params.authorName ?? 'DiscoWeb',
    author_avatar_url: params.authorAvatarUrl ?? null,
    metadata: {
      kind: 'earn_settings',
      i18nKey: 'earn_settings',
      groups: params.groups ?? {},
      summaryLines: params.summaryLines ?? [],
      effectiveDate: params.effectiveDate ?? null,
      reason: params.reason ?? null,
      targetAudience: params.targetAudience ?? null,
      impactEstimate: params.impactEstimate ?? null,
      supportLink: params.supportLink ?? null,
    },
  });

  if (error) {
    console.error('[earnSettingsMail] insert failed', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
