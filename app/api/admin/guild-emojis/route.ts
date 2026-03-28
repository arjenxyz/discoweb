import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value || GUILD_ID;
};

export async function GET() {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
  }

  const guildId = await getSelectedGuildId();

  const res = await fetch(`https://discord.com/api/guilds/${guildId}/emojis`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  const emojis = (await res.json()) as Array<{
    id: string;
    name: string;
    animated: boolean;
    available?: boolean;
  }>;

  return NextResponse.json(
    emojis
      .filter((e) => e.available !== false)
      .map((e) => ({
        id: e.id,
        name: e.name,
        animated: e.animated,
        // CDN URL for the emoji image
        url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'webp'}?size=64`,
        // Discord markdown format
        tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`,
      })),
  );
}
