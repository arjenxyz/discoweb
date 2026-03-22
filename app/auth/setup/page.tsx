'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LuShield, LuX, LuLoader, LuChevronRight, LuChevronLeft, LuCheck, LuMessageSquare, LuMic, LuTag, LuZap, LuSettings, LuUsers, LuLock, LuRocket, LuWrench, LuSkipForward, LuGauge, LuChevronDown } from 'react-icons/lu';

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

const STEPS = [
  { id: 'roles',   title: 'Roller',           icon: LuShield,      description: 'Yönetim ve doğrulama rollerini belirleyin',     required: true },
  { id: 'economy', title: 'Kazanç',            icon: LuSettings,    description: 'Papel kazanç sistemini yapılandırın',            required: false },
  { id: 'bonuses', title: 'Bonuslar',          icon: LuZap,         description: 'Tag ve Booster bonus oranlarını ayarlayın',      required: false },
  { id: 'advanced',title: 'Gelişmiş',          icon: LuGauge,       description: 'Topluluk onay eşiği ve ek ayarlar',             required: false },
  { id: 'confirm', title: 'Kurulum',           icon: LuCheck,       description: 'Ayarları kontrol edin ve kurulumu başlatın',    required: true },
];

export default function SetupPage() {
  const router = useRouter();
  const [user] = useState<DiscordUser | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('discordUser');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (error) {
          console.error('Failed to parse discord user data:', error);
          return null;
        }
      }
    }
    return null;
  });

  const [guildId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split('; ');
      const guildCookie = cookies.find(row => row.startsWith('selected_guild_id='));
      return guildCookie ? guildCookie.split('=')[1] : null;
    }
    return null;
  });

  const [guildName, setGuildName] = useState<string>('');
  const [guildIcon, setGuildIcon] = useState<string | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>('');
  const [selectedVerifyRole, setSelectedVerifyRole] = useState<string>('');
  const [messageEarnEnabled, setMessageEarnEnabled] = useState(false);
  const [voiceEarnEnabled, setVoiceEarnEnabled] = useState(false);
  const [earnPerMessage, setEarnPerMessage] = useState('1');
  const [earnPerVoiceMinute, setEarnPerVoiceMinute] = useState('0.5');
  const [tagBonusMessage, setTagBonusMessage] = useState('0');
  const [tagBonusVoice, setTagBonusVoice] = useState('0');
  const [boosterBonusMessage, setBoosterBonusMessage] = useState('0');
  const [boosterBonusVoice, setBoosterBonusVoice] = useState('0');
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
  const [setupMode, setSetupMode] = useState<'select' | 'quick' | 'custom'>('select');
  const [approvalThreshold, setApprovalThreshold] = useState('80');

  const getRoleNameById = useCallback(
    (roleId: string) => roles.find((role) => role.id === roleId)?.name ?? 'Bilinmeyen Rol',
    [roles],
  );

  // Helper: convert Discord role color int to hex
  const roleColorHex = (color: number) => color ? `#${color.toString(16).padStart(6, '0')}` : '#99AAB5';

  // Custom dropdown states
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [verifyDropdownOpen, setVerifyDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const verifyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (verifyDropdownRef.current && !verifyDropdownRef.current.contains(e.target as Node)) {
        setVerifyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkPermissionsAndLoadData = async () => {
      if (!guildId || !user) {
        router.replace('/auth/select-server');
        return;
      }

      try {
        const guildResponse = await fetch(`/api/discord/guild/${guildId}`, { method: 'GET' });
        if (!guildResponse.ok) throw new Error('Sunucu bilgileri alınamadı');

        const guildData = await guildResponse.json();
        setGuildName(guildData.name);
        setGuildIcon(guildData.icon ?? null);

        const rolesResponse = await fetch(`/api/discord/guild/${guildId}/roles`, { method: 'GET' });
        if (!rolesResponse.ok) throw new Error('Sunucu rolleri alınamadı');

        const rolesData = await rolesResponse.json();
        setRoles(rolesData);

        // Sunucu sahibi mi kontrol et
        const isServerOwner = Boolean(user?.id) && guildData.owner_id === user?.id;

        const adminRoles = rolesData.filter((role: DiscordRole) => {
          const perms = parseInt(role.permissions);
          return (perms & 0x8) || (perms & 0x20) || (perms & 0x10000000);
        });

        const userRolesResponse = await fetch(`/api/discord/guild/${guildId}/members/${user?.id}`, { method: 'GET' });

        let userHasAdminRole = false;
        if (userRolesResponse.ok) {
          const userData = await userRolesResponse.json();
          userHasAdminRole = userData.roles.some((roleId: string) =>
            adminRoles.some((adminRole: DiscordRole) => adminRole.id === roleId)
          );
        }

        // Sunucu sahibi ise her zaman admin yetkisi ver
        setIsAdmin(isServerOwner || userHasAdminRole);

        if (!isServerOwner && adminRoles.length === 0) {
          setError('Bu sunucuda bot kurulumu aktif değil. Sunucu sahibi veya yönetici ile iletişime geçin.');
        }

        const setupStatusResponse = await fetch('/api/setup/server', { method: 'GET' });
        if (setupStatusResponse.ok) {
          const setupStatus = await setupStatusResponse.json();
          if (setupStatus?.is_setup) {
            setAlreadySetup(true);
            if (setupStatus.admin_role_id) setSelectedAdminRole(setupStatus.admin_role_id);
            if (setupStatus.verify_role_id) setSelectedVerifyRole(setupStatus.verify_role_id);
            if (setupStatus.earn_per_message != null) setEarnPerMessage(String(setupStatus.earn_per_message));
            if (setupStatus.earn_per_voice_minute != null) setEarnPerVoiceMinute(String(setupStatus.earn_per_voice_minute));
            if (setupStatus.message_earn_enabled) setMessageEarnEnabled(true);
            if (setupStatus.voice_earn_enabled) setVoiceEarnEnabled(true);
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

    checkPermissionsAndLoadData();
  }, [guildId, user, router]);

  const handleSetup = async () => {
    if (alreadySetup) {
      setError('Bu sunucu zaten kurulmuş. Admin paneline yönlendiriliyorsunuz...');
      setTerminalLines((prev) => [...prev, 'setup: already completed', 'redirect: admin in 5s']);
      setRedirectCountdown(5);
      return;
    }
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
    const adminRoleName = getRoleNameById(selectedAdminRole);
    const verifyRoleName = getRoleNameById(selectedVerifyRole);
    setTerminalLines([
      'npm ci',
      'added 148 packages, audited 149 packages in 4s',
      'found 0 vulnerabilities',
      `cd ${guildId}`,
      `env: guild=${guildId} adminRole=${adminRoleName} verifyRole=${verifyRoleName}`,
      `roles: admin="${adminRoleName}" verify="${verifyRoleName}"`,
      `economy: msg=${messageEarnEnabled ? earnPerMessage : '0'} voice=${voiceEarnEnabled ? earnPerVoiceMinute : '0'}/min`,
      'discord:channels:create',
      'discord:webhooks:create',
      'db:upsert:servers',
    ]);

    try {
      setTerminalLines((prev) => [...prev, 'setup: running...']);

      const response = await fetch('/api/setup/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
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
          approvalThreshold: Number(approvalThreshold),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData?.detail ? ` (${errorData.detail})` : '';
        throw new Error((errorData.error || 'Kurulum başarısız') + detail);
      }

      await response.json().catch(() => null);

      setTerminalLines((prev) => [...prev, 'channels: done', 'webhooks: done', 'database: done', 'setup: completed', 'redirect: admin in 5s']);
      setSetupCompleted(true);
      setAlreadySetup(true);
      setRedirectCountdown(5);

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
    } catch (setupError) {
      console.error('Setup error:', setupError);
      setError(setupError instanceof Error ? setupError.message : 'Kurulum sırasında hata oluştu.');
      setTerminalLines((prev) => [...prev, 'kurulum başarısız']);
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
      const nextValue = redirectCountdown - 1;
      setRedirectCountdown(nextValue);
      if (nextValue > 0) {
        setTerminalLines((prev) => [...prev, `redirect: admin in ${nextValue}s`]);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  useEffect(() => {
    if (!setupStarted || setupCompleted) return;
    const adminRoleName = selectedAdminRole ? getRoleNameById(selectedAdminRole) : 'Admin';
    const verifyRoleName = selectedVerifyRole ? getRoleNameById(selectedVerifyRole) : 'Verify';
    const liveLogs = [
      `discord:roles:bind admin=${adminRoleName}`,
      `discord:roles:bind verify=${verifyRoleName}`,
      'discord:permissions:sync',
      'discord:webhooks:verify',
      'db:schemas:check',
      'db:upsert:channels',
      'db:upsert:webhooks',
      'setup: heartbeat',
    ];
    let index = 0;
    const interval = setInterval(() => {
      setTerminalLines((prev) => [...prev, liveLogs[index % liveLogs.length]]);
      index += 1;
    }, 1200);
    return () => clearInterval(interval);
  }, [setupStarted, setupCompleted, selectedAdminRole, selectedVerifyRole, getRoleNameById]);

  const canGoNext = () => {
    if (currentStep === 0) return !!selectedAdminRole && !!selectedVerifyRole;
    if (currentStep === 1) return true;
    return true;
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020204] text-white">
        <div className="relative">
          <div className="absolute -inset-20 rounded-full bg-[#5865F2]/10 blur-3xl" />
          <div className="relative text-center">
            <LuLoader className="w-10 h-10 animate-spin mx-auto mb-4 text-[#5865F2]" />
            <p className="text-sm text-[#cbd5db]">Sunucu bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ACCESS DENIED ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020204] text-white relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
        <nav className="relative z-10 border-b border-white/5 bg-[#020204]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <Image src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt={user.username} width={40} height={40} className="h-10 w-10 rounded-full border border-red-500/30" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-600/20">
                  <span className="text-sm font-bold text-red-400">{user?.username?.charAt(0).toUpperCase() ?? 'U'}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{user?.username ?? 'Discord Kullanıcısı'}</p>
                <p className="text-xs text-white/40">Yetkisiz erişim</p>
              </div>
            </div>
            <button onClick={() => router.replace('/auth/select-server')} className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Sunucu seçimine dön
            </button>
          </div>
        </nav>

        <main className="relative z-10 mx-auto w-full max-w-md px-6 py-20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <LuShield className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Erişim Reddedildi</h1>
            <p className="text-[#cbd5db]">Bu sunucunun kurulumuna erişim izniniz yok</p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm">
            <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
              <LuX className="w-5 h-5" />
              Olası Sebepler
            </h3>
            <ul className="text-sm text-[#cbd5db] space-y-3">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Sunucu sahibi veya yönetici değilsiniz</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Gerekli yönetim izinlerine sahip değilsiniz</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Bot bu sunucuya henüz eklenmemiş</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // --- MAIN SETUP PAGE ---
  return (
    <div className="min-h-screen bg-[#020204] text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#5865F2]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#7289DA]/5 blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-[#020204]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {guildIcon ? (
              <Image src={guildIcon} alt={guildName || 'Sunucu'} width={40} height={40} className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
                {guildName ? guildName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{guildName || 'Sunucu'}</p>
              <p className="text-xs text-white/40">Sunucu Kurulumu</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
              <LuUsers className="w-3.5 h-3.5" />
              <span>{user?.username}</span>
            </div>
            <button onClick={() => router.replace('/auth/select-server')} className="text-xs text-white/40 hover:text-white/60 transition-colors border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/20">
              Geri
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-8">
        {/* Hero header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[#5865F2] mb-2">
            <LuLock className="w-3.5 h-3.5" />
            <span className="uppercase tracking-[0.15em] font-medium">Sadece Sunucu Sahibi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Sunucu Kurulumu
          </h1>
          <p className="text-[#cbd5db] text-sm sm:text-base max-w-lg">
            Web mağaza sisteminizi birkaç adımda yapılandırın. Tüm ayarları daha sonra admin panelinden değiştirebilirsiniz.
          </p>
        </div>

        {/* Setup Mode Selection */}
        {setupMode === 'select' && !setupStarted && (
          <div className="grid gap-4 sm:grid-cols-2 animate-[slideUp_0.3s_ease-out]">
            {/* Hızlı Kurulum */}
            <button
              onClick={() => {
                setSetupMode('quick');
                setCurrentStep(0);
                // Varsayılan ekonomi ayarlarını aktif et
                setMessageEarnEnabled(true);
                setVoiceEarnEnabled(true);
                setEarnPerMessage('1');
                setEarnPerVoiceMinute('0.5');
                setTagBonusMessage('0.5');
                setTagBonusVoice('0.25');
                setBoosterBonusMessage('1');
                setBoosterBonusVoice('0.5');
                setApprovalThreshold('80');
              }}
              className="group relative rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                Önerilen
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <LuRocket className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Hızlı Kurulum</h3>
              <p className="text-sm text-white/50 mb-4">
                Sadece rolleri seçin, geri kalan her şey en iyi varsayılanlarla otomatik kurulsun.
              </p>
              <div className="space-y-1.5 text-xs text-white/40">
                <div className="flex items-center gap-2"><LuCheck className="w-3 h-3 text-emerald-400" /> Mesaj kazancı: 1 papel/mesaj</div>
                <div className="flex items-center gap-2"><LuCheck className="w-3 h-3 text-emerald-400" /> Ses kazancı: 0.5 papel/dakika</div>
                <div className="flex items-center gap-2"><LuCheck className="w-3 h-3 text-emerald-400" /> Tag & Boost bonusları dahil</div>
                <div className="flex items-center gap-2"><LuCheck className="w-3 h-3 text-emerald-400" /> Tüm ayarlar sonradan değiştirilebilir</div>
              </div>
            </button>

            {/* Özel Kurulum */}
            <button
              onClick={() => {
                setSetupMode('custom');
                setCurrentStep(0);
              }}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left transition-all hover:border-[#5865F2]/30 hover:bg-[#5865F2]/[0.03] hover:shadow-[0_0_30px_rgba(88,101,242,0.08)]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center mb-4">
                <LuWrench className="w-6 h-6 text-[#5865F2]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Özel Kurulum</h3>
              <p className="text-sm text-white/50 mb-4">
                Her ayarı adım adım kendiniz yapılandırın. İstediğiniz adımı atlayabilirsiniz.
              </p>
              <div className="space-y-1.5 text-xs text-white/40">
                <div className="flex items-center gap-2"><LuSettings className="w-3 h-3 text-[#5865F2]" /> Ekonomi oranlarını ayarlayın</div>
                <div className="flex items-center gap-2"><LuSettings className="w-3 h-3 text-[#5865F2]" /> Tag & Boost bonuslarını belirleyin</div>
                <div className="flex items-center gap-2"><LuSettings className="w-3 h-3 text-[#5865F2]" /> Onay eşiği ve gelişmiş ayarlar</div>
                <div className="flex items-center gap-2"><LuSettings className="w-3 h-3 text-[#5865F2]" /> Zorunlu olmayan adımları atlayın</div>
              </div>
            </button>
          </div>
        )}

        {setupMode !== 'select' && !setupStarted && (
          <>
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center gap-0">
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === currentStep;
                  const isDone = i < currentStep;
                  return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <button
                        onClick={() => { if (i <= currentStep || isDone) setCurrentStep(i); }}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30'
                            : isDone
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-white/30 border border-transparent'
                        }`}
                      >
                        <StepIcon className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">{step.title}</span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 ${i < currentStep ? 'bg-emerald-500/30' : 'bg-white/10'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-white/40">{STEPS[currentStep].description}</p>
            </div>

            {/* Step 0: Roles */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
                      <LuShield className="w-5 h-5 text-[#5865F2]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Rol Yapılandırması</h2>
                      <p className="text-xs text-white/40">Yönetim ve üye doğrulama rollerini seçin</p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Admin Role */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-white/60">
                        <LuShield className="w-3.5 h-3.5 text-[#5865F2]" />
                        Admin Rolü
                      </label>
                      <div className="relative" ref={adminDropdownRef}>
                        <button
                          type="button"
                          onClick={() => { setAdminDropdownOpen(v => !v); setVerifyDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                            adminDropdownOpen
                              ? 'border-[#5865F2]/50 bg-white/5 ring-1 ring-[#5865F2]/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          {selectedAdminRole ? (
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorHex(roles.find(r => r.id === selectedAdminRole)?.color ?? 0) }} />
                              <span className="text-white">{getRoleNameById(selectedAdminRole)}</span>
                            </span>
                          ) : (
                            <span className="text-white/40">Rol seçin...</span>
                          )}
                          <LuChevronDown className={`w-4 h-4 text-white/40 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {adminDropdownOpen && (
                          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0e14] shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden">
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
                              {roles
                                .filter(role => {
                                  const perms = parseInt(role.permissions);
                                  return (perms & 0x8) || (perms & 0x20) || (perms & 0x10000000);
                                })
                                .map((role) => (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => { setSelectedAdminRole(role.id); setAdminDropdownOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                      selectedAdminRole === role.id
                                        ? 'bg-[#5865F2]/15 text-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorHex(role.color) }} />
                                    <span>{role.name}</span>
                                    {selectedAdminRole === role.id && <LuCheck className="w-3.5 h-3.5 text-[#5865F2] ml-auto" />}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/30">Bu role sahip kişiler admin paneline erişebilir</p>
                    </div>

                    {/* Verify Role */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-white/60">
                        <LuUsers className="w-3.5 h-3.5 text-emerald-400" />
                        Doğrulama Rolü
                      </label>
                      <div className="relative" ref={verifyDropdownRef}>
                        <button
                          type="button"
                          onClick={() => { setVerifyDropdownOpen(v => !v); setAdminDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                            verifyDropdownOpen
                              ? 'border-emerald-500/50 bg-white/5 ring-1 ring-emerald-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          {selectedVerifyRole ? (
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorHex(roles.find(r => r.id === selectedVerifyRole)?.color ?? 0) }} />
                              <span className="text-white">{getRoleNameById(selectedVerifyRole)}</span>
                            </span>
                          ) : (
                            <span className="text-white/40">Rol seçin...</span>
                          )}
                          <LuChevronDown className={`w-4 h-4 text-white/40 transition-transform ${verifyDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {verifyDropdownOpen && (
                          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0e14] shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden">
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
                              {roles.map((role) => (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => { setSelectedVerifyRole(role.id); setVerifyDropdownOpen(false); }}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                    selectedVerifyRole === role.id
                                      ? 'bg-emerald-500/15 text-white'
                                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorHex(role.color) }} />
                                  <span>{role.name}</span>
                                  {selectedVerifyRole === role.id && <LuCheck className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/30">Bu role sahip üyeler papel kazanabilir ve mağazayı kullanabilir</p>
                    </div>
                  </div>

                  {/* Selected roles preview */}
                  {(selectedAdminRole || selectedVerifyRole) && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedAdminRole && (() => {
                        const role = roles.find(r => r.id === selectedAdminRole);
                        return role ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border" style={{ borderColor: `${roleColorHex(role.color)}40`, backgroundColor: `${roleColorHex(role.color)}15`, color: roleColorHex(role.color) }}>
                            <LuShield className="w-3 h-3" /> {role.name}
                          </span>
                        ) : null;
                      })()}
                      {selectedVerifyRole && (() => {
                        const role = roles.find(r => r.id === selectedVerifyRole);
                        return role ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border" style={{ borderColor: `${roleColorHex(role.color)}40`, backgroundColor: `${roleColorHex(role.color)}15`, color: roleColorHex(role.color) }}>
                            <LuUsers className="w-3 h-3" /> {role.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Earn Settings */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Message Earning */}
                  <div className={`rounded-2xl border p-6 backdrop-blur-sm transition-all ${messageEarnEnabled ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-white/8 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${messageEarnEnabled ? 'bg-emerald-500/15' : 'bg-white/5'}`}>
                          <LuMessageSquare className={`w-5 h-5 ${messageEarnEnabled ? 'text-emerald-400' : 'text-white/30'}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Mesaj Kazancı</h3>
                          <p className="text-[10px] text-white/40">Her mesajda papel kazan</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMessageEarnEnabled(v => !v)}
                        className={`relative h-6 w-11 rounded-full transition-all ${messageEarnEnabled ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all ${messageEarnEnabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className={`transition-all ${messageEarnEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Mesaj başına kazanç</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="0" step="0.1" value={earnPerMessage}
                          onChange={(e) => setEarnPerMessage(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500/50 focus:outline-none transition-all"
                        />
                        <span className="shrink-0 text-xs text-white/40 font-medium">papel</span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Earning */}
                  <div className={`rounded-2xl border p-6 backdrop-blur-sm transition-all ${voiceEarnEnabled ? 'border-indigo-500/20 bg-indigo-500/[0.03]' : 'border-white/8 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${voiceEarnEnabled ? 'bg-indigo-500/15' : 'bg-white/5'}`}>
                          <LuMic className={`w-5 h-5 ${voiceEarnEnabled ? 'text-indigo-400' : 'text-white/30'}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Sesli Sohbet Kazancı</h3>
                          <p className="text-[10px] text-white/40">Her dakika papel kazan</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVoiceEarnEnabled(v => !v)}
                        className={`relative h-6 w-11 rounded-full transition-all ${voiceEarnEnabled ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all ${voiceEarnEnabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className={`transition-all ${voiceEarnEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Dakika başına kazanç</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="0" step="0.1" value={earnPerVoiceMinute}
                          onChange={(e) => setEarnPerVoiceMinute(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none transition-all"
                        />
                        <span className="shrink-0 text-xs text-white/40 font-medium">papel</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] text-white/30">Bu ayarları daha sonra <strong className="text-white/50">Admin Panel → Kazanç Ayarları</strong> sayfasından da değiştirebilirsiniz.</p>
                </div>
              </div>
            )}

            {/* Step 3: Bonuses */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                {/* Tag Bonuses */}
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <LuTag className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Sunucu Tagı Bonusu</h3>
                      <p className="text-[10px] text-white/40">Discord profilinde sunucu tagını kullanan üyelere ek kazanç</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Mesaj bonusu</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.1" value={tagBonusMessage} onChange={(e) => setTagBonusMessage(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500/50 focus:outline-none transition-all" />
                        <span className="shrink-0 text-xs text-white/40">+papel/mesaj</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Ses bonusu</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.1" value={tagBonusVoice} onChange={(e) => setTagBonusVoice(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500/50 focus:outline-none transition-all" />
                        <span className="shrink-0 text-xs text-white/40">+papel/dk</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booster Bonuses */}
                <div className="rounded-2xl border border-pink-500/15 bg-pink-500/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
                      <LuZap className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Sunucu Boost Bonusu</h3>
                      <p className="text-[10px] text-white/40">Sunucuyu boostlayan üyelere ek kazanç — otomatik tespit edilir</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Mesaj bonusu</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.1" value={boosterBonusMessage} onChange={(e) => setBoosterBonusMessage(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-pink-500/50 focus:outline-none transition-all" />
                        <span className="shrink-0 text-xs text-white/40">+papel/mesaj</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Ses bonusu</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.1" value={boosterBonusVoice} onChange={(e) => setBoosterBonusVoice(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-pink-500/50 focus:outline-none transition-all" />
                        <span className="shrink-0 text-xs text-white/40">+papel/dk</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] text-white/30">Tag ve Booster bonusları temel kazanca <strong className="text-white/50">ek olarak</strong> uygulanır. Örneğin: 1 papel/mesaj + 0.5 tag bonusu = toplam 1.5 papel/mesaj</p>
                </div>
              </div>
            )}

            {/* Step 4: Advanced */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <LuGauge className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Topluluk Onay Eşiği</h3>
                      <p className="text-[10px] text-white/40">Yetki uygunluk kontrolleri için gereken onay yüzdesi</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="50" max="100" step="5"
                        value={approvalThreshold}
                        onChange={(e) => setApprovalThreshold(e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-amber-500"
                      />
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 min-w-[60px] text-center">
                        <span className="text-sm font-mono font-semibold text-amber-400">%{approvalThreshold}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30">Varsayılan: %80. Düşük değerler daha kolay onay, yüksek değerler daha güvenli yönetim sağlar.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] text-white/30">Bu ayar daha sonra <strong className="text-white/50">Admin Panel → Ayarlar</strong> sayfasından da değiştirilebilir.</p>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <LuCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Kurulum Özeti</h2>
                      <p className="text-xs text-white/40">Ayarlarınızı kontrol edin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Roles summary */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Roller</p>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2">
                          <LuShield className="w-3.5 h-3.5 text-[#5865F2]" />
                          <span className="text-white/50">Admin:</span>
                          <span className="text-white font-medium">{selectedAdminRole ? getRoleNameById(selectedAdminRole) : '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LuUsers className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-white/50">Verify:</span>
                          <span className="text-white font-medium">{selectedVerifyRole ? getRoleNameById(selectedVerifyRole) : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Economy summary */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Kazanç Ayarları</p>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2">
                          <LuMessageSquare className={`w-3.5 h-3.5 ${messageEarnEnabled ? 'text-emerald-400' : 'text-white/20'}`} />
                          <span className="text-white/50">Mesaj:</span>
                          <span className="text-white font-medium font-mono">{messageEarnEnabled ? `${earnPerMessage} papel` : 'Kapalı'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LuMic className={`w-3.5 h-3.5 ${voiceEarnEnabled ? 'text-indigo-400' : 'text-white/20'}`} />
                          <span className="text-white/50">Ses:</span>
                          <span className="text-white font-medium font-mono">{voiceEarnEnabled ? `${earnPerVoiceMinute} papel/dk` : 'Kapalı'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bonuses summary */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Bonuslar</p>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2">
                          <LuTag className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-white/50">Tag:</span>
                          <span className="text-white font-medium font-mono">+{tagBonusMessage}/mesaj, +{tagBonusVoice}/dk</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LuZap className="w-3.5 h-3.5 text-pink-400" />
                          <span className="text-white/50">Boost:</span>
                          <span className="text-white font-medium font-mono">+{boosterBonusMessage}/mesaj, +{boosterBonusVoice}/dk</span>
                        </div>
                      </div>
                    </div>

                    {/* Advanced summary */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Gelişmiş</p>
                      <div className="flex items-center gap-2 text-sm">
                        <LuGauge className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-white/50">Onay Eşiği:</span>
                        <span className="text-white font-medium font-mono">%{approvalThreshold}</span>
                      </div>
                    </div>

                    {/* What will be created */}
                    <div className="rounded-xl bg-[#5865F2]/[0.05] border border-[#5865F2]/15 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-[#5865F2]/60 mb-2">Kurulumda oluşturulacaklar</p>
                      <ul className="text-xs text-[#cbd5db] space-y-1">
                        <li>• 2 kategori (Üye Logları + Admin Logları)</li>
                        <li>• 10 log kanalı ve webhook bağlantıları</li>
                        <li>• Veritabanı sunucu kaydı ve yapılandırma</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  if (currentStep === 0) {
                    setSetupMode('select');
                  } else {
                    setCurrentStep(s => s - 1);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
              >
                <LuChevronLeft className="w-4 h-4" />
                {currentStep === 0 ? 'Mod Seçimi' : 'Geri'}
              </button>

              <div className="flex items-center gap-2">
                {/* Skip button for non-required steps */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && !STEPS[currentStep].required && (
                  <button
                    onClick={() => setCurrentStep(s => s + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-white/40 hover:text-white/60 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <LuSkipForward className="w-3.5 h-3.5" />
                    Varsayılan kullan
                  </button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={() => {
                      if (setupMode === 'quick' && currentStep === 0 && canGoNext()) {
                        // Hızlı kurulumda tier seçildikten sonra direkt son adıma atla
                        setCurrentStep(STEPS.length - 1);
                      } else {
                        setCurrentStep(s => Math.min(STEPS.length - 1, s + 1));
                      }
                    }}
                    disabled={!canGoNext()}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                      canGoNext()
                        ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[0_0_20px_rgba(88,101,242,0.3)]'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {setupMode === 'quick' && currentStep === 0 ? 'Kuruluma Geç' : 'Devam'}
                    <LuChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSetup}
                    disabled={settingUp || !selectedAdminRole || !selectedVerifyRole}
                    className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                      settingUp
                        ? 'bg-[#5865F2]/50 text-white/70 cursor-wait'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {settingUp ? (
                      <>
                        <LuLoader className="w-4 h-4 animate-spin" />
                        Kuruluyor...
                      </>
                    ) : (
                      <>
                        <LuCheck className="w-4 h-4" />
                        Kurulumu Başlat
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {setupStarted && (
          /* Terminal */
          <section className="rounded-2xl border border-white/8 bg-[#0a0c10] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs text-white/40 font-mono">setup.log — {guildName}</span>
              </div>
              <div className="flex items-center gap-2">
                {!setupCompleted && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
                <span className="text-[10px] text-white/40">{setupCompleted ? 'tamamlandı' : 'çalışıyor'}</span>
              </div>
            </div>
            <div className="min-h-[300px] max-h-[400px] overflow-y-auto px-5 py-5 text-xs font-mono leading-7 custom-scrollbar">
              {terminalLines.length === 0 ? (
                <span className="text-white/40">$ setup ready</span>
              ) : (
                terminalLines.slice(-16).map((line, index) => (
                  <div
                    key={`${line}-${index}`}
                    className={
                      line.includes('failed') || line.includes('hata') || line.includes('error')
                        ? 'text-red-400'
                        : line.includes('done') || line.includes('completed')
                          ? 'text-emerald-400'
                          : line.includes('redirect')
                            ? 'text-amber-400'
                            : line.includes('discord')
                              ? 'text-[#5865F2]'
                              : line.includes('db:')
                                ? 'text-amber-300/80'
                                : 'text-white/60'
                    }
                  >
                    <span className="text-white/20 select-none">$ </span>{line}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 backdrop-blur-sm">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
