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

  // Advanced kontrolü
  const { data: server } = await supabase
    .from('servers')
    .select('economy_tier')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (server?.economy_tier !== 'advanced') {
    return NextResponse.json({ error: 'not_advanced' }, { status: 403 });
  }

  const { data: listing } = await supabase
    .from('server_listings')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: 'no_listing' }, { status: 404 });

  // Yatırımcı sayısı
  const { count: investorCount } = await supabase
    .from('investor_holdings')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', guildId)
    .gt('lot_count', 0);

  // Toplam işlem hacmi
  const { data: volumeRow } = await supabase
    .from('market_trades')
    .select('lot_count')
    .eq('guild_id', guildId);
  const totalVolume = (volumeRow ?? []).reduce((s: number, r: { lot_count: number }) => s + r.lot_count, 0);

  // 24 saatlik fiyat değişimi
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const { data: dayTrades } = await supabase
    .from('market_trades')
    .select('price_per_lot, traded_at')
    .eq('guild_id', guildId)
    .gte('traded_at', yesterday)
    .order('traded_at', { ascending: true });

  let priceChange24h = null;
  if (dayTrades && dayTrades.length > 0 && listing.market_price) {
    const oldest = dayTrades[0].price_per_lot;
    priceChange24h = oldest > 0 ? ((listing.market_price - oldest) / oldest) * 100 : null;
  }

  // Son işlemler
  const { data: recentTrades } = await supabase
    .from('market_trades')
    .select('lot_count, price_per_lot, traded_at, buyer_user_id, seller_user_id')
    .eq('guild_id', guildId)
    .order('traded_at', { ascending: false })
    .limit(6);

  // Aktif cezalar
  const { data: penalties } = await supabase
    .from('server_penalties')
    .select('type, reason, issued_at')
    .eq('guild_id', guildId)
    .eq('is_active', true);

  // Aktif olaylar
  const { data: events } = await supabase
    .from('market_events')
    .select('title, type, price_impact')
    .or(`guild_id.eq.${guildId},guild_id.is.null`)
    .eq('is_active', true);

  return NextResponse.json({
    ...listing,
    investor_count: investorCount ?? 0,
    total_traded_volume: totalVolume,
    price_change_24h: priceChange24h,
    recent_trades: (recentTrades ?? []).map((t: any) => ({ ...t, type: 'buy' })),
    active_penalties: penalties ?? [],
    active_events: events ?? [],
  });
}
