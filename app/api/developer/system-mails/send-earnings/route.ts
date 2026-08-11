import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { requireSessionUser } from '@/lib/auth';
import { insertEarnSettingsMail } from '@/lib/earnSettingsMail';

const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const checkDeveloperAccess = async (discordUserId: string): Promise<boolean> => {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) return false;

    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

    const developerResponse = await fetch(
      `https://discord.com/api/guilds/${developerGuildId}/members/${discordUserId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );

    if (!developerResponse.ok) return false;
    const developerMember = (await developerResponse.json()) as { roles: string[] };
    return developerMember.roles.includes(developerRoleId);
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const discordUserId = auth.userId;
  if (!(await checkDeveloperAccess(discordUserId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const payload = (await request.json()) as {
    effectiveDate?: string;
    changeSummaryDetailed?: string;
    reasonShort?: string;
    targetAudience?: string;
    impactEstimate?: string;
    supportLink?: string;
    title?: string;
    guildId?: string | null;
  };

  const effectiveDate = payload.effectiveDate ?? new Date().toISOString().split('T')[0];
  const title = payload.title ?? 'Kazanç Ayarları Güncellendi';
  const summary = String(payload.changeSummaryDetailed || '').trim();
  const summaryLines = summary
    ? summary
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  const selectedGuildId =
    payload.guildId ?? request.cookies.get('selected_guild_id')?.value ?? DEFAULT_DEVELOPER_GUILD_ID;

  const result = await insertEarnSettingsMail(supabase, {
    guildId: selectedGuildId,
    userId: null,
    title,
    summaryLines,
    effectiveDate,
    reason: payload.reasonShort ?? null,
    targetAudience: payload.targetAudience ?? null,
    impactEstimate: payload.impactEstimate ?? null,
    supportLink: payload.supportLink ?? null,
    category: 'system',
    authorName: 'DiscoWeb',
    createdBy: discordUserId,
  });

  if (!result.ok) {
    console.error('send-earnings POST save_failed:', result.error);
    return NextResponse.json({ error: 'save_failed', detail: result.error }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'developer_system_mail_create_earnings',
    status: 'success',
    userId: discordUserId ?? undefined,
    guildId: selectedGuildId,
    metadata: { title, effectiveDate },
  });

  return NextResponse.json({ status: 'ok' });
}
