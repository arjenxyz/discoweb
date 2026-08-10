import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requireSessionUser } from '@/lib/auth';

const CHANNEL_TYPES = [
  'user_main',
  'user_auth',
  'user_roles',
  'user_exchange',
  'user_store',
  'admin_main',
  'admin_wallet',
  'admin_store',
  'admin_notifications',
  'admin_settings',
] as const;

type ChannelType = (typeof CHANNEL_TYPES)[number];

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const getSelectedGuildId = async () => {
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;
  return selectedGuildId || (process.env.DISCORD_GUILD_ID ?? '1465698764453838882');
};

const isAdminUser = async (userId: string, guildId: string) => {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return false;
    }

    const supabase = getSupabase();
    if (!supabase) {
      return false;
    }

    const { data: server } = await supabase
      .from('servers')
      .select('admin_role_id')
      .eq('discord_id', guildId)
      .maybeSingle();

    if (!server?.admin_role_id) {
      return false;
    }

    const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!memberResponse.ok) {
      return false;
    }

    const member = (await memberResponse.json()) as { roles: string[] };
    return member.roles.includes(server.admin_role_id);
  } catch (error) {
    console.error('log-channel test: admin check failed', error);
    return false;
  }
};

const getSiteBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.WEB_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
};

const getWebhookImageUrl = (channelType: ChannelType) => {
  const map: Record<ChannelType, string> = {
    user_main: 'Main.png',
    user_auth: 'Main.png',
    user_roles: 'Roles.png',
    user_exchange: 'Main.png',
    user_store: 'Store.png',
    admin_main: 'Main.png',
    admin_wallet: 'Wallet.jpg',
    admin_store: 'Store.png',
    admin_notifications: 'Notifications.png',
    admin_settings: 'Settings.png',
  };
  return `${getSiteBaseUrl()}/webhook/${map[channelType]}`;
};

const getBotAvatarUrl = async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const resp = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!resp.ok) return null;
    const bot = await resp.json();
    if (!bot?.id || !bot?.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png`;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) {
    return session.response;
  }

  const { channelType } = (await request.json()) as {
    channelType?: ChannelType;
    source?: 'setup' | 'manual' | 'system';
    step?: string;
    note?: string;
  };

  if (!channelType || !CHANNEL_TYPES.includes(channelType)) {
    return NextResponse.json({ error: 'invalid_channel' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const guildId = await getSelectedGuildId();

  if (!(await isAdminUser(session.userId, guildId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data } = await supabase
    .from('log_channel_configs')
    .select('webhook_url,is_active')
    .eq('channel_type', channelType)
    .eq('guild_id', guildId)
    .maybeSingle();

  const webhookUrl = data?.is_active ? data?.webhook_url : null;

  if (!webhookUrl) {
    return NextResponse.json({ error: 'missing_webhook' }, { status: 400 });
  }

  const match = webhookUrl.match(/https:\/\/discord\.com\/api\/webhooks\/(\d+)\/(.+)/);
  if (!match) {
    return NextResponse.json({ error: 'invalid_webhook_url' }, { status: 400 });
  }

  const botAvatarUrl = await getBotAvatarUrl();
  const botToken = process.env.DISCORD_BOT_TOKEN;
  let testerName: string | null = null;
  let testerAvatarUrl: string | null = null;

  if (botToken) {
    try {
      const userResp = await fetch(`https://discord.com/api/users/${session.userId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (userResp.ok) {
        const user = await userResp.json();
        testerName = user.global_name || user.username || null;
        if (user.avatar) {
          testerAvatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        }
      }
    } catch {
      // ignore tester lookup errors
    }
  }
  let channelMention: string = channelType;
  if (supabase) {
    const { data: channelRow } = await supabase
      .from('bot_log_channels')
      .select('channel_id')
      .eq('guild_id', guildId)
      .eq('channel_type', channelType)
      .maybeSingle();
    if (channelRow?.channel_id) {
      channelMention = `<#${channelRow.channel_id}>`;
    }
  }

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Veri Merkezi',
      avatar_url: botAvatarUrl ?? undefined,
      embeds: [
        {
          title: 'Webhook Bağlantı Onayı',
          description:
            `Bu mesaj, webhook servisinin hedef URL ile başarılı bir şekilde eşleştiğini doğrulamak amacıyla sistem tarafından manuel olarak oluşturulmuştur.\n\n` +
            `İşlem: Manuel Test\n` +
            `Kanal: ${channelMention}\n\n` +
            `Önemli Not: Eğer bu mesajın iletildiği kanal bilgileri veya yapılandırma ayarları sisteminizle uyuşmuyorsa, lütfen vakit kaybetmeden destek sunucumuza gelerek teknik ekibimizle iletişime geçiniz.`,
          color: 3982620,
          author: testerName
            ? { name: testerName, icon_url: testerAvatarUrl ?? botAvatarUrl ?? undefined }
            : (botAvatarUrl ? { name: 'Veri Merkezi', icon_url: botAvatarUrl } : { name: 'Veri Merkezi' }),
          thumbnail: { url: getWebhookImageUrl(channelType) },
        },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: 'webhook_failed', status: resp.status, detail: text },
      { status: 400 },
    );
  }

  return NextResponse.json({ status: 'ok' });
}
