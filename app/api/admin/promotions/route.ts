import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { getSelectedGuildId, resolveServer } from '@/lib/serverResolve';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

const getAdminId = async () => {
  return getSessionUserId();
};

export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const resolved = await resolveServer(supabase);
  if (!resolved) {
    return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('promotions')
    .select('id,code,value,max_uses,used_count,status,expires_at,created_at')
    .eq('server_id', resolved.serverId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const resolved = await resolveServer(supabase);
  if (!resolved) {
    return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
  }

  const adminId = await getAdminId();
  const selectedGuildId = await getSelectedGuildId();
  const payload = (await request.json()) as {
    code?: string;
    value?: number;
    maxUses?: number | null;
    status?: 'active' | 'disabled' | 'expired';
    expiresAt?: string | null;
  };

  if (!payload.code || typeof payload.value !== 'number') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (payload.value <= 0) {
    return NextResponse.json({ error: 'invalid_value' }, { status: 400 });
  }

  const maxUses =
    typeof payload.maxUses === 'number' && payload.maxUses > 0
      ? Math.floor(payload.maxUses)
      : null;

  const { error } = await supabase.from('promotions').insert({
    server_id: resolved.serverId,
    code: payload.code.trim().toUpperCase(),
    value: payload.value,
    max_uses: maxUses,
    status: payload.status ?? 'active',
    expires_at: payload.expiresAt ?? null,
  });

  if (error) {
    return NextResponse.json({ error: 'save_failed', details: error.message }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_promo_create',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: {
      code: payload.code,
      value: payload.value,
      maxUses,
      status: payload.status ?? 'active',
      expiresAt: payload.expiresAt ?? null,
    },
  });

  return NextResponse.json({ status: 'ok' });
}

export async function DELETE(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const adminId = await getAdminId();
  const selectedGuildId = await getSelectedGuildId();
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_promo_delete',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: { id },
  });

  return NextResponse.json({ status: 'ok' });
}
