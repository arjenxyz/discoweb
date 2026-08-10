import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isLocalDevBypassFromRequest, LOCAL_DEV_USER_ID } from '@/lib/localDevBypass';
import { LOCAL_DEV_MOCK_ROLES } from '@/lib/localDevMocks';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const localBypass = isLocalDevBypassFromRequest(request);
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      if (localBypass) {
        return NextResponse.json([...LOCAL_DEV_MOCK_ROLES]);
      }
      return auth.response;
    }

    if (localBypass || auth.userId === LOCAL_DEV_USER_ID) {
      return NextResponse.json([...LOCAL_DEV_MOCK_ROLES]);
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

    const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: response.status });
    }

    const roles = await response.json();
    const sortedRoles = roles.sort((a: { position: number }, b: { position: number }) => b.position - a.position);

    return NextResponse.json(sortedRoles);
  } catch (error) {
    console.error('Error fetching Discord guild roles:', error);
    if (isLocalDevBypassFromRequest(request)) {
      return NextResponse.json([...LOCAL_DEV_MOCK_ROLES]);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
