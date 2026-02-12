import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { checkMaintenance } from '@/lib/maintenance';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;
  return selectedGuildId || process.env.DISCORD_GUILD_ID || '1465698764453838882';
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function GET() {
  const maintenance = await checkMaintenance(['site']);
  if (maintenance.blocked) {
    return NextResponse.json(
      { error: 'maintenance', key: maintenance.key, reason: maintenance.reason },
      { status: 503 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('discord_user_id')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const selectedGuildId = await getSelectedGuildId();

  const [{ data: serverTotals }, { data: userTotals }] = await Promise.all([
    supabase
      .from('server_overview_stats')
      .select('total_messages,total_voice_minutes')
      .eq('guild_id', selectedGuildId)
      .maybeSingle(),
    supabase
      .from('member_overview_stats')
      .select('total_messages,total_voice_minutes')
      .eq('guild_id', selectedGuildId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  let joinedAt: string | null = null;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  let memberRoles: string[] = [];
  let boosterSince: string | null = null;
  let isBooster = false;
  if (botToken) {
    const memberResponse = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (memberResponse.ok) {
      const member = (await memberResponse.json()) as { joined_at?: string; roles?: string[]; premium_since?: string | null };
      joinedAt = member.joined_at ?? null;
      memberRoles = member.roles ?? [];
      boosterSince = member.premium_since ?? null;
      isBooster = Boolean(boosterSince);
    }
  }

  // load server record to get verify_role_id, tag/booster config and internal server id
  const { data: serverRow } = await supabase
    .from('servers')
    .select('id,verify_role_id,tag_bonus_message,tag_bonus_voice,booster_bonus_message,booster_bonus_voice,tag_id')
    .eq('discord_id', selectedGuildId)
    .maybeSingle();

  // compute last 24h stats (approx by stat_date >= today-1)
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data: last24 } = await supabase
    .from('member_daily_stats')
    .select('message_count,voice_minutes', { count: 'exact' })
    .eq('guild_id', selectedGuildId)
    .eq('user_id', userId)
    .gte('stat_date', dayAgo);

  const messagesLast24h = (last24 ?? []).reduce((s: number, r: any) => s + Number(r.message_count ?? 0), 0);
  const voiceMinutesLast24h = (last24 ?? []).reduce((s: number, r: any) => s + Number(r.voice_minutes ?? 0), 0);

  // determine verified role and when it was first applied (if any)
  let hasVerifyRole = false;
  let verifiedSince: string | null = null;
  if (serverRow?.verify_role_id) {
    hasVerifyRole = memberRoles.includes(serverRow.verify_role_id);

    // look for a paid store_order that applied the verify role
    const { data: verifyOrders } = await supabase
      .from('store_orders')
      .select('applied_at')
      .eq('user_id', userId)
      .eq('server_id', serverRow.id)
      .eq('role_id', serverRow.verify_role_id)
      .eq('status', 'paid')
      .order('applied_at', { ascending: true })
      .limit(1);
    if (verifyOrders && verifyOrders.length) {
      verifiedSince = verifyOrders[0].applied_at ?? null;
    }
  }

  // totals since verifiedSince (if present)
  let totalsSinceVerified: { messages: number; voice_minutes: number } | null = null;
  if (verifiedSince) {
    const sinceDate = new Date(verifiedSince).toISOString().slice(0, 10);
    const { data: sinceRows } = await supabase
      .from('member_daily_stats')
      .select('message_count,voice_minutes')
      .eq('guild_id', selectedGuildId)
      .eq('user_id', userId)
      .gte('stat_date', sinceDate);
    const msgs = (sinceRows ?? []).reduce((s: number, r: any) => s + Number(r.message_count ?? 0), 0);
    const vmins = (sinceRows ?? []).reduce((s: number, r: any) => s + Number(r.voice_minutes ?? 0), 0);
    totalsSinceVerified = { messages: msgs, voice_minutes: vmins };
  }

  // active perks (paid store_orders currently applied)
  let activePerks: Array<{ role_id: string; item_title: string | null; applied_at: string | null; expires_at: string | null }> = [];
  if (serverRow?.id) {
    const { data: perks } = await supabase
      .from('store_orders')
      .select('role_id,item_title,applied_at,expires_at')
      .eq('user_id', userId)
      .eq('server_id', serverRow.id)
      .eq('status', 'paid')
      .not('applied_at', 'is', null)
      .order('applied_at', { ascending: false });
    if (perks) {
      const now = Date.now();
      activePerks = (perks as any[])
        .filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now)
        .map((p) => ({ role_id: p.role_id, title: p.item_title ?? null, applied_at: p.applied_at ?? null, expires_at: p.expires_at ?? null }));
    }
  }

  // tag info from member_profiles
  let hasTag = false;
  let tagGrantedAt: string | null = null;
  if (selectedGuildId) {
    const { data: profileRow } = await supabase
      .from('member_profiles')
      .select('tag_granted_at')
      .eq('guild_id', selectedGuildId)
      .eq('user_id', userId)
      .maybeSingle();
    if (profileRow) {
      tagGrantedAt = profileRow.tag_granted_at ?? null;
      hasTag = Boolean(tagGrantedAt);
    }
  }

  return NextResponse.json({
    joinedAt,
    serverMessages: Number(serverTotals?.total_messages ?? 0),
    serverVoiceMinutes: Number(serverTotals?.total_voice_minutes ?? 0),
    userMessages: Number(userTotals?.total_messages ?? 0),
    userVoiceMinutes: Number(userTotals?.total_voice_minutes ?? 0),
    // tag / booster config & status
    tagBonusMessage: Number(serverRow?.tag_bonus_message ?? 0),
    tagBonusVoice: Number(serverRow?.tag_bonus_voice ?? 0),
    boosterBonusMessage: Number(serverRow?.booster_bonus_message ?? 0),
    boosterBonusVoice: Number(serverRow?.booster_bonus_voice ?? 0),
    hasTag,
    tagGrantedAt,
    isBooster,
    boosterSince,
    hasVerifyRole,
    verifiedSince,
    totalsSinceVerified,
    messagesLast24h,
    voiceMinutesLast24h,
    activePerks,
  });
}
