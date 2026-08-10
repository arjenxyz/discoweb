import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

const getSelectedGuildId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value ?? null;
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

export async function POST(request: Request) {
  if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'missing_guild' }, { status: 400 });

  const payload = (await request.json()) as { title?: string; body?: string; details_url?: string | null; image_url?: string | null };
  const title = (payload.title ?? '').trim();
  const body = (payload.body ?? '').trim();

  if (!title || !body) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  try {
    const discordUserId = await getSessionUserId();

    const { error } = await supabase.from('system_mails').insert({
      guild_id: guildId,
      user_id: null,
      title,
      body,
      category: 'announcement',
      status: 'published',
      created_by: discordUserId,
      author_name: discordUserId ?? 'System',
      author_avatar_url: null,
      image_url: payload.image_url ?? null,
      details_url: payload.details_url ?? null,
    });

    if (error) {
      console.error('announce: failed to insert system_mails', error);
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error('announce: exception', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
