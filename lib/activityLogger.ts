/**
 * Activity giriş/çıkış loglarını doğrudan Discord kanalına gönderir.
 * Bot token ile /channels/{id}/messages endpoint'ini kullanır.
 */

const DISCORD_API = 'https://discord.com/api/v10';

// --- Activity (Discord Activity) log kanalları ---
const LOGIN_CHANNEL_ID      = '1484938345770651861';
const LOGOUT_CHANNEL_ID     = '1484938399965122691';
const NEW_USER_CHANNEL_ID   = '1484940513822904350';
const NEW_SERVER_CHANNEL_ID = '1484940664818110544';

// --- Web tarafı log kanalları ---
const WEB_LOGIN_CHANNEL_ID      = '1508034150307725402'; // Giriş yapan kullanıcılar
const SETUP_SUCCESS_CHANNEL_ID  = '1508034254209028116'; // Başarılı kurulumlar
const SETUP_FAILED_CHANNEL_ID   = '1508034289466478662'; // Başarısız kurulumlar
const LOG_SERVER_CHANNEL_ID     = '1508034336300208228'; // Log sunucusu farklı olan kurulumlar

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LoginLogPayload = {
  userId: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
  guildId: string | null;
  guildName?: string | null;
  guildIcon?: string | null;
  isNewUser: boolean;
  ip: string | null;
  userAgent: string | null;
  tokenExpiresAt: string | null;
};

export type LogoutLogPayload = {
  userId: string | null;
  username?: string | null;
  guildId: string | null;
  guildName?: string | null;
  guildIcon?: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type NewUserPayload = {
  userId: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
  guildId: string | null;
  guildName: string | null;
  guildIcon?: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type NewServerPayload = {
  guildId: string;
  guildName: string;
  guildIcon?: string | null;
  ownerId: string;
  registeredBy: string;
  isSetup: boolean;
  adminRoleId?: string | null;
  verifyRoleId?: string | null;
};

type ErrorLogPayload = {
  reason: string;
  status?: string;
  ip: string | null;
  userAgent: string | null;
  guildId?: string | null;
  metadata?: Record<string, unknown>;
};

export type WebLoginPayload = {
  userId: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
  isNewUser: boolean;
  guildCount: number;
  ip: string | null;
  userAgent: string | null;
  tokenExpiresAt: string | null;
};

export type SetupSuccessPayload = {
  guildId: string;
  guildName: string;
  guildIcon?: string | null;
  ownerId: string;
  registeredBy: string;
  adminRoleId: string;
  verifyRoleId: string;
  economyTier?: string | null;
  isUpdate: boolean;
  targetGuildId?: string | null;
};

export type SetupFailedPayload = {
  guildId?: string | null;
  guildName?: string | null;
  guildIcon?: string | null;
  userId?: string | null;
  reason: string;
  httpStatus: number;
  ip: string | null;
  userAgent: string | null;
};

export type SetupLogServerPayload = {
  guildId: string;
  guildName: string;
  guildIcon?: string | null;
  targetGuildId: string;
  targetGuildName?: string | null;
  targetGuildIcon?: string | null;
  registeredBy: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const cdnAvatar = (userId: string, avatarHash: string | null) =>
  avatarHash
    ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(userId) >> BigInt(22)) % 6}.png`;

const cdnGuildIcon = (guildId: string, iconHash: string | null | undefined) =>
  iconHash
    ? `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=64`
    : null;

const ts = (date: Date = new Date()) =>
  `<t:${Math.floor(date.getTime() / 1000)}:F>`;

const tsR = (date: Date) =>
  `<t:${Math.floor(date.getTime() / 1000)}:R>`;

/** UA'dan okunabilir platform/tarayıcı çıkar */
function parseUA(ua: string | null): string {
  if (!ua) return '—';
  const u = ua.toLowerCase();
  const parts: string[] = [];

  if (u.includes('discord')) parts.push('Discord İstemcisi');
  else if (u.includes('android')) parts.push('Android');
  else if (u.includes('iphone') || u.includes('ipad')) parts.push('iOS');
  else if (u.includes('windows')) parts.push('Windows');
  else if (u.includes('macintosh') || u.includes('mac os')) parts.push('macOS');
  else if (u.includes('linux')) parts.push('Linux');
  else parts.push('Bilinmeyen OS');

  if (!u.includes('discord')) {
    if (u.includes('edg/')) parts.push('Edge');
    else if (u.includes('chrome') && !u.includes('chromium')) parts.push('Chrome');
    else if (u.includes('firefox')) parts.push('Firefox');
    else if (u.includes('safari') && !u.includes('chrome')) parts.push('Safari');
    else if (u.includes('opera') || u.includes('opr/')) parts.push('Opera');
  }

  return parts.join(' · ');
}

/** Sunucu bilgisini footer için hazırla */
function guildFooter(guildId: string | null, guildName: string | null | undefined, guildIcon: string | null | undefined, suffix: string) {
  const iconUrl = guildId ? cdnGuildIcon(guildId, guildIcon) : null;
  const name = guildName ? `${guildName} · ${suffix}` : suffix;
  return iconUrl
    ? { text: name, icon_url: iconUrl }
    : { text: name };
}

async function postToChannel(channelId: string, payload: Record<string, unknown>): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return;
  try {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* sessizce geç */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export async function logActivityLogin(data: LoginLogPayload): Promise<void> {
  const tag = data.discriminator && data.discriminator !== '0'
    ? `${data.username}#${data.discriminator}`
    : data.username;

  const guildIconUrl = data.guildId ? cdnGuildIcon(data.guildId, data.guildIcon) : null;

  const embed = {
    author: {
      name: tag,
      icon_url: cdnAvatar(data.userId, data.avatar),
    },
    title: data.isNewUser ? '🆕 İlk Giriş' : '✅ Activity Açıldı',
    description: data.isNewUser
      ? `**${data.username}** sisteme ilk kez giriş yaptı.`
      : `**${data.username}** Activity'yi açtı.`,
    color: data.isNewUser ? 0x57F287 : 0x1ABC9C,
    thumbnail: { url: guildIconUrl ?? cdnAvatar(data.userId, data.avatar) },
    fields: [
      { name: '👤 Kullanıcı', value: `<@${data.userId}>\n\`${data.userId}\``, inline: true },
      {
        name: '🏠 Sunucu',
        value: data.guildName
          ? `**${data.guildName}**\n\`${data.guildId}\``
          : (data.guildId ? `\`${data.guildId}\`` : '—'),
        inline: true,
      },
      {
        name: '⏱️ Token Sona Erer',
        value: data.tokenExpiresAt
          ? `${tsR(new Date(data.tokenExpiresAt))}\n${ts(new Date(data.tokenExpiresAt))}`
          : '—',
        inline: true,
      },
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ Platform', value: parseUA(data.userAgent), inline: true },
      { name: '📅 Zaman', value: ts(), inline: true },
      ...(data.userAgent ? [{ name: '📋 User Agent', value: `\`\`\`\n${data.userAgent.slice(0, 300)}\n\`\`\``, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: guildFooter(data.guildId, data.guildName, data.guildIcon, 'Activity Giriş'),
  };

  await postToChannel(LOGIN_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export async function logActivityLogout(data: LogoutLogPayload): Promise<void> {
  const embed = {
    title: '🚪 Activity Kapandı',
    description: data.username
      ? `**${data.username}** Activity'den ayrıldı.`
      : data.userId
        ? `<@${data.userId}> Activity'den ayrıldı.`
        : 'Bir kullanıcı Activity\'den ayrıldı.',
    color: 0x747F8D,
    fields: [
      {
        name: '👤 Kullanıcı',
        value: data.userId
          ? `<@${data.userId}>${data.username ? ` **(${data.username})**` : ''}\n\`${data.userId}\``
          : '—',
        inline: true,
      },
      {
        name: '🏠 Sunucu',
        value: data.guildName
          ? `**${data.guildName}**\n\`${data.guildId}\``
          : (data.guildId ? `\`${data.guildId}\`` : '—'),
        inline: true,
      },
      { name: '📅 Zaman', value: ts(), inline: true },
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ Platform', value: parseUA(data.userAgent), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: guildFooter(data.guildId, data.guildName, data.guildIcon, 'Activity Çıkış'),
  };

  await postToChannel(LOGOUT_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW USER
// ─────────────────────────────────────────────────────────────────────────────

export async function logNewUser(data: NewUserPayload): Promise<void> {
  const tag = data.discriminator && data.discriminator !== '0'
    ? `${data.username}#${data.discriminator}`
    : data.username;

  const guildIconUrl = data.guildId ? cdnGuildIcon(data.guildId, data.guildIcon) : null;

  const embed = {
    author: {
      name: tag,
      icon_url: cdnAvatar(data.userId, data.avatar),
    },
    title: '🎉 Yeni Kullanıcı Katıldı!',
    description: `**${data.username}** sisteme ilk kez kayıt oldu.\nHoş geldin! 👋`,
    color: 0x5865F2,
    thumbnail: { url: guildIconUrl ?? cdnAvatar(data.userId, data.avatar) },
    fields: [
      { name: '👤 Kullanıcı', value: `<@${data.userId}>\n\`${data.userId}\``, inline: true },
      {
        name: '🏠 İlk Sunucu',
        value: data.guildName
          ? `**${data.guildName}**\n\`${data.guildId}\``
          : (data.guildId ? `\`${data.guildId}\`` : '—'),
        inline: true,
      },
      { name: '📅 Kayıt Zamanı', value: ts(), inline: true },
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ Platform', value: parseUA(data.userAgent), inline: true },
      ...(data.userAgent ? [{ name: '📋 User Agent', value: `\`\`\`\n${data.userAgent.slice(0, 300)}\n\`\`\``, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: guildFooter(data.guildId, data.guildName, data.guildIcon, 'Yeni Kullanıcı'),
  };

  await postToChannel(NEW_USER_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW SERVER
// ─────────────────────────────────────────────────────────────────────────────

export async function logNewServer(data: NewServerPayload): Promise<void> {
  const guildIconUrl = cdnGuildIcon(data.guildId, data.guildIcon);

  const embed = {
    author: guildIconUrl
      ? { name: data.guildName, icon_url: guildIconUrl }
      : { name: data.guildName },
    title: data.isSetup ? '🚀 Yeni Sunucu Kurulumu Tamamlandı' : '📋 Yeni Sunucu Sisteme Eklendi',
    description: data.isSetup
      ? `**${data.guildName}** sunucusu kurulumunu tamamladı ve sisteme dahil oldu.`
      : `**${data.guildName}** sunucusu sisteme kaydedildi, kurulum bekleniyor.`,
    color: data.isSetup ? 0x57F287 : 0xF1C40F,
    thumbnail: guildIconUrl ? { url: guildIconUrl } : undefined,
    fields: [
      { name: '🏠 Sunucu', value: `**${data.guildName}**\n\`${data.guildId}\``, inline: true },
      { name: '👑 Sunucu Sahibi', value: `<@${data.ownerId}>\n\`${data.ownerId}\``, inline: true },
      {
        name: data.ownerId === data.registeredBy ? '🔧 Kuran' : '🔧 Kaydeden',
        value: `<@${data.registeredBy}>\n\`${data.registeredBy}\``,
        inline: true,
      },
      ...(data.isSetup ? [
        {
          name: '🎭 Admin Rolü',
          value: data.adminRoleId ? `<@&${data.adminRoleId}>\n\`${data.adminRoleId}\`` : '—',
          inline: true,
        },
        {
          name: '✅ Verify Rolü',
          value: data.verifyRoleId ? `<@&${data.verifyRoleId}>\n\`${data.verifyRoleId}\`` : '—',
          inline: true,
        },
        { name: '📋 Durum', value: '`is_setup: true`', inline: true },
      ] : [
        { name: '📋 Durum', value: '`is_setup: false` — kurulum bekleniyor', inline: true },
      ]),
      { name: '📅 Zaman', value: ts(), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: guildIconUrl
      ? { text: `${data.guildName} · ${data.isSetup ? 'Sunucu Kurulumu' : 'Sunucu Kaydı'}`, icon_url: guildIconUrl }
      : { text: `DiscoWeb · ${data.isSetup ? 'Sunucu Kurulumu' : 'Sunucu Kaydı'}` },
  };

  await postToChannel(NEW_SERVER_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ERROR
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// WEB LOGIN (discoweb-main OAuth girişi)
// ─────────────────────────────────────────────────────────────────────────────

export async function logWebLogin(data: WebLoginPayload): Promise<void> {
  const tag = data.discriminator && data.discriminator !== '0'
    ? `${data.username}#${data.discriminator}`
    : data.username;

  const embed = {
    author: {
      name: tag,
      icon_url: cdnAvatar(data.userId, data.avatar),
    },
    title: data.isNewUser ? '🆕 Yeni Web Girişi' : '🔑 Web Girişi',
    description: data.isNewUser
      ? `**${data.username}** sisteme ilk kez giriş yaptı.`
      : `**${data.username}** giriş yaptı.`,
    color: data.isNewUser ? 0x57F287 : 0x5865F2,
    thumbnail: { url: cdnAvatar(data.userId, data.avatar) },
    fields: [
      { name: '👤 Kullanıcı', value: `<@${data.userId}>\n\`${data.userId}\``, inline: true },
      { name: '🏠 Sunucu Sayısı', value: `\`${data.guildCount}\` sunucu`, inline: true },
      {
        name: '⏱️ Token Sona Erer',
        value: data.tokenExpiresAt
          ? `${tsR(new Date(data.tokenExpiresAt))}\n${ts(new Date(data.tokenExpiresAt))}`
          : '—',
        inline: true,
      },
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ Platform', value: parseUA(data.userAgent), inline: true },
      { name: '📅 Zaman', value: ts(), inline: true },
      ...(data.userAgent ? [{ name: '📋 User Agent', value: `\`\`\`\n${data.userAgent.slice(0, 300)}\n\`\`\``, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'DiscoWeb · Web Giriş' },
  };

  await postToChannel(WEB_LOGIN_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP SUCCESS (başarılı kurulum)
// ─────────────────────────────────────────────────────────────────────────────

export async function logSetupSuccess(data: SetupSuccessPayload): Promise<void> {
  const guildIconUrl = cdnGuildIcon(data.guildId, data.guildIcon);

  const embed = {
    author: guildIconUrl
      ? { name: data.guildName, icon_url: guildIconUrl }
      : { name: data.guildName },
    title: data.isUpdate ? '🔄 Sunucu Kurulumu Güncellendi' : '🚀 Sunucu Kurulumu Tamamlandı',
    description: data.isUpdate
      ? `**${data.guildName}** sunucusunun kurulum ayarları güncellendi.`
      : `**${data.guildName}** sunucusu başarıyla kuruldu ve sisteme dahil oldu.`,
    color: data.isUpdate ? 0x1ABC9C : 0x57F287,
    thumbnail: guildIconUrl ? { url: guildIconUrl } : undefined,
    fields: [
      { name: '🏠 Sunucu', value: `**${data.guildName}**\n\`${data.guildId}\``, inline: true },
      { name: '👑 Sunucu Sahibi', value: `<@${data.ownerId}>\n\`${data.ownerId}\``, inline: true },
      {
        name: data.ownerId === data.registeredBy ? '🔧 Kuran' : '🔧 Kaydeden',
        value: `<@${data.registeredBy}>\n\`${data.registeredBy}\``,
        inline: true,
      },
      { name: '🎭 Admin Rolü', value: `<@&${data.adminRoleId}>\n\`${data.adminRoleId}\``, inline: true },
      { name: '✅ Verify Rolü', value: `<@&${data.verifyRoleId}>\n\`${data.verifyRoleId}\``, inline: true },
      { name: '💰 Ekonomi Tier', value: `\`${data.economyTier ?? 'basic'}\``, inline: true },
      ...(data.targetGuildId && data.targetGuildId !== data.guildId
        ? [{ name: '📡 Log Sunucusu', value: `\`${data.targetGuildId}\` *(farklı sunucu)*`, inline: false }]
        : []),
      { name: '📅 Zaman', value: ts(), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: guildIconUrl
      ? { text: `${data.guildName} · ${data.isUpdate ? 'Güncelleme' : 'Yeni Kurulum'}`, icon_url: guildIconUrl }
      : { text: `DiscoWeb · ${data.isUpdate ? 'Güncelleme' : 'Yeni Kurulum'}` },
  };

  await postToChannel(SETUP_SUCCESS_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP FAILED (başarısız kurulum)
// ─────────────────────────────────────────────────────────────────────────────

export async function logSetupFailed(data: SetupFailedPayload): Promise<void> {
  const guildIconUrl = data.guildId ? cdnGuildIcon(data.guildId, data.guildIcon) : null;

  const embed = {
    title: '❌ Kurulum Başarısız',
    description: data.guildName
      ? `**${data.guildName}** sunucusunun kurulumu başarısız oldu.`
      : 'Bir sunucunun kurulumu başarısız oldu.',
    color: 0xED4245,
    ...(guildIconUrl ? { thumbnail: { url: guildIconUrl } } : {}),
    fields: [
      ...(data.guildId ? [{ name: '🏠 Sunucu', value: data.guildName ? `**${data.guildName}**\n\`${data.guildId}\`` : `\`${data.guildId}\``, inline: true }] : []),
      ...(data.userId ? [{ name: '👤 Kurmaya Çalışan', value: `<@${data.userId}>\n\`${data.userId}\``, inline: true }] : []),
      { name: '🔖 Hata Sebebi', value: `\`${data.reason}\``, inline: false },
      { name: '📋 HTTP Durumu', value: `\`${data.httpStatus}\``, inline: true },
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ Platform', value: parseUA(data.userAgent), inline: true },
      { name: '📅 Zaman', value: ts(), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'DiscoWeb · Kurulum Hatası' },
  };

  await postToChannel(SETUP_FAILED_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP LOG-SERVER (kurulumda farklı log sunucusu)
// ─────────────────────────────────────────────────────────────────────────────

export async function logSetupLogServer(data: SetupLogServerPayload): Promise<void> {
  const guildIconUrl = cdnGuildIcon(data.guildId, data.guildIcon);
  const targetIconUrl = data.targetGuildId ? cdnGuildIcon(data.targetGuildId, data.targetGuildIcon) : null;

  const embed = {
    title: '📡 Farklı Log Sunucusu Yapılandırıldı',
    description: `**${data.guildName}** sunucusu, log merkezi olarak **${data.targetGuildName ?? data.targetGuildId}** sunucusunu kullanacak şekilde kuruldu.`,
    color: 0xF1C40F,
    ...(guildIconUrl ? { thumbnail: { url: guildIconUrl } } : {}),
    fields: [
      {
        name: '🏠 Kurulan Sunucu',
        value: `**${data.guildName}**\n\`${data.guildId}\``,
        inline: true,
      },
      {
        name: '📡 Log Merkezi (Farklı Sunucu)',
        value: data.targetGuildName
          ? `**${data.targetGuildName}**\n\`${data.targetGuildId}\`${targetIconUrl ? '' : ''}`
          : `\`${data.targetGuildId}\``,
        inline: true,
      },
      {
        name: '🔧 Yapılandıran',
        value: `<@${data.registeredBy}>\n\`${data.registeredBy}\``,
        inline: true,
      },
      { name: '📅 Zaman', value: ts(), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: guildIconUrl
      ? { text: `${data.guildName} → ${data.targetGuildName ?? data.targetGuildId} · Log Sunucusu`, icon_url: guildIconUrl }
      : { text: `DiscoWeb · Log Sunucusu Yapılandırması` },
  };

  await postToChannel(LOG_SERVER_CHANNEL_ID, { embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ERROR (activity login hatası)
// ─────────────────────────────────────────────────────────────────────────────

export async function logActivityAuthError(data: ErrorLogPayload): Promise<void> {
  const embed = {
    title: '⚠️ Activity Auth Hatası',
    color: 0xED4245,
    fields: [
      { name: '🔖 Sebep', value: `\`${data.reason}\``, inline: true },
      ...(data.status ? [{ name: '📋 Durum', value: `\`${data.status}\``, inline: true }] : []),
      ...(data.guildId ? [{ name: '🏠 Guild ID', value: `\`${data.guildId}\``, inline: true }] : []),
      { name: '🌐 IP', value: data.ip ? `\`${data.ip}\`` : '—', inline: true },
      { name: '🖥️ User Agent', value: data.userAgent ? `\`${data.userAgent.slice(0, 200)}\`` : '—', inline: false },
      ...(data.metadata ? [{ name: '📄 Detay', value: `\`\`\`json\n${JSON.stringify(data.metadata, null, 2).slice(0, 900)}\n\`\`\``, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'DiscoWeb · Auth Hata' },
  };

  await postToChannel(LOGIN_CHANNEL_ID, { embeds: [embed] });
}
