import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { getSessionUserId } from '@/lib/auth';
import { MAINTENANCE_KEYS, type MaintenanceKey, createDefaultFlags, syncBotMaintenanceToBot } from '@/lib/maintenance';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';

type MaintenanceFlagRow = {
  id?: string;
  key: string;
  is_active: boolean;
  reason: string | null;
  updated_by: string | null;
  updated_at: string;
};

const getSupabase = (): SupabaseClient | null => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const hasRole = async (userId: string, roleId?: string | null, guildId?: string) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || !roleId) return false;
  const targetGuildId = guildId || GUILD_ID;
  const memberResponse = await fetch(`https://discord.com/api/guilds/${targetGuildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!memberResponse.ok) return false;
  const member = (await memberResponse.json()) as { roles: string[] };
  return member.roles.includes(roleId);
};

const getDiscordProfile = async (userId: string, guildId?: string) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;
  const targetGuildId = guildId || GUILD_ID;
  const response = await fetch(`https://discord.com/api/guilds/${targetGuildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!response.ok) return null;
  const member = (await response.json()) as {
    nick?: string;
    user?: { id: string; username: string; avatar: string | null; global_name?: string | null };
  };
  const id = member.user?.id ?? userId;
  const avatarHash = member.user?.avatar;
  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.png?size=96`
    : `https://cdn.discordapp.com/embed/avatars/${Number(id) % 5}.png`;
  return {
    id,
    name: member.nick ?? member.user?.global_name ?? member.user?.username ?? id,
    avatarUrl,
  };
};

const isMaintenanceAdmin = async () => {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, userId: null };
  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
  const developerGuildId =
    process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;
  const isDeveloper = await hasRole(userId, developerRoleId, developerGuildId);
  if (!isDeveloper) return { ok: false as const, userId };
  return { ok: true as const, userId };
};

const ensureFlags = async (supabase: SupabaseClient): Promise<MaintenanceFlagRow[]> => {
  const { data, error } = await supabase
    .from('global_maintenance_flags')
    .select('key,is_active,reason,updated_by,updated_at')
    .order('key', { ascending: true });

  if (error) throw new Error(error.message);

  const existingKeys = new Set((data ?? []).map((row) => row.key));
  const missing = MAINTENANCE_KEYS.filter((key) => !existingKeys.has(key));

  if (missing.length > 0) {
    const { error: insertError } = await supabase.from('global_maintenance_flags').insert(
      missing.map((key) => ({ key, is_active: false })),
    );
    if (insertError) throw new Error(insertError.message);
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from('global_maintenance_flags')
    .select('key,is_active,reason,updated_by,updated_at')
    .in('key', [...MAINTENANCE_KEYS])
    .order('key', { ascending: true });

  if (refreshError) throw new Error(refreshError.message);

  // Stable id for UI keys
  return (refreshed ?? []).map((row) => ({
    id: row.key,
    key: row.key,
    is_active: Boolean(row.is_active),
    reason: row.reason ?? null,
    updated_by: row.updated_by ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
  }));
};

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
    }

    const { ok } = await isMaintenanceAdmin();
    if (!ok) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const flags = await ensureFlags(supabase);
    const updaterIds = flags
      .map((flag) => flag.updated_by)
      .filter((value): value is string => Boolean(value));
    const uniqueIds = [...new Set(updaterIds)];
    const profiles = await Promise.all(uniqueIds.map(async (id) => [id, await getDiscordProfile(id)]));
    const updaterProfiles = Object.fromEntries(
      profiles.filter(([, profile]) => profile).map(([id, profile]) => [id, profile]),
    ) as Record<string, { id: string; name: string; avatarUrl: string }>;

    return NextResponse.json({
      scope: 'global',
      server: { id: 'global', name: 'Platform (global)' },
      flags,
      keys: MAINTENANCE_KEYS,
      updaterProfiles,
      defaults: createDefaultFlags(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'unexpected', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
    }

    const { ok, userId } = await isMaintenanceAdmin();
    if (!ok || !userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      key?: string;
      is_active?: boolean;
      reason?: string | null;
    };

    if (!body.key || !MAINTENANCE_KEYS.includes(body.key as MaintenanceKey)) {
      return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
    }

    const { error } = await supabase.from('global_maintenance_flags').upsert(
      {
        key: body.key,
        is_active: Boolean(body.is_active),
        reason: body.reason ?? null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

    if (error) {
      return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 });
    }

    await logWebEvent(request, {
      event: 'admin_maintenance_update',
      status: body.is_active ? 'enabled' : 'disabled',
      userId,
      guildId: 'global',
      metadata: { key: body.key, reason: body.reason ?? null, scope: 'global' },
    });

    if (body.key === 'bot') {
      void syncBotMaintenanceToBot(Boolean(body.is_active), body.reason ?? null);
    }

    const flags = await ensureFlags(supabase);
    const updaterIds = flags
      .map((flag) => flag.updated_by)
      .filter((value): value is string => Boolean(value));
    const uniqueIds = [...new Set(updaterIds)];
    const profiles = await Promise.all(uniqueIds.map(async (id) => [id, await getDiscordProfile(id)]));
    const updaterProfiles = Object.fromEntries(
      profiles.filter(([, profile]) => profile).map(([id, profile]) => [id, profile]),
    ) as Record<string, { id: string; name: string; avatarUrl: string }>;

    return NextResponse.json({ ok: true, scope: 'global', flags, updaterProfiles });
  } catch (error) {
    return NextResponse.json(
      { error: 'unexpected', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    );
  }
}
