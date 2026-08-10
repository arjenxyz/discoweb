import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
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

export async function GET() {
  try {
    if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const supabase = getSupabase();
    const guildId = await getSelectedGuildId();
    if (!supabase || !guildId) return NextResponse.json({ error: 'missing_config' }, { status: 500 });

    const { data, error } = await supabase
      .from('servers')
      .select('admin_role_id,verify_role_id,approval_threshold,is_setup,discord_id,referral_reward')
      .eq('discord_id', guildId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });

    // Fetch guild roles from Discord
    let roles: Array<{ id: string; name: string; color: number }> = [];
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      if (botToken) {
        const res = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (res.ok) {
          const allRoles = await res.json();
          roles = allRoles
            .filter((r: any) => !r.managed && r.name !== '@everyone')
            .sort((a: any, b: any) => b.position - a.position)
            .map((r: any) => ({ id: r.id, name: r.name, color: r.color }));
        }
      }
    } catch {}

    return NextResponse.json({
      admin_role_id: data?.admin_role_id ?? null,
      verify_role_id: data?.verify_role_id ?? null,
      approval_threshold: data?.approval_threshold ?? 80,
      referral_reward: data?.referral_reward ?? 500,
      is_setup: data?.is_setup ?? false,
      _roles: roles,
    });
  } catch (e) {
    console.error('admin/settings GET error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const supabase = getSupabase();
    const guildId = await getSelectedGuildId();
    if (!supabase || !guildId) return NextResponse.json({ error: 'missing_config' }, { status: 500 });

    const adminId = await getSessionUserId();
    const payload = await request.json();

    const updateObj: Record<string, any> = {};

    // Only include fields that were sent
    if (payload.admin_role_id !== undefined) updateObj.admin_role_id = payload.admin_role_id || null;
    if (payload.verify_role_id !== undefined) updateObj.verify_role_id = payload.verify_role_id || null;
    if (payload.approval_threshold !== undefined) updateObj.approval_threshold = Number(payload.approval_threshold);
    if (payload.referral_reward !== undefined) {
      const r = Math.max(0, Math.min(100_000, Math.round(Number(payload.referral_reward))));
      updateObj.referral_reward = r;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: 'no_changes' }, { status: 400 });
    }

    const { error } = await supabase
      .from('servers')
      .update(updateObj)
      .eq('discord_id', guildId);

    if (error) {
      console.error('admin/settings POST db error:', error);
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    await logWebEvent(request, {
      event: 'admin_settings_update',
      status: 'success',
      userId: adminId ?? undefined,
      guildId,
      metadata: updateObj,
    });

    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error('admin/settings POST error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
