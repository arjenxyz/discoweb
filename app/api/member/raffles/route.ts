import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  const sessionUserId = await getSessionUserId();
  const now = new Date().toISOString();

  const { data: raffles, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('guild_id', guildId)
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .is('drawn_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });

  if (!raffles?.length) {
    return NextResponse.json([]);
  }

  const raffleIds = raffles.map((r: { id: string }) => r.id);

  // Katılım sayıları
  const { data: entryCounts } = await supabase
    .from('raffle_entries')
    .select('raffle_id')
    .in('raffle_id', raffleIds);

  const countMap: Record<string, number> = {};
  for (const e of entryCounts ?? []) {
    countMap[e.raffle_id] = (countMap[e.raffle_id] ?? 0) + 1;
  }

  // Kullanıcının katıldığı çekilişler
  let userEnteredSet = new Set<string>();
  if (sessionUserId) {
    const { data: userEntries } = await supabase
      .from('raffle_entries')
      .select('raffle_id')
      .in('raffle_id', raffleIds)
      .eq('user_id', sessionUserId);
    for (const e of userEntries ?? []) {
      userEnteredSet.add(e.raffle_id);
    }
  }

  const result = raffles.map((r: any) => ({
    ...r,
    entry_count: countMap[r.id] ?? 0,
    user_entered: userEnteredSet.has(r.id),
  }));

  return NextResponse.json(result);
}
