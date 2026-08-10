import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;
    if (userId !== auth.userId) {
      const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
      const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
      const devResp = await fetch(`https://discord.com/api/guilds/${developerGuildId}/members/${auth.userId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!devResp.ok) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const devMember = (await devResp.json()) as { roles?: string[] };
      if (!devMember.roles?.includes(developerRoleId)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    // Discord API'den kullanıcı bilgilerini al
    const response = await fetch(`https://discord.com/api/users/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }

    const user = await response.json();

    return NextResponse.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
    });
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
