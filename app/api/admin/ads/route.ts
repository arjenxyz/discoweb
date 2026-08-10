import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';

export const dynamic = 'force-dynamic';


const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data } = await supabase
    .from('ads')
    .select('*')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ ads: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    invite_url: string;
    server_name: string;
    server_description?: string;
    server_icon?: string;
    member_count?: number;
    online_count?: number;
    target_guild_id?: string;
    active?: boolean;
  };

  if (!body.invite_url || !body.server_name) {
    return NextResponse.json({ error: 'invite_url ve server_name zorunlu' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data: topRow } = await supabase
    .from('ads')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = Number((topRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('ads')
    .insert({
      invite_url: body.invite_url,
      server_name: body.server_name,
      server_description: body.server_description ?? null,
      server_icon: body.server_icon ?? null,
      member_count: body.member_count ?? null,
      online_count: body.online_count ?? null,
      target_guild_id: body.target_guild_id ?? null,
      active: body.active ?? true,
      sort_order: nextSort,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    active?: boolean;
    sort_order?: number;
  };

  if (!body.id) {
    return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.active === 'boolean') patch.active = body.active;
  if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order;

  const { data, error } = await supabase.from('ads').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });
  }

  await supabase.from('ads').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
