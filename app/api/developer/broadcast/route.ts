import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';

const EXACT_BROADCAST_CHANNEL_NAMES = new Set([
  'developer-duyuru',
  'developer_duyuru',
  'developer-duyurular',
  'geliştirici-duyuru',
  'gelistirici-duyuru',
]);

const BROADCAST_CHANNEL_TYPES = new Set([
  'developer_duyuru',
  'developer-duyuru',
  'developer_duyurular',
  'developer_duyuru_kanal',
]);

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

function normalizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function matchesBroadcastChannelName(name: string): boolean {
  const lower = name.toLowerCase();
  if (EXACT_BROADCAST_CHANNEL_NAMES.has(lower)) return true;

  const compact = normalizeChannelName(name);
  return (
    (compact.includes('developer') && compact.includes('duyuru')) ||
    (compact.includes('gelistirici') && compact.includes('duyuru')) ||
    compact.includes('developerduyuru')
  );
}

function matchesBroadcastChannelType(channelType: string): boolean {
  const type = channelType.toLowerCase();
  if (BROADCAST_CHANNEL_TYPES.has(type)) return true;
  return type.includes('developer') && type.includes('duyuru');
}

function splitMessageContent(content: string): { pingContent?: string; body: string } {
  const trimmed = content.trim();
  if (trimmed.toLowerCase().startsWith('@everyone')) {
    const body = trimmed.replace(/^@everyone\s*/i, '').trim();
    return { pingContent: '@everyone', body: body || trimmed };
  }
  return { body: trimmed };
}

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

async function loadDbBroadcastTargets(): Promise<Map<string, string>> {
  const targets = new Map<string, string>();
  const supabase = getSupabase();
  if (!supabase) return targets;

  const { data: rows } = await supabase
    .from('bot_log_channels')
    .select('guild_id, channel_id, channel_type, is_active')
    .not('channel_id', 'is', null);

  for (const row of rows ?? []) {
    if (row.is_active === false) continue;
    if (!row.guild_id || !row.channel_id) continue;
    if (!matchesBroadcastChannelType(row.channel_type ?? '')) continue;
    targets.set(String(row.guild_id), String(row.channel_id));
  }

  return targets;
}

async function broadcastViaBotApi(title: string, content: string, color: string) {
  const botApiUrl = process.env.BOT_API_URL;
  if (!botApiUrl) return null;

  try {
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
    const data = (await response.json()) as { successCount?: number; failCount?: number };
    if ((data.successCount ?? 0) <= 0) return null;
    return data;
  } catch {
    return null;
  }
}

async function broadcastViaDiscord(botToken: string, title: string, content: string, color: string) {
  const { Client, GatewayIntentBits, ChannelType } = await import('discord.js');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const dbTargets = await loadDbBroadcastTargets();
  const sentChannelIds = new Set<string>();
  let successCount = 0;
  let failCount = 0;
  const embedColor = parseEmbedColor(color);
  const { pingContent, body } = splitMessageContent(content);

  const buildPayload = () => ({
    content: pingContent,
    embeds: [
      {
        title,
        description: body,
        color: embedColor,
      },
    ],
  });

  try {
    await client.login(botToken);

    for (const [, channelId] of dbTargets) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased() || !('send' in channel)) {
          failCount += 1;
          continue;
        }
        await channel.send(buildPayload());
        sentChannelIds.add(channelId);
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    for (const [, guild] of client.guilds.cache) {
      try {
        const channels = await guild.channels.fetch();
        const target = channels.find(
          (channel) =>
            channel?.type === ChannelType.GuildText &&
            !!channel.name &&
            matchesBroadcastChannelName(channel.name) &&
            !sentChannelIds.has(channel.id),
        );

        if (!target?.isTextBased() || !('send' in target)) {
          continue;
        }

        await target.send(buildPayload());
        sentChannelIds.add(target.id);
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }
  } finally {
    await client.destroy().catch(() => undefined);
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
        source: 'bot_api',
      });
    }

    const result = await broadcastViaDiscord(auth.botToken, trimmedTitle, trimmedContent, color ?? '#5865F2');
    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      failCount: result.failCount,
      source: 'discord',
    });
  } catch (err: unknown) {
    console.error('Broadcast endpoint error:', err);
    const message = err instanceof Error ? err.message : 'Sunucu hatası.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
