"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuDatabase, LuLoader, LuLock, LuShield } from 'react-icons/lu';

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

export default function SelectServerPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementTargetHref, setAgreementTargetHref] = useState<string | null>(null);
  const [isProcessingAgreement, setIsProcessingAgreement] = useState(false);

  const ensureAgreementAndRedirect = useCallback((href: string) => {
    if (typeof window !== 'undefined' && localStorage.getItem('discord_agreement_accepted') === 'true') {
      router.replace(href);
      return;
    }
    setAgreementTargetHref(href);
    setShowAgreementModal(true);
  }, [router]);

  const loginUrl = useMemo(() => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '';
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? process.env.NEXT_PUBLIC_REDIRECT_URI ?? '';
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=identify%20guilds`;
  }, []);

  useEffect(() => {
    const fetchUserInfo = async (): Promise<UserInfo | null> => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        console.log('SelectServer: /api/auth/me status:', response.status);

        if (response.ok) {
          const userData = (await response.json()) as UserInfo;
          console.log('SelectServer: User data received:', userData);
          setUser(userData);
          return userData;
        }

        console.error('SelectServer: Failed to fetch user data:', response.status);
        localStorage.removeItem('discordUser');
        localStorage.removeItem('adminGuilds');
        localStorage.removeItem('adminGuildsUpdatedAt');
        router.replace(loginUrl);
      } catch (error) {
        console.error('SelectServer: Failed to fetch user info:', error);
        localStorage.removeItem('discordUser');
        localStorage.removeItem('adminGuilds');
        localStorage.removeItem('adminGuildsUpdatedAt');
        router.replace(loginUrl);
      }
      return null;
    };

    const loadGuilds = async (currentUserId?: string | null) => {
      const adminGuilds = localStorage.getItem('adminGuilds');
      const updatedAt = localStorage.getItem('adminGuildsUpdatedAt');
      setLastUpdatedAt(updatedAt);

      if (!adminGuilds) {
        console.log('No adminGuilds found in localStorage');
        ensureAgreementAndRedirect(loginUrl);
        return;
      }

      try {
        const parsedGuilds = JSON.parse(adminGuilds) as Guild[];
        console.log('Loaded adminGuilds from localStorage:', parsedGuilds);

        const filteredGuilds: Guild[] = [];
        for (const guild of parsedGuilds) {
          try {
            const response = await fetch(`/api/discord/guild/${guild.id}/member-check`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });

            if (!response.ok) {
              console.warn(`Membership check failed for guild ${guild.id}, status=${response.status}`);
              continue;
            }

            const data = (await response.json()) as { isMember: boolean };
            if (!data.isMember) {
              console.log(`User is no longer a member of guild ${guild.name} (${guild.id})`);
              continue;
            }

            let isOwner = Boolean(guild.isOwner);
            let iconUrl = guild.iconUrl ?? null;

            const guildResponse = await fetch(`/api/discord/guild/${guild.id}`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });

            if (guildResponse.ok) {
              const guildData = (await guildResponse.json()) as { owner_id?: string; icon?: string | null };
              isOwner = Boolean(currentUserId) && guildData.owner_id === currentUserId;
              iconUrl = guildData.icon ?? null;
            }

            filteredGuilds.push({ ...guild, isOwner, iconUrl });
          } catch (error) {
            console.error(`Error checking membership for guild ${guild.id}:`, error);
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
              // ignore status fetch errors
            }
            return guild;
          }),
        );

        console.log('Filtered guilds (user is still member):', withSetupStatus);
        setGuilds(withSetupStatus);

        try {
          console.log('Checking developer access for auto-redirect...');
          const developerResponse = await fetch('/api/developer/check-access', {
            credentials: 'include',
            cache: 'no-store',
          });

          if (developerResponse.ok) {
            if (withSetupStatus.length > 0) {
              const firstGuild = withSetupStatus[0];
              document.cookie = `selected_guild_id=${firstGuild.id}; path=/`;
              localStorage.setItem('selectedGuildId', firstGuild.id);
            }
            router.replace('/developer');
            return;
          }
        } catch (error) {
          console.error('Developer access check failed:', error);
        }

        if (filteredGuilds.length === 0) {
          console.log('User is not a member of any guilds, redirecting to bot invite');
          router.replace('/auth/bot-invite');
          return;
        }
      } catch (error) {
        console.error('Sunucu bilgileri parse edilemedi:', error);
        router.replace('/auth/error');
        return;
      }

      setLoading(false);
    };

    const initPage = async () => {
      const userData = await fetchUserInfo();
      await loadGuilds(userData?.id ?? null);
    };

    initPage();
  }, [ensureAgreementAndRedirect, loginUrl, router]);

  const handleSetupGuild = (guildId: string) => {
    console.log('Setting up guild:', guildId);
    document.cookie = `selected_guild_id=${guildId}; path=/`;
    localStorage.setItem('selectedGuildId', guildId);
    router.replace('/auth/setup');
  };

  const handleGuildSelect = async (guildId: string) => {
    console.log('Selecting guild:', guildId);
    console.log('Available guilds:', guilds);

    document.cookie = `selected_guild_id=${guildId}; path=/`;
    localStorage.setItem('selectedGuildId', guildId);

    const selectedGuild = guilds.find((guild) => guild.id === guildId);
    console.log('Selected guild:', selectedGuild);

    const isAdmin = selectedGuild?.isAdmin || false;
    const verifyRoleId = selectedGuild?.verifyRoleId;

    console.log('isAdmin:', isAdmin, 'verifyRoleId:', verifyRoleId);

    try {
      console.log('Checking developer access...');
      const developerResponse = await fetch('/api/developer/check-access', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (developerResponse.ok) {
        document.cookie = `selected_guild_id=${guildId}; path=/`;
        localStorage.setItem('selectedGuildId', guildId);
        router.replace('/developer');
        return;
      }
    } catch (error) {
      console.error('Developer access check failed:', error);
    }

    if (isAdmin) {
      console.log('Redirecting to admin panel');
      document.cookie = `selected_guild_id=${guildId}; path=/`;
      localStorage.setItem('selectedGuildId', guildId);
      router.replace('/admin');
      return;
    }

    if (verifyRoleId) {
      try {
        const response = await fetch('/api/member/check-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId }),
        });

        if (response.ok) {
          const data = (await response.json()) as { hasRole: boolean };
          if (data.hasRole) {
            router.replace('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Rol kontrolü hatası:', error);
      }

      router.replace(`/auth/rules?pendingGuildId=${guildId}`);
      return;
    }

    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
        <div className="text-center">
          <LuLoader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-white/70">Sunucular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0d12] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-80px] top-[-40px] h-[320px] w-[320px] rounded-full bg-[#5865F2]/18 blur-[140px]" />
        <div className="absolute bottom-[-120px] right-[-60px] h-[360px] w-[360px] rounded-full bg-sky-400/12 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_50%)]" />
      </div>

      <nav className="border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-slate-600">
                <span className="text-base font-bold text-white">{user?.username?.charAt(0).toUpperCase() ?? 'U'}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{user?.username ?? 'Discord Kullanıcısı'}</p>
              <p className="text-xs text-white/50">Discord hesabınızla giriş yaptınız</p>
            </div>
          </div>
          <button
            onClick={() => router.replace('/dashboard')}
            className="text-xs text-white/50 transition-colors hover:text-white/70"
          >
            Ana sayfaya dön
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.25)]">
          <h1 className="mb-2 text-2xl font-bold text-white">Sunucu seçin</h1>
          <p className="text-sm text-white/70">İşlem yapmak istediğiniz sunucuyu seçin.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
            {lastUpdatedAt && <span>Son güncelleme: {new Date(lastUpdatedAt).toLocaleString('tr-TR')}</span>}
            <button
              onClick={() => ensureAgreementAndRedirect(loginUrl)}
              className="text-xs text-blue-400 transition-colors hover:text-blue-300"
            >
              Sunucuları yenile
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {guilds.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[#1a1d23] p-8 text-center">
              <p className="mb-4 text-white/70">Erişilebilir hiç sunucu bulunamadı.</p>
              <p className="text-sm text-white/50">Botun bulunduğu sunucularda üye olduğunuzdan emin olun.</p>
            </div>
          ) : (
            guilds.map((guild) => {
              const canSetup = !guild.isSetup && guild.isOwner;
              const canEnter = guild.isSetup || canSetup;
              const roleBadgeClass = guild.isOwner
                ? 'bg-fuchsia-500/85'
                : guild.isAdmin
                  ? 'bg-emerald-500/85'
                  : 'bg-sky-500/85';

              return (
                <button
                  key={guild.id}
                  onClick={() => {
                    if (guild.isSetup) {
                      handleGuildSelect(guild.id);
                      return;
                    }
                    if (canSetup) {
                      handleSetupGuild(guild.id);
                    }
                  }}
                  disabled={!canEnter}
                  className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                    guild.isSetup
                      ? 'border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:bg-white/[0.08]'
                      : canSetup
                        ? 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15'
                        : 'cursor-not-allowed border-white/5 bg-[#14171d] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {guild.iconUrl ? (
                        <Image
                          src={guild.iconUrl}
                          alt={guild.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-white/80">
                          {guild.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h3 className="font-medium text-white">{guild.name}</h3>
                        <p className="text-xs text-white/50">ID: {guild.id}</p>
                        {!guild.isSetup && canSetup && (
                          <p className="mt-1 text-xs text-orange-300">Bu sunucu kurulmamış. Tıklayarak kurulumu başlatabilirsiniz.</p>
                        )}
                        {!guild.isSetup && !canSetup && (
                          <p className="mt-1 text-xs text-white/50">Kurulum sadece sunucu sahibi tarafından yapılabilir.</p>
                        )}
                      </div>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${roleBadgeClass}`}>
                      {guild.isOwner ? 'Sahip' : guild.isAdmin ? 'Yönetici' : 'Üye'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </main>

      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0a1020]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#cbd5ff]">
              Güvenli Giriş Onayı
            </div>

            <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              Veri kullanım onayı
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-white/70">
              Giriş, sunucu doğrulama ve rol kontrolü için gerekli veriler işlenir.
            </p>

            <div className="mt-4 space-y-2.5">
              {AGREEMENT_OVERVIEW.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/15 text-[#d5dbff]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-white/65">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="space-y-1.5 text-xs text-white/72">
                {AGREEMENT_PROMISES.map((point) => (
                  <p key={point}>• {point}</p>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-white/60">
                Detaylar için{' '}
                <Link href="/privacy" className="text-[#9eb0ff] hover:text-white">
                  Gizlilik
                </Link>{' '}
                ve{' '}
                <Link href="/terms" className="text-[#9eb0ff] hover:text-white">
                  Kullanım Koşulları
                </Link>
                .
              </p>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setShowAgreementModal(false);
                  router.replace('/');
                }}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Şimdi değil
              </button>
              <button
                onClick={() => {
                  setIsProcessingAgreement(true);
                  try {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('discord_agreement_accepted', 'true');
                    }
                    if (agreementTargetHref) {
                      router.replace(agreementTargetHref);
                    }
                  } finally {
                    setIsProcessingAgreement(false);
                    setShowAgreementModal(false);
                    setAgreementTargetHref(null);
                  }
                }}
                disabled={isProcessingAgreement}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5865F2] to-[#7289DA] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {isProcessingAgreement ? 'İşleniyor...' : 'Onayla ve devam et'}
                {!isProcessingAgreement && <LuArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
