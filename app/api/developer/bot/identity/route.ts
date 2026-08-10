import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';

const DISCORD_API = 'https://discord.com/api/v10';

async function checkDeveloperAccess() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;

  const auth = await requireSessionUser();
  if (!auth.ok) return false;
  
  const discordUserId = auth.userId;
  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

  try {
    const res = await fetch(`${DISCORD_API}/guilds/${developerGuildId}/members/${discordUserId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.roles.includes(developerRoleId);
  } catch {
    return false;
  }
}

export async function GET() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  if (!(await checkDeveloperAccess())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bot ${botToken}` }
  });
  
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch bot info' }, { status: res.status });
  
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  if (!(await checkDeveloperAccess())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const { username, avatar, banner } = body;

    const payload: Record<string, string | null> = {};
    if (username) payload.username = username;
    if (avatar !== undefined) payload.avatar = avatar; // null to remove, base64 string to update
    if (banner !== undefined) payload.banner = banner; // null to remove, base64 string to update

    const res = await fetch(`${DISCORD_API}/users/@me`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Bot identity update error:', errorData);
      
      let errorMessage = 'Güncelleme başarısız.';
      if (errorData.retry_after) {
        errorMessage = `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(errorData.retry_after)} saniye bekleyin.`;
      } else if (errorData.message) {
        errorMessage += ` Hata: ${errorData.message}`;
      }
      
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
