import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderEarnNotification, type ChangeItem } from '@/lib/templates/EarnNotification.server';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

const SPAM_DEFAULTS = {
  spam_message_cooldown_ms: 5000,
  spam_min_message_length: 3,
  spam_flood_count: 5,
  spam_flood_window_ms: 15000,
  spam_block_sticker_only: true,
  spam_block_attachment_only: true,
  spam_block_emoji_only: true,
  spam_voice_block_alone: true,
  spam_voice_block_mute_deaf: true,
  daily_message_earn_cap: 0,
  daily_voice_earn_cap: 0,
};

const asBool = (value: unknown, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return !(value === false || value === 0 || value === 'false' || value === '0');
};

const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Math.round(Number(value ?? fallback));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const clampCap = (value: unknown) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(1_000_000, Number(n.toFixed(2)));
};

async function invalidateBotConfig(guildId: string) {
  const botApiUrl = process.env.BOT_API_URL;
  if (!botApiUrl) return;
  try {
    await fetch(`${botApiUrl.replace(/\/$/, '')}/api/invalidate-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.BOT_API_KEY
          ? { Authorization: `Bearer ${process.env.BOT_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ guildId }),
    });
  } catch (err) {
    console.warn('earn-settings: invalidate-config failed', err);
  }
}

export async function GET() {
  try {
    if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const supabase = getSupabase();
    const guildId = (await cookies()).get('selected_guild_id')?.value;
    if (!supabase || !guildId) {
      return NextResponse.json({ error: 'missing_config', detail: !supabase ? 'supabase' : 'guildId' }, { status: 500 });
    }

    const { data, error: dbErr } = await supabase.from('servers').select('*').eq('discord_id', guildId).maybeSingle();
    if (dbErr) console.error('earn-settings GET db error:', dbErr);

    let guildPreview = null;
    try {
      const res = await fetch(`https://discord.com/api/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });
      if (res.ok) {
        const g = await res.json();
        guildPreview = {
          name: g.name,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${guildId}/${g.icon}.png` : null,
        };
      }
    } catch {}

    let channels: Array<{ id: string; name: string; type: number; parent_id: string | null }> = [];
    let roles: Array<{ id: string; name: string; color: number }> = [];
    try {
      const chRes = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });
      if (chRes.ok) {
        const allChannels = await chRes.json();
        channels = allChannels
          .filter((c: any) => [0, 2, 4].includes(c.type))
          .map((c: any) => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id ?? null }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    } catch {}

    try {
      const roleRes = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });
      if (roleRes.ok) {
        const allRoles = await roleRes.json();
        roles = allRoles
          .filter((r: { managed?: boolean; name: string }) => !r.managed && r.name !== '@everyone')
          .sort((a: { position: number }, b: { position: number }) => b.position - a.position)
          .map((r: { id: string; name: string; color: number }) => ({
            id: r.id,
            name: r.name,
            color: r.color,
          }));
      }
    } catch {}

    return NextResponse.json({
    ...SPAM_DEFAULTS,
    ...data,
    spam_message_cooldown_ms: data?.spam_message_cooldown_ms ?? SPAM_DEFAULTS.spam_message_cooldown_ms,
    spam_min_message_length: data?.spam_min_message_length ?? SPAM_DEFAULTS.spam_min_message_length,
    spam_flood_count: data?.spam_flood_count ?? SPAM_DEFAULTS.spam_flood_count,
    spam_flood_window_ms: data?.spam_flood_window_ms ?? SPAM_DEFAULTS.spam_flood_window_ms,
    spam_block_sticker_only: asBool(data?.spam_block_sticker_only, SPAM_DEFAULTS.spam_block_sticker_only),
    spam_block_attachment_only: asBool(data?.spam_block_attachment_only, SPAM_DEFAULTS.spam_block_attachment_only),
    spam_block_emoji_only: asBool(data?.spam_block_emoji_only, SPAM_DEFAULTS.spam_block_emoji_only),
    spam_voice_block_alone: asBool(data?.spam_voice_block_alone, SPAM_DEFAULTS.spam_voice_block_alone),
    spam_voice_block_mute_deaf: asBool(data?.spam_voice_block_mute_deaf, SPAM_DEFAULTS.spam_voice_block_mute_deaf),
    daily_message_earn_cap: Number(data?.daily_message_earn_cap ?? SPAM_DEFAULTS.daily_message_earn_cap) || 0,
    daily_voice_earn_cap: Number(data?.daily_voice_earn_cap ?? SPAM_DEFAULTS.daily_voice_earn_cap) || 0,
    verify_role_id: data?.verify_role_id ?? null,
    tag_configured: Boolean(data?.tag_id ?? false),
    _guildPreview: guildPreview,
    _channels: channels,
    _roles: roles,
  });
  } catch (e) {
    console.error('earn-settings GET unexpected error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const supabase = getSupabase();
    const guildId = (await cookies()).get('selected_guild_id')?.value;
    if (!supabase || !guildId) return NextResponse.json({ error: 'error' }, { status: 500 });

    const payload = await request.json();

    type ServerUpdate = {
      earn_per_message: number;
      message_earn_enabled: boolean;
      earn_per_voice_minute: number;
      voice_earn_enabled: boolean;
      verify_role_id: string | null;
      tag_required: boolean;
      tag_id: string | null;
      tag_bonus_message: number;
      tag_bonus_voice: number;
      booster_bonus_message: number;
      booster_bonus_voice: number;
      earn_channels: any;
      spam_message_cooldown_ms: number;
      spam_min_message_length: number;
      spam_flood_count: number;
      spam_flood_window_ms: number;
      spam_block_sticker_only: boolean;
      spam_block_attachment_only: boolean;
      spam_block_emoji_only: boolean;
      spam_voice_block_alone: boolean;
      spam_voice_block_mute_deaf: boolean;
      daily_message_earn_cap: number;
      daily_voice_earn_cap: number;
    };

    const { data: oldData } = await supabase.from('servers').select('*').eq('discord_id', guildId).maybeSingle();

    // Kurulumda seçilen üye rolünü koru: boş kayıt verify_role_id'yi silmesin
    const incomingVerifyRole =
      typeof payload.verify_role_id === 'string' ? payload.verify_role_id.trim() : payload.verify_role_id;
    const resolvedVerifyRoleId =
      (incomingVerifyRole && String(incomingVerifyRole)) ||
      oldData?.verify_role_id ||
      null;

    const updateObj: ServerUpdate = {
      earn_per_message: Number(payload.earn_per_message ?? 0),
      message_earn_enabled: Boolean(payload.message_earn_enabled),
      earn_per_voice_minute: Number(payload.earn_per_voice_minute ?? 0),
      voice_earn_enabled: Boolean(payload.voice_earn_enabled),
      verify_role_id: resolvedVerifyRoleId,
      tag_required: Boolean(payload.tag_required),
      tag_id: payload.tag_required ? guildId : null,
      tag_bonus_message: Number(payload.tag_bonus_message ?? 0),
      tag_bonus_voice: Number(payload.tag_bonus_voice ?? 0),
      booster_bonus_message: Number(payload.booster_bonus_message ?? 0),
      booster_bonus_voice: Number(payload.booster_bonus_voice ?? 0),
      earn_channels: payload.earn_channels ?? null,
      spam_message_cooldown_ms: clampInt(payload.spam_message_cooldown_ms, SPAM_DEFAULTS.spam_message_cooldown_ms, 0, 300000),
      spam_min_message_length: clampInt(payload.spam_min_message_length, SPAM_DEFAULTS.spam_min_message_length, 0, 500),
      spam_flood_count: clampInt(payload.spam_flood_count, SPAM_DEFAULTS.spam_flood_count, 2, 50),
      spam_flood_window_ms: clampInt(payload.spam_flood_window_ms, SPAM_DEFAULTS.spam_flood_window_ms, 1000, 300000),
      spam_block_sticker_only: asBool(payload.spam_block_sticker_only, true),
      spam_block_attachment_only: asBool(payload.spam_block_attachment_only, true),
      spam_block_emoji_only: asBool(payload.spam_block_emoji_only, true),
      spam_voice_block_alone: asBool(payload.spam_voice_block_alone, true),
      spam_voice_block_mute_deaf: asBool(payload.spam_voice_block_mute_deaf, true),
      daily_message_earn_cap: clampCap(payload.daily_message_earn_cap),
      daily_voice_earn_cap: clampCap(payload.daily_voice_earn_cap),
    };

    const remaining: Record<string, unknown> = { ...updateObj };
    let saved = false;
    let lastErrorMessage: string | null = null;

    for (let attempt = 0; attempt < 16; attempt++) {
      // Explicit result typing avoids Supabase generic circular inference
      const result = (await supabase
        .from('servers')
        .update(remaining as never)
        .eq('discord_id', guildId)) as { error: { message?: string } | null };

      const updateError: { message?: string } | null = result.error;
      if (!updateError) {
        saved = true;
        lastErrorMessage = null;
        break;
      }

      lastErrorMessage = String(updateError.message || 'unknown_error');
      const missingMatch =
        lastErrorMessage.match(/Could not find the '([^']+)' column/i) ||
        lastErrorMessage.match(/column ["']?([a-z_]+)["']? of relation/i);
      const missingCol: string | undefined = missingMatch?.[1];

      if (missingCol && missingCol in remaining) {
        console.warn(`earn-settings: column missing (${missingCol}), retrying without it`);
        delete remaining[missingCol];
        continue;
      }
      break;
    }

    if (!saved) {
      console.error('earn-settings save failed:', lastErrorMessage);
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    const changeGroups: Record<string, ChangeItem[]> = { general: [], tag: [], boost: [] };

    const checkToggle = (key: keyof ServerUpdate, label: string, group: 'general' | 'tag' | 'boost') => {
      const oldV = Boolean(oldData?.[key as string]);
      const newV = Boolean(updateObj[key]);
      if (oldV !== newV) {
        changeGroups[group].push({ type: 'toggle', text: label, enabled: newV });
      }
    };

    const checkValue = (key: keyof ServerUpdate, label: string, group: 'general' | 'tag' | 'boost') => {
      const oldV = Number(oldData?.[key as string] ?? 0);
      const newV = Number(updateObj[key] as number ?? 0);
      if (oldV !== newV) {
        const dir: 'up' | 'down' = newV > oldV ? 'up' : 'down';
        changeGroups[group].push({ type: 'narrative', text: label, dir });
        changeGroups[group].push({ type: 'tech', text: `${label}: ${oldV.toFixed(2)} -> ${newV.toFixed(2)} Papel`, dir });
      }
    };

    checkToggle('message_earn_enabled', 'Mesaj Kazancı', 'general');
    checkToggle('voice_earn_enabled', 'Ses Kazancı', 'general');
    checkToggle('tag_required', 'Tag Bonusu Sistemi', 'tag');

    checkValue('earn_per_message', 'Mesaj Kazancı', 'general');
    checkValue('earn_per_voice_minute', 'Ses Kazancı', 'general');
    checkValue('tag_bonus_message', 'Tag Bonusu (Mesaj)', 'tag');
    checkValue('tag_bonus_voice', 'Tag Bonusu (Ses)', 'tag');
    checkValue('booster_bonus_message', 'Boost Bonusu (Mesaj)', 'boost');
    checkValue('booster_bonus_voice', 'Boost Bonusu (Ses)', 'boost');

    if (Object.values(changeGroups).some((g) => g.length > 0)) {
      const bodyHtml = renderEarnNotification(changeGroups, 'Bu güncelleme yönetici tarafından uygulandı.');

      await supabase.from('system_mails').insert({
        guild_id: guildId,
        title: 'Ekonomi Güncellemesi',
        body: bodyHtml,
        category: 'update',
        status: 'published',
        author_name: 'Sistem Yönetimi',
        author_avatar_url: null,
      });
    }

    await invalidateBotConfig(guildId);

    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error('earn-settings PUT unexpected error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
