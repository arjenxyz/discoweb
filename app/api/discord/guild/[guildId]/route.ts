import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isLocalDevBypassFromRequest, LOCAL_DEV_USER_ID } from '@/lib/localDevBypass';
import { LOCAL_DEV_MOCK_GUILD } from '@/lib/localDevMocks';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const localBypass = isLocalDevBypassFromRequest(request);
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      if (localBypass) {
        const { guildId } = await params;
        return NextResponse.json({ ...LOCAL_DEV_MOCK_GUILD, id: guildId || LOCAL_DEV_MOCK_GUILD.id });
      }
      return auth.response;
    }

    if (localBypass || auth.userId === LOCAL_DEV_USER_ID) {
      const { guildId } = await params;
      return NextResponse.json({ ...LOCAL_DEV_MOCK_GUILD, id: guildId || LOCAL_DEV_MOCK_GUILD.id });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const { guildId } = await params;

    const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${auth.userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!memberResponse.ok) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch guild' }, { status: response.status });
    }

    const guild = await response.json();

    return NextResponse.json({
      id: guild.id,
      name: guild.name,
      icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      owner_id: guild.owner_id ?? null,
    });
  } catch (error) {
    console.error('Error fetching Discord guild:', error);
    if (isLocalDevBypassFromRequest(request)) {
      const { guildId } = await params;
      return NextResponse.json({ ...LOCAL_DEV_MOCK_GUILD, id: guildId || LOCAL_DEV_MOCK_GUILD.id });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
