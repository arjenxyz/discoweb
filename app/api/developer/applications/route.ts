import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

async function checkDeveloperAccess(request: NextRequest) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) return { ok: false as const, response: auth.response };

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return { ok: false as const, response: NextResponse.json({ error: 'server_error' }, { status: 500 }) };

  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

  const developerResponse = await fetch(
    `https://discord.com/api/guilds/${developerGuildId}/members/${auth.userId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );

  if (!developerResponse.ok) return { ok: false as const, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };

  const developerMember = (await developerResponse.json()) as { roles: string[] };
  if (!developerMember.roles.includes(developerRoleId)) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  try {
    const access = await checkDeveloperAccess(request);
    if (!access.ok) return access.response;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const [{ data: ecoApps }, { data: ipoApps }] = await Promise.all([
      supabase.from('economy_tier_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('ipo_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({ economy: ecoApps ?? [], ipo: ipoApps ?? [] });
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkDeveloperAccess(request);
    if (!access.ok) return access.response;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const body = await request.json();
    const { type, id, action, starter_package } = body;

    if (!type || !id || !action) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: 'invalid_action' }, { status: 400 });

    if (type === 'economy') {
      if (action === 'approve') {
        const { data: app } = await supabase.from('economy_tier_applications').select('guild_id, applicant_user_id').eq('id', id).maybeSingle();
        if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 });

        await supabase.from('member_wallets').update({ balance: 0, reserved_balance: 0 }).eq('guild_id', app.guild_id);
        await supabase.from('servers').update({ economy_tier: 'advanced', advanced_since: new Date().toISOString() }).eq('discord_id', app.guild_id);

        const pkg = starter_package ?? 100000;
        const { data: treasury } = await supabase.from('server_treasury').select('balance').eq('guild_id', app.guild_id).maybeSingle();
        if (treasury) {
          await supabase.from('server_treasury').update({ balance: (treasury.balance ?? 0) + pkg, total_collected: pkg }).eq('guild_id', app.guild_id);
        } else {
          await supabase.from('server_treasury').insert({ guild_id: app.guild_id, balance: pkg, total_collected: pkg });
        }
        await supabase.from('economy_tier_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
      } else {
        await supabase.from('economy_tier_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
      }
    } else if (type === 'ipo') {
      if (action === 'approve') {
        const { data: app } = await supabase.from('ipo_applications').select('guild_id, applicant_user_id, proposed_price, proposed_founder_ratio').eq('id', id).maybeSingle();
        if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 });

        const totalLots = 1000000;
        const founderLots = Math.round(totalLots * app.proposed_founder_ratio);
        const publicLots = totalLots - founderLots;

        await supabase.from('server_listings').upsert({
          guild_id: app.guild_id,
          status: 'approved',
          total_lots: totalLots,
          founder_lots: founderLots,
          public_lots: publicLots,
          founder_user_id: app.applicant_user_id,
          founder_vesting_start: new Date().toISOString(),
          founder_vested_lots: 0,
          base_price: app.proposed_price,
          market_price: app.proposed_price,
          ipo_price: app.proposed_price,
          listed_at: new Date().toISOString(),
        }, { onConflict: 'guild_id' });

        await supabase.from('ipo_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
      } else {
        await supabase.from('ipo_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
      }
    } else {
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Applications POST error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
