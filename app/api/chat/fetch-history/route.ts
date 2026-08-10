import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const u1 = searchParams.get('u1')?.trim();
    const u2 = searchParams.get('u2')?.trim();
    if (!u1 || !u2) {
      return NextResponse.json({ error: 'missing_user_ids' }, { status: 400 });
    }

    // verify developer role using existing endpoint
    const devResp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/developer/check-access`, {
      credentials: 'include',
    });
    if (!devResp.ok) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'db_not_configured' }, { status: 500 });
    }

    // compute pair_key
    const a = u1 < u2 ? u1 : u2;
    const b = u1 < u2 ? u2 : u1;
    const key = `${a}|${b}`;

    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('pair_key', key)
      .maybeSingle();

    if (!room || !room.id) {
      return NextResponse.json({ messages: [] });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('fetch-history supabase error', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('fetch-history error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}