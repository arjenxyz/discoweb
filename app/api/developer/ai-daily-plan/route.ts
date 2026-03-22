import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { requireSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_DEVELOPER_GUILD_ID = '1465698764453838882';
const DEFAULT_DEVELOPER_ROLE_ID = '1467580199481639013';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

async function checkAccess(request: NextRequest): Promise<boolean> {
  // Bot internal call via secret header
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && request.headers.get('x-internal-secret') === internalSecret) {
    return true;
  }
  // Developer session call
  const auth = await requireSessionUser(request);
  if (!auth.ok) return false;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;
  const roleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
  const guildId = process.env.DEVELOPER_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;
  const res = await fetch(`https://discord.com/api/guilds/${guildId}/members/${auth.userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) return false;
  const member = (await res.json()) as { roles: string[] };
  return member.roles.includes(roleId);
}

const MOODS = ['bullish', 'bearish', 'volatile', 'stable'] as const;
const CATALYSTS = ['earnings_season', 'rumor', 'technical_correction', 'whale_move', 'quiet_day', 'fomo_wave', 'profit_taking'] as const;
const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const SYSTEM_PROMPT = `Sen DiscoWeb borsa sisteminin AI piyasa yapıcısısın. Bir sunucu için bugünün saat saat fiyat hareket planını oluşturuyorsun.

Kurallar:
- Gün boyunca toplam fiyat etkisi -20% ile +20% arasında olmalı
- Saatlerin yaklaşık %55-65'i nötr olabilir (price_impact: 0, title ve description boş string)
- Saat 9-10: açılış genellikle aktif (boğa/ayı yönünde açılış)
- Saat 12-14: öğlen sakinliği veya ani hareket
- Saat 17-20: kapanış hareketliliği
- Dramatik hareketler (>%10) için mutlaka açıklama yaz
- Piyasa ruh haline (mood) ve katalizöre (catalyst) uygun içerik üret
- Başlıklar ve açıklamalar Türkçe olmalı

JSON formatı (başka hiçbir şey yazma):
{
  "reasoning": "Bugünkü piyasa stratejisi (2-3 cümle Türkçe)",
  "mood": "bullish|bearish|volatile|stable",
  "schedule": [
    {"hour": 0, "price_impact": 0, "title": "", "description": ""},
    {"hour": 1, "price_impact": 0, "title": "", "description": ""},
    ...tüm 24 saat için...
    {"hour": 23, "price_impact": 0, "title": "", "description": ""}
  ]
}

schedule dizisi tam olarak 24 eleman içermeli (hour: 0'dan 23'e).`;

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await checkAccess(request);
    if (!hasAccess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const body = await request.json();
    const { guildId } = body;
    if (!guildId) return NextResponse.json({ error: 'missing_guild_id' }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'missing_groq_key' }, { status: 500 });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Idempotent: eğer bugün için plan zaten varsa döndür
    const { data: existing } = await supabase
      .from('market_daily_plans')
      .select('*')
      .eq('guild_id', guildId)
      .eq('plan_date', today)
      .maybeSingle();
    if (existing) return NextResponse.json({ plan: existing, cached: true });

    // Supabase'den kapsamlı piyasa verisi çek
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: listing },
      { data: treasury },
      { data: activePenalties },
      { data: recentPenalties },
      { data: activeEvents },
      { data: recentTrades },
      { data: weeklyTrades },
      { data: server },
      { count: investorCount },
      { count: buyOrders },
      { count: sellOrders },
      { data: activityStats },
    ] = await Promise.all([
      supabase.from('server_listings').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_treasury').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_penalties').select('type,reason,issued_at').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('server_penalties').select('type,issued_at').eq('guild_id', guildId).gte('issued_at', thirtyDaysAgo),
      supabase.from('market_events').select('type,title,price_impact,expires_at').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('market_trades').select('lot_count,price_per_lot,traded_at').eq('guild_id', guildId).order('traded_at', { ascending: false }).limit(10),
      supabase.from('market_trades').select('lot_count,price_per_lot,traded_at').eq('guild_id', guildId).gte('traded_at', sevenDaysAgo),
      supabase.from('servers').select('economy_tier,burn_rate,treasury_rate,papel_value_multiplier,earn_multiplier_override').eq('discord_id', guildId).maybeSingle(),
      supabase.from('investor_holdings').select('*', { count: 'exact', head: true }).eq('guild_id', guildId).gt('lot_count', 0),
      supabase.from('market_orders').select('*', { count: 'exact', head: true }).eq('guild_id', guildId).eq('type', 'buy').eq('status', 'open'),
      supabase.from('market_orders').select('*', { count: 'exact', head: true }).eq('guild_id', guildId).eq('type', 'sell').eq('status', 'open'),
      supabase.from('server_overview_stats').select('total_messages,total_voice_minutes,active_members').eq('guild_id', guildId).maybeSingle(),
    ]);

    // 7 günlük hacim özeti
    const weeklyVolume = (weeklyTrades ?? []).reduce((acc, t) => acc + (t.lot_count ?? 0) * (t.price_per_lot ?? 0), 0);
    const dailyAvgVolume = weeklyVolume / 7;

    // Piyasa duyarlılığı
    const buyOrderCount = buyOrders ?? 0;
    const sellOrderCount = sellOrders ?? 0;
    const totalOrders = buyOrderCount + sellOrderCount;
    const sentimentRatio = totalOrders > 0 ? buyOrderCount / totalOrders : 0.5; // >0.5 = alım baskısı

    // Rastgelelik katmanı (%50)
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const catalyst = CATALYSTS[Math.floor(Math.random() * CATALYSTS.length)];
    const volatilityLevel = Math.random(); // 0-1
    const dayOfWeek = now.getDay();
    const dayName = DAY_NAMES[dayOfWeek];

    const marketData = {
      guild_id: guildId,
      server,
      listing,
      treasury,
      active_penalties: activePenalties ?? [],
      recent_penalties_30d: (recentPenalties ?? []).length,
      active_events: activeEvents ?? [],
      recent_trades: recentTrades ?? [],
      weekly_avg_daily_volume: Math.round(dailyAvgVolume),
      investor_count: investorCount ?? 0,
      open_buy_orders: buyOrderCount,
      open_sell_orders: sellOrderCount,
      sentiment_ratio: sentimentRatio.toFixed(2),
      activity_stats: activityStats,
    };

    const randomContext = {
      mood: randomMood,
      catalyst,
      volatility_level: volatilityLevel.toFixed(2),
      day_of_week: dayName,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
    };

    const groq = new Groq({ apiKey });

    let aiResult: { reasoning: string; mood: string; schedule: Array<{ hour: number; price_impact: number; title: string; description: string }> };
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Sunucu verileri:\n${JSON.stringify(marketData, null, 2)}\n\nRastgele piyasa bağlamı:\n${JSON.stringify(randomContext, null, 2)}\n\nBugün (${today}, ${dayName}) için saat saat plan oluştur.` },
        ],
      });
      aiResult = JSON.parse(completion.choices[0].message.content ?? '{}');
    } catch (e) {
      return NextResponse.json({ error: 'ai_failed', detail: String(e) }, { status: 500 });
    }

    // schedule'ı 24 saatlik tam diziye normalize et
    const fullSchedule = Array.from({ length: 24 }, (_, h) => {
      const entry = (aiResult.schedule ?? []).find((s) => s.hour === h);
      return { hour: h, price_impact: entry?.price_impact ?? 0, title: entry?.title ?? '', description: entry?.description ?? '', executed: false };
    });

    const { data: plan, error: insertError } = await supabase
      .from('market_daily_plans')
      .insert({
        guild_id: guildId,
        plan_date: today,
        hourly_schedule: fullSchedule,
        ai_reasoning: aiResult.reasoning,
        mood: aiResult.mood ?? randomMood,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: 'db_insert_failed', detail: insertError.message }, { status: 500 });

    return NextResponse.json({ plan, cached: false });
  } catch (error) {
    console.error('ai-daily-plan error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// GET: Bugünün mevcut planını döndür
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await checkAccess(request);
    if (!hasAccess) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    if (!guildId) return NextResponse.json({ error: 'missing_guild_id' }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const { data: plan } = await supabase
      .from('market_daily_plans')
      .select('*')
      .eq('guild_id', guildId)
      .eq('plan_date', today)
      .maybeSingle();

    return NextResponse.json({ plan: plan ?? null });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
