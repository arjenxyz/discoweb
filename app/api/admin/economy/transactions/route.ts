import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkMaintenance } from '@/lib/maintenance';
import { isAdminOrDeveloper, getSelectedGuildId } from '@/lib/adminAuth';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

// wallet_ledger "type" kolonu için geçerli değerler
const VALID_TYPES = [
  'earn_message', 'earn_voice', 'purchase', 'transfer_in', 'transfer_out',
  'transfer_tax', 'admin_adjust', 'refund', 'promotion',
];

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const maintenance = await checkMaintenance(['site']);
  if (maintenance.blocked) {
    return NextResponse.json({ error: 'maintenance', key: maintenance.key, reason: maintenance.reason }, { status: 503 });
  }

  if (!(await isAdminOrDeveloper())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const selectedGuildId = await getSelectedGuildId();
  const url = new URL(req.url);

  // Filtreler
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const ledgerType = url.searchParams.get('type') ?? '';
  const userId = url.searchParams.get('userId') ?? '';
  const dateFrom = url.searchParams.get('dateFrom') ?? '';
  const dateTo = url.searchParams.get('dateTo') ?? '';

  try {
    // wallet_ledger guild_id kullanır (server_id değil)
    let query = supabase
      .from('wallet_ledger')
      .select('*', { count: 'exact' })
      .eq('guild_id', selectedGuildId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (ledgerType && VALID_TYPES.includes(ledgerType)) {
      query = query.eq('type', ledgerType);
    }
    if (userId.trim()) {
      query = query.eq('user_id', userId.trim());
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom + 'T00:00:00Z');
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59Z');
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'query_failed', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({
      transactions: (data ?? []).map(t => ({
        id: t.id,
        userId: t.user_id,
        type: t.type,
        amount: Number(t.amount ?? 0),
        balanceAfter: t.balance_after != null ? Number(t.balance_after) : null,
        metadata: t.metadata ?? null,
        createdAt: t.created_at,
      })),
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    return NextResponse.json({ error: 'query_failed', detail: String(err) }, { status: 500 });
  }
}
