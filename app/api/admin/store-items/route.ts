import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { getSelectedGuildId, resolveServer } from '@/lib/serverResolve';
import { isLocalDevBypass } from '@/lib/localDevBypass';
import { LOCAL_DEV_MOCK_STORE_ITEMS } from '@/lib/localDevMocks';

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

  if (await isLocalDevBypass()) {
    return NextResponse.json(LOCAL_DEV_MOCK_STORE_ITEMS);
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
    .from('store_items')
    .select('id,title,description,price,status,role_id,duration_days,created_at')
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
    title?: string;
    description?: string;
    price?: number;
    status?: 'active' | 'inactive';
    roleId?: string | null;
    durationDays?: number;
  };

  if (!payload.title || typeof payload.price !== 'number' || !payload.roleId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Validate roleId exists in the selected guild via Discord API
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
    }

    const rolesResp = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!rolesResp.ok) {
      return NextResponse.json({ error: 'role_check_failed' }, { status: 500 });
    }

    const roles = (await rolesResp.json()) as Array<{ id: string }>;
    const found = roles.some((r) => String(r.id) === String(payload.roleId));
    if (!found) {
      return NextResponse.json({ error: 'invalid_role', message: 'Rol bilgileri yanlış' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'role_check_error' }, { status: 500 });
  }

  if (typeof payload.durationDays !== 'number' || payload.durationDays < 0) {
    return NextResponse.json({ error: 'invalid_duration' }, { status: 400 });
  }

  const { error } = await supabase.from('store_items').insert({
    server_id: resolved.serverId,
    title: payload.title,
    description: payload.description ?? null,
    price: payload.price,
    status: payload.status ?? 'active',
    role_id: payload.roleId,
    duration_days: payload.durationDays,
  });

  if (error) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_store_item_create',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    roleId: payload.roleId ?? undefined,
    metadata: {
      title: payload.title,
      price: payload.price,
      durationDays: payload.durationDays,
      status: payload.status ?? 'active',
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

  const { error } = await supabase.from('store_items').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_store_item_delete',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: { id },
  });

  return NextResponse.json({ status: 'ok' });
}

export async function PUT(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const adminId = await getAdminId();
  const selectedGuildId = await getSelectedGuildId();
  const payload = (await request.json()) as {
    id?: string;
    title?: string;
    description?: string | null;
    price?: number;
    status?: 'active' | 'inactive';
    roleId?: string | null;
    durationDays?: number;
  };

  if (!payload.id || !payload.title || typeof payload.price !== 'number' || !payload.roleId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Validate roleId exists in the selected guild via Discord API for update as well
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
    }

    const selectedGuildId = await getSelectedGuildId();
    const rolesResp = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!rolesResp.ok) {
      return NextResponse.json({ error: 'role_check_failed' }, { status: 500 });
    }

    const roles = (await rolesResp.json()) as Array<{ id: string }>;
    const found = roles.some((r) => String(r.id) === String(payload.roleId));
    if (!found) {
      return NextResponse.json({ error: 'invalid_role', message: 'Rol bilgileri yanlış' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'role_check_error' }, { status: 500 });
  }

  if (typeof payload.durationDays !== 'number' || payload.durationDays < 0) {
    return NextResponse.json({ error: 'invalid_duration' }, { status: 400 });
  }

  const { error } = await supabase
    .from('store_items')
    .update({
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      status: payload.status ?? 'active',
      role_id: payload.roleId,
      duration_days: payload.durationDays,
    })
    .eq('id', payload.id);

  if (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_store_item_update',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    roleId: payload.roleId ?? undefined,
    metadata: {
      id: payload.id,
      title: payload.title,
      price: payload.price,
      durationDays: payload.durationDays,
      status: payload.status ?? 'active',
    },
  });

  return NextResponse.json({ status: 'ok' });
}
