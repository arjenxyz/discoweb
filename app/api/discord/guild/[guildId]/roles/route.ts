import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

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
    const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${auth.userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!memberResponse.ok) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Discord API'den sunucu rollerini al
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: response.status });
    }

    const roles = await response.json();

    // Rollerı pozisyonuna göre sırala (en yüksekten en düşüğe)
    const sortedRoles = roles.sort((a: any, b: any) => b.position - a.position);

    return NextResponse.json(sortedRoles);
  } catch (error) {
    console.error('Error fetching Discord guild roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
