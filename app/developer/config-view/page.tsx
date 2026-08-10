'use client';

import { useState, useEffect } from 'react';
import { LuSettings, LuDatabase, LuServer, LuKey, LuGlobe, LuShield, LuRefreshCw, LuEye, LuEyeOff, LuSearch } from 'react-icons/lu';

interface ConfigItem {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'secret';
  description: string;
  category: string;
}

const CATEGORY_META: Record<string, { icon: typeof LuGlobe; color: string }> = {
  'Environment': { icon: LuGlobe, color: 'text-blue-400' },
  'Database': { icon: LuDatabase, color: 'text-emerald-400' },
  'API Keys': { icon: LuKey, color: 'text-violet-400' },
  'Security': { icon: LuShield, color: 'text-rose-400' },
  'Server': { icon: LuServer, color: 'text-amber-400' },
};

export default function ConfigViewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/config-view', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = await res.json();
      setConfigs(data.configs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecret = (key: string) => {
    const newSet = new Set(visibleSecrets);
    if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
    setVisibleSecrets(newSet);
  };

  const categories = [...new Set(configs.map(c => c.category))];

  const filtered = configs.filter(c => {
    const matchesSearch = !searchTerm || c.key.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = !selectedCategory || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const grouped = categories
    .map(cat => ({ name: cat, items: filtered.filter(c => c.category === cat) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sistem Ayarları</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Ortam değişkenleri ve yapılandırma durumları.</p>
        </div>
        <button type="button" onClick={loadConfigs} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all">
          <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Ayar adı veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:border-[#5865F2]/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${!selectedCategory ? 'bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/20' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
          >
            Tümü
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${selectedCategory === cat ? 'bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/20' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const meta = CATEGORY_META[group.name] ?? { icon: LuSettings, color: 'text-white/50' };
            const Icon = meta.icon;
            return (
              <div key={group.name} className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <span className="text-sm font-semibold text-white">{group.name}</span>
                  <span className="text-[10px] text-white/30 ml-auto">{group.items.length} ayar</span>
                </div>
                <div className="divide-y divide-white/5">
                  {group.items.map(item => (
                    <div key={item.key} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-white/70">{item.key}</p>
                        <p className="text-[10px] text-white/30">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.type === 'boolean' ? (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            item.value ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          }`}>
                            {item.value ? 'Aktif' : 'Pasif'}
                          </span>
                        ) : item.type === 'secret' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-amber-300/70">
                              {visibleSecrets.has(item.key) ? String(item.value) : '••••••••'}
                            </span>
                            <button type="button" onClick={() => toggleSecret(item.key)} className="text-white/30 hover:text-white/60 transition-colors">
                              {visibleSecrets.has(item.key) ? <LuEyeOff className="w-3.5 h-3.5" /> : <LuEye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/70 font-mono">{String(item.value)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
