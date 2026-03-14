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

// Gini katsayısı hesapla (0 = mükemmel eşitlik, 1 = mükemmel eşitsizlik)
function calculateGini(values: number[]): number {
  const sorted = [...values].filter(v => v >= 0).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (2 * (i + 1) - n - 1) * sorted[i];
  }
  return weightedSum / (n * sum);
}

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
  const trendDays = Math.min(Number(url.searchParams.get('trendDays') ?? '7'), 90);

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const trendStart = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Paralel sorgular — wallet_ledger guild_id ve "type" kolonu kullanır
    const [
      { data: wallets },
      { data: dailyStats },
      { data: todayLedgerEarnings },
      { data: todayLedgerSpending },
      { data: weekActiveLedger },
      { data: trendLedger },
      { data: topWallets },
    ] = await Promise.all([
      // Tüm cüzdanlar (bakiye dağılımı + gini)
      supabase.from('member_wallets').select('balance,user_id').eq('guild_id', selectedGuildId),
      // Günlük istatistikler (trend)
      supabase.from('server_daily_stats')
        .select('stat_date,message_count,voice_minutes')
        .eq('guild_id', selectedGuildId)
        .gte('stat_date', trendStart)
        .order('stat_date', { ascending: true }),
      // Bugünkü kazançlar
      supabase.from('wallet_ledger')
        .select('amount')
        .eq('guild_id', selectedGuildId)
        .in('type', ['earn_message', 'earn_voice'])
        .gte('created_at', today + 'T00:00:00Z'),
      // Bugünkü harcamalar
      supabase.from('wallet_ledger')
        .select('amount')
        .eq('guild_id', selectedGuildId)
        .eq('type', 'purchase')
        .gte('created_at', today + 'T00:00:00Z'),
      // Son 7 günde aktif kullanıcılar
      supabase.from('wallet_ledger')
        .select('user_id')
        .eq('guild_id', selectedGuildId)
        .gte('created_at', weekAgo),
      // Trend verileri (ledger günlük aggregate)
      supabase.from('wallet_ledger')
        .select('type,amount,created_at')
        .eq('guild_id', selectedGuildId)
        .in('type', ['earn_message', 'earn_voice', 'purchase'])
        .gte('created_at', trendStart + 'T00:00:00Z'),
      // En zengin 10 kullanıcı
      supabase.from('member_wallets')
        .select('user_id,balance')
        .eq('guild_id', selectedGuildId)
        .order('balance', { ascending: false })
        .limit(10),
    ]);

    // Bakiye dağılımı hesapla
    const balances = (wallets ?? []).map(w => Number(w.balance ?? 0));
    const totalCirculation = balances.reduce((a, b) => a + b, 0);
    const totalWallets = balances.length;
    const avgBalance = totalWallets > 0 ? totalCirculation / totalWallets : 0;
    const gini = calculateGini(balances);

    // Bakiye histogram
    const distribution = [
      { range: '0-100', count: 0 },
      { range: '100-500', count: 0 },
      { range: '500-1K', count: 0 },
      { range: '1K-5K', count: 0 },
      { range: '5K-10K', count: 0 },
      { range: '10K+', count: 0 },
    ];
    for (const b of balances) {
      if (b < 100) distribution[0].count++;
      else if (b < 500) distribution[1].count++;
      else if (b < 1000) distribution[2].count++;
      else if (b < 5000) distribution[3].count++;
      else if (b < 10000) distribution[4].count++;
      else distribution[5].count++;
    }

    // Bugünkü kazanç/harcama
    const todayEarnings = (todayLedgerEarnings ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount ?? 0)), 0);
    const todaySpending = (todayLedgerSpending ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount ?? 0)), 0);

    // Aktif katılımcı oranı
    const activeUsers = new Set((weekActiveLedger ?? []).map((r: any) => r.user_id));
    const participationRate = totalWallets > 0 ? (activeUsers.size / totalWallets) * 100 : 0;

    // Günlük kazanç/harcama oranı
    const earningsByDay: Record<string, number> = {};
    const spendingByDay: Record<string, number> = {};
    for (const entry of trendLedger ?? []) {
      const day = (entry.created_at as string).split('T')[0];
      const amt = Math.abs(Number(entry.amount ?? 0));
      if (entry.type === 'purchase') {
        spendingByDay[day] = (spendingByDay[day] ?? 0) + amt;
      } else {
        earningsByDay[day] = (earningsByDay[day] ?? 0) + amt;
      }
    }

    // Trend data — günlük kazanç vs harcama
    const allDays = new Set([...Object.keys(earningsByDay), ...Object.keys(spendingByDay)]);
    // Eksik günleri doldur
    for (let d = new Date(trendStart); d <= now; d.setDate(d.getDate() + 1)) {
      allDays.add(d.toISOString().split('T')[0]);
    }
    const trend = [...allDays].sort().map(day => ({
      date: day,
      earnings: Math.round((earningsByDay[day] ?? 0) * 100) / 100,
      spending: Math.round((spendingByDay[day] ?? 0) * 100) / 100,
    }));

    // Günlük oran
    const totalTrendEarnings = Object.values(earningsByDay).reduce((a, b) => a + b, 0);
    const totalTrendSpending = Object.values(spendingByDay).reduce((a, b) => a + b, 0);
    const earningSpendingRatio = totalTrendSpending > 0 ? totalTrendEarnings / totalTrendSpending : null;

    // Enflasyon tahmini: trendDays içindeki net papel değişimi
    let inflationRate: number | null = null;
    const netTrendChange = totalTrendEarnings - totalTrendSpending;
    const trendStartCirculation = totalCirculation - netTrendChange;
    if (trendStartCirculation > 0) {
      inflationRate = (netTrendChange / trendStartCirculation) * 100;
    }

    return NextResponse.json({
      totalCirculation: Math.round(totalCirculation * 100) / 100,
      totalWallets,
      avgBalance: Math.round(avgBalance * 100) / 100,
      gini: Math.round(gini * 1000) / 1000,
      todayEarnings: Math.round(todayEarnings * 100) / 100,
      todaySpending: Math.round(todaySpending * 100) / 100,
      distribution,
      topWallets: (topWallets ?? []).map(w => ({
        userId: w.user_id,
        balance: Math.round(Number(w.balance ?? 0) * 100) / 100,
      })),
      trend,
      inflationRate: inflationRate != null ? Math.round(inflationRate * 100) / 100 : null,
      participationRate: Math.round(participationRate * 100) / 100,
      earningSpendingRatio: earningSpendingRatio != null ? Math.round(earningSpendingRatio * 100) / 100 : null,
      trendDays,
    });
  } catch (err) {
    return NextResponse.json({ error: 'query_failed', detail: String(err) }, { status: 500 });
  }
}
