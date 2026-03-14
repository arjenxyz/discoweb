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
  const simulationDays = Math.min(Math.max(1, Number(url.searchParams.get('days') ?? '30')), 365);

  try {
    // Server config (kazanç oranları) — kolon adları: earn_per_message, earn_per_voice_minute
    const { data: serverRow } = await supabase
      .from('servers')
      .select('id,earn_per_message,earn_per_voice_minute,tag_bonus_message,tag_bonus_voice,booster_bonus_message,booster_bonus_voice,transfer_tax_rate,transfer_daily_limit')
      .eq('discord_id', selectedGuildId)
      .maybeSingle();

    if (!serverRow) {
      return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
    }

    const earnPerMessage = Number(serverRow.earn_per_message ?? 0.2);
    const earnPerVoice = Number(serverRow.earn_per_voice_minute ?? 0.2);

    // Son 14 günün günlük ortalamaları
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      { data: dailyStats },
      { data: dailySpending },
      { data: wallets },
      { count: tagCount },
      { count: boosterCount },
    ] = await Promise.all([
      supabase.from('server_daily_stats')
        .select('message_count,voice_minutes')
        .eq('guild_id', selectedGuildId)
        .gte('stat_date', fourteenDaysAgo),
      // wallet_ledger guild_id ve "type" kolonu kullanır
      supabase.from('wallet_ledger')
        .select('amount,created_at')
        .eq('guild_id', selectedGuildId)
        .eq('type', 'purchase')
        .gte('created_at', fourteenDaysAgo + 'T00:00:00Z'),
      supabase.from('member_wallets')
        .select('balance')
        .eq('guild_id', selectedGuildId),
      supabase.from('member_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('guild_id', selectedGuildId)
        .eq('has_tag', true),
      supabase.from('member_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('guild_id', selectedGuildId)
        .eq('is_booster', true),
    ]);

    // Günlük ortalama mesaj/ses
    const statsCount = (dailyStats ?? []).length || 1;
    const totalMessages = (dailyStats ?? []).reduce((s, r) => s + Number(r.message_count ?? 0), 0);
    const totalVoice = (dailyStats ?? []).reduce((s, r) => s + Number(r.voice_minutes ?? 0), 0);
    const avgDailyMessages = totalMessages / statsCount;
    const avgDailyVoice = totalVoice / statsCount;

    // Günlük ortalama harcama
    const spendingByDay: Record<string, number> = {};
    for (const entry of dailySpending ?? []) {
      const day = (entry.created_at as string).split('T')[0];
      spendingByDay[day] = (spendingByDay[day] ?? 0) + Math.abs(Number(entry.amount ?? 0));
    }
    const spendingDays = Object.keys(spendingByDay).length || 1;
    const totalSpendingAmount = Object.values(spendingByDay).reduce((a, b) => a + b, 0);
    const avgDailySpending = totalSpendingAmount / spendingDays;

    // Simülasyon hesapla
    const dailyMessageEarnings = avgDailyMessages * earnPerMessage;
    const dailyVoiceEarnings = avgDailyVoice * earnPerVoice;
    const dailyTotalEarnings = dailyMessageEarnings + dailyVoiceEarnings;

    const projectedEarnings = dailyTotalEarnings * simulationDays;
    const projectedSpending = avgDailySpending * simulationDays;
    const netChange = projectedEarnings - projectedSpending;

    const currentCirculation = (wallets ?? []).reduce((s, w) => s + Number(w.balance ?? 0), 0);
    const projectedCirculation = currentCirculation + netChange;

    // Öneriler oluştur
    const recommendations: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = [];

    // Enflasyon kontrolü
    if (netChange > 0 && currentCirculation > 0) {
      const projectedInflation = (netChange / currentCirculation) * 100;
      if (projectedInflation > 50) {
        recommendations.push({
          type: 'warning',
          message: `${simulationDays} günde tahmini %${Math.round(projectedInflation)} enflasyon bekleniyor. Kazanç oranlarını düşürmeyi veya yeni mağaza ürünleri eklemeyi düşünün.`,
        });
      } else if (projectedInflation > 20) {
        recommendations.push({
          type: 'info',
          message: `${simulationDays} günde tahmini %${Math.round(projectedInflation)} enflasyon bekleniyor. Ekonomiyi yakından takip edin.`,
        });
      } else {
        recommendations.push({
          type: 'success',
          message: `Enflasyon oranı kontrol altında (%${Math.round(projectedInflation)}).`,
        });
      }
    }

    // Aktivite kontrolü
    if (avgDailyMessages < 50) {
      recommendations.push({
        type: 'warning',
        message: 'Günlük mesaj aktivitesi düşük. Bonus oranlarını artırmayı veya etkinlikler düzenlemeyi düşünün.',
      });
    }

    // Harcama kontrolü
    if (avgDailySpending === 0) {
      recommendations.push({
        type: 'warning',
        message: 'Mağazada hiç harcama yapılmıyor. Cazip ürünler ekleyerek papel dolaşımını artırabilirsiniz.',
      });
    } else if (dailyTotalEarnings > 0 && avgDailySpending / dailyTotalEarnings < 0.3) {
      recommendations.push({
        type: 'info',
        message: 'Harcama/kazanç oranı düşük. Daha fazla mağaza ürünü ekleyerek ekonomiyi dengeleyebilirsiniz.',
      });
    }

    // Bakiye eşitsizliği
    const balances = (wallets ?? []).map(w => Number(w.balance ?? 0));
    if (balances.length > 5) {
      const sorted = [...balances].sort((a, b) => b - a);
      const top10Pct = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.1)));
      const top10Sum = top10Pct.reduce((a, b) => a + b, 0);
      if (currentCirculation > 0 && top10Sum / currentCirculation > 0.7) {
        recommendations.push({
          type: 'warning',
          message: 'Papel\'in %70\'inden fazlası en zengin %10\'da. Transfer limitini artırmayı veya yeni başlayanlara bonus vermeyi düşünün.',
        });
      }
    }

    return NextResponse.json({
      currentState: {
        circulation: Math.round(currentCirculation * 100) / 100,
        walletCount: balances.length,
        earnPerMessage,
        earnPerVoice,
        tagCount: tagCount ?? 0,
        boosterCount: boosterCount ?? 0,
        transferTaxRate: Number(serverRow.transfer_tax_rate ?? 0),
        transferDailyLimit: Number(serverRow.transfer_daily_limit ?? 0),
      },
      averages: {
        dailyMessages: Math.round(avgDailyMessages),
        dailyVoiceMinutes: Math.round(avgDailyVoice),
        dailyEarnings: Math.round(dailyTotalEarnings * 100) / 100,
        dailySpending: Math.round(avgDailySpending * 100) / 100,
      },
      simulation: {
        days: simulationDays,
        projectedEarnings: Math.round(projectedEarnings * 100) / 100,
        projectedSpending: Math.round(projectedSpending * 100) / 100,
        netChange: Math.round(netChange * 100) / 100,
        projectedCirculation: Math.round(projectedCirculation * 100) / 100,
      },
      recommendations,
    });
  } catch (err) {
    return NextResponse.json({ error: 'query_failed', detail: String(err) }, { status: 500 });
  }
}
