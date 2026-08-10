import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isLocalDevBypassFromRequest, LOCAL_DEV_USER_ID } from '@/lib/localDevBypass';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return auth.response;
    }
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const { guildId } = await params;
    const skipMemberCheck =
      isLocalDevBypassFromRequest(request) || auth.userId === LOCAL_DEV_USER_ID;

    if (!skipMemberCheck) {
      const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${auth.userId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!memberResponse.ok) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    // Discord API'den sunucu bilgilerini al
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
