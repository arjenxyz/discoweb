/**
 * Developer-only access kontrolü.
 * `DEVELOPER_GUILD_ID` sunucusundaki `DEVELOPER_ROLE_ID` rolüne sahip olanlar developer sayılır.
 */

const DEV_GUILD_ID = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const DEV_ROLE_ID = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';

export async function isDeveloper(userId: string): Promise<boolean> {
  if (!userId || !DEV_GUILD_ID || !DEV_ROLE_ID) return false;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${DEV_GUILD_ID}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return false;
    const member = (await res.json()) as { roles?: string[] };
    return Array.isArray(member.roles) && member.roles.includes(DEV_ROLE_ID);
  } catch {
    return false;
  }
}
