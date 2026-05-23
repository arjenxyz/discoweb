import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import { redeemPromoCode, mapPromoErrorForClient } from '@/lib/promotions/redeemPromo';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value || process.env.DISCORD_GUILD_ID || '1465698764453838882';
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

/** @deprecated Prefer POST /api/member/promotion */
export async function POST(request: Request) {
  try {
    const maintenance = await checkMaintenance(['site', 'promotions']);
    if (maintenance.blocked) {
      return NextResponse.json(
        { error: 'maintenance', message: 'Promosyon sistemi şu an bakımda.' },
        { status: 503 },
      );
    }

    const session = await requireSessionUser(request);
    if (!session.ok) return session.response;

    const { code } = (await request.json()) as { code?: string };
    const supabase = getSupabase();
    const selectedGuildId = await getSelectedGuildId();

    const result = await redeemPromoCode({
      supabase,
      userId: session.userId,
      guildId: selectedGuildId,
      code: code ?? '',
      request,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: mapPromoErrorForClient(result.error), message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'promotion_applied',
      amount: result.amount,
      newBalance: result.balance,
    });
  } catch (error) {
    console.error('Promotion usage error:', error);
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}
