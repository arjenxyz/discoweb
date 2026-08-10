'use client';

import { useTranslation } from '@/lib/i18nContext';

import { useState, useEffect, useRef } from 'react';
import { LuSave, LuRefreshCw, LuUpload, LuUser, LuInfo, LuTriangleAlert, LuImage, LuMonitorPlay, LuActivity } from 'react-icons/lu';

type BotInfo = {
  id: string;
  username: string;
  avatar: string | null;
  banner: string | null;
  discriminator: string;
};

type BotStatus = {
  presence_status: string;
  presence_type: string;
  presence_text: string;
};

export default function BotIdentityPage() {
  const { t } = useTranslation();
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    presence_status: 'online',
    presence_type: 'PLAYING',
    presence_text: ''
  });

  const [loading, setLoading] = useState(true);
  
  // Identity State
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarDataUri, setAvatarDataUri] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [bannerDataUri, setBannerDataUri] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);

  // Status State
  const [savingStatus, setSavingStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Identity
      const idRes = await fetch('/api/developer/bot/identity');
      const idData = await idRes.json();
      if (!idRes.ok) throw new Error(idData.error || 'Failed to fetch identity');
      
      setBotInfo(idData);
      setUsername(idData.username);
      if (idData.avatar) {
        setPreviewAvatar(`https://cdn.discordapp.com/avatars/${idData.id}/${idData.avatar}.png?size=256`);
      }
      if (idData.banner) {
        setPreviewBanner(`https://cdn.discordapp.com/banners/${idData.id}/${idData.banner}.png?size=1024`);
      }

      // Fetch Status
      const stRes = await fetch('/api/developer/bot/status');
      const stData = await stRes.json();
      if (!stRes.ok) throw new Error(stData.error || 'Failed to fetch status');
      setBotStatus(stData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'avatar' ? 2 : 5; // 2MB for avatar, 5MB for banner
    if (file.size > 1024 * 1024 * maxSize) {
      alert(t('developer.bot_identity.file_too_large', { max: maxSize }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (type === 'avatar') {
        setAvatarDataUri(dataUri);
        setPreviewAvatar(dataUri);
      } else {
        setBannerDataUri(dataUri);
        setPreviewBanner(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setError(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleSaveIdentity = async () => {
    if (!username.trim()) {
      alert(t('developer.bot_identity.username_empty'));
      return;
    }

    setSavingIdentity(true);
    setError(null);

    try {
      const payload: any = {};
      if (username !== botInfo?.username) payload.username = username;
      if (avatarDataUri) payload.avatar = avatarDataUri;
      if (bannerDataUri) payload.banner = bannerDataUri;

      if (Object.keys(payload).length === 0) {
        setSavingIdentity(false);
        showMessage(t('developer.bot_identity.no_changes'));
        return;
      }

      const res = await fetch('/api/developer/bot/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || t('developer.bot_identity.identity_failed'));

      setBotInfo(data);
      setUsername(data.username);
      if (data.avatar) setPreviewAvatar(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`);
      if (data.banner) setPreviewBanner(`https://cdn.discordapp.com/banners/${data.id}/${data.banner}.png?size=1024`);
      
      setAvatarDataUri(null);
      setBannerDataUri(null);
      showMessage(t('developer.bot_identity.identity_ok'));
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    setError(null);

    try {
      const res = await fetch('/api/developer/bot/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botStatus),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || t('developer.bot_identity.status_failed'));

      showMessage(t('developer.bot_identity.status_ok'));
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LuRefreshCw className="w-8 h-8 text-[#5865F2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight">
          Bot Kontrol Merkezi
        </h1>
        <p className="text-white/40 text-sm mt-1">{t('developer.bot_identity.subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <LuTriangleAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-200 text-sm font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <LuInfo className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-emerald-200 text-sm font-medium">{successMsg}</div>
        </div>
      )}

      {/* Identity card */}
      <div className="relative group rounded-3xl overflow-hidden bg-[#0d0f14]/80 border border-white/[0.05] shadow-2xl backdrop-blur-xl">
        {/* Glow Effect */}
        <div className="absolute -inset-px bg-gradient-to-b from-[#5865F2]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Banner Section */}
        <div 
          className="h-48 w-full bg-[#111319] relative flex items-center justify-center group/banner cursor-pointer border-b border-white/[0.05]"
          onClick={() => bannerInputRef.current?.click()}
        >
          {previewBanner ? (
            <img src={previewBanner} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover/banner:opacity-40 transition-opacity" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/20 to-purple-500/20" />
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
            <LuImage className="w-8 h-8 text-white mb-2" />
            <span className="text-white font-medium text-sm">{t('developer.bot_identity.change_banner')}</span>
            <span className="text-white/50 text-xs mt-1">{t('developer.bot_identity.banner_hint')}</span>
          </div>
          <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
        </div>

        <div className="p-6 md:p-8 relative">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section (Absolute positioning to overlap banner) */}
            <div className="relative -mt-20 md:-mt-24 z-10 flex-shrink-0 flex flex-col items-center">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0d0f14] bg-[#111319] overflow-hidden relative group/avatar cursor-pointer shadow-xl"
                onClick={() => avatarInputRef.current?.click()}
              >
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <LuUser className="w-16 h-16 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <LuUpload className="w-8 h-8 text-white" />
                </div>
              </div>
              <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
              
              {/* Bot ID Badge */}
              <div className="mt-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-white/50 font-mono tracking-wider">ID: {botInfo?.id}</span>
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1 space-y-6 pt-2">
              <div className="flex items-center gap-3">
                <LuUser className="w-5 h-5 text-[#5865F2]" />
                <h2 className="text-xl font-bold text-white">{t('developer.bot_identity.appearance')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-white/40 uppercase">{t('developer.bot_identity.username')}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#5865F2]/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                  <LuInfo className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="text-yellow-200/80 text-xs leading-relaxed">
                    {t('developer.bot_identity.username_rules')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveIdentity}
                  disabled={savingIdentity}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all"
                >
                  {savingIdentity ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <LuSave className="w-4 h-4" />}
                  {t('developer.bot_identity.save_changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="relative group rounded-3xl overflow-hidden bg-[#0d0f14]/80 border border-white/[0.05] shadow-2xl backdrop-blur-xl p-6 md:p-8">
        <div className="absolute -inset-px bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 space-y-4">
            <div className="flex items-center gap-3">
              <LuMonitorPlay className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Bot Durumu (Presence)</h2>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              {t('developer.bot_identity.status_card_desc')} 
              <br/><br/>
              {t('developer.bot_identity.status_note')}
            </p>
          </div>

          <div className="md:w-2/3 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-white/40 uppercase">Durum Tipi</label>
                <select
                  value={botStatus.presence_status}
                  onChange={(e) => setBotStatus({ ...botStatus, presence_status: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all appearance-none"
                >
                  <option value="online">{t('developer.bot_identity.presence_online')}</option>
                  <option value="idle">{t('developer.bot_identity.presence_idle')}</option>
                  <option value="dnd">{t('developer.bot_identity.presence_dnd')}</option>
                  <option value="invisible">{t('developer.bot_identity.presence_invisible')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-white/40 uppercase">Aktivite Tipi</label>
                <select
                  value={botStatus.presence_type}
                  onChange={(e) => setBotStatus({ ...botStatus, presence_type: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all appearance-none"
                >
                  <option value="PLAYING">🎮 Oynuyor</option>
                  <option value="LISTENING">🎧 Dinliyor</option>
                  <option value="WATCHING">{t('developer.bot_identity.activity_watching')}</option>
                  <option value="COMPETING">{t('developer.bot_identity.activity_competing')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider text-white/40 uppercase">Aktivite Metni</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LuActivity className="w-4 h-4 text-white/20" />
                </div>
                <input
                  type="text"
                  value={botStatus.presence_text}
                  onChange={(e) => setBotStatus({ ...botStatus, presence_text: e.target.value })}
                  placeholder={t('developer.bot_identity.activity_placeholder')}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
              >
                {savingStatus ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <LuSave className="w-4 h-4" />}
                {t('developer.bot_identity.update_status')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
