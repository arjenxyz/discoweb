import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { guild_id } = await request.json() as { guild_id: string };

    if (!guild_id) {
      return NextResponse.json({ error: 'Missing guild_id' }, { status: 400 });
    }

    // Developer access kontrolü
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const discordUserId = auth.userId;

    const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
    const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

    const developerResponse = await fetch(
      `https://discord.com/api/v10/guilds/${developerGuildId}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );

    if (!developerResponse.ok) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    const developerMember = (await developerResponse.json()) as { roles: string[] };
    if (!developerMember.roles.includes(developerRoleId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Botu sunucudan çıkar
    const leaveResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guild_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!leaveResponse.ok && leaveResponse.status !== 204) {
      console.error('Failed to leave guild:', await leaveResponse.text());
      return NextResponse.json({ error: 'Bot sunucudan çıkamadı veya zaten bulunmuyor.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving guild:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
