import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth';
import { renderEarnNotification } from '@/lib/templates/EarnNotification.server';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

// --- GÖRSEL BİLDİRİM ŞABLONU (KUTULU YAPI) ---
type ChangeItem = { type: 'narrative' | 'tech'; text: string; dir?: 'up' | 'down' | 'same' };

// render moved to React component (src/lib/templates/EarnNotification.tsx)

// --- YARDIMCI FONKSİYONLAR ---
const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

// --- API HANDLERS ---
export async function GET() {
  try {
  if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  const guildId = (await cookies()).get('selected_guild_id')?.value;
  if (!supabase || !guildId) return NextResponse.json({ error: 'missing_config', detail: !supabase ? 'supabase' : 'guildId' }, { status: 500 });

  const { data, error: dbErr } = await supabase.from('servers').select('*').eq('discord_id', guildId).maybeSingle();
  if (dbErr) console.error('earn-settings GET db error:', dbErr);

  let guildPreview = null;
  try {
    const res = await fetch(`https://discord.com/api/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
    });
    if (res.ok) {
      const g = await res.json();
      guildPreview = { name: g.name, icon: g.icon ? `https://cdn.discordapp.com/icons/${guildId}/${g.icon}.png` : null };
    }
  } catch {}

  // Fetch Discord channels for channel config UI
  let channels: Array<{ id: string; name: string; type: number; parent_id: string | null }> = [];
  try {
    const chRes = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
    });
    if (chRes.ok) {
      const allChannels = await chRes.json();
      // type 0 = text, 2 = voice, 4 = category
      channels = allChannels
        .filter((c: any) => [0, 2, 4].includes(c.type))
        .map((c: any) => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id ?? null }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  } catch {}

  return NextResponse.json({
    ...data,
    tag_configured: Boolean(data?.tag_id ?? false),
    _guildPreview: guildPreview,
    _channels: channels,
  });
  } catch (e) {
    console.error('earn-settings GET unexpected error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
  if (!(await isAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  const guildId = (await cookies()).get('selected_guild_id')?.value;
  if (!supabase || !guildId) return NextResponse.json({ error: 'error' }, { status: 500 });

  const payload = await request.json();

  // tag_id is automatically set to guildId when tag_required is true (see updateObj below)

  // 1. Sadece DB sütunlarını filtrele (500 hatasını önleyen kritik kısım)
  type ServerUpdate = {
    earn_per_message: number;
    message_earn_enabled: boolean;
    earn_per_voice_minute: number;
    voice_earn_enabled: boolean;
    verify_role_id: string | null;
    tag_required: boolean;
    tag_id: string | null;
    tag_bonus_message: number;
    tag_bonus_voice: number;
    booster_bonus_message: number;
    booster_bonus_voice: number;
    earn_channels: any;
  };

  const updateObj: ServerUpdate = {
    earn_per_message: Number(payload.earn_per_message ?? 0),
    message_earn_enabled: Boolean(payload.message_earn_enabled),
    earn_per_voice_minute: Number(payload.earn_per_voice_minute ?? 0),
    voice_earn_enabled: Boolean(payload.voice_earn_enabled),
    verify_role_id: payload.verify_role_id || null,
    tag_required: Boolean(payload.tag_required),
    tag_id: payload.tag_required ? guildId : null,
    tag_bonus_message: Number(payload.tag_bonus_message ?? 0),
    tag_bonus_voice: Number(payload.tag_bonus_voice ?? 0),
    booster_bonus_message: Number(payload.booster_bonus_message ?? 0),
    booster_bonus_voice: Number(payload.booster_bonus_voice ?? 0),
    earn_channels: payload.earn_channels ?? null,
  };

  const { data: oldData } = await supabase.from('servers').select('*').eq('discord_id', guildId).maybeSingle();

  // Try full update first; if earn_channels column doesn't exist yet, retry without it
  let saveError = null;
  const { error: err1 } = await supabase.from('servers').update(updateObj).eq('discord_id', guildId);
  if (err1) {
    // Possibly earn_channels column missing — retry without it
    const { earn_channels: _ec, ...updateWithout } = updateObj;
    const { error: err2 } = await supabase.from('servers').update(updateWithout).eq('discord_id', guildId);
    saveError = err2;
    if (!err2) {
      console.warn('earn-settings: earn_channels column missing, saved without it. Run: ALTER TABLE servers ADD COLUMN earn_channels jsonb DEFAULT NULL;');
    }
  }
  if (saveError) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  // --- BİLDİRİM MANTIĞI ---
  const changeGroups: Record<string, ChangeItem[]> = { general: [], tag: [], boost: [] };
  const templates: Record<'general'|'tag'|'boost', Record<'up'|'down'|'same', string>> = {
    general: { up: "📈 Müjde: Kazanç oranlarını artırdık!", down: "⚖️ Dengeleme: Ekonomi için küçük bir düzenleme yapıldı.", same: "💎 Sabit: Bu oran değişmedi." },
    tag: { up: "🏷️ Sancaktarlara Destek: Tag bonusu arttı!", down: "🏷️ Tag Düzenlemesi: Bonuslar güncellendi.", same: "🏷️ Tag Durumu: Değişiklik yok." },
    boost: { up: "🚀 Boost Güçlendirmesi: Ödüller arttı!", down: "🚀 Boost Güncellemesi: Düzenleme yapıldı.", same: "🚀 Boost Sabit: Aynı kaldı." }
  };

  const numericKeys: Array<keyof ServerUpdate> = [
    'earn_per_message',
    'earn_per_voice_minute',
    'tag_bonus_message',
    'tag_bonus_voice',
    'booster_bonus_message',
    'booster_bonus_voice'
  ];

  const check = (key: keyof ServerUpdate, label: string, group: 'general' | 'tag' | 'boost') => {
    const oldV = Number(oldData?.[key as string] ?? 0);
    let newV = 0;
    if (numericKeys.includes(key)) {
      newV = Number(updateObj[key] as number ?? 0);
    }
    if (oldV !== newV) {
      const dir: 'up' | 'down' = newV > oldV ? 'up' : 'down';
      changeGroups[group].push({ type: 'narrative', text: templates[group][dir], dir });
      changeGroups[group].push({ type: 'tech', text: `${label}: ${oldV.toFixed(2)} -> ${newV.toFixed(2)} Papel`, dir });
    }
  };

  check('earn_per_message', 'Mesaj Kazancı', 'general');
  check('earn_per_voice_minute', 'Ses Kazancı', 'general');
  check('tag_bonus_message', 'Tag Bonusu (Mesaj)', 'tag');
  check('tag_bonus_voice', 'Tag Bonusu (Ses)', 'tag');
  check('booster_bonus_message', 'Boost Bonusu (Mesaj)', 'boost');
  check('booster_bonus_voice', 'Boost Bonusu (Ses)', 'boost');

  if (Object.values(changeGroups).some((g) => g.length > 0)) {
    const bodyHtml = renderEarnNotification(changeGroups, 'Ekonomi güncellemesi uygulandı. Detaylar için lütfen bildirimi inceleyin.');

    await supabase.from('system_mails').insert({
      guild_id: guildId,
      title: 'Ekonomi Güncellemesi',
      body: bodyHtml,
      category: 'system',
      status: 'published',
      // Hardcoded system sender so frontend shows proper header/avatar
      author_name: 'Sistem Yönetimi',
      author_avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
    });
  }

  return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error('earn-settings PUT unexpected error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
