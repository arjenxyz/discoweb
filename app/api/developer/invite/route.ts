import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guild_id');

    if (!guildId) {
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

    // 1. Sunucudaki kanalları çek
    const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!channelsResponse.ok) {
      console.error('Failed to fetch channels:', await channelsResponse.text());
      return NextResponse.json({ error: 'Bot bu sunucuda bulunmuyor veya kanal yetkisi yok.' }, { status: 403 });
    }

    const channels = await channelsResponse.json() as Array<{ id: string; type: number; name: string }>;
    
    // 2. İlk uygun metin kanalını (type: 0) bul
    const textChannel = channels.find(c => c.type === 0);
    
    if (!textChannel) {
      return NextResponse.json({ error: 'Sunucuda uygun metin kanalı bulunamadı.' }, { status: 404 });
    }

    // 3. Davet linki oluştur
    const inviteResponse = await fetch(`https://discord.com/api/v10/channels/${textChannel.id}/invites`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_age: 86400, // 24 hours
        max_uses: 1,
        unique: true
      }),
    });

    if (!inviteResponse.ok) {
      console.error('Failed to create invite:', await inviteResponse.text());
      return NextResponse.json({ error: 'Botun bu kanalda davet oluşturma yetkisi yok.' }, { status: 403 });
    }

    const inviteData = await inviteResponse.json() as { code: string };
    const inviteUrl = `https://discord.gg/${inviteData.code}`;

    return NextResponse.json({ invite_url: inviteUrl });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
