import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEV_GUILD_ID = process.env.DEVELOPER_GUILD_ID ?? process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const DEV_ROLE_ID = process.env.DEVELOPER_ROLE_ID ?? '1467580199481639013';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

async function isDeveloper(userId: string): Promise<boolean> {
  if (!DEV_GUILD_ID || !DEV_ROLE_ID) return false;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${DEV_GUILD_ID}/members/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return false;
    const member = await res.json() as { roles?: string[] };
    return Array.isArray(member.roles) && member.roles.includes(DEV_ROLE_ID);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return session.response;
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'all';
  const activeOnly = searchParams.get('active') !== 'false';

  const result: Record<string, unknown> = {};

  if (type === 'all' || type === 'member') {
    let q = supabase
      .from('member_bans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    result.member = data ?? [];
  }

  if (type === 'all' || type === 'server') {
    let q = supabase
      .from('server_bans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    result.server = data ?? [];
  }

  return NextResponse.json(result);
}

type CreateBanBody = {
  type: 'member' | 'server';
  userId?: string;
  guildId?: string;
  reason?: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return session.response;
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const body = (await request.json()) as CreateBanBody;
  if (!body?.type) return NextResponse.json({ error: 'missing_type' }, { status: 400 });

  if (body.type === 'server') {
    if (!body.guildId) return NextResponse.json({ error: 'missing_guild_id' }, { status: 400 });
    const { data, error } = await supabase
      .from('server_bans')
      .insert({
        guild_id: body.guildId,
        reason: body.reason ?? null,
        is_active: true,
        created_by: session.userId,
        expires_at: body.expiresAt ?? null,
        metadata: body.metadata ?? {},
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: 'insert_failed', details: error.message }, { status: 500 });

    await supabase.from('admin_actions').insert({
      action_type: 'ban_added',
      payload_after: { target: 'server', guild_id: body.guildId, reason: body.reason, admin_id: session.userId }
    });

    return NextResponse.json({ ok: true, ban: data });
  }

  if (!body.userId) return NextResponse.json({ error: 'missing_user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('member_bans')
    .insert({
      user_id: body.userId,
      guild_id: body.guildId ?? null,
      reason: body.reason ?? null,
      is_active: true,
      created_by: session.userId,
      expires_at: body.expiresAt ?? null,
      metadata: body.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: 'insert_failed', details: error.message }, { status: 500 });

  await supabase.from('admin_actions').insert({
    action_type: 'ban_added',
    payload_after: { target: 'member', user_id: body.userId, reason: body.reason, admin_id: session.userId }
  });

  return NextResponse.json({ ok: true, ban: data });
}

type LiftBanBody = {
  type: 'member' | 'server';
  id: string;
};

export async function DELETE(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return session.response;
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const body = (await request.json()) as LiftBanBody;
  if (!body?.type || !body?.id) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const table = body.type === 'server' ? 'server_bans' : 'member_bans';

  const { error } = await supabase
    .from(table)
    .update({
      is_active: false,
      lifted_at: new Date().toISOString(),
      lifted_by: session.userId,
    })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: 'update_failed', details: error.message }, { status: 500 });

  await supabase.from('admin_actions').insert({
    action_type: 'ban_removed',
    payload_after: { type: body.type, ban_id: body.id, admin_id: session.userId }
  });

  return NextResponse.json({ ok: true });
}
