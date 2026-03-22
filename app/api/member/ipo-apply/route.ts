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

export async function POST(request: Request) {
  const session = await requireSessionUser(request);
  if (!session.ok) return session.response;
  const userId = session.userId;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const guildId = await getSelectedGuildId();
  if (!guildId) return NextResponse.json({ error: 'no_guild' }, { status: 400 });

  const body = await request.json();
  const { proposed_price, proposed_founder_ratio } = body;

  if (!proposed_price || proposed_price <= 0) {
    return NextResponse.json({ error: 'invalid_price' }, { status: 400 });
  }
  if (!proposed_founder_ratio || proposed_founder_ratio < 0.51 || proposed_founder_ratio > 0.80) {
    return NextResponse.json({ error: 'invalid_founder_ratio' }, { status: 400 });
  }

  // Advanced kontrolü
  const { data: server } = await supabase
    .from('servers')
    .select('economy_tier, name')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (server?.economy_tier !== 'advanced') {
    return NextResponse.json({ error: 'not_advanced' }, { status: 403 });
  }

  // Zaten listede mi?
  const { data: existingListing } = await supabase
    .from('server_listings')
    .select('status')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (existingListing?.status === 'approved') {
    return NextResponse.json({ error: 'already_listed' }, { status: 409 });
  }

  // Bekleyen başvuru var mı?
  const { data: pendingApp } = await supabase
    .from('ipo_applications')
    .select('id')
    .eq('guild_id', guildId)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingApp) {
    return NextResponse.json({ error: 'application_pending' }, { status: 409 });
  }

  // Sunucu istatistikleri snapshot
  const { count: memberCount } = await supabase
    .from('member_wallets')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', guildId);

  const { data: treasury } = await supabase
    .from('server_treasury')
    .select('balance')
    .eq('guild_id', guildId)
    .maybeSingle();

  const statsSnapshot = {
    member_count: memberCount ?? 0,
    treasury_balance: treasury?.balance ?? 0,
  };

  // Başvuruyu kaydet
  const { data: newApp, error: insertError } = await supabase
    .from('ipo_applications')
    .insert({
      guild_id: guildId,
      applicant_user_id: userId,
      proposed_price,
      proposed_founder_ratio,
      guild_stats_snapshot: statsSnapshot,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !newApp) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  // Bot API'ye bildirim gönder (arka planda, hata olursa uygulama durmasın)
  try {
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3000';
    const botApiKey = process.env.BOT_API_KEY;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (botApiKey) headers['Authorization'] = `Bearer ${botApiKey}`;

    await fetch(`${botApiUrl}/api/notify-ipo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        applicationId: newApp.id,
        guildId,
        guildName: server?.name ?? guildId,
        applicantUserId: userId,
        proposedPrice: proposed_price,
        proposedFounderRatio: proposed_founder_ratio,
        statsSnapshot,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Bot offline olsa bile başvuru kaydedildi
  }

  return NextResponse.json({ success: true, applicationId: newApp.id });
}
