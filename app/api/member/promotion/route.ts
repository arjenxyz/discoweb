import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { checkMaintenance } from '@/lib/maintenance';
import { getSessionUserId } from '@/lib/auth';
import { redeemPromoCode } from '@/lib/promotions/redeemPromo';

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
  const maintenance = await checkMaintenance(['site', 'promotions']);
  if (maintenance.blocked) {
    return NextResponse.json(
      { error: 'maintenance', message: 'Promosyon sistemi şu an bakımda.', key: maintenance.key, reason: maintenance.reason },
      { status: 503 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role', message: 'Sunucu yapılandırması eksik.' }, { status: 500 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized', message: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
  }

  const payload = (await request.json()) as { code?: string };
  const selectedGuildId = await getSelectedGuildId();

  const result = await redeemPromoCode({
    supabase,
    userId,
    guildId: selectedGuildId,
    code: payload.code ?? '',
    request,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({
    code: result.code,
    amount: result.amount,
    balance: result.balance,
    message: result.message,
  });
}
