import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { getSessionUserId } from '@/lib/auth';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value || GUILD_ID;
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function GET() {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  const { data, error } = await supabase
    .from('badge_tiers')
    .select('*')
    .eq('guild_id', guildId)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  const payload = (await request.json()) as {
    name?: string;
    emoji?: string | null;
    days_required?: number;
    color?: string | null;
    description?: string | null;
    sort_order?: number;
  };

  if (!payload.name?.trim()) {
    return NextResponse.json({ error: 'invalid_payload', message: 'İsim zorunludur' }, { status: 400 });
  }
  if (!Number.isInteger(payload.days_required) || (payload.days_required ?? 0) < 1) {
    return NextResponse.json({ error: 'invalid_payload', message: 'Gün gereksinimi pozitif tam sayı olmalı' }, { status: 400 });
  }

  const { error } = await supabase.from('badge_tiers').insert({
    guild_id: guildId,
    name: payload.name.trim(),
    emoji: payload.emoji ?? null,
    days_required: payload.days_required,
    color: payload.color ?? null,
    description: payload.description ?? null,
    sort_order: payload.sort_order ?? 0,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate_days', message: 'Bu gün değeri zaten mevcut' }, { status: 409 });
    }
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }
  return NextResponse.json({ status: 'ok' });
}

export async function PUT(request: Request) {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const payload = (await request.json()) as {
    id?: string;
    name?: string;
    emoji?: string | null;
    days_required?: number;
    color?: string | null;
    description?: string | null;
    sort_order?: number;
  };

  if (!payload.id) {
    return NextResponse.json({ error: 'invalid_payload', message: 'id zorunludur' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name.trim();
  if (payload.emoji !== undefined) update.emoji = payload.emoji;
  if (payload.days_required !== undefined) {
    if (!Number.isInteger(payload.days_required) || payload.days_required < 1) {
      return NextResponse.json({ error: 'invalid_payload', message: 'Gün gereksinimi pozitif tam sayı olmalı' }, { status: 400 });
    }
    update.days_required = payload.days_required;
  }
  if (payload.color !== undefined) update.color = payload.color;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.sort_order !== undefined) update.sort_order = payload.sort_order;

  const { error } = await supabase.from('badge_tiers').update(update).eq('id', payload.id);
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate_days', message: 'Bu gün değeri zaten mevcut' }, { status: 409 });
    }
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
  return NextResponse.json({ status: 'ok' });
}

export async function DELETE(request: Request) {
  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const { id } = (await request.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const { error } = await supabase.from('badge_tiers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ status: 'ok' });
}
