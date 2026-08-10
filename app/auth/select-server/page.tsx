'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ubuntu } from 'next/font/google';
import { LuArrowRight, LuCode, LuDatabase, LuLock, LuShield, LuSettings } from 'react-icons/lu';
import CuteNavbar from '@/components/CuteNavbar';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { lockBodyScroll } from '@/lib/lockBodyScroll';
import { siteConfig } from '@/config/site';

const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['400', '700'] });

const AGREEMENT_OVERVIEW = [
  {
    title: 'Temel hesap bilgileri',
    description: 'Discord kimliği, kullanıcı adı ve avatar bilgisi giriş eşleştirmesi için kullanılır.',
    icon: LuShield,
  },
  {
    title: 'Sunucu ve rol doğrulaması',
    description: 'Üyelik ve rol kontrolleri sadece doğru panel erişimi sağlamak için işlenir.',
    icon: LuDatabase,
  },
  {
    title: 'Güvenlik ve işlem kayıtları',
    description: 'Güvenlik amacıyla gerekli durumlarda teknik işlem kayıtları tutulabilir.',
    icon: LuLock,
  },
];

const AGREEMENT_PROMISES = [
  'Verileriniz satılmaz; reklam profili çıkarmak için kullanılmaz.',
  'İşlenen bilgiler sadece hizmet sunumu ve güvenlik için gereklidir.',
];

interface Guild {
  id: string;
  name: string;
  isAdmin: boolean;
  isSetup: boolean;
  verifyRoleId: string | null;
  isOwner: boolean;
  iconUrl?: string | null;
}

interface UserInfo {
  id: string;
  username: string;
  avatar: string | null;
}

const LOCAL_DEV_GUILD: Guild = {
  id: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? '1465698764453838882',
  name: 'Local Development',
  isAdmin: true,
  isSetup: true,
  verifyRoleId: null,
  isOwner: true,
  iconUrl: null,
};

export default function SelectServerPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementTargetHref, setAgreementTargetHref] = useState<string | null>(null);
  const [isProcessingAgreement, setIsProcessingAgreement] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const localBypass = isLocalDevBypassClient();

  const ensureAgreementAndRedirect = useCallback(
    (href: string) => {
      if (typeof window !== 'undefined' && localStorage.getItem('discord_agreement_accepted') === 'true') {
        router.replace(href);
        return;
      }
      setAgreementTargetHref(href);
      setShowAgreementModal(true);
    },
    [router],
  );

  const loginUrl = useMemo(() => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '';
    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? process.env.NEXT_PUBLIC_REDIRECT_URI ?? '';
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=identify%20guilds`;
  }, []);

  useEffect(() => {
    if (!showAgreementModal) return undefined;
    return lockBodyScroll();
  }, [showAgreementModal]);

  const loadGuilds = useCallback(
    async (currentUserId?: string | null) => {
      const bypass = isLocalDevBypassClient();
      const adminGuilds = localStorage.getItem('adminGuilds');
      const updatedAt = localStorage.getItem('adminGuildsUpdatedAt');
      setLastUpdatedAt(updatedAt);

      if (!adminGuilds) {
        if (bypass) {
          setGuilds([LOCAL_DEV_GUILD]);
          setLoading(false);
          return;
        }
        ensureAgreementAndRedirect(loginUrl);
        return;
      }

      try {
        const parsedGuilds = JSON.parse(adminGuilds) as Guild[];
        const filteredGuilds: Guild[] = [];

        for (const guild of parsedGuilds) {
          try {
            const response = await fetch(`/api/discord/guild/${guild.id}/member-check`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });

            if (!response.ok) continue;

            const data = (await response.json()) as { isMember: boolean };
            if (!data.isMember) continue;

            let isOwner = Boolean(guild.isOwner);
            let iconUrl = guild.iconUrl ?? null;

            const guildResponse = await fetch(`/api/discord/guild/${guild.id}`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });

            if (guildResponse.ok) {
              const guildData = (await guildResponse.json()) as {
                owner_id?: string;
                icon?: string | null;
              };
              isOwner = Boolean(currentUserId) && guildData.owner_id === currentUserId;
              iconUrl = guildData.icon ?? guild.iconUrl ?? null;
            }

            filteredGuilds.push({ ...guild, isOwner, iconUrl });
          } catch {
            // skip guild on membership errors
          }
        }

        const withSetupStatus = await Promise.all(
          filteredGuilds.map(async (guild) => {
            try {
              const response = await fetch(`/api/setup/status?guildId=${guild.id}`);
              if (response.ok) {
                const status = (await response.json()) as { is_setup?: boolean };
                return { ...guild, isSetup: !!status.is_setup };
              }
            } catch {
              // ignore
            }
            return guild;
          }),
        );

        const adminOnlyGuilds = withSetupStatus.filter((g) => g.isAdmin || g.isOwner);
        setGuilds(bypass && adminOnlyGuilds.length === 0 ? [LOCAL_DEV_GUILD] : adminOnlyGuilds);

        let developerAccess = bypass;
        try {
          const developerResponse = await fetch('/api/developer/check-access', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (developerResponse.ok) {
            developerAccess = true;
          }
        } catch {
          // ignore
        }
        setHasDeveloperAccess(developerAccess);
      } catch {
        if (bypass) {
          setGuilds([LOCAL_DEV_GUILD]);
          setHasDeveloperAccess(true);
          setLoading(false);
          return;
        }
        router.replace('/auth/error');
        return;
      }

      setLoading(false);
    },
    [ensureAgreementAndRedirect, loginUrl, router],
  );

  const handleRefreshGuilds = useCallback(async () => {
    if (isRefreshing || localBypass) return;
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      const response = await fetch('/api/discord/refresh-guilds', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as {
        adminGuilds?: Guild[];
        updatedAt?: string;
        needsReauth?: boolean;
        error?: string;
      };

      if (response.status === 401 || payload.needsReauth) {
        setRefreshMessage('Discord oturumu yenilenmeli — yönlendiriliyorsunuz…');
        ensureAgreementAndRedirect(loginUrl);
        return;
      }

      if (!response.ok || !payload.adminGuilds) {
        setRefreshMessage('Liste güncellenemedi. Biraz sonra tekrar deneyin.');
        return;
      }

      const updatedAt = payload.updatedAt ?? new Date().toISOString();
      localStorage.setItem('adminGuilds', JSON.stringify(payload.adminGuilds));
      localStorage.setItem('adminGuildsUpdatedAt', updatedAt);
      setLastUpdatedAt(updatedAt);
      setRefreshMessage('Sunucu listesi güncellendi.');
      await loadGuilds(currentUserIdRef.current);
    } catch {
      setRefreshMessage('Liste güncellenemedi. Biraz sonra tekrar deneyin.');
    } finally {
      setIsRefreshing(false);
    }
  }, [ensureAgreementAndRedirect, isRefreshing, loadGuilds, localBypass, loginUrl]);

  useEffect(() => {
    const fetchUserInfo = async (): Promise<UserInfo | null> => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (response.ok) {
          return (await response.json()) as UserInfo;
        }

        localStorage.removeItem('discordUser');
        localStorage.removeItem('adminGuilds');
        localStorage.removeItem('adminGuildsUpdatedAt');
        router.replace(loginUrl);
      } catch {
        localStorage.removeItem('discordUser');
        localStorage.removeItem('adminGuilds');
        localStorage.removeItem('adminGuildsUpdatedAt');
        router.replace(loginUrl);
      }
      return null;
    };

    const initPage = async () => {
      const userData = await fetchUserInfo();
      currentUserIdRef.current = userData?.id ?? null;
      await loadGuilds(userData?.id ?? null);
    };

    initPage();
  }, [loadGuilds, loginUrl, router]);

  const handleSetupGuild = (guildId: string) => {
    document.cookie = `selected_guild_id=${guildId}; path=/`;
    localStorage.setItem('selectedGuildId', guildId);
    router.replace('/auth/setup');
  };

  const handleGuildSelect = async (guildId: string) => {
    document.cookie = `selected_guild_id=${guildId}; path=/`;
    localStorage.setItem('selectedGuildId', guildId);
    router.replace('/admin');
  };

  if (loading) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-[#7289DA]/10" />
        <div className="absolute left-1/4 top-1/4 h-32 w-32 animate-pulse rounded-full bg-[#5865F2]/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 animate-pulse rounded-full bg-[#7289DA]/15 blur-3xl" />
        <div className="relative z-10 text-center">
          <img
            src="/gif/BM.gif"
            alt=""
            draggable={false}
            className="mx-auto mb-6 h-28 w-auto object-contain"
          />
          <div className="mx-auto mb-3 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#5865F2]" />
          </div>
          <p className={`text-sm text-white/60 ${ubuntu.className}`}>Sunucular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden bg-black text-white ${ubuntu.className}`}>
      <CuteNavbar />

      <div className="pointer-events-none absolute left-10 top-20 h-72 w-72 rounded-full bg-[#5865F2]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-96 w-96 rounded-full bg-[#7289DA]/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-32 md:px-8 lg:px-12">
        <section className="w-full min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5865F2]">
              DiscoWeb
            </p>
            <h1 className="mt-3 max-w-3xl text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Sunucu seçin
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[#cbd5db] md:text-base">
              Yönetmek istediğiniz Discord sunucusunu seçin. Yalnızca sahip olduğunuz veya admin
              olduğunuz sunucular listelenir.
            </p>

            <div className="mt-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white/90">Sunucularınız</h2>
                {lastUpdatedAt && (
                  <p className="mt-1 text-[11px] text-white/35">
                    Son güncelleme: {new Date(lastUpdatedAt).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>
              {!localBypass && (
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => void handleRefreshGuilds()}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {isRefreshing ? 'Yenileniyor…' : 'Yenile'}
                </button>
              )}
            </div>
            {refreshMessage && (
              <p className="mt-2 text-xs text-[#9eb0ff]">{refreshMessage}</p>
            )}

            <div
              className={`mt-4 ${
                guilds.length > 1
                  ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid grid-cols-1 gap-3 sm:max-w-xl'
              }`}
            >
              {guilds.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-7 text-left backdrop-blur-md sm:col-span-1">
                  <p className="text-sm font-medium text-white/80">Erişilebilir sunucu bulunamadı.</p>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Botun bulunduğu sunucularda admin veya sahip olduğunuzdan emin olun. Liste
                    eksikse yenileyin ya da botu sunucuya ekleyin.
                  </p>
                  {!localBypass && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <a
                        href={siteConfig.bot.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-full bg-[#5865F2] px-4 text-xs font-bold text-white transition hover:bg-[#4752c4]"
                      >
                        Botu sunucuya ekle
                      </a>
                      <button
                        type="button"
                        disabled={isRefreshing}
                        onClick={() => void handleRefreshGuilds()}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {isRefreshing ? 'Yenileniyor…' : 'Yenile'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                guilds.map((guild) => {
                  const canSetup = !guild.isSetup && guild.isOwner;
                  const canEnter = guild.isSetup || canSetup;
                  const roleLabel = guild.isOwner ? 'Sahip' : guild.isAdmin ? 'Yönetici' : 'Üye';

                  return (
                    <div
                      key={guild.id}
                      className={`group relative flex min-h-[5.5rem] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                        guild.isSetup
                          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                          : canSetup
                            ? 'border-[#5865F2]/35 bg-[#5865F2]/10 hover:bg-[#5865F2]/15'
                            : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-55'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!canEnter}
                        onClick={() => {
                          if (guild.isSetup) {
                            handleGuildSelect(guild.id);
                            return;
                          }
                          if (canSetup) handleSetupGuild(guild.id);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {guild.iconUrl ? (
                          <Image
                            src={guild.iconUrl}
                            alt=""
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#5865F2]/25 text-base font-bold text-white">
                            {guild.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-white">{guild.name}</h3>
                            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                              {roleLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-white/35">ID: {guild.id}</p>
                          {!guild.isSetup && canSetup && (
                            <p className="mt-1 text-xs text-[#c5cbff]">
                              Kurulum gerekli — tıklayarak başlatın
                            </p>
                          )}
                          {!guild.isSetup && !canSetup && (
                            <p className="mt-1 text-xs text-white/40">
                              Kurulum yalnızca sunucu sahibi tarafından yapılabilir
                            </p>
                          )}
                        </div>

                        {canEnter && (
                          <LuArrowRight className="hidden h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white sm:block" />
                        )}
                      </button>

                      {guild.isSetup && (guild.isOwner || guild.isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleSetupGuild(guild.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                          title="Sunucu ayarlarını güncelle"
                          aria-label="Sunucu ayarlarını güncelle"
                        >
                          <LuSettings className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {hasDeveloperAccess && (
              <div className="mt-12 border-t border-white/10 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                  Geliştirici
                </p>
                <Link
                  href="/developer"
                  className="group mt-4 flex max-w-xl items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/20 text-white transition group-hover:bg-[#5865F2]/35">
                    <LuCode className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">Developer paneli</span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/45">
                      Sistem yönetimi, sunucular ve araçlar
                    </span>
                  </span>
                  <LuArrowRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              </div>
            )}
        </section>

        <p className="mt-10 text-center text-xs text-[#99AAB5]/75">Copyright Discoweb 2026</p>
      </main>

      {showAgreementModal && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => {
              setShowAgreementModal(false);
              router.replace('/');
            }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Veri kullanım onayı"
            className="relative z-10 w-full max-w-lg overflow-visible rounded-[28px] border border-white/20 bg-[#5865F2] p-6 shadow-[0_28px_70px_rgba(88,101,242,0.55)]"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_42%)]" />
            <div className="relative z-20">
              <div className="mb-2.5 h-1 w-10 rounded-full bg-white/80" />
              <h3 className="text-xl font-black tracking-tight text-white">Veri kullanım onayı</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Giriş, sunucu doğrulama ve rol kontrolü için gerekli veriler işlenir.
              </p>

              <div className="mt-5 space-y-2.5">
                {AGREEMENT_OVERVIEW.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white/10 px-3 py-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs leading-5 text-white/70">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-l-2 border-white/35 pl-3 text-xs leading-5 text-white/65">
                {AGREEMENT_PROMISES.map((point) => (
                  <p key={point}>{point}</p>
                ))}
                <p className="mt-2">
                  Detaylar için{' '}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
                    Gizlilik
                  </Link>{' '}
                  ve{' '}
                  <Link href="/terms" className="underline underline-offset-2 hover:text-white">
                    Kullanım Koşulları
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAgreementModal(false);
                    router.replace('/');
                  }}
                  className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                >
                  Şimdi değil
                </button>
                <button
                  type="button"
                  disabled={isProcessingAgreement}
                  onClick={() => {
                    setIsProcessingAgreement(true);
                    try {
                      localStorage.setItem('discord_agreement_accepted', 'true');
                      if (agreementTargetHref) router.replace(agreementTargetHref);
                    } finally {
                      setIsProcessingAgreement(false);
                      setShowAgreementModal(false);
                      setAgreementTargetHref(null);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#5865F2] transition hover:bg-white/90 disabled:opacity-50"
                >
                  {isProcessingAgreement ? 'İşleniyor...' : 'Onayla ve devam et'}
                  {!isProcessingAgreement && <LuArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
