import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';
const BROADCAST_CHANNEL_NAMES = new Set(['developer-duyuru', 'developer_duyuru', 'developer-duyurular']);

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

async function requireDeveloper() {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return { ok: false as const, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return { ok: false as const, response: NextResponse.json({ error: 'Bot token yapılandırılmamış.' }, { status: 500 }) };
  }

  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

  const developerResponse = await fetch(
    `https://discord.com/api/v10/guilds/${developerGuildId}/members/${auth.userId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );

  if (!developerResponse.ok) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  const developerMember = (await developerResponse.json()) as { roles?: string[] };
  if (!Array.isArray(developerMember.roles) || !developerMember.roles.includes(developerRoleId)) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { ok: true as const, botToken };
}

function parseEmbedColor(color: string | undefined): number {
  if (!color) return 0x5865f2;
  const hex = color.replace('#', '').trim();
  const parsed = Number.parseInt(hex, 16);
  return Number.isFinite(parsed) ? parsed : 0x5865f2;
}

async function broadcastViaBotApi(title: string, content: string, color: string) {
  const botApiUrl = process.env.BOT_API_URL;
  if (!botApiUrl) return null;

  const botApiKey = process.env.BOT_API_KEY ?? '';
  const response = await fetch(`${botApiUrl.replace(/\/$/, '')}/api/broadcast-system`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(botApiKey ? { Authorization: `Bearer ${botApiKey}` } : {}),
    },
    body: JSON.stringify({ title, content, color }),
  });

  if (!response.ok) return null;
  return (await response.json()) as { successCount?: number; failCount?: number };
}

async function broadcastViaDiscord(botToken: string, title: string, content: string, color: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Veritabanı bağlantısı kurulamadı.');
  }

  const { data: servers, error } = await supabase
    .from('servers')
    .select('discord_id')
    .eq('is_setup', true);

  if (error) {
    throw new Error('Sunucu listesi alınamadı.');
  }

  const guildIds = (servers ?? []).map((s) => s.discord_id).filter(Boolean);
  if (guildIds.length === 0) {
    return { successCount: 0, failCount: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  const embedColor = parseEmbedColor(color);

  for (const guildId of guildIds) {
    try {
      const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${botToken}` },
      });

      if (!channelsRes.ok) {
        failCount += 1;
        continue;
      }

      const channels = (await channelsRes.json()) as Array<{ id: string; name: string; type: number }>;
      const targetChannel = channels.find(
        (channel) => channel.type === 0 && BROADCAST_CHANNEL_NAMES.has(channel.name.toLowerCase()),
      );

      if (!targetChannel) {
        failCount += 1;
        continue;
      }

      const messageRes = await fetch(`https://discord.com/api/v10/channels/${targetChannel.id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [{ title, description: content, color: embedColor }],
        }),
      });

      if (messageRes.ok) successCount += 1;
      else failCount += 1;
    } catch {
      failCount += 1;
    }
  }

  return { successCount, failCount };
}

export async function POST(request: Request) {
  const auth = await requireDeveloper();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { title, content, color } = body as { title?: string; content?: string; color?: string };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Başlık ve içerik gerekli.' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const botApiResult = await broadcastViaBotApi(trimmedTitle, trimmedContent, color ?? '#5865F2');
    if (botApiResult) {
      return NextResponse.json({
        success: true,
        successCount: botApiResult.successCount ?? 0,
        failCount: botApiResult.failCount ?? 0,
      });
    }

    const result = await broadcastViaDiscord(auth.botToken, trimmedTitle, trimmedContent, color ?? '#5865F2');
    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      failCount: result.failCount,
    });
  } catch (err: unknown) {
    console.error('Broadcast endpoint error:', err);
    const message = err instanceof Error ? err.message : 'Sunucu hatası.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
