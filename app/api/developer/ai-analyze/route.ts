import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

async function checkDeveloperAccess(request: NextRequest) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) return { ok: false as const, response: auth.response };

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return { ok: false as const, response: NextResponse.json({ error: 'server_error' }, { status: 500 }) };

  const developerRoleId = process.env.DEVELOPER_ROLE_ID ?? DEFAULT_DEVELOPER_ROLE_ID;
  const developerGuildId = process.env.DEVELOPER_GUILD_ID ?? DEFAULT_DEVELOPER_GUILD_ID;

  const developerResponse = await fetch(
    `https://discord.com/api/guilds/${developerGuildId}/members/${auth.userId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );

  if (!developerResponse.ok) return { ok: false as const, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };

  const developerMember = (await developerResponse.json()) as { roles: string[] };
  if (!developerMember.roles.includes(developerRoleId)) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { ok: true as const };
}

const SYSTEM_PROMPT = `Sen DiscoWeb borsa sisteminin yapay zeka danışmanısın. Developer'a sunucu ekonomisi hakkında analiz ve öneriler sunuyorsun.

Mevcut aksiyonlar:
- market_event: {type: 'news'|'price_adjustment'|'freeze'|'unfreeze', title, description, price_impact (ör: 0.1 = +%10, -0.15 = -%15), expires_at, guild_id}
- market_penalty: {guild_id, type: 'warning'|'fine'|'suspension'|'delist', reason, fine_amount (optional)}
- listing_update: {guild_id, market_price (optional), status (optional: 'approved'|'suspended'), circuit_breaker_until (optional ISO string)}

Yanıtını SADECE şu JSON formatında ver (başka hiçbir metin ekleme):
{
  "analysis": "Türkçe serbest metin analiz (2-4 paragraf)",
  "suggested_actions": [
    {
      "type": "market_event" | "market_penalty" | "listing_update",
      "label": "Kullanıcıya gösterilecek Türkçe açıklama",
      "payload": { ...ilgili API body }
    }
  ]
}

suggested_actions boş array olabilir. Max 3 öneri sun.`;

export async function POST(request: NextRequest) {
  try {
    const access = await checkDeveloperAccess(request);
    if (!access.ok) return access.response;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

    const body = await request.json();
    const { guildId, prompt } = body;
    if (!guildId || !prompt) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'missing_gemini_key' }, { status: 500 });

    const [
      { data: listing },
      { data: treasury },
      { data: penalties },
      { data: events },
      { data: recentTrades },
      { data: openOrders },
      { data: server },
      { data: holdingsCount },
    ] = await Promise.all([
      supabase.from('server_listings').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_treasury').select('*').eq('guild_id', guildId).maybeSingle(),
      supabase.from('server_penalties').select('*').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('market_events').select('*').eq('guild_id', guildId).eq('is_active', true),
      supabase.from('market_trades').select('*').eq('guild_id', guildId).order('traded_at', { ascending: false }).limit(10),
      supabase.from('market_orders').select('id', { count: 'exact', head: true }).eq('guild_id', guildId).eq('status', 'open'),
      supabase.from('servers').select('economy_tier, burn_rate, treasury_rate, papel_value_multiplier, earn_multiplier_override').eq('discord_id', guildId).maybeSingle(),
      supabase.from('investor_holdings').select('id', { count: 'exact', head: true }).eq('guild_id', guildId).gt('lot_count', 0),
    ]);

    const marketData = {
      guild_id: guildId,
      server,
      listing,
      treasury,
      active_penalties: penalties ?? [],
      active_events: events ?? [],
      recent_trades: recentTrades ?? [],
      open_orders_count: openOrders ?? 0,
      investor_count: holdingsCount ?? 0,
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    });

    let result;
    try {
      const response = await model.generateContent(
        `Sunucu verileri:\n${JSON.stringify(marketData, null, 2)}\n\nDeveloper sorusu: ${prompt}`
      );
      const text = response.response.text();
      result = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'ai_failed', detail: String(e) }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI analyze error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
