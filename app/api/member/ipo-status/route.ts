import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';
import { getSelectedGuildId } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return session.response;

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

  // Aktif listing durumu
  const { data: listing } = await supabase
    .from('server_listings')
    .select('status')
    .eq('guild_id', guildId)
    .maybeSingle();

  // Son başvuru
  const { data: application } = await supabase
    .from('ipo_applications')
    .select('id, status, proposed_price, proposed_founder_ratio, created_at, reviewed_at')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    listing_status: listing?.status ?? null,
    application: application ?? null,
  });
}
