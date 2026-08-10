'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { LuShield, LuX, LuLoader, LuChevronRight, LuChevronLeft, LuCheck, LuMessageSquare, LuMic, LuTag, LuZap, LuSettings, LuUsers, LuLock, LuRocket, LuWrench, LuHardDrive, LuServer, LuChevronDown } from 'react-icons/lu';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { lockBodyScroll } from '@/lib/lockBodyScroll';
import staffRoleGif from './staff-role.gif';
import {
  LOCAL_DEV_MOCK_GUILD_NAME,
  LOCAL_DEV_MOCK_LOG_GUILD_ID,
  LOCAL_DEV_MOCK_ROLES,
} from '@/lib/localDevMocks';

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  permissions: string;
  position: number;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
}

type DropdownPos = {
  maxHeight: number;
  width: number;
};

function roleColorHex(color: number) {
  return color ? `#${color.toString(16).padStart(6, '0')}` : '#99AAB5';
}

function isAdminCapableRole(role: DiscordRole) {
  const perms = Number.parseInt(role.permissions, 10);
  return Boolean((perms & 0x8) || (perms & 0x20) || (perms & 0x10000000));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function measureCenteredPanel(): DropdownPos {
  const viewportPad = 24;
  return {
    width: Math.min(420, window.innerWidth - viewportPad * 2),
    maxHeight: Math.min(360, window.innerHeight - viewportPad * 2),
  };
}

type RoleSelectAccent = 'blue' | 'emerald';

function RoleSelectDropdown({
  label,
  hint,
  placeholder,
  icon: Icon,
  iconSrc,
  accent,
  roles,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  icon?: typeof LuShield;
  iconSrc?: string;
  accent: RoleSelectAccent;
  roles: DiscordRole[];
  value: string;
  onChange: (roleId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = roles.find((role) => role.id === value) ?? null;
  const options = useMemo(
    () => roles.filter((role) => role.name !== '@everyone'),
    [roles],
  );

  const accentIcon = accent === 'blue' ? 'text-[#5865F2]' : 'text-[#5865F2]';

  useEffect(() => {
    if (!open) return undefined;
    return lockBodyScroll();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => setPos(measureCenteredPanel());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div>
      <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-white/80">
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconSrc}
            alt=""
            draggable={false}
            className="h-6 w-6 shrink-0 object-contain"
          />
        ) : Icon ? (
          <Icon className={`h-4 w-4 ${accentIcon}`} />
        ) : null}
        {label}
      </label>

      <div className="relative" ref={anchorRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
            open
              ? 'border-[#5865F2]/50 bg-[#5865F2]/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
          }`}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: roleColorHex(selected.color) }}
              />
              <span className="truncate font-medium text-white">{selected.name}</span>
            </span>
          ) : (
            <span className="text-white/40">{placeholder}</span>
          )}
          <LuChevronDown
            className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 ${
              open ? 'rotate-180 text-[#5865F2]' : ''
            }`}
          />
        </button>
      </div>

      <p className="mt-2 ml-1 text-xs text-white/30">{hint}</p>

      {open &&
        pos &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Kapat"
              className="fixed inset-0 z-[190] cursor-default bg-black/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <div className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center px-6">
              <div className="mb-5 flex max-w-full items-center justify-center gap-2.5 px-4">
                {iconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconSrc}
                    alt=""
                    draggable={false}
                    className="h-6 w-6 shrink-0 object-contain"
                  />
                ) : Icon ? (
                  <Icon className={`h-5 w-5 shrink-0 ${accentIcon}`} />
                ) : null}
                <p className="truncate text-center text-base font-semibold tracking-wide text-white/90 sm:text-lg">
                  {label}
                </p>
              </div>
              <div
                ref={menuRef}
                role="listbox"
                style={{ width: pos.width }}
                className="pointer-events-auto max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#12141d]/95 shadow-2xl backdrop-blur-md"
              >
                <div
                  className="custom-scrollbar space-y-1 overflow-y-auto overscroll-contain p-2"
                  style={{ maxHeight: pos.maxHeight }}
                >
                  {options.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-white/40">Rol bulunamadı</p>
                  ) : (
                    options.map((role) => {
                      const isSelected = role.id === value;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onChange(role.id);
                            setOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#5865F2]/30 text-white'
                              : 'text-white/75 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: roleColorHex(role.color) }}
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">{role.name}</span>
                          {isSelected && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#5865F2]" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

const STEPS = [
  { id: 'roles',   title: 'Roller',           icon: LuShield,      description: 'Admin ve üye rollerini seçin' },
  { id: 'logs',    title: 'Log Yönetimi',     icon: LuHardDrive,   description: 'Logların yazılacağı yer' },
  { id: 'economy', title: 'Kazanç',            icon: LuSettings,    description: 'Papel kazanç oranları' },
  { id: 'bonuses', title: 'Bonuslar',          icon: LuZap,         description: 'Tag ve boost ek kazançları' },
  { id: 'confirm', title: 'Kurulum',           icon: LuCheck,       description: 'Onayla ve başlat' },
];

function readSelectedGuildId(): string | null {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const guildCookie = cookies.find((row) => row.startsWith('selected_guild_id='));
  if (guildCookie) return guildCookie.split('=')[1] || null;
  return localStorage.getItem('selectedGuildId');
}

export default function SetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<DiscordUser | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('discordUser');
      if (storedUser) {
        try { return JSON.parse(storedUser); } catch { return null; }
      }
    }
    return null;
  });

  const [guildId, setGuildId] = useState<string | null>(() => readSelectedGuildId());

  const [guildName, setGuildName] = useState<string>(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient() ? LOCAL_DEV_MOCK_GUILD_NAME : '',
  );
  const [guildIcon, setGuildIcon] = useState<string | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient()
      ? (LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[])
      : [],
  );
  
  // States
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>('');
  const [selectedVerifyRole, setSelectedVerifyRole] = useState<string>('');
  
  const [logMode, setLogMode] = useState<'current' | 'dedicated'>('current');
  const [targetGuildId, setTargetGuildId] = useState<string>(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient() ? LOCAL_DEV_MOCK_LOG_GUILD_ID : '',
  );
  const [targetGuildStatus, setTargetGuildStatus] = useState<
    'idle' | 'checking' | 'ok' | 'invalid' | 'not_found'
  >(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient() ? 'ok' : 'idle',
  );
  const [targetGuildName, setTargetGuildName] = useState<string | null>(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient() ? 'Local Log Server' : null,
  );

  // Default economy settings for premium feel (pre-filled)
  const [messageEarnEnabled, setMessageEarnEnabled] = useState(true);
  const [voiceEarnEnabled, setVoiceEarnEnabled] = useState(true);
  const [earnPerMessage, setEarnPerMessage] = useState('1');
  const [earnPerVoiceMinute, setEarnPerVoiceMinute] = useState('0.5');
  
  const [tagBonusMessage, setTagBonusMessage] = useState('0.5');
  const [tagBonusVoice, setTagBonusVoice] = useState('0.25');
  const [boosterBonusMessage, setBoosterBonusMessage] = useState('1');
  const [boosterBonusVoice, setBoosterBonusVoice] = useState('0.5');
  const [tagBonusEnabled, setTagBonusEnabled] = useState(true);
  const [boosterBonusEnabled, setBoosterBonusEnabled] = useState(true);

  // Flow control
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [setupStarted, setSetupStarted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(() =>
    typeof window !== 'undefined' && isLocalDevBypassClient(),
  );
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [error, setError] = useState<string>('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const adminRoles = useMemo(() => roles.filter(isAdminCapableRole), [roles]);
  const memberRoles = useMemo(
    () =>
      roles.filter(
        (role) => role.name !== '@everyone' && !isAdminCapableRole(role),
      ),
    [roles],
  );

  useEffect(() => {
    if (!selectedVerifyRole) return;
    if (!memberRoles.some((role) => role.id === selectedVerifyRole)) {
      setSelectedVerifyRole('');
    }
  }, [memberRoles, selectedVerifyRole]);

  useEffect(() => {
    if (logMode !== 'dedicated') {
      setTargetGuildStatus('idle');
      setTargetGuildName(null);
      return;
    }

    const trimmed = targetGuildId.trim();
    if (!trimmed) {
      setTargetGuildStatus('idle');
      setTargetGuildName(null);
      return;
    }

    if (!/^\d{17,20}$/.test(trimmed)) {
      setTargetGuildStatus('invalid');
      setTargetGuildName(null);
      return;
    }

    let cancelled = false;
    setTargetGuildStatus('checking');
    setTargetGuildName(null);

    const timer = window.setTimeout(async () => {
      try {
        if (isLocalDevBypassClient()) {
          if (cancelled) return;
          setTargetGuildStatus('ok');
          setTargetGuildName(
            trimmed === LOCAL_DEV_MOCK_LOG_GUILD_ID ? 'Local Log Server' : 'Local Development',
          );
          return;
        }

        const response = await fetch(`/api/discord/guild/${trimmed}?mode=bot`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (cancelled) return;

        if (!response.ok) {
          setTargetGuildStatus(response.status === 400 ? 'invalid' : 'not_found');
          setTargetGuildName(null);
          return;
        }

        const data = (await response.json()) as { name?: string };
        setTargetGuildStatus('ok');
        setTargetGuildName(data.name?.trim() || trimmed);
      } catch {
        if (cancelled) return;
        setTargetGuildStatus('not_found');
        setTargetGuildName(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [logMode, targetGuildId]);

  useEffect(() => {
    const checkPermissionsAndLoadData = async () => {
      let resolvedGuildId = guildId ?? readSelectedGuildId();
      if (resolvedGuildId && resolvedGuildId !== guildId) {
        document.cookie = `selected_guild_id=${resolvedGuildId}; path=/`;
        setGuildId(resolvedGuildId);
      }

      let resolvedUser = user;
      let localBypass = isLocalDevBypassClient();

      if (localBypass) {
        setRoles(LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[]);
        setIsAdmin(true);
        setGuildName((prev) => prev || LOCAL_DEV_MOCK_GUILD_NAME);
        if (!targetGuildId) setTargetGuildId(LOCAL_DEV_MOCK_LOG_GUILD_ID);
      }

      try {
        const meResponse = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (meResponse.ok) {
          const me = (await meResponse.json()) as {
            id?: string;
            username?: string | null;
            avatar?: string | null;
            localDevBypass?: boolean;
          };
          if (me.id) {
            resolvedUser = {
              id: me.id,
              username: me.username ?? 'User',
              avatar: me.avatar ?? null,
              discriminator: '0',
            };
            setUser(resolvedUser);
            localStorage.setItem('discordUser', JSON.stringify(resolvedUser));
            if (me.localDevBypass) {
              localBypass = true;
              setRoles(LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[]);
              setIsAdmin(true);
              setGuildName((prev) => prev || LOCAL_DEV_MOCK_GUILD_NAME);
              if (!targetGuildId) setTargetGuildId(LOCAL_DEV_MOCK_LOG_GUILD_ID);
            }
          }
        }
      } catch {
        // keep stored user if available
      }

      if (!resolvedGuildId || !resolvedUser) {
        router.replace('/auth/select-server');
        return;
      }

      try {
        const guildResponse = await fetch(`/api/discord/guild/${resolvedGuildId}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!guildResponse.ok) {
          if (localBypass) {
            try {
              const stored = localStorage.getItem('adminGuilds');
              const parsed = stored
                ? (JSON.parse(stored) as Array<{ id: string; name?: string; iconUrl?: string | null }>)
                : [];
              const match = parsed.find((g) => g.id === resolvedGuildId);
              setGuildName(match?.name ?? LOCAL_DEV_MOCK_GUILD_NAME);
              setGuildIcon(match?.iconUrl ?? null);
            } catch {
              setGuildName(LOCAL_DEV_MOCK_GUILD_NAME);
            }
            setRoles(LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[]);
            setIsAdmin(true);
            if (!targetGuildId) setTargetGuildId(LOCAL_DEV_MOCK_LOG_GUILD_ID);
          } else {
            throw new Error('Sunucu bilgileri alınamadı');
          }
        } else {
          const guildData = (await guildResponse.json()) as {
            name?: string;
            icon?: string | null;
            owner_id?: string | null;
          };
          setGuildName(guildData.name ?? (localBypass ? LOCAL_DEV_MOCK_GUILD_NAME : ''));
          setGuildIcon(guildData.icon ?? null);

          const rolesResponse = await fetch(`/api/discord/guild/${resolvedGuildId}/roles`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          if (!rolesResponse.ok) {
            if (localBypass) {
              setRoles(LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[]);
              setIsAdmin(true);
            } else {
              throw new Error('Sunucu rolleri alınamadı');
            }
          } else {
            const rolesData = (await rolesResponse.json()) as DiscordRole[];
            setRoles(
              rolesData.length > 0
                ? rolesData
                : localBypass
                  ? (LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[])
                  : rolesData,
            );

            if (localBypass) {
              setIsAdmin(true);
              if (!targetGuildId) setTargetGuildId(LOCAL_DEV_MOCK_LOG_GUILD_ID);
            } else {
              const isServerOwner = Boolean(resolvedUser.id) && guildData.owner_id === resolvedUser.id;
              const adminRolesForPerm = rolesData.filter(isAdminCapableRole);

              const userRolesResponse = await fetch(
                `/api/discord/guild/${resolvedGuildId}/members/${resolvedUser.id}`,
                { method: 'GET', credentials: 'include', cache: 'no-store' },
              );

              let userHasAdminRole = false;
              if (userRolesResponse.ok) {
                const userData = (await userRolesResponse.json()) as { roles?: string[] };
                userHasAdminRole = (userData.roles ?? []).some((roleId) =>
                  adminRolesForPerm.some((adminRole) => adminRole.id === roleId),
                );
              }

              setIsAdmin(isServerOwner || userHasAdminRole);

              if (!isServerOwner && adminRolesForPerm.length === 0) {
                setError('Bu sunucuda bot kurulumu aktif değil. Sunucu sahibi veya yönetici ile iletişime geçin.');
              }
            }
          }
        }

        if (!localBypass) {
          const setupStatusResponse = await fetch('/api/setup/server', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          if (setupStatusResponse.ok) {
            const setupStatus = await setupStatusResponse.json();
            if (setupStatus?.is_setup) {
              setAlreadySetup(true);
              // Pre-fill existing data if modifying setup
              if (setupStatus.admin_role_id) setSelectedAdminRole(setupStatus.admin_role_id);
              if (setupStatus.verify_role_id) setSelectedVerifyRole(setupStatus.verify_role_id);
              if (setupStatus.earn_per_message != null) setEarnPerMessage(String(setupStatus.earn_per_message));
              if (setupStatus.earn_per_voice_minute != null) setEarnPerVoiceMinute(String(setupStatus.earn_per_voice_minute));
              setMessageEarnEnabled(!!setupStatus.message_earn_enabled);
              setVoiceEarnEnabled(!!setupStatus.voice_earn_enabled);
              if (setupStatus.tag_bonus_message != null) setTagBonusMessage(String(setupStatus.tag_bonus_message));
              if (setupStatus.tag_bonus_voice != null) setTagBonusVoice(String(setupStatus.tag_bonus_voice));
              if (setupStatus.booster_bonus_message != null) setBoosterBonusMessage(String(setupStatus.booster_bonus_message));
              if (setupStatus.booster_bonus_voice != null) setBoosterBonusVoice(String(setupStatus.booster_bonus_voice));
              setTagBonusEnabled(
                Number(setupStatus.tag_bonus_message ?? 0) > 0 ||
                  Number(setupStatus.tag_bonus_voice ?? 0) > 0,
              );
              setBoosterBonusEnabled(
                Number(setupStatus.booster_bonus_message ?? 0) > 0 ||
                  Number(setupStatus.booster_bonus_voice ?? 0) > 0,
              );
            }
          }
        }
      } catch (error) {
        console.error('Setup data loading error:', error);
        if (isLocalDevBypassClient()) {
          setRoles(LOCAL_DEV_MOCK_ROLES as unknown as DiscordRole[]);
          setIsAdmin(true);
          setGuildName((prev) => prev || LOCAL_DEV_MOCK_GUILD_NAME);
          setError('');
        } else {
          setError('Sunucu bilgileri yüklenirken hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };

    void checkPermissionsAndLoadData();
    // Resolve auth + guild once on mount; user/guildId are refreshed inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSetup = async () => {
    if (!selectedAdminRole || !selectedVerifyRole) {
      setError('Lütfen hem admin hem de verify rolünü seçin.');
      return;
    }
    if (!guildId) {
      setError('Sunucu bilgisi bulunamadı.');
      return;
    }

    setSettingUp(true);
    setSetupStarted(true);
    setError('');

    setTerminalLines([
      '> İzinler doğrulanıyor...',
      '> Bot API entegrasyonu başlatılıyor...',
      '> Webhook servisleri hazırlanıyor...',
    ]);

    try {
      setTerminalLines((prev) => [...prev, '> Log sunucusu yapılandırılıyor...']);

      if (isLocalDevBypassClient()) {
        await sleep(500);
        setTerminalLines((prev) => [...prev, '> Örnek roller bağlanıyor...']);
        await sleep(450);
        setTerminalLines((prev) => [...prev, '> Ekonomi ayarları yazılıyor...']);
        await sleep(450);
        setTerminalLines((prev) => [...prev, '> Bonus kuralları uygulanıyor...']);
        await sleep(450);
        setTerminalLines((prev) => [
          ...prev,
          '> Localhost mock kurulum tamamlandı.',
          '> KURULUM BAŞARILI!',
        ]);
        setSetupCompleted(true);
        setAlreadySetup(true);
        try {
          const stored = localStorage.getItem('adminGuilds');
          if (stored) {
            const parsed = JSON.parse(stored) as Array<{ id: string; isSetup?: boolean }>;
            const updated = parsed.map((g) => (g.id === guildId ? { ...g, isSetup: true } : g));
            localStorage.setItem('adminGuilds', JSON.stringify(updated));
          }
        } catch {
          // ignore
        }
        setRedirectCountdown(3);
        return;
      }

      const response = await fetch('/api/setup/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          targetGuildId: logMode === 'dedicated' ? targetGuildId : undefined,
          adminRoleId: selectedAdminRole,
          verifyRoleId: selectedVerifyRole,
          messageEarnEnabled,
          voiceEarnEnabled,
          earnPerMessage: messageEarnEnabled ? Number(earnPerMessage) : 0,
          earnPerVoiceMinute: voiceEarnEnabled ? Number(earnPerVoiceMinute) : 0,
          tagBonusMessage: tagBonusEnabled ? Number(tagBonusMessage) : 0,
          tagBonusVoice: tagBonusEnabled ? Number(tagBonusVoice) : 0,
          boosterBonusMessage: boosterBonusEnabled ? Number(boosterBonusMessage) : 0,
          boosterBonusVoice: boosterBonusEnabled ? Number(boosterBonusVoice) : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kurulum başarısız');
      }

      const resData = await response.json();

      setTerminalLines((prev) => [
        ...prev, 
        `> Log Kurulumu: ${resData.logSetupSuccess ? 'BAŞARILI' : 'BAŞARISIZ (Lütfen botun sunucuda olduğundan emin olun)'}`,
        '> Veritabanı kayıtları oluşturuldu...',
        '> Kurulum başarıyla tamamlandı!', 
        '> Admin Paneline yönlendiriliyorsunuz...'
      ]);
      
      setSetupCompleted(true);
      setAlreadySetup(true);
      setRedirectCountdown(4);

      try {
        const stored = localStorage.getItem('adminGuilds');
        if (stored) {
          const parsed = JSON.parse(stored) as Array<{ id: string; isSetup?: boolean }>;
          const updated = parsed.map((g) => (g.id === guildId ? { ...g, isSetup: true } : g));
          localStorage.setItem('adminGuilds', JSON.stringify(updated));
        }
      } catch {}
    } catch (setupError) {
      console.error('Setup error:', setupError);
      setError(setupError instanceof Error ? setupError.message : 'Kurulum sırasında hata oluştu.');
      setTerminalLines((prev) => [...prev, '> KURULUM BAŞARISIZ!']);
    } finally {
      setSettingUp(false);
    }
  };

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      router.replace('/admin');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const canGoNext =
    currentStep === 0
      ? Boolean(selectedAdminRole && selectedVerifyRole)
      : currentStep === 1 && logMode === 'dedicated'
        ? targetGuildStatus === 'ok'
        : true;

  const handleNext = () => {
    if (!canGoNext) return;
    setError('');
    setCurrentStep((c) => Math.min(STEPS.length - 1, c + 1));
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020204] text-white">
        <div className="relative">
          <div className="absolute -inset-20 rounded-full bg-[#5865F2]/20 blur-3xl animate-pulse" />
          <div className="relative text-center">
            <LuLoader className="w-12 h-12 animate-spin mx-auto mb-4 text-[#5865F2]" />
            <p className="text-sm font-medium tracking-wide text-white/70">Sistem Hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ACCESS DENIED ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020204] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
        <div className="relative z-10 p-8 rounded-3xl border border-red-500/20 bg-black/40 backdrop-blur-xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <LuShield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Erişim Reddedildi</h1>
          <p className="text-white/60 mb-8 text-sm">Kurulum için sunucu sahibi veya yönetici olmalısınız.</p>
          <button onClick={() => router.replace('/auth/select-server')} className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all border border-white/10 hover:border-white/20">
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN SETUP PAGE ---
  return (
    <div className="min-h-screen bg-[#020204] text-white relative overflow-x-hidden flex flex-col font-sans">
      {/* Background glow effects - Professional Glassmorphism */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full bg-[#5865F2]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-[#7289DA]/10 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {guildIcon ? (
              <Image src={guildIcon} alt={guildName || 'Sunucu'} width={44} height={44} className="h-11 w-11 rounded-2xl border border-white/10 object-cover shadow-lg" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white/80 shadow-lg">
                {guildName ? guildName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div>
              <p className="text-base font-bold text-white tracking-tight">{guildName}</p>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] animate-pulse" />
                {alreadySetup ? 'Güncelleme Aşaması' : 'Kurulum Aşaması'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.replace('/auth/select-server')}
              className="text-sm font-medium text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2"
            >
              İptal
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 items-start md:grid-cols-[280px_1fr] gap-8">
          
          {/* Sidebar / Steps */}
          <div className="hidden md:flex flex-col gap-2 self-start">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4 px-3">Adımlar</h2>
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={step.id} className={`flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#5865F2]/10 border border-[#5865F2]/20 shadow-[0_0_20px_rgba(88,101,242,0.1)]' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-[#5865F2] text-white shadow-[0_0_15px_rgba(88,101,242,0.5)]' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>
                    {isDone ? <LuCheck className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-white/80'}`}>{step.title}</h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="bg-[#0c0e14]/80 backdrop-blur-2xl border border-white/10 rounded-[1.75rem] shadow-2xl p-5 sm:p-7 flex flex-col self-start">
            <div>
              {/* --- STEP 0: ROLES --- */}
              {currentStep === 0 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="text-xl font-bold text-white mb-2">Sistem Rolleri</h2>
                  <p className="text-sm text-white/50 mb-6">Admin paneli ve üye erişimi için Discord rollerini seçin.</p>

                  <div className="space-y-5">
                    <RoleSelectDropdown
                      label="Yönetici Rolü"
                      hint="Bu rolle Admin Paneline girilir."
                      placeholder="Admin rolünü seçin..."
                      iconSrc={staffRoleGif.src}
                      accent="blue"
                      roles={adminRoles}
                      value={selectedAdminRole}
                      onChange={setSelectedAdminRole}
                    />
                    <RoleSelectDropdown
                      label="Üye Rolü"
                      hint="Kayıtlı üyelerin temel rolü; papel kazanır."
                      placeholder="Üye rolünü seçin..."
                      icon={LuUsers}
                      accent="blue"
                      roles={memberRoles}
                      value={selectedVerifyRole}
                      onChange={setSelectedVerifyRole}
                    />
                  </div>
                </div>
              )}

              {/* --- STEP 1: LOG MANAGEMENT --- */}
              {currentStep === 1 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="text-lg font-bold text-white mb-1">Log Yönetimi</h2>
                  <p className="text-sm text-white/50 mb-4">İşlem logları nereye yazılsın?</p>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setLogMode('current')}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                        logMode === 'current'
                          ? 'border-[#5865F2] bg-[#5865F2]/10 ring-1 ring-[#5865F2]/40'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          logMode === 'current' ? 'border-[#5865F2]' : 'border-white/30'
                        }`}
                      >
                        {logMode === 'current' && <div className="h-2 w-2 rounded-full bg-[#5865F2]" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                          Bu sunucuya kur
                          <span className="rounded-md bg-[#5865F2]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#5865F2]">
                            Önerilen
                          </span>
                        </h3>
                        <p className="mt-0.5 text-xs text-white/45">DiscoWeb Logs kategorisi burada açılır.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogMode('dedicated')}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                        logMode === 'dedicated'
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          logMode === 'dedicated' ? 'border-indigo-500' : 'border-white/30'
                        }`}
                      >
                        {logMode === 'dedicated' && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                      </div>
                      <div className="min-w-0 w-full">
                        <h3 className="text-sm font-semibold text-white">Ayrı log sunucusu</h3>
                        <p className="mt-0.5 text-xs text-white/45">Loglar başka bir Discord sunucusuna gider.</p>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            logMode === 'dedicated' ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <label className="mb-1.5 block text-[11px] font-medium text-indigo-300">
                            Hedef sunucu ID
                          </label>
                          <input
                            type="text"
                            placeholder="123456789012345678"
                            value={targetGuildId}
                            onChange={(e) => setTargetGuildId(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full rounded-lg border bg-black/40 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:ring-1 ${
                              targetGuildStatus === 'ok'
                                ? 'border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500'
                                : targetGuildStatus === 'invalid' || targetGuildStatus === 'not_found'
                                  ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500'
                                  : 'border-indigo-500/30 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                          />
                          <p
                            className={`mt-1.5 flex items-center gap-1 text-[10px] ${
                              targetGuildStatus === 'ok'
                                ? 'text-emerald-400/90'
                                : targetGuildStatus === 'invalid' || targetGuildStatus === 'not_found'
                                  ? 'text-red-400/90'
                                  : targetGuildStatus === 'checking'
                                    ? 'text-indigo-300/70'
                                    : 'text-indigo-300/60'
                            }`}
                          >
                            {targetGuildStatus === 'checking' && (
                              <>
                                <LuLoader className="h-3 w-3 animate-spin" /> Kontrol ediliyor…
                              </>
                            )}
                            {targetGuildStatus === 'ok' && (
                              <>
                                <LuCheck className="h-3 w-3" /> Sunucu bulundu
                                {targetGuildName ? `: ${targetGuildName}` : ''}
                              </>
                            )}
                            {targetGuildStatus === 'invalid' && (
                              <>
                                <LuX className="h-3 w-3" /> Geçersiz sunucu ID
                              </>
                            )}
                            {targetGuildStatus === 'not_found' && (
                              <>
                                <LuX className="h-3 w-3" /> Bu ID ile sunucu bulunamadı veya bot o sunucuda değil
                              </>
                            )}
                            {targetGuildStatus === 'idle' && (
                              <>
                                <LuCheck className="h-3 w-3" /> Bot o sunucuda olmalı.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2.5">
                      <LuLock className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                      <div>
                        <h4 className="text-xs font-semibold text-orange-300">Dikkat</h4>
                        <p className="mt-0.5 text-[11px] leading-snug text-orange-200/70">
                          Kurulumda eski log kanalları silinip yeniden açılabilir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 2: ECONOMY --- */}
              {currentStep === 2 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="text-lg font-bold text-white mb-1">Ekonomi</h2>
                  <p className="mb-4 text-sm text-white/50">Mesaj ve ses için papel oranlarını ayarlayın.</p>

                  <div className="space-y-2.5">
                    <div
                      className={`rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        messageEarnEnabled
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            messageEarnEnabled
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          <LuMessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">Mesaj Kazancı</h3>
                          <p className="text-[11px] text-white/45">Her mesaj için</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMessageEarnEnabled(!messageEarnEnabled)}
                          className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
                            messageEarnEnabled ? 'bg-emerald-500' : 'bg-white/20'
                          }`}
                          aria-pressed={messageEarnEnabled}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              messageEarnEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {messageEarnEnabled && (
                        <div className="mt-2.5 flex items-center gap-2.5 pl-11">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={earnPerMessage}
                            onChange={(e) => setEarnPerMessage(e.target.value)}
                            className="w-20 rounded-lg border border-emerald-500/30 bg-black/40 px-2.5 py-1.5 text-center text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                          />
                          <span className="text-xs text-white/50">Papel / mesaj</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        voiceEarnEnabled
                          ? 'border-indigo-500/30 bg-indigo-500/5'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            voiceEarnEnabled
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          <LuMic className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">Ses Kazancı</h3>
                          <p className="text-[11px] text-white/45">Her ses dakikası için</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVoiceEarnEnabled(!voiceEarnEnabled)}
                          className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
                            voiceEarnEnabled ? 'bg-indigo-500' : 'bg-white/20'
                          }`}
                          aria-pressed={voiceEarnEnabled}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              voiceEarnEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {voiceEarnEnabled && (
                        <div className="mt-2.5 flex items-center gap-2.5 pl-11">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={earnPerVoiceMinute}
                            onChange={(e) => setEarnPerVoiceMinute(e.target.value)}
                            className="w-20 rounded-lg border border-indigo-500/30 bg-black/40 px-2.5 py-1.5 text-center text-sm font-bold text-indigo-400 focus:border-indigo-500 focus:outline-none"
                          />
                          <span className="text-xs text-white/50">Papel / dk</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 3: BONUSES --- */}
              {currentStep === 3 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="mb-1 text-lg font-bold text-white">Bonuslar</h2>
                  <p className="mb-4 text-sm text-white/50">Tag ve boost için ekstra papel.</p>

                  <div className="space-y-2.5">
                    <div
                      className={`rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        tagBonusEnabled
                          ? 'border-purple-500/30 bg-purple-500/5'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            tagBonusEnabled
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          <LuTag className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">Tag Bonusu</h3>
                          <p className="text-[11px] text-white/45">İsminde sunucu tagı olanlar</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTagBonusEnabled(!tagBonusEnabled)}
                          className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
                            tagBonusEnabled ? 'bg-purple-500' : 'bg-white/20'
                          }`}
                          aria-pressed={tagBonusEnabled}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              tagBonusEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {tagBonusEnabled && (
                        <div className="mt-2.5 grid grid-cols-2 gap-2 pl-11">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-white/40">Mesaj</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={tagBonusMessage}
                              onChange={(e) => setTagBonusMessage(e.target.value)}
                              className="w-full rounded-lg border border-purple-500/30 bg-black/40 px-2 py-1.5 text-center text-sm font-bold text-purple-300 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-white/40">Ses / dk</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={tagBonusVoice}
                              onChange={(e) => setTagBonusVoice(e.target.value)}
                              className="w-full rounded-lg border border-purple-500/30 bg-black/40 px-2 py-1.5 text-center text-sm font-bold text-purple-300 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        boosterBonusEnabled
                          ? 'border-pink-500/30 bg-pink-500/5'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            boosterBonusEnabled
                              ? 'bg-pink-500/20 text-pink-400'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          <LuRocket className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">Boost Bonusu</h3>
                          <p className="text-[11px] text-white/45">Sunucuyu boostlayanlar</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBoosterBonusEnabled(!boosterBonusEnabled)}
                          className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
                            boosterBonusEnabled ? 'bg-pink-500' : 'bg-white/20'
                          }`}
                          aria-pressed={boosterBonusEnabled}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              boosterBonusEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {boosterBonusEnabled && (
                        <div className="mt-2.5 grid grid-cols-2 gap-2 pl-11">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-white/40">Mesaj</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={boosterBonusMessage}
                              onChange={(e) => setBoosterBonusMessage(e.target.value)}
                              className="w-full rounded-lg border border-pink-500/30 bg-black/40 px-2 py-1.5 text-center text-sm font-bold text-pink-300 focus:border-pink-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-white/40">Ses / dk</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={boosterBonusVoice}
                              onChange={(e) => setBoosterBonusVoice(e.target.value)}
                              className="w-full rounded-lg border border-pink-500/30 bg-black/40 px-2 py-1.5 text-center text-sm font-bold text-pink-300 focus:border-pink-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 4: CONFIRM & RUN --- */}
              {currentStep === 4 && (
                <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col">
                  {!setupStarted ? (
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-[#5865F2]/10 flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[#5865F2]/20 border-t-[#5865F2] animate-spin-slow" />
                        <LuServer className="w-10 h-10 text-[#5865F2]" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">Hazır</h2>
                      <p className="text-white/60 mb-8 max-w-md mx-auto">Ayarlar tamam. Başlatınca sunucuya uygulanır.</p>
                      <button onClick={handleSetup} className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 px-12 rounded-2xl transition-all shadow-[0_0_30px_rgba(88,101,242,0.4)] hover:shadow-[0_0_50px_rgba(88,101,242,0.6)] hover:-translate-y-1">
                        Kurulumu Başlat
                      </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <h2 className="text-xl font-bold text-white mb-6 text-center">Kurulum sürüyor</h2>
                      
                      {/* Premium Terminal / Logger */}
                      <div className="bg-[#020204] rounded-2xl border border-white/10 p-6 font-mono text-sm h-64 overflow-hidden relative shadow-inner">
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#020204] to-transparent z-10" />
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#020204] to-transparent z-10" />
                        
                        <div className="flex flex-col justify-end h-full space-y-2 relative z-0">
                          {terminalLines.map((line, i) => {
                            const isError = line.includes('BAŞARISIZ');
                            const isSuccess = line.includes('BAŞARILI') || line.includes('tamamlandı');
                            return (
                              <div key={i} className={`animate-[slideUp_0.3s_ease-out] flex items-start gap-2 ${isError ? 'text-red-400' : isSuccess ? 'text-emerald-400 font-bold' : 'text-indigo-300'}`}>
                                <span className="opacity-50 select-none">~</span>
                                <span>{line}</span>
                              </div>
                            );
                          })}
                          {!setupCompleted && !error && (
                            <div className="flex items-center gap-2 text-indigo-300/50 mt-2">
                              <span className="w-2 h-4 bg-indigo-300 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            {!setupStarted && (
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <button 
                  onClick={() => setCurrentStep(c => Math.max(0, c - 1))}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}`}
                >
                  <LuChevronLeft className="w-5 h-5" /> Geri
                </button>
                
                {currentStep < STEPS.length - 1 && (
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                      canGoNext
                        ? 'bg-white text-black hover:bg-[#5865F2] hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(88,101,242,0.4)]'
                        : 'cursor-not-allowed bg-white/15 text-white/35'
                    }`}
                  >
                    İleri <LuChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
