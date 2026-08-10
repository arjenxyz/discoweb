import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

async function checkDeveloperAccess() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;
  const auth = await requireSessionUser();
  if (!auth.ok) return false;
  
  const discordUserId = auth.userId;
  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${developerGuildId}/members/${discordUserId}`, {
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
  if (!(await checkDeveloperAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  
  try {
    const { data, error } = await supabase.from('bot_settings').select('*').eq('id', 'default').single();
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'bot_settings tablosu bulunamadı. Lütfen SQL scriptini Supabase üzerinde çalıştırın.' }, { status: 500 });
    }
    return NextResponse.json(data || { id: 'default', presence_status: 'online', presence_type: 'PLAYING', presence_text: '' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await checkDeveloperAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  
  try {
    const { error } = await supabase.from('bot_settings').upsert({
      id: 'default',
      presence_status: body.presence_status,
      presence_type: body.presence_type,
      presence_text: body.presence_text,
      updated_at: new Date().toISOString()
    });

    if (error) {
      return NextResponse.json({ error: 'bot_settings tablosu eksik veya veritabanı hatası oluştu. SQL scriptini çalıştırdığınızdan emin olun.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
