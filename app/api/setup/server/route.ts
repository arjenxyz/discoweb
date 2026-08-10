import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSessionUserId, requireSessionUser } from '@/lib/auth';
import { logNewServer, logSetupSuccess, logSetupFailed, logSetupLogServer } from '@/lib/activityLogger';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const getSelectedGuildId = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('selected_guild_id')?.value ?? null;
};

// Slugify function to create URL-friendly slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Type used for summary items retrieved from DB
type SavedChannel = { channel_type: string; channel_name: string; webhook_url?: string | null };

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Veritabanı bağlantısı yapılandırılmamış' }, { status: 500 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const guildId = await getSelectedGuildId();

  if (!guildId) {
    return NextResponse.json({ error: 'Sunucu kimliği bulunamadı' }, { status: 400 });
  }

  const { data: server, error } = await supabase
    .from('servers')
    .select('discord_id, admin_role_id, verify_role_id, is_setup, earn_per_message, earn_per_voice_minute, message_earn_enabled, voice_earn_enabled, tag_bonus_message, tag_bonus_voice, booster_bonus_message, booster_bonus_voice')
    .eq('discord_id', guildId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Sunucu bilgileri alınamadı' }, { status: 500 });
  }

  if (!server) {
    return NextResponse.json({ exists: false, is_setup: false });
  }

  return NextResponse.json({
    exists: true,
    is_setup: !!server.is_setup,
    admin_role_id: server.admin_role_id || null,
    verify_role_id: server.verify_role_id || null,
    earn_per_message: server.earn_per_message ?? 0,
    earn_per_voice_minute: server.earn_per_voice_minute ?? 0,
    message_earn_enabled: server.message_earn_enabled ?? false,
    voice_earn_enabled: server.voice_earn_enabled ?? false,
    tag_bonus_message: server.tag_bonus_message ?? 0,
    tag_bonus_voice: server.tag_bonus_voice ?? 0,
    booster_bonus_message: server.booster_bonus_message ?? 0,
    booster_bonus_voice: server.booster_bonus_voice ?? 0,
  });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  try {
    const { guildId, targetGuildId, adminRoleId, verifyRoleId, messageEarnEnabled, voiceEarnEnabled, earnPerMessage, earnPerVoiceMinute, tagBonusMessage, tagBonusVoice, boosterBonusMessage, boosterBonusVoice, economyTier } = await request.json();

    if (!guildId || !adminRoleId) {
      void logSetupFailed({ guildId: guildId ?? null, userId: null, reason: 'Eksik parametre: guildId veya adminRoleId', httpStatus: 400, ip, userAgent });
      return NextResponse.json(
        { error: 'guildId ve adminRoleId gerekli' },
        { status: 400 }
      );
    }

    const resolvedVerifyRoleId =
      typeof verifyRoleId === 'string' && verifyRoleId.trim().length > 0 ? verifyRoleId.trim() : null;

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token yapılandırılmamış' },
        { status: 500 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı yapılandırılmamış' },
        { status: 500 }
      );
    }

    // Kullanıcının admin olup olmadığını kontrol et
    const session = await requireSessionUser(request);
    if (!session.ok) {
      return session.response;
    }
    const userId = session.userId;

    // Kullanıcının sunucuda admin olup olmadığını kontrol et
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );

    if (!memberResponse.ok) {
      void logSetupFailed({ guildId, userId, reason: 'Kullanıcı sunucuda bulunamadı', httpStatus: 403, ip, userAgent });
      return NextResponse.json(
        { error: 'Kullanıcı sunucuda bulunamadı' },
        { status: 403 }
      );
    }

    const member = await memberResponse.json();

    // Sunucu bilgilerini al
    const guildResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );

    if (!guildResponse.ok) {
      return NextResponse.json(
        { error: 'Sunucu bilgileri alınamadı' },
        { status: 500 }
      );
    }

    const guild = await guildResponse.json();

    // Kurulum öncesi: Sadece sunucu sahibi kurulum yapabilir
    // Kurulum sonrası: Admin rolü ile kontrol yapılır
    const isOwner = guild.owner_id === userId;
    const isAdmin = member.roles.includes(adminRoleId);

    if (!isOwner) {
      void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: 'Sunucu sahibi değil', httpStatus: 403, ip, userAgent });
      return NextResponse.json(
        { error: 'Bu işlem için sunucu sahibi olmanız gerekir' },
        { status: 403 }
      );
    }

    // Debug logging for incoming role selections
    console.log('Setup payload:', { guildId, adminRoleId, verifyRoleId: resolvedVerifyRoleId, userId });

    // Fetch guild roles to validate provided role IDs
    const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    let guildRoles: Array<{ id: string; permissions?: string }> = [];
    if (rolesResponse.ok) {
      guildRoles = await rolesResponse.json();
    } else {
      console.warn('Warning: could not fetch guild roles for validation', rolesResponse.status);
    }

    // Call Bot API to setup the Admin Log channel (ÖNCE BUNU YAPACAĞIZ)
    let botApiSuccess = false;
    let createdChannelId = null;
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3000';
    const botApiKey = process.env.BOT_API_KEY || '';

    try {
      const botRes = await fetch(`${botApiUrl}/api/setup-server-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(botApiKey && { 'Authorization': `Bearer ${botApiKey}` })
        },
        body: JSON.stringify({
          guildId,
          targetGuildId: targetGuildId || guildId
        })
      });

      if (botRes.ok) {
        const botData = await botRes.json();
        botApiSuccess = true;
        createdChannelId = botData.channelId;
        console.log('✅ Bot API ile log kanalı kurulumu başarılı:', createdChannelId);
      } else {
        const errData = await botRes.json().catch(() => null);
        console.error('❌ Bot API hata döndürdü:', botRes.status, errData);
        // We will throw error so frontend knows bot is not in the server and NO DB CHANGES OCCUR
        void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `Bot API hatası: ${errData?.error || 'Log sunucusu kurulumu başarısız'}`, httpStatus: 400, ip, userAgent });
        return NextResponse.json({ error: errData?.error || 'Log sunucusu kurulumu başarısız' }, { status: 400 });
      }
    } catch (botErr) {
      console.error('❌ Bot API bağlantı hatası:', botErr);
      void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: 'Bot API bağlantı hatası', httpStatus: 500, ip, userAgent });
      return NextResponse.json({ error: 'Bot API sunucusuna ulaşılamadı. Botun açık olduğundan emin olun.' }, { status: 500 });
    }

    // Veritabanında sunucuyu güncelle/kaydet
    const { data: existingServer } = await supabase
      .from('servers')
      .select('id, discord_id')
      .eq('discord_id', guildId)
      .single();

    let serverId: string;

    // Validate provided role IDs
    const findRole = (id: string | null) => guildRoles.find(r => r.id === id) || null;
    const adminRoleObj = findRole(adminRoleId);
    const verifyRoleObj = resolvedVerifyRoleId ? findRole(resolvedVerifyRoleId) : null;

    // Admin role must exist and have admin/manage guild/manage roles perms
    if (!adminRoleObj) {
      void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `Admin rolü bulunamadı: ${adminRoleId}`, httpStatus: 400, ip, userAgent });
      return NextResponse.json({ error: 'Belirtilen admin rolü sunucuda bulunamadı' }, { status: 400 });
    }
    const perms = BigInt(adminRoleObj.permissions ?? '0');
    const hasAdminPerm = (perms & BigInt(0x8)) !== BigInt(0) || (perms & BigInt(0x20)) !== BigInt(0) || (perms & BigInt(0x10000000)) !== BigInt(0);
    if (!hasAdminPerm) {
      void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `Admin rolü yetersiz izne sahip: ${adminRoleId}`, httpStatus: 400, ip, userAgent });
      return NextResponse.json({ error: 'Seçilen admin rolü gerekli yönetim izinlerine sahip değil' }, { status: 400 });
    }

    if (resolvedVerifyRoleId && !verifyRoleObj) {
      void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `Verify rolü bulunamadı: ${resolvedVerifyRoleId}`, httpStatus: 400, ip, userAgent });
      return NextResponse.json({ error: 'Belirtilen verify rolü sunucuda bulunamadı' }, { status: 400 });
    }

    if (existingServer) {
      // Mevcut sunucuyu güncelle
      const { data: updatedServer, error: updateError } = await supabase
        .from('servers')
        .update({
          name: guild.name,
          admin_role_id: adminRoleId,
          verify_role_id: resolvedVerifyRoleId,
          is_setup: true,
          tag_id: guildId,
          message_earn_enabled: Boolean(messageEarnEnabled),
          earn_per_message: Number(earnPerMessage ?? 0),
          voice_earn_enabled: Boolean(voiceEarnEnabled),
          earn_per_voice_minute: Number(earnPerVoiceMinute ?? 0),
          tag_bonus_message: Number(tagBonusMessage ?? 0),
          tag_bonus_voice: Number(tagBonusVoice ?? 0),
          booster_bonus_message: Number(boosterBonusMessage ?? 0),
          booster_bonus_voice: Number(boosterBonusVoice ?? 0),
          economy_tier: economyTier ?? 'basic',
        })
        .eq('discord_id', guildId)
        .select('id, discord_id, admin_role_id, verify_role_id')
        .single();

      if (updateError) {
        console.error('Server update error:', updateError);
        void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `DB güncelleme hatası: ${updateError.message}`, httpStatus: 500, ip, userAgent });
        return NextResponse.json(
          { error: 'Sunucu güncellenirken hata oluştu' },
          { status: 500 }
        );
      }
      serverId = updatedServer.id;
      console.log('Server updated:', updatedServer);
    } else {
      // Yeni sunucu oluştur
      const uniqueSlug = `${slugify(guild.name)}-${guildId}`;
      const { data: newServer, error: insertError } = await supabase
        .from('servers')
        .insert({
          discord_id: guildId,
          name: guild.name,
          slug: uniqueSlug,
          admin_role_id: adminRoleId,
          verify_role_id: resolvedVerifyRoleId,
          is_setup: true,
          tag_id: guildId,
          message_earn_enabled: Boolean(messageEarnEnabled),
          earn_per_message: Number(earnPerMessage ?? 0),
          voice_earn_enabled: Boolean(voiceEarnEnabled),
          earn_per_voice_minute: Number(earnPerVoiceMinute ?? 0),
          tag_bonus_message: Number(tagBonusMessage ?? 0),
          tag_bonus_voice: Number(tagBonusVoice ?? 0),
          booster_bonus_message: Number(boosterBonusMessage ?? 0),
          booster_bonus_voice: Number(boosterBonusVoice ?? 0),
          economy_tier: economyTier ?? 'basic',
        })
        .select('id, discord_id, admin_role_id, verify_role_id')
        .single();

      if (insertError) {
        console.error('Server insert error:', insertError);
        void logSetupFailed({ guildId, guildName: guild.name, guildIcon: guild.icon ?? null, userId, reason: `DB insert hatası: ${insertError.message}`, httpStatus: 500, ip, userAgent });
        return NextResponse.json(
          { error: 'Sunucu oluşturulurken hata oluştu', detail: insertError.message, code: insertError.code },
          { status: 500 }
        );
      }
      serverId = newServer.id;
      console.log('Server created:', newServer);
    }

    // Eski kanal logu (backward compat)
    void logNewServer({
      guildId,
      guildName: guild.name ?? guildId,
      guildIcon: guild.icon ?? null,
      ownerId: guild.owner_id ?? userId,
      registeredBy: userId,
      isSetup: true,
      adminRoleId,
      verifyRoleId: resolvedVerifyRoleId,
    });

    // Yeni kurulum başarı logu
    void logSetupSuccess({
      guildId,
      guildName: guild.name ?? guildId,
      guildIcon: guild.icon ?? null,
      ownerId: guild.owner_id ?? userId,
      registeredBy: userId,
      adminRoleId,
      verifyRoleId: resolvedVerifyRoleId,
      economyTier: economyTier ?? 'basic',
      isUpdate: !!existingServer,
      targetGuildId: targetGuildId || null,
    });

    // Farklı log sunucusu kullanılıyorsa ayrıca logla
    if (targetGuildId && targetGuildId !== guildId) {
      // targetGuild adını almaya çalış (opsiyonel, hata olursa geç)
      let targetGuildName: string | null = null;
      let targetGuildIcon: string | null = null;
      try {
        const tgRes = await fetch(`https://discord.com/api/guilds/${targetGuildId}`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (tgRes.ok) {
          const tg = await tgRes.json();
          targetGuildName = tg.name ?? null;
          targetGuildIcon = tg.icon ?? null;
        }
      } catch { /* sessizce geç */ }

      void logSetupLogServer({
        guildId,
        guildName: guild.name ?? guildId,
        guildIcon: guild.icon ?? null,
        targetGuildId,
        targetGuildName,
        targetGuildIcon,
        registeredBy: userId,
      });
    }

    // Double-check roles stored in DB for debugging
    console.log('Storing roles (payload):', { adminRoleId, verifyRoleId: resolvedVerifyRoleId });

    // Fetch and log the saved server row to ensure values are persisted
    try {
      const { data: saved, error: savedErr } = await supabase
        .from('servers')
        .select('id, discord_id, admin_role_id, verify_role_id')
        .eq('discord_id', guildId)
        .single();
      if (savedErr) {
        console.warn('Could not fetch saved server row:', savedErr);
      } else {
        console.log('Saved server row:', saved);
      }
    } catch (fetchErr) {
      console.warn('Exception fetching saved server row:', fetchErr);
    }



    return NextResponse.json({
      success: true,
      message: 'Sunucu başarıyla kuruldu',
      serverId,
      logSetupSuccess: botApiSuccess,
      adminLogChannelId: createdChannelId
    });

  } catch (error) {
    console.error('Setup API error:', error);
    void logSetupFailed({ reason: `Beklenmeyen hata: ${String(error)}`, httpStatus: 500, ip, userAgent });
    return NextResponse.json(
      { error: 'Kurulum sırasında beklenmeyen hata oluştu' },
      { status: 500 }
    );
  }
}
