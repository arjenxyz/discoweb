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
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && request.headers.get('x-internal-secret') === internalSecret) return true;
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

// ---------- Teknik analiz yardımcıları ----------
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  const start = prices.length - period;
  for (let i = start; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateDailyVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

// ---------- Deterministik yedek plan (AI başarısız olursa) ----------
function generateFallbackPlan(
  sentimentRatio: number,
  volatility: number,
  dayOfWeek: number,
  activeEventsImpact: number,
): { reasoning: string; mood: string; schedule: Array<{ hour: number; price_impact: number; title: string; description: string }> } {
  const mood =
    sentimentRatio > 0.6 ? 'bullish' : sentimentRatio < 0.4 ? 'bearish' : 'stable';
  const baseImpact = (sentimentRatio - 0.5) * 0.2;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const schedule = Array.from({ length: 24 }, (_, hour) => {
    let price_impact = 0;
    if (hour === 9) price_impact = baseImpact * 0.5;
    else if (hour === 10) price_impact = baseImpact * 0.3;
    else if (hour === 17) price_impact = baseImpact * 0.4;
    else if (hour === 18) price_impact = baseImpact * 0.2;

    if (volatility > 0.03 && (hour === 14 || hour === 15)) {
      price_impact += activeEventsImpact * 0.3;
    }
    if (isWeekend) price_impact *= 0.5;
    price_impact = Math.min(0.15, Math.max(-0.15, price_impact));

    const title = price_impact !== 0 ? (price_impact > 0 ? '📈 Piyasa hareketi' : '📉 Piyasa düzeltmesi') : '';
    const description = price_impact !== 0 ? `Otomatik plan: ${price_impact > 0 ? 'yükseliş' : 'düşüş'} eğilimi.` : '';
    return { hour, price_impact, title, description };
  });

  return { reasoning: 'AI plan oluşturulamadı, deterministik yedek plan kullanıldı.', mood, schedule };
}

const MOODS = ['bullish', 'bearish', 'volatile', 'stable'] as const;
const CATALYSTS = ['earnings_season', 'rumor', 'technical_correction', 'whale_move', 'quiet_day', 'fomo_wave', 'profit_taking'] as const;
const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const SYSTEM_PROMPT = `Sen DiscoWeb borsa sisteminin AI piyasa yapıcısısın. Bir sunucu için bugünün saat saat fiyat hareket planını oluşturuyorsun.

SADECE TÜRKÇE kullan. Başka dil kesinlikle yasak.

price_impact KURALLARI (ÇOK ÖNEMLİ):
- price_impact DEĞERLERİ ONDALIK sayı olmalı. YÜZDE değil, ONDALIK!
- +%5 etkisi için 0.05 yaz (5 YAZMA)
- -%8 etkisi için -0.08 yaz (-8 YAZMA)
- +%10 etkisi için 0.10 yaz (10 YAZMA)
- Maksimum değer: 0.15 (yani +%15). Daha büyük değer YASAK.
- Minimum değer: -0.15 (yani -%15). Daha küçük değer YASAK.
- Nötr saatler için tam olarak 0 yaz.
- Gün boyunca tüm price_impact değerlerinin toplamı -0.20 ile +0.20 arasında olmalı.

Teknik göstergeler:
- RSI > 70 → aşırı alım → düzeltme ihtimali yüksek
- RSI < 30 → aşırı satım → toparlanma ihtimali yüksek
- Fiyat SMA20 üzerinde → kısa vadeli yükseliş trendi
- Volatilite yüksekse daha büyük hamleler, düşükse sakin seyir

Diğer kurallar:
- Saatlerin yaklaşık %60'ı nötr (price_impact: 0, title ve description boş string "")
- Saat 9-10: açılış aktif
- Saat 12-14: öğlen sakinliği
- Saat 17-20: kapanış hareketliliği
- Aktif market event varsa etkisini plana yansıt
- Emir defterinde alım baskısı (sentiment_ratio > 0.5) varsa yükseliş eğilimi
- Piyasa ruh haline (mood) ve katalizöre (catalyst) uygun Türkçe içerik üret

JSON formatı (başka hiçbir şey yazma):
{
  "reasoning": "Bugünkü piyasa stratejisi (2-3 cümle, SADECE Türkçe)",
  "mood": "bullish|bearish|volatile|stable",
  "schedule": [
    {"hour": 0, "price_impact": 0, "title": "", "description": ""},
    {"hour": 1, "price_impact": 0, "title": "", "description": ""},
    {"hour": 2, "price_impact": 0, "title": "", "description": ""},
    {"hour": 3, "price_impact": 0, "title": "", "description": ""},
    {"hour": 4, "price_impact": 0, "title": "", "description": ""},
    {"hour": 5, "price_impact": 0, "title": "", "description": ""},
    {"hour": 6, "price_impact": 0, "title": "", "description": ""},
    {"hour": 7, "price_impact": 0, "title": "", "description": ""},
    {"hour": 8, "price_impact": 0, "title": "", "description": ""},
    {"hour": 9, "price_impact": 0.05, "title": "Örnek Başlık", "description": "Örnek açıklama"},
    {"hour": 10, "price_impact": 0, "title": "", "description": ""},
    {"hour": 11, "price_impact": 0, "title": "", "description": ""},
    {"hour": 12, "price_impact": 0, "title": "", "description": ""},
    {"hour": 13, "price_impact": 0, "title": "", "description": ""},
    {"hour": 14, "price_impact": -0.03, "title": "Örnek Başlık", "description": "Örnek açıklama"},
    {"hour": 15, "price_impact": 0, "title": "", "description": ""},
    {"hour": 16, "price_impact": 0, "title": "", "description": ""},
    {"hour": 17, "price_impact": 0.04, "title": "Örnek Başlık", "description": "Örnek açıklama"},
    {"hour": 18, "price_impact": 0, "title": "", "description": ""},
    {"hour": 19, "price_impact": 0, "title": "", "description": ""},
    {"hour": 20, "price_impact": 0, "title": "", "description": ""},
    {"hour": 21, "price_impact": 0, "title": "", "description": ""},
    {"hour": 22, "price_impact": 0, "title": "", "description": ""},
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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'missing_groq_key' }, { status: 500 });

    const body = await request.json() as {
      guildId: string;
      force?: boolean;
      custom_context?: string | null;
      override_model?: string | null;
    };
    const { guildId, force = false, custom_context = null, override_model = null } = body;
    if (!guildId) return NextResponse.json({ error: 'missing_guild_id' }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayName = DAY_NAMES[dayOfWeek];

    // Plan cache kontrolü
    if (!force) {
      const { data: existing } = await supabase
        .from('market_daily_plans')
        .select('*')
        .eq('guild_id', guildId)
        .eq('plan_date', today)
        .maybeSingle();
      if (existing) return NextResponse.json({ plan: existing, cached: true });
    }

    // ---------- Piyasa verisi çek ----------
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
      { data: priceHistoryTrades }, // teknik analiz için son 30 gün
      { data: openOrders },
      { data: server },
      { count: investorCount },
      { data: activityStats },
    ] = await Promise.all([
      supabase.from('server_listings').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_treasury').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_penalties').select('type,reason,issued_at').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('server_penalties').select('type,issued_at').eq('guild_id', guildId).gte('issued_at', thirtyDaysAgo),
      supabase.from('market_events').select('type,title,price_impact,expires_at').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('market_trades').select('lot_count,price_per_lot,traded_at').eq('guild_id', guildId).order('traded_at', { ascending: false }).limit(10),
      supabase.from('market_trades').select('lot_count,price_per_lot,traded_at').eq('guild_id', guildId).gte('traded_at', sevenDaysAgo),
      supabase.from('market_trades').select('price_per_lot,traded_at').eq('guild_id', guildId).order('traded_at', { ascending: true }).gte('traded_at', thirtyDaysAgo).limit(200),
      supabase.from('market_orders').select('type,lot_count,price_per_lot').eq('guild_id', guildId).eq('status', 'open'),
      supabase.from('servers').select('economy_tier,burn_rate,treasury_rate,papel_value_multiplier,earn_multiplier_override').eq('discord_id', guildId).maybeSingle(),
      supabase.from('investor_holdings').select('*', { count: 'exact', head: true }).eq('guild_id', guildId).gt('lot_count', 0),
      supabase.from('server_overview_stats').select('total_messages,total_voice_minutes,active_members').eq('guild_id', guildId).maybeSingle(),
    ]);

    // ---------- Teknik analiz ----------
    const prices = (priceHistoryTrades ?? []).map(t => t.price_per_lot as number);
    const currentPrice = prices.at(-1) ?? (listing?.market_price as number | null) ?? 100;
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const rsi = calculateRSI(prices, 14);
    const volatility = calculateDailyVolatility(prices);

    // ---------- Emir defteri analizi ----------
    const buyOrders = (openOrders ?? []).filter(o => o.type === 'buy');
    const sellOrders = (openOrders ?? []).filter(o => o.type === 'sell');
    const buyVolume = buyOrders.reduce((acc, o) => acc + (o.lot_count as number) * (o.price_per_lot as number), 0);
    const sellVolume = sellOrders.reduce((acc, o) => acc + (o.lot_count as number) * (o.price_per_lot as number), 0);
    const totalOrderVolume = buyVolume + sellVolume;
    const sentimentRatio = totalOrderVolume > 0 ? buyVolume / totalOrderVolume : 0.5;

    // ---------- Hacim özeti ----------
    const weeklyVolume = (weeklyTrades ?? []).reduce((acc, t) => acc + (t.lot_count as number) * (t.price_per_lot as number), 0);
    const dailyAvgVolume = weeklyVolume / 7;

    // ---------- Aktif event etkisi ----------
    const activeEventsImpact = (activeEvents ?? []).reduce((acc, e) => acc + ((e.price_impact as number) ?? 0), 0);

    // ---------- Rastgelelik katmanı ----------
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const catalyst = CATALYSTS[Math.floor(Math.random() * CATALYSTS.length)];

    const marketData = {
      guild_id: guildId,
      server,
      listing: { ...listing, current_price: currentPrice },
      treasury,
      active_penalties: activePenalties ?? [],
      recent_penalties_30d: (recentPenalties ?? []).length,
      active_events: activeEvents ?? [],
      recent_trades: recentTrades ?? [],
      weekly_avg_daily_volume: Math.round(dailyAvgVolume),
      investor_count: investorCount ?? 0,
      order_book: {
        buy_orders: buyOrders.length,
        sell_orders: sellOrders.length,
        buy_volume: Math.round(buyVolume),
        sell_volume: Math.round(sellVolume),
        order_imbalance: Math.round(buyVolume - sellVolume),
        sentiment_ratio: sentimentRatio.toFixed(2),
      },
      technicals: {
        current_price: currentPrice,
        sma20: sma20 !== null ? parseFloat(sma20.toFixed(2)) : null,
        sma50: sma50 !== null ? parseFloat(sma50.toFixed(2)) : null,
        rsi: rsi !== null ? parseFloat(rsi.toFixed(1)) : null,
        daily_volatility: parseFloat(volatility.toFixed(4)),
      },
      activity_stats: activityStats ?? { total_messages: 0, total_voice_minutes: 0, active_members: 0 },
    };

    const randomContext = {
      mood: randomMood,
      catalyst,
      volatility_level: Math.min(1, volatility * 20).toFixed(2),
      day_of_week: dayName,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
    };

    // ---------- AI çağrısı ----------
    const groq = new Groq({ apiKey });
    let aiResult: { reasoning: string; mood: string; schedule: Array<{ hour: number; price_impact: number; title: string; description: string }> };
    let fallbackUsed = false;

    try {
      const completion = await groq.chat.completions.create({
        model: override_model ?? 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Sunucu verileri:\n${JSON.stringify(marketData, null, 2)}\n\nRastgele piyasa bağlamı:\n${JSON.stringify(randomContext, null, 2)}\n\nEk not: ${custom_context ?? 'Yok'}\n\nBugün (${today}, ${dayName}) için saat saat plan oluştur.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });
      aiResult = JSON.parse(completion.choices[0].message.content ?? '{}') as typeof aiResult;
    } catch (e) {
      console.error('AI hatası, yedek plan kullanılıyor:', e);
      fallbackUsed = true;
      aiResult = generateFallbackPlan(sentimentRatio, volatility, dayOfWeek, activeEventsImpact);
    }

    // ---------- Çıktı normalize + doğrulama ----------
    const rawSchedule = aiResult.schedule ?? [];
    const validatedSchedule = Array.from({ length: 24 }, (_, hour) => {
      const entry = rawSchedule.find(s => s.hour === hour);
      const price_impact = Math.min(0.15, Math.max(-0.15, entry?.price_impact ?? 0));
      // price_impact sıfırsa title/description'ı da temizle
      if (price_impact === 0) {
        return { hour, price_impact: 0, title: '', description: '', executed: false };
      }
      return { hour, price_impact, title: entry?.title ?? '', description: entry?.description ?? '', executed: false };
    });

    // Toplam impact ±0.20 sınırını aştıysa orantılı ölçekle
    const totalImpact = validatedSchedule.reduce((sum, h) => sum + h.price_impact, 0);
    if (Math.abs(totalImpact) > 0.20) {
      const scale = 0.20 / Math.abs(totalImpact);
      for (const h of validatedSchedule) {
        h.price_impact = parseFloat((h.price_impact * scale).toFixed(4));
      }
    }

    const finalMood = (MOODS as readonly string[]).includes(aiResult.mood) ? aiResult.mood : randomMood;

    // upsert — force=true olsa bile race condition yok
    const { data: plan, error: upsertError } = await supabase
      .from('market_daily_plans')
      .upsert(
        {
          guild_id: guildId,
          plan_date: today,
          hourly_schedule: validatedSchedule,
          ai_reasoning: aiResult.reasoning ?? (fallbackUsed ? 'Yedek plan kullanıldı.' : ''),
          mood: finalMood,
        },
        { onConflict: 'guild_id,plan_date' },
      )
      .select()
      .single();

    if (upsertError) {
      console.error('DB upsert hatası:', upsertError);
      return NextResponse.json({ error: 'db_upsert_failed', detail: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ plan, cached: false, fallback: fallbackUsed });
  } catch (error) {
    console.error('ai-daily-plan error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// GET: Bugünün planını + canlı piyasa özetini döndür
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

    const [{ data: plan }, { data: listing }, { data: lastTrade }] = await Promise.all([
      supabase.from('market_daily_plans').select('*').eq('guild_id', guildId).eq('plan_date', today).maybeSingle(),
      supabase.from('server_listings').select('market_price, ipo_price').eq('guild_id', guildId).maybeSingle(),
      supabase.from('market_trades').select('price_per_lot,lot_count,traded_at').eq('guild_id', guildId).order('traded_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    return NextResponse.json({
      plan: plan ?? null,
      live: {
        market_price: listing?.market_price ?? null,
        ipo_price: listing?.ipo_price ?? null,
        last_trade: lastTrade ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
