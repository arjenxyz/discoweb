'use client';

import { useState, useEffect } from 'react';
import { LuListChecks } from 'react-icons/lu';

type WeeklyTaskType = 'join_guild' | 'message_count' | 'voice_minutes' | 'role' | 'event_participation';

type WeeklyTaskAdmin = {
  id: string;
  guild_id: string;
  guild_name?: string | null;
  week_start: string;
  title: string;
  description: string | null;
  requirement_type: WeeklyTaskType;
  requirement_value: number | null;
  requirement_role_id: string | null;
  requirement_target_guild_id: string | null;
  reward_mari: number;
  sort_order: number;
  active: boolean;
};

export default function WeeklyTasksPage() {
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    guildId: '',
    title: '',
    description: '',
    requirementType: 'message_count' as WeeklyTaskType,
    requirementValue: '10',
    requirementRoleId: '',
    requirementTargetGuildId: '',
    rewardMari: '10',
    sortOrder: '0',
    active: true,
  });

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/weekly-tasks', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setWeeklyTasks(data.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSuccess(null);
    setError(null);
    try {
      const payload = {
        guild_id: form.guildId.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        requirement_type: form.requirementType,
        requirement_value: form.requirementValue ? Number(form.requirementValue) : null,
        requirement_role_id: form.requirementRoleId.trim() || null,
        requirement_target_guild_id: form.requirementTargetGuildId.trim() || null,
        reward_mari: Number(form.rewardMari),
        sort_order: Number(form.sortOrder),
        active: form.active,
      };
      
      const res = await fetch('/api/admin/weekly-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      
      setSuccess('Haftalık görev başarıyla oluşturuldu.');
      setForm({
        guildId: '', title: '', description: '', requirementType: 'message_count',
        requirementValue: '10', requirementRoleId: '', requirementTargetGuildId: '',
        rewardMari: '10', sortOrder: '0', active: true,
      });
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <LuListChecks className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Haftalık Görevler</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Sunucu bazlı global haftalık görevleri yönetin.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5 h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Yeni Görev Oluştur</h2>
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Sunucu ID (Zorunlu)</label>
              <input required type="text" value={form.guildId} onChange={e => setForm(p => ({ ...p, guildId: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Görev Başlığı</label>
              <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Açıklama</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none min-h-[60px]" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Görev Tipi</label>
                <select value={form.requirementType} onChange={e => setForm(p => ({ ...p, requirementType: e.target.value as WeeklyTaskType }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none">
                  <option value="message_count">Mesaj Sayısı</option>
                  <option value="voice_minutes">Ses Dakikası</option>
                  <option value="join_guild">Sunucuya Katılma</option>
                  <option value="role">Rol Alma</option>
                  <option value="event_participation">Etkinliğe Katılım</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Gereksinim Değeri</label>
                <input type="number" value={form.requirementValue} onChange={e => setForm(p => ({ ...p, requirementValue: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Rol ID (Gerekiyorsa)</label>
                <input type="text" value={form.requirementRoleId} onChange={e => setForm(p => ({ ...p, requirementRoleId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Hedef Sunucu ID</label>
                <input type="text" value={form.requirementTargetGuildId} onChange={e => setForm(p => ({ ...p, requirementTargetGuildId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Ödül (Mari)</label>
                <input type="number" value={form.rewardMari} onChange={e => setForm(p => ({ ...p, rewardMari: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Sıra</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#5865F2]/50 outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded border-white/10 bg-black/30" />
              <span className="text-sm text-white">Aktif</span>
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && <p className="text-xs text-emerald-400">{success}</p>}

            <button type="submit" disabled={creating} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50">
              {creating ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5">
          <h2 className="text-lg font-bold text-white mb-4">Mevcut Görevler</h2>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[700px] pr-2">
            {loading ? (
              <p className="text-sm text-white/40 text-center py-4">Yükleniyor...</p>
            ) : weeklyTasks.length > 0 ? (
              weeklyTasks.map((task) => (
                <div key={task.id} className={`rounded-xl border p-4 ${task.active ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold text-white">{task.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                      {task.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-white/50 mb-3">{task.description}</p>}
                  <div className="flex flex-wrap gap-2 text-[10px] text-white/60">
                    <span className="bg-black/40 px-2 py-1 rounded-lg">Sunucu: {task.guild_name ?? task.guild_id}</span>
                    <span className="bg-black/40 px-2 py-1 rounded-lg">Tip: {task.requirement_type}</span>
                    <span className="bg-black/40 px-2 py-1 rounded-lg">Gereksinim: {task.requirement_value ?? 'Yok'}</span>
                    <span className="bg-black/40 px-2 py-1 rounded-lg text-amber-300">Ödül: {task.reward_mari} Mari</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/40 text-center py-4">Henüz görev bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
