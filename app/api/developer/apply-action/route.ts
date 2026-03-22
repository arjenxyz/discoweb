import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const DAILY_LIMIT = 5;

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

export async function POST(request: NextRequest) {
  try {
    const access = await checkDeveloperAccess(request);
    if (!access.ok) return access.response;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const body = await request.json();
    const { type, payload } = body;
    if (!type || !payload) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];
    const limitKey = `dev_ai_actions_${today}`;
    const { data: limitRow } = await supabase.from('app_config').select('value').eq('key', limitKey).maybeSingle();
    const currentCount = parseInt(limitRow?.value ?? '0', 10);

    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json({ error: 'daily_limit_exceeded', limit: DAILY_LIMIT }, { status: 429 });
    }

    if (type === 'market_event') {
      const { guild_id, type: eventType, title, description, price_impact, expires_at, severity } = payload;
      if (!guild_id || !eventType || !title) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
      const { error } = await supabase.from('market_events').insert({
        guild_id, type: eventType, severity: severity ?? 'info', title,
        description: description ?? '', price_impact: price_impact ?? 0,
        is_active: true, expires_at: expires_at ?? null,
      });
      if (error) return NextResponse.json({ error: 'insert_failed', detail: error.message }, { status: 500 });

    } else if (type === 'market_penalty') {
      const { guild_id, type: penaltyType, reason, fine_amount } = payload;
      if (!guild_id || !penaltyType || !reason) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
      const multipliers: Record<string, number> = { warning: 0.90, fine: 0.80, suspension: 1.0, delist: 1.0 };
      const { error } = await supabase.from('server_penalties').insert({
        guild_id, type: penaltyType, reason, fine_amount: fine_amount ?? null,
        price_multiplier: multipliers[penaltyType] ?? 1.0, is_active: true,
      });
      if (error) return NextResponse.json({ error: 'insert_failed', detail: error.message }, { status: 500 });
      if (penaltyType === 'suspension') {
        await supabase.from('server_listings').update({ status: 'suspended' }).eq('guild_id', guild_id);
      } else if (penaltyType === 'delist') {
        await supabase.from('server_listings').update({ status: 'delisted', delisted_at: new Date().toISOString() }).eq('guild_id', guild_id);
      }

    } else if (type === 'listing_update') {
      const { guild_id, market_price, status, circuit_breaker_until } = payload;
      if (!guild_id) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
      const updates: Record<string, unknown> = {};
      if (market_price !== undefined) updates.market_price = market_price;
      if (status !== undefined) updates.status = status;
      if (circuit_breaker_until !== undefined) updates.circuit_breaker_until = circuit_breaker_until;
      if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'no_changes' }, { status: 400 });
      const { error } = await supabase.from('server_listings').update(updates).eq('guild_id', guild_id);
      if (error) return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 });

    } else {
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
    }

    if (limitRow) {
      await supabase.from('app_config').update({ value: String(currentCount + 1) }).eq('key', limitKey);
    } else {
      await supabase.from('app_config').insert({ key: limitKey, value: '1' });
    }

    return NextResponse.json({ success: true, remaining: DAILY_LIMIT - currentCount - 1 });
  } catch (error) {
    console.error('Apply action error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
