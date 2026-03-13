'use client';

import { useEffect, useState } from "react";
import Image from 'next/image';
import {
  LuMessageSquare,
  LuMic,
  LuSave,
  LuShieldAlert,
  LuZap,
  LuTag,
  LuCheck,
  LuUndo2,
  LuLoader,
  LuServer,
  LuHash,
  LuVolume2,
  LuFolder,
  LuX,
} from 'react-icons/lu';

type DiscordChannel = {
  id: string;
  name: string;
  type: number; // 0=text, 2=voice, 4=category
  parent_id: string | null;
};

type EarnChannels = {
  mode: 'all' | 'whitelist' | 'blacklist';
  message_channels: string[];
  message_categories: string[];
  voice_channels: string[];
  voice_categories: string[];
};

type EarnSettings = {
  earn_per_message: number;
  message_earn_enabled: boolean;
  earn_per_voice_minute: number;
  voice_earn_enabled: boolean;
  verify_role_id: string | null;
  tag_configured?: boolean;
  tag_required: boolean;
  tag_bonus_message: number;
  tag_bonus_voice: number;
  booster_bonus_message: number;
  booster_bonus_voice: number;
  earn_channels?: EarnChannels | null;
  _guildPreview?: {
    name: string;
    icon: string | null;
  };
  _channels?: DiscordChannel[];
};

export default function EarnSettingsPage() {
  const [settings, setSettings] = useState<EarnSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialSettings, setInitialSettings] = useState<EarnSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Rol Adı State'i
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/earn-settings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Veri çekilemedi');
        const data = await res.json();
        setSettings(data);
        setInitialSettings(data);
      } catch {
        setError('Ayarlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Rol Adı Simülasyonu (Bunu ileride gerçek API ile değiştirebilirsin)
  useEffect(() => {
    if (settings?.verify_role_id && settings.verify_role_id.length > 15) {
      setRoleName('@Doğrulanmış Üye'); 
    } else {
      setRoleName(null);
    }
  }, [settings?.verify_role_id]);

  // Değişiklik Kontrolü
  useEffect(() => {
    if (!settings || !initialSettings) return setHasChanges(false);
    // _guildPreview gibi UI alanlarını kıyaslamadan çıkarıyoruz
    const cleanSettings = { ...settings, _guildPreview: undefined };
    const cleanInitial = { ...initialSettings, _guildPreview: undefined };
    setHasChanges(JSON.stringify(cleanSettings) !== JSON.stringify(cleanInitial));
  }, [settings, initialSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/earn-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      
      setMessage('Ayarlar başarıyla kaydedildi.');
      setInitialSettings(settings);
      setHasChanges(false);
    } catch {
      setError('Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const updateNumber = (key: keyof EarnSettings, value: number) => {
    if (!settings || isNaN(value) || value < 0) return;
    const current = settings[key];
    if (typeof current === 'number' && current === value) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <LuLoader className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );
  
  if (!settings) return <div className="text-center p-10 text-red-400">Veri yüklenemedi.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Kazanç Ayarları</h1>
          <p className="mt-1 text-sm text-zinc-400">Sunucu ekonomisini buradan yönetin.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {hasChanges && (
                <button 
                    onClick={() => setSettings(initialSettings)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                    <LuUndo2 size={16} />
                    <span>Geri Al</span>
                </button>
            )}
            <button 
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuSave size={18} />}
                <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
        </div>
      </div>

      {/* MESAJLAR */}
      {(message || error) && (
        <div className={`p-4 rounded-lg border ${error ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'} flex items-center gap-3`}>
            {error ? <LuShieldAlert size={20} /> : <LuCheck size={20} />}
            <span>{error || message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KART 1: MESAJ */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0f1116] border border-white/5 p-6 group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <LuMessageSquare size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Mesaj Aktivitesi</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.message_earn_enabled}
                  onChange={(e) => setSettings({ ...settings, message_earn_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Mesaj Başına Kazanç</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-amber-500 text-sm font-bold">P</span>
                      </div>
                        <input 
                          type="number" 
                          min={0} 
                          step="0.01" 
                          value={settings?.earn_per_message ?? 0} 
                          onChange={(e) => updateNumber('earn_per_message', Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        />
                  </div>
               </div>
            </div>
        </div>

        {/* KART 2: SES */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0f1116] border border-white/5 p-6 group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <LuMic size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Sesli Sohbet</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.voice_earn_enabled}
                  onChange={(e) => setSettings({ ...settings, voice_earn_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:bg-violet-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Dakika Başına Kazanç</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-emerald-500 text-sm font-bold">P</span>
                      </div>
                        <input 
                          type="number" 
                          min={0} 
                          step="0.01" 
                          value={settings?.earn_per_voice_minute ?? 0} 
                          onChange={(e) => updateNumber('earn_per_voice_minute', Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                        />
                  </div>
               </div>
            </div>
        </div>

        {/* KART 3: ETİKET & BOOSTER (GÜNCELLENDİ) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-[#0f1116] border border-white/5 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* SOL: ETİKET */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              <LuTag size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Etiket Bonusu</h2>
                                <p className="text-xs text-zinc-500">Sunucunuzun etiketini takanlara ödül.</p>
                            </div>
                         </div>
                         <label className={`relative inline-flex items-center ${!settings.tag_configured ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input 
                              type="checkbox" 
                              checked={settings.tag_required}
                              onChange={(e) => {
                                if (!settings.tag_configured) return;
                                setSettings({ ...settings, tag_required: e.target.checked });
                              }}
                              className="sr-only peer" 
                              disabled={!settings.tag_configured}
                            />
                            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:bg-pink-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                    </div>

                    {/* GERÇEK SUNUCU BİLGİSİ ÖNİZLEMESİ */}
                    {settings.tag_required && settings._guildPreview && (
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-zinc-500 font-medium">Bu sunucu için etiket kontrolü yapılacak:</span>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2B2D31] border border-[#1E1F22] text-[#DBDEE1]">
                                {settings._guildPreview.icon ? (
                                    <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                       <Image 
                                         src={settings._guildPreview.icon} 
                                         alt="Guild Icon" 
                                         fill 
                                         className="object-cover" 
                                         unoptimized 
                                       />
                                    </div>
                                ) : (
                                    <LuServer size={16} />
                                )}
                                <span className="text-xs font-bold">{settings._guildPreview.name}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Mesaj Bonusu</label>
                          <input type="number" min={0} step="0.01" value={settings?.tag_bonus_message ?? 0} onChange={(e) => updateNumber('tag_bonus_message', Number(e.target.value))} className={`w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-pink-500/50 outline-none ${!settings.tag_configured ? 'opacity-60 pointer-events-none' : ''}`} disabled={!settings.tag_configured} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Ses Bonusu</label>
                          <input type="number" min={0} step="0.01" value={settings?.tag_bonus_voice ?? 0} onChange={(e) => updateNumber('tag_bonus_voice', Number(e.target.value))} className={`w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-pink-500/50 outline-none ${!settings.tag_configured ? 'opacity-60 pointer-events-none' : ''}`} disabled={!settings.tag_configured} />
                        </div>
                    </div>
                    {!settings.tag_configured && (
                      <div className="mt-3 text-sm text-zinc-400">Sunucuda etiket yapılandırılmamış. Etiket zorunluluğunu etkinleştirmek için önce Discord üzerinde uygun bir etiket yapılandırın veya bot yapılandırmasını tamamlayın.</div>
                    )}
                </div>

                {/* SAĞ: BOOSTER */}
                <div className="space-y-6 md:border-l md:border-white/5 md:pl-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                          <LuZap size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Booster Bonusu</h2>
                            <p className="text-xs text-zinc-500">Takviye yapan üyelere ekstra ödül.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Mesaj Bonusu</label>
                            <input type="number" min={0} step="0.01" value={settings?.booster_bonus_message ?? 0} onChange={(e) => updateNumber('booster_bonus_message', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-fuchsia-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5">Ses Bonusu</label>
                            <input type="number" min={0} step="0.01" value={settings?.booster_bonus_voice ?? 0} onChange={(e) => updateNumber('booster_bonus_voice', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 text-white font-mono focus:ring-2 focus:ring-fuchsia-500/50 outline-none" />
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* KART 4: GÜVENLİK */}
        <div className="lg:col-span-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
                <LuShieldAlert size={120} className="text-red-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 inline-flex">
                        <LuShieldAlert size={24} />
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Güvenlik & Doğrulama</h3>
                        <p className="text-sm text-red-200/70 mt-1">
                            Bu alan, botun kimlere ödül vereceğini belirler. Boş bırakılırsa tüm üyeler ödül alır.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-red-300 uppercase mb-2">Doğrulama Rolü ID&#39;si</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="text" 
                                value={settings.verify_role_id ?? ''} 
                                onChange={(e) => setSettings({ ...settings, verify_role_id: e.target.value || null })} 
                                placeholder="Rol ID'si girin" 
                                className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-red-500/20 text-white placeholder-red-500/30 focus:ring-2 focus:ring-red-500/50 outline-none font-mono" 
                            />
                            
                            {/* ROL ADI GÖSTERGESİ */}
                            {roleName && (
                                <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium whitespace-nowrap animate-in fade-in">
                                    <LuCheck size={16} />
                                    <span>{roleName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* KART 5: KANAL YAPILANDIRMASI */}
        <ChannelEarnConfig
          settings={settings}
          onUpdate={(earnChannels) => setSettings({ ...settings, earn_channels: earnChannels })}
        />

      </div>
    </div>
  );
}

/* --- KANAL YAPILANDIRMA BİLEŞENİ --- */
function ChannelEarnConfig({
  settings,
  onUpdate,
}: {
  settings: EarnSettings;
  onUpdate: (channels: EarnChannels) => void;
}) {
  const channels = settings._channels ?? [];
  const earnChannels: EarnChannels = settings.earn_channels ?? {
    mode: 'all',
    message_channels: [],
    message_categories: [],
    voice_channels: [],
    voice_categories: [],
  };

  const categories = channels.filter((c) => c.type === 4);
  const textChannels = channels.filter((c) => c.type === 0);
  const voiceChannels = channels.filter((c) => c.type === 2);

  const update = (partial: Partial<EarnChannels>) => {
    onUpdate({ ...earnChannels, ...partial });
  };

  const toggleItem = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const getChannelName = (id: string) => channels.find((c) => c.id === id)?.name ?? id;
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  if (channels.length === 0) {
    return (
      <div className="lg:col-span-2 rounded-2xl bg-[#0f1116] border border-white/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <LuHash size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kazanç Kanalları</h2>
            <p className="text-xs text-zinc-500">Kanal bilgisi yüklenemedi.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 rounded-2xl bg-[#0f1116] border border-white/5 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <LuHash size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kazanç Kanalları</h2>
            <p className="text-xs text-zinc-500">Hangi kanallarda papel kazanılacağını belirleyin.</p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-3">
        {([
          { value: 'all', label: 'Tüm Kanallar', desc: 'Her kanalda kazanç aktif' },
          { value: 'whitelist', label: 'Beyaz Liste', desc: 'Sadece seçilen kanallarda kazanç' },
          { value: 'blacklist', label: 'Kara Liste', desc: 'Seçilen kanallar hariç kazanç' },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update({ mode: opt.value })}
            className={`flex-1 min-w-[140px] rounded-xl border p-4 text-left transition ${
              earnChannels.mode === opt.value
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
            }`}
          >
            <p className={`text-sm font-semibold ${earnChannels.mode === opt.value ? 'text-cyan-300' : 'text-white/70'}`}>
              {opt.label}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>

      {earnChannels.mode !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesaj Kanalları */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-2">
              <LuMessageSquare size={14} />
              Mesaj Kanalları
            </p>

            {/* Kategori Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuFolder size={12} /> Kategoriler</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = earnChannels.message_categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update({ message_categories: toggleItem(earnChannels.message_categories, cat.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <LuFolder size={12} />
                      {cat.name}
                      {selected && <LuX size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kanal Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuHash size={12} /> Metin Kanalları</p>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 bg-zinc-900/50 p-2">
                {textChannels.map((ch) => {
                  const selected = earnChannels.message_channels.includes(ch.id);
                  const catName = ch.parent_id ? getCategoryName(ch.parent_id) : null;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => update({ message_channels: toggleItem(earnChannels.message_channels, ch.id) })}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                        selected
                          ? 'bg-blue-500/15 text-blue-300'
                          : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <LuHash size={12} className="shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {catName && <span className="ml-auto text-[10px] text-zinc-600 truncate">{catName}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sesli Kanallar */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-2">
              <LuMic size={14} />
              Sesli Kanallar
            </p>

            {/* Kategori Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuFolder size={12} /> Kategoriler</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = earnChannels.voice_categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update({ voice_categories: toggleItem(earnChannels.voice_categories, cat.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <LuFolder size={12} />
                      {cat.name}
                      {selected && <LuX size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kanal Seçimi */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><LuVolume2 size={12} /> Ses Kanalları</p>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 bg-zinc-900/50 p-2">
                {voiceChannels.map((ch) => {
                  const selected = earnChannels.voice_channels.includes(ch.id);
                  const catName = ch.parent_id ? getCategoryName(ch.parent_id) : null;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => update({ voice_channels: toggleItem(earnChannels.voice_channels, ch.id) })}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                        selected
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <LuVolume2 size={12} className="shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {catName && <span className="ml-auto text-[10px] text-zinc-600 truncate">{catName}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seçim Özeti */}
      {earnChannels.mode !== 'all' && (
        <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
            {earnChannels.mode === 'whitelist' ? 'Sadece şu kanallarda kazanç aktif:' : 'Şu kanallar hariç kazanç aktif:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {earnChannels.message_categories.map((id) => (
              <span key={`mc-${id}`} className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300">
                <LuFolder size={10} /> {getCategoryName(id)} <span className="text-blue-500">(mesaj)</span>
              </span>
            ))}
            {earnChannels.message_channels.map((id) => (
              <span key={`ch-${id}`} className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300">
                <LuHash size={10} /> {getChannelName(id)}
              </span>
            ))}
            {earnChannels.voice_categories.map((id) => (
              <span key={`vc-${id}`} className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
                <LuFolder size={10} /> {getCategoryName(id)} <span className="text-violet-500">(ses)</span>
              </span>
            ))}
            {earnChannels.voice_channels.map((id) => (
              <span key={`vch-${id}`} className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
                <LuVolume2 size={10} /> {getChannelName(id)}
              </span>
            ))}
            {earnChannels.message_channels.length === 0 &&
              earnChannels.message_categories.length === 0 &&
              earnChannels.voice_channels.length === 0 &&
              earnChannels.voice_categories.length === 0 && (
                <span className="text-xs text-zinc-500">Henüz kanal seçilmedi.</span>
              )}
          </div>
        </div>
      )}
    </div>
  );
}