import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminOrDeveloper, getSelectedGuildId } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET() {
  const isAdmin = await isAdminOrDeveloper();
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'no_guild' }, { status: 400 });

  const { data: server } = await supabase
    .from('servers')
    .select('economy_tier, burn_rate, treasury_rate')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (server?.economy_tier !== 'advanced') {
    return NextResponse.json({ error: 'not_advanced' }, { status: 403 });
  }

  const { data: treasury } = await supabase
    .from('server_treasury')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle();

  const { data: dividends } = await supabase
    .from('dividend_payouts')
    .select('week_id, total_amount, per_lot_amount, distributed_at, triggered_by')
    .eq('guild_id', guildId)
    .order('distributed_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    balance: treasury?.balance ?? 0,
    total_collected: treasury?.total_collected ?? 0,
    total_burned: treasury?.total_burned ?? 0,
    total_dividends_paid: treasury?.total_dividends_paid ?? 0,
    burn_rate: server?.burn_rate ?? 0.05,
    treasury_rate: server?.treasury_rate ?? 0.10,
    recent_dividends: dividends ?? [],
  });
}
