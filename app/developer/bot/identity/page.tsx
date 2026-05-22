'use client';

import { useState, useEffect, useRef } from 'react';
import { LuSave, LuRefreshCw, LuUpload, LuUserCircle2, LuInfo, LuTriangleAlert } from 'react-icons/lu';

type BotInfo = {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
};

export default function BotIdentityPage() {
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [avatarDataUri, setAvatarDataUri] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBotInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/bot/identity');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setBotInfo(data);
      setUsername(data.username);
      if (data.avatar) {
        setPreviewAvatar(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBotInfo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setAvatarDataUri(dataUri);
      setPreviewAvatar(dataUri); // Show instant preview
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      alert('Kullanıcı adı boş olamaz.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {};
      if (username !== botInfo?.username) payload.username = username;
      if (avatarDataUri) payload.avatar = avatarDataUri;

      if (Object.keys(payload).length === 0) {
        setSaving(false);
        setSuccessMsg('Herhangi bir değişiklik yapılmadı.');
        return;
      }

      const res = await fetch('/api/developer/bot/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');

      setBotInfo(data);
      setUsername(data.username);
      if (data.avatar) {
        setPreviewAvatar(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`);
      }
      setAvatarDataUri(null); // Clear pending upload
      setSuccessMsg('Bot kimliği başarıyla güncellendi!');
      
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kimlik Yönetimi</h1>
          <p className="text-white/40 text-sm mt-1">Botun profil resmini ve ismini anlık olarak güncelleyin.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
          <LuTriangleAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-200 text-sm">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium">
          {successMsg}
        </div>
      )}

      <div className="p-4 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl flex items-start gap-3">
        <LuInfo className="w-5 h-5 text-[#5865F2] shrink-0 mt-0.5" />
        <div className="text-white/70 text-sm leading-relaxed">
          <strong className="text-white font-semibold block mb-1">Önemli Bilgilendirme</strong>
          Discord API kuralları gereği botun kullanıcı adı saatte maksimum 2 kez değiştirilebilir. 
          Avatar değişiklikleri ise hızlıca yansısa da çok sık denemelerde "rate limit"e takılabilir.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Avatar Upload */}
        <div className="col-span-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 bg-black/40 flex items-center justify-center relative">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Bot Avatar" className="w-full h-full object-cover" />
              ) : (
                <LuUserCircle2 className="w-16 h-16 text-white/20" />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <LuUpload className="w-8 h-8 text-white/80" />
              </div>
            </div>
            
            {avatarDataUri && (
              <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0d0f14]" title="Yeni resim seçildi" />
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/gif" 
            className="hidden" 
          />
          
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Profil Resmi</h3>
            <p className="text-xs text-white/40">Önerilen boyut: 512x512px (PNG, JPG). Maksimum 2MB.</p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-colors"
          >
            Yeni Resim Yükle
          </button>
        </div>

        {/* Right Col: Form */}
        <div className="col-span-1 md:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wider text-white/40 uppercase">
              Bot ID
            </label>
            <div className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/60 font-mono cursor-not-allowed">
              {botInfo?.id}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wider text-white/40 uppercase">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 focus:bg-white/[0.06] transition-colors"
              placeholder="DiscoWeb"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all"
            >
              {saving ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <LuSave className="w-4 h-4" />}
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
