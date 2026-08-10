'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { LuShield, LuX, LuLoader, LuChevronRight, LuChevronLeft, LuCheck, LuMessageSquare, LuMic, LuTag, LuZap, LuSettings, LuUsers, LuLock, LuRocket, LuWrench, LuHardDrive, LuServer, LuChevronDown } from 'react-icons/lu';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { lockBodyScroll } from '@/lib/lockBodyScroll';

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
            className="h-5 w-5 shrink-0 object-contain"
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
            <div
              ref={menuRef}
              role="listbox"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: pos.width,
                zIndex: 200,
                transform: 'translate(-50%, -50%)',
              }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#12141d]/95 shadow-2xl backdrop-blur-md"
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

  const [guildName, setGuildName] = useState<string>('');
  const [guildIcon, setGuildIcon] = useState<string | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  
  // States
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>('');
  const [selectedVerifyRole, setSelectedVerifyRole] = useState<string>('');
  
  const [logMode, setLogMode] = useState<'current' | 'dedicated'>('current');
  const [targetGuildId, setTargetGuildId] = useState<string>('');

  // Default economy settings for premium feel (pre-filled)
  const [messageEarnEnabled, setMessageEarnEnabled] = useState(true);
  const [voiceEarnEnabled, setVoiceEarnEnabled] = useState(true);
  const [earnPerMessage, setEarnPerMessage] = useState('1');
  const [earnPerVoiceMinute, setEarnPerVoiceMinute] = useState('0.5');
  
  const [tagBonusMessage, setTagBonusMessage] = useState('0.5');
  const [tagBonusVoice, setTagBonusVoice] = useState('0.25');
  const [boosterBonusMessage, setBoosterBonusMessage] = useState('1');
  const [boosterBonusVoice, setBoosterBonusVoice] = useState('0.5');

  // Flow control
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [setupStarted, setSetupStarted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [error, setError] = useState<string>('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const adminRoles = useMemo(() => roles.filter(isAdminCapableRole), [roles]);
  const memberRoles = useMemo(
    () => roles.filter((role) => role.name !== '@everyone'),
    [roles],
  );

  useEffect(() => {
    const checkPermissionsAndLoadData = async () => {
      let resolvedGuildId = guildId ?? readSelectedGuildId();
      if (resolvedGuildId && resolvedGuildId !== guildId) {
        document.cookie = `selected_guild_id=${resolvedGuildId}; path=/`;
        setGuildId(resolvedGuildId);
      }

      let resolvedUser = user;
      let localBypass = isLocalDevBypassClient();

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
            if (me.localDevBypass) localBypass = true;
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
              setGuildName(match?.name ?? 'Local Development');
              setGuildIcon(match?.iconUrl ?? null);
            } catch {
              setGuildName('Local Development');
            }
            setRoles([]);
            setIsAdmin(true);
          } else {
            throw new Error('Sunucu bilgileri alınamadı');
          }
        } else {
          const guildData = (await guildResponse.json()) as {
            name?: string;
            icon?: string | null;
            owner_id?: string | null;
          };
          setGuildName(guildData.name ?? '');
          setGuildIcon(guildData.icon ?? null);

          const rolesResponse = await fetch(`/api/discord/guild/${resolvedGuildId}/roles`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          if (!rolesResponse.ok) throw new Error('Sunucu rolleri alınamadı');

          const rolesData = (await rolesResponse.json()) as DiscordRole[];
          setRoles(rolesData);

          if (localBypass) {
            setIsAdmin(true);
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
          }
        }
      } catch (error) {
        console.error('Setup data loading error:', error);
        setError('Sunucu bilgileri yüklenirken hata oluştu.');
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
          tagBonusMessage: Number(tagBonusMessage),
          tagBonusVoice: Number(tagBonusVoice),
          boosterBonusMessage: Number(boosterBonusMessage),
          boosterBonusVoice: Number(boosterBonusVoice),
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
        ? Boolean(targetGuildId.trim())
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
                      iconSrc="/gif/112771-staff.gif"
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
                  <h2 className="text-xl font-bold text-white mb-2">Log Yönetimi</h2>
                  <p className="text-sm text-white/50 mb-6">İşlem logları nereye yazılsın?</p>

                  <div className="space-y-4">
                    {/* Option 1: Current Server */}
                    <button 
                      onClick={() => setLogMode('current')}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${logMode === 'current' ? 'bg-[#5865F2]/10 border-[#5865F2] shadow-[0_0_20px_rgba(88,101,242,0.15)] ring-1 ring-[#5865F2]/50' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
                    >
                      <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${logMode === 'current' ? 'border-[#5865F2]' : 'border-white/30'}`}>
                        {logMode === 'current' && <div className="w-3 h-3 rounded-full bg-[#5865F2]" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          Bu sunucuya kur <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[#5865F2] text-[10px] uppercase font-bold">Önerilen</span>
                        </h3>
                        <p className="text-sm text-white/50 mt-1">DiscoWeb Logs kategorisi burada açılır.</p>
                      </div>
                    </button>

                    {/* Option 2: Dedicated Server */}
                    <button 
                      onClick={() => setLogMode('dedicated')}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${logMode === 'dedicated' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
                    >
                      <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${logMode === 'dedicated' ? 'border-indigo-500' : 'border-white/30'}`}>
                        {logMode === 'dedicated' && <div className="w-3 h-3 rounded-full bg-indigo-500" />}
                      </div>
                      <div className="w-full">
                        <h3 className="font-semibold text-white">Ayrı log sunucusu</h3>
                        <p className="text-sm text-white/50 mt-1">Loglar başka bir Discord sunucusuna gider.</p>
                        
                        {/* Expandable input for dedicated server */}
                        <div className={`overflow-hidden transition-all duration-300 ${logMode === 'dedicated' ? 'max-h-32 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <label className="text-xs font-medium text-indigo-300 mb-2 block">Hedef sunucu ID</label>
                          <input 
                            type="text" 
                            placeholder="123456789012345678"
                            value={targetGuildId}
                            onChange={(e) => setTargetGuildId(e.target.value)}
                            className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                          />
                          <p className="text-[10px] text-indigo-300/60 mt-2 flex items-center gap-1">
                            <LuCheck className="w-3 h-3" /> Bot o sunucuda olmalı.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Warning Box */}
                    <div className="mt-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 flex items-start gap-3">
                      <LuLock className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-orange-300 mb-1">Dikkat</h4>
                        <p className="text-xs text-orange-200/70 leading-relaxed">Kurulumda eski log kanalları silinip yeniden açılabilir.</p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* --- STEP 2: ECONOMY --- */}
              {currentStep === 2 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="text-xl font-bold text-white mb-2">Ekonomi</h2>
                  <p className="text-sm text-white/50 mb-6">Mesaj ve ses için papel oranlarını ayarlayın.</p>

                  <div className="space-y-6">
                    {/* Message Earning */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${messageEarnEnabled ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/10' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${messageEarnEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                            <LuMessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Mesaj Kazancı</h3>
                            <p className="text-xs text-white/50">Her mesaj için</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setMessageEarnEnabled(!messageEarnEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${messageEarnEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${messageEarnEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      
                      {messageEarnEnabled && (
                        <div className="flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
                          <input type="number" min="0" step="0.1" value={earnPerMessage} onChange={(e) => setEarnPerMessage(e.target.value)} className="w-32 bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-bold text-lg focus:outline-none focus:border-emerald-500 text-center" />
                          <span className="text-white/60 font-medium">Papel Kazandır</span>
                        </div>
                      )}
                    </div>

                    {/* Voice Earning */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${voiceEarnEnabled ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/10' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${voiceEarnEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/40'}`}>
                            <LuMic className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Ses Kazancı</h3>
                            <p className="text-xs text-white/50">Her ses dakikası için</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setVoiceEarnEnabled(!voiceEarnEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${voiceEarnEnabled ? 'bg-indigo-500' : 'bg-white/20'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${voiceEarnEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      
                      {voiceEarnEnabled && (
                        <div className="flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
                          <input type="number" min="0" step="0.1" value={earnPerVoiceMinute} onChange={(e) => setEarnPerVoiceMinute(e.target.value)} className="w-32 bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-400 font-bold text-lg focus:outline-none focus:border-indigo-500 text-center" />
                          <span className="text-white/60 font-medium">Papel Kazandır</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 3: BONUSES --- */}
              {currentStep === 3 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h2 className="text-xl font-bold text-white mb-2">Bonuslar</h2>
                  <p className="text-sm text-white/50 mb-6">Tag ve boost için ekstra papel.</p>

                  <div className="space-y-6">
                    {/* Tag Bonus */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                          <LuTag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Tag Bonusu</h3>
                          <p className="text-xs text-white/50">İsminde sunucu tagı olanlar</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-white/40 mb-2">Mesaj Başına Ek</label>
                          <div className="relative">
                            <input type="number" min="0" step="0.1" value={tagBonusMessage} onChange={(e) => setTagBonusMessage(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500" />
                            <span className="absolute right-4 top-3.5 text-xs text-white/30">+ Papel</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/40 mb-2">Dakika Başına Ek</label>
                          <div className="relative">
                            <input type="number" min="0" step="0.1" value={tagBonusVoice} onChange={(e) => setTagBonusVoice(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500" />
                            <span className="absolute right-4 top-3.5 text-xs text-white/30">+ Papel</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booster Bonus */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                          <LuRocket className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Boost Bonusu</h3>
                          <p className="text-xs text-white/50">Sunucuyu boostlayanlar</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-white/40 mb-2">Mesaj Başına Ek</label>
                          <div className="relative">
                            <input type="number" min="0" step="0.1" value={boosterBonusMessage} onChange={(e) => setBoosterBonusMessage(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-pink-500" />
                            <span className="absolute right-4 top-3.5 text-xs text-white/30">+ Papel</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/40 mb-2">Dakika Başına Ek</label>
                          <div className="relative">
                            <input type="number" min="0" step="0.1" value={boosterBonusVoice} onChange={(e) => setBoosterBonusVoice(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-pink-500" />
                            <span className="absolute right-4 top-3.5 text-xs text-white/30">+ Papel</span>
                          </div>
                        </div>
                      </div>
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
