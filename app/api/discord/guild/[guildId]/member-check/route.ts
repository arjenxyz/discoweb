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
    const userId = auth.userId;

    // Discord API'den kullanıcının sunucuda üye olup olmadığını kontrol et
    const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (memberResponse.ok) {
      // Kullanıcı sunucuda üye
      return NextResponse.json({ isMember: true });
    } else if (memberResponse.status === 404) {
      // Kullanıcı sunucuda üye değil
      return NextResponse.json({ isMember: false });
    } else {
      // Diğer hata durumları
      console.error(`Unexpected response status: ${memberResponse.status}`);
      return NextResponse.json({ error: 'Failed to check membership' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error checking guild membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
