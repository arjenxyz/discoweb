import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

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

export async function POST(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  const now = new Date().toISOString();

  const { raffleId } = (await request.json()) as { raffleId?: string };
  if (!raffleId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  // Çekilişi getir ve doğrula
  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('id, guild_id, is_active, end_date, drawn_at, min_tag_days')
    .eq('id', raffleId)
    .eq('guild_id', guildId)
    .maybeSingle();

  if (raffleError || !raffle) return NextResponse.json({ error: 'raffle_not_found' }, { status: 404 });
  if (!raffle.is_active) return NextResponse.json({ error: 'raffle_inactive' }, { status: 400 });
  if (raffle.drawn_at) return NextResponse.json({ error: 'raffle_already_drawn' }, { status: 400 });
  if (raffle.end_date && new Date(raffle.end_date) < new Date(now)) {
    return NextResponse.json({ error: 'raffle_ended' }, { status: 400 });
  }

  // min_tag_days kontrolü
  if (raffle.min_tag_days > 0) {
    const { data: server } = await supabase
      .from('servers')
      .select('id')
      .eq('discord_id', guildId)
      .maybeSingle();

    if (server) {
      const { data: member } = await supabase
        .from('members')
        .select('tag_granted_at')
        .eq('user_id', session.userId)
        .eq('server_id', server.id)
        .maybeSingle();

      if (!member?.tag_granted_at) {
        return NextResponse.json({ error: 'tag_required' }, { status: 403 });
      }

      const tagDate = new Date(member.tag_granted_at);
      const daysSinceTag = (Date.now() - tagDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceTag < raffle.min_tag_days) {
        return NextResponse.json({ error: 'tag_days_insufficient', required: raffle.min_tag_days }, { status: 403 });
      }
    }
  }

  // Katılımı kaydet (UNIQUE constraint ile duplicate engellenir)
  const { error: insertError } = await supabase
    .from('raffle_entries')
    .insert({
      raffle_id: raffleId,
      guild_id: guildId,
      user_id: session.userId,
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'already_entered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'entry_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
