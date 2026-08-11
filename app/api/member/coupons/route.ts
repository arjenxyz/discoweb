import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';
import { resolveServer } from '@/lib/serverResolve';
import { checkMaintenance } from '@/lib/maintenance';

const getSupabase = (): SupabaseClient | null => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

export async function GET() {
  const maintenance = await checkMaintenance(['site', 'discounts', 'store']);
  if (maintenance.blocked) {
    return NextResponse.json(
      { error: 'maintenance', key: maintenance.key, reason: maintenance.reason },
      { status: 503 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const userId = await getSessionUserId();
  const resolved = await resolveServer(supabase, { requireSetup: true });

  if (!resolved) {
    return NextResponse.json([]);
  }

  const nowIso = new Date().toISOString();
  const { data: discounts, error: discountsError } = await supabase
    .from('store_discounts')
    .select('id,code,percent,max_uses,used_count,status,expires_at,is_welcome,is_special,per_user_limit')
    .eq('server_id', resolved.serverId)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (discountsError) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  let filtered = (discounts ?? []).filter(
    (d) => !d.max_uses || (d.used_count ?? 0) < d.max_uses,
  );

  const mapped = await Promise.all(
    filtered.map(async (d) => {
      let userUsageCount = 0;
      const perUserLimit = d.per_user_limit ?? 1;

      if (userId) {
        const { data: userUsages } = await supabase
          .from('discount_usages')
          .select('id')
          .eq('discount_id', d.id)
          .eq('user_id', userId);
        userUsageCount = userUsages?.length ?? 0;
      }

      return {
        id: d.id,
        code: d.code,
        percent: Number(d.percent),
        max_uses: d.max_uses ?? null,
        used_count: d.used_count ?? 0,
        userUsageCount,
        perUserLimit,
        expires_at: d.expires_at ?? null,
        is_welcome: d.is_welcome ?? false,
        is_special: d.is_special ?? false,
      };
    }),
  );

  return NextResponse.json(mapped.filter((d) => d.userUsageCount < d.perUserLimit));
}
