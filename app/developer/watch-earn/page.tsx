'use client';

import { useTranslation } from '@/lib/i18nContext';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { LuEye, LuEyeOff, LuMonitorPlay, LuTrash2 } from 'react-icons/lu';

type WatchEarnTask = {
  id: string;
  title: string;
  logo_text: string;
  sponsor: string;
  reward_papel: number;
  multiplier_label: string | null;
  banner_url: string;
  video_url: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const emptyForm = {
  title: '',
  logo_text: '',
  sponsor: '',
  reward_papel: '200',
  multiplier_label: '',
  banner_url: '/menu-background/varyant.jpg',
  video_url: '',
  starts_at: '',
  ends_at: '',
  active: true,
};

const formatShort = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function WatchEarnAdminPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<WatchEarnTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/watch-earn', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/watch-earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          logo_text: form.logo_text.trim(),
          sponsor: form.sponsor.trim(),
          reward_papel: Number(form.reward_papel),
          multiplier_label: form.multiplier_label.trim() || null,
          banner_url: form.banner_url.trim(),
          video_url: form.video_url.trim(),
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setSuccess(t('developer.watch_earn.create_success'));
      setForm(emptyForm);
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (task: WatchEarnTask) => {
    try {
      const res = await fetch('/api/admin/watch-earn', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: task.id, active: !task.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      if (data.task) {
        setTasks((prev) => prev.map((item) => (item.id === task.id ? data.task : item)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('developer.watch_earn.status_failed'));
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm(t('developer.watch_earn.confirm_delete'))) return;
    try {
      await fetch(`/api/admin/watch-earn?id=${id}`, { method: 'DELETE', credentials: 'include' });
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <LuMonitorPlay className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('developer.watch_earn.title')}</h1>
          <p className="text-sm text-[#99AAB5] mt-1">{t('developer.watch_earn.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={createTask} className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">{t('developer.watch_earn.create_title')}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.logo_text')}</label>
            <input
              required
              value={form.logo_text}
              onChange={(e) => setForm((f) => ({ ...f, logo_text: e.target.value }))}
              placeholder="EXODUS"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.task_title')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="EXODUS GAMEPLAY GÖREVİ"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.sponsor')}</label>
            <input
              required
              value={form.sponsor}
              onChange={(e) => setForm((f) => ({ ...f, sponsor: e.target.value }))}
              placeholder="Wizards of the Coast"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.reward')}</label>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.reward_papel}
              onChange={(e) => setForm((f) => ({ ...f, reward_papel: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.starts_at')}</label>
            <input
              required
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.ends_at')}</label>
            <input
              required
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.banner_url')}</label>
            <input
              required
              value={form.banner_url}
              onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))}
              placeholder="/menu-background/varyant.jpg"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.video_url')}</label>
            <input
              required
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              placeholder="/cdn/Storage/Test1.mp4"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
            <p className="mt-1 text-[11px] text-white/35">{t('developer.watch_earn.video_hint')}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">{t('developer.watch_earn.multiplier')}</label>
            <input
              value={form.multiplier_label}
              onChange={(e) => setForm((f) => ({ ...f, multiplier_label: e.target.value }))}
              placeholder="1,2 kat kilit aç"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5865F2]/40"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-white/20"
              />
              {t('developer.common.active')}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {creating ? t('developer.watch_earn.creating') : t('developer.watch_earn.create_btn')}
        </button>

        {success && <p className="text-xs text-emerald-400">{success}</p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5">
        <h2 className="text-lg font-bold text-white mb-4">{t('developer.watch_earn.existing')}</h2>
        {loading ? (
          <p className="text-sm text-white/40 text-center py-4">{t('developer.common.loading')}</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">{t('developer.watch_earn.empty')}</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-xl border p-4 flex flex-col sm:flex-row gap-4 ${
                  task.active ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-black/40">
                  <Image src={task.banner_url} alt={task.logo_text} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-white truncate">{task.logo_text}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {task.active ? t('developer.common.active') : t('developer.common.inactive')}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mb-2">{task.title}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-white/45">
                    <span className="bg-black/40 px-2 py-1 rounded-lg">{task.sponsor}</span>
                    <span className="bg-black/40 px-2 py-1 rounded-lg text-amber-300">
                      {t('developer.watch_earn.reward_label', { amount: task.reward_papel })}
                    </span>
                    <span className="bg-black/40 px-2 py-1 rounded-lg">
                      {formatShort(task.starts_at)} → {formatShort(task.ends_at)}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void toggleActive(task)}
                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-white/60 hover:text-white"
                    title={task.active ? t('developer.watch_earn.unpublish') : t('developer.watch_earn.publish')}
                  >
                    {task.active ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTask(task.id)}
                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 p-2 text-rose-400"
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
