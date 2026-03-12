"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MailDetailModal from './MailDetailModal';
import type { MailItem } from '../types';
import {
  LuMail, LuMailOpen, LuTrash2,
  LuRefreshCw, LuSearch, LuInbox,
  LuStar, LuClock, LuCheckCheck,
  LuMegaphone, LuWrench, LuGift,
  LuReceipt, LuChevronLeft, LuChevronDown, LuChevronUp,
  LuArchive, LuTag, LuSparkles,
} from 'react-icons/lu';

const stripHtml = (s?: string) => (s ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;?/g, ' ');

const previewText = (s?: string, max = 100) => {
  const t = stripHtml(s).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; css: string }> = {
  announcement: {
    label: 'Duyurular',
    icon: <LuMegaphone />,
    css: 'border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2]',
  },
  system: {
    label: 'Sistem',
    icon: <LuMail />,
    css: 'border-red-500/30 bg-red-500/10 text-red-400',
  },
  maintenance: {
    label: 'Bakım',
    icon: <LuWrench />,
    css: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  sponsor: {
    label: 'Sponsorluk',
    icon: <LuStar />,
    css: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400',
  },
  update: {
    label: 'Güncellemeler',
    icon: <LuSparkles />,
    css: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  },
  lottery: {
    label: 'Promosyonlar',
    icon: <LuGift />,
    css: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  },
  reward: {
    label: 'Ödüller',
    icon: <LuReceipt />,
    css: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  },
  order: {
    label: 'Siparişler',
    icon: <LuTag />,
    css: 'border-white/20 bg-white/5 text-white/60',
  },
};

const FIXED_CATEGORIES = ['announcement', 'system', 'update', 'maintenance', 'reward', 'lottery', 'sponsor', 'order'] as const;

type MailSectionProps = {
  loading: boolean;
  error: string | null;
  items: MailItem[];
  onOpenMail?: (mail: MailItem) => void;
  onBack?: () => void;
};

export default function MailSection({
  loading,
  error,
  items,
  onOpenMail,
  onBack,
}: MailSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type }), 3500);
  };

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Route-based modal sync
  useEffect(() => {
    try {
      const id = searchParams?.get('id') ?? null;
      const path = pathname ?? '';
      if (path.startsWith('/dashboard/mail')) {
        if (id) {
          const found = items.find(i => String(i.id) === String(id));
          if (found && (!selectedMail || String(selectedMail.id) !== String(found.id))) {
            setSelectedMail(found);
          }
        }
      } else {
        if (selectedMail) setSelectedMail(null);
      }
    } catch {}
  }, [pathname, searchParams?.get('id')]);

  // Counts
  const countsTotal = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc.all = (acc.all ?? 0) + 1;
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, { all: 0 });
  }, [items]);

  const countsUnread = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const unread = item.is_read ? 0 : 1;
      acc.all = (acc.all ?? 0) + unread;
      acc[item.category] = (acc[item.category] ?? 0) + unread;
      return acc;
    }, { all: 0 });
  }, [items]);

  const filtered = useMemo(() => {
    let base = activeCategory === 'all' ? items.slice() : items.filter((item) => item.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(m => m.title.toLowerCase().includes(q) || stripHtml(m.body).toLowerCase().includes(q));
    }
    base.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });
    return base;
  }, [items, activeCategory, sortOrder, searchQuery]);

  const toggleSort = () => setSortOrder(s => (s === 'desc' ? 'asc' : 'desc'));

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return days[d.getDay()];
    } else {
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    const visibleIds = filtered.map(m => String(m.id));
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      for (const id of visibleIds) newSet.delete(id);
    } else {
      for (const id of visibleIds) newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const navItems = [
    { key: 'all', label: 'Gelen Kutusu', icon: <LuInbox /> },
    ...FIXED_CATEGORIES.map(cat => ({
      key: cat,
      label: CATEGORY_CONFIG[cat]?.label ?? cat,
      icon: CATEGORY_CONFIG[cat]?.icon ?? <LuMail />,
    })),
  ];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#0b0d12] flex flex-col">

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-8 md:py-5 bg-white/[0.02]">
        <div className="flex items-center gap-2 md:gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <LuChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Geri</span>
            </button>
          )}
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 transition-all"
          >
            <LuInbox className="w-4 h-4" /> Klasörler
          </button>
          <div className="hidden md:block p-3 bg-gradient-to-br from-[#5865F2] to-indigo-600 rounded-2xl shadow-lg shadow-[#5865F2]/20">
            <LuMail className="w-6 h-6 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5865F2]">İletişim</p>
            <h2 className="text-xl font-bold text-white tracking-tight">Posta Kutusu</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-medium text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {countsTotal.all ?? 0} <span className="hidden sm:inline">Mesaj &middot;</span> {countsUnread.all ?? 0} <span className="hidden sm:inline">Okunmamış</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 min-h-0">

        {/* SIDEBAR - Desktop: inline, Mobile: drawer overlay */}
        {isMobile && (
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          </div>
        )}
        <div className={`${
          isMobile
            ? `fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-72'
        } flex flex-col border-r border-white/10 bg-[#0b0d12] backdrop-blur-md min-h-0`}>
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 custom-scrollbar">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 px-2">Klasörler</p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeCategory === item.key;
                const count = countsUnread[item.key] ?? 0;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { setActiveCategory(item.key); if (isMobile) setSidebarOpen(false); }}
                    className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-[#5865F2]/10 text-white shadow-[inset_4px_0_0_0_#5865F2]'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`text-lg transition-colors ${isActive ? 'text-[#5865F2]' : 'text-white/40 group-hover:text-white'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    {count > 0 && (
                      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[10px] font-bold ${
                        isActive ? 'bg-[#5865F2] text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex-shrink-0 px-5 pb-5">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Depolama</p>
              <p className="text-xs text-white/50 mb-2">
                {countsTotal.all} mesajdan {countsUnread.all} okunmadı
              </p>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5865F2] to-indigo-500 transition-all"
                  style={{ width: `${countsTotal.all > 0 ? Math.min((countsUnread.all / countsTotal.all) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-transparent to-[#0b0d12]/20 min-w-0 min-h-0">

          {/* Search Bar */}
          <div className="flex-shrink-0 px-3 md:px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-[#5865F2]/30 transition-colors">
                <LuSearch className="w-4 h-4 text-white/30" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Mesajlarda ara..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex-shrink-0 px-3 md:px-6 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Select All */}
              <button
                onClick={selectAll}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Tümünü Seç"
              >
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                  selectedIds.size > 0 ? 'bg-[#5865F2] border-[#5865F2]' : 'border-white/30'
                }`}>
                  {selectedIds.size > 0 && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Refresh */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('mail:refresh'));
                  showToast('Yenilendi', 'success');
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                title="Yenile"
              >
                <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Bulk actions when selected */}
              {selectedIds.size > 0 && (
                <>
                  <div className="w-px h-5 bg-white/10 mx-1" />

                  <button
                    onClick={async () => {
                      const ids = Array.from(selectedIds);
                      try {
                        await fetch('/api/mail', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                        showToast(`${ids.length} mesaj silindi`, 'success');
                        setSelectedIds(new Set());
                        window.dispatchEvent(new CustomEvent('mail:refresh'));
                      } catch {
                        showToast('Silme hatası', 'error');
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-rose-400 transition-colors"
                    title="Sil"
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={async () => {
                      const ids = Array.from(selectedIds);
                      try {
                        await fetch('/api/mail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                        showToast('Okundu işaretlendi', 'success');
                        setSelectedIds(new Set());
                        window.dispatchEvent(new CustomEvent('mail:refresh'));
                      } catch {
                        showToast('İşlem hatası', 'error');
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-[#5865F2] transition-colors"
                    title="Okundu işaretle"
                  >
                    <LuMailOpen className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-bold text-[#5865F2] ml-1">{selectedIds.size} seçili</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>{filtered.length > 0 ? '1' : '0'}–{filtered.length} / {filtered.length}</span>
              <button
                onClick={toggleSort}
                title={sortOrder === 'desc' ? 'En yeni önce' : 'En eski önce'}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                {sortOrder === 'desc' ? <LuChevronDown className="w-4 h-4" /> : <LuChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mail List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <LuRefreshCw className="w-8 h-8 animate-spin mb-3" />
                <span className="text-sm">Yükleniyor...</span>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <LuArchive className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white font-bold">Kutu Boş</p>
                <p className="text-sm text-white/40 mt-1">Bu kategoride henüz mesaj yok.</p>
              </div>
            )}

            {!loading && !error && filtered.map((mail) => {
              const config = CATEGORY_CONFIG[mail.category] ?? CATEGORY_CONFIG.order;
              const isSelected = selectedIds.has(String(mail.id));

              return (
                <div
                  key={mail.id}
                  className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-[#5865F2]/30 bg-[#5865F2]/10'
                      : mail.is_read
                        ? 'border-white/5 bg-[#0b0d12]/40 opacity-70 hover:opacity-100 hover:bg-[#0b0d12]/60 hover:border-white/10'
                        : 'border-[#5865F2]/20 bg-gradient-to-r from-[#5865F2]/5 to-transparent hover:border-[#5865F2]/40 hover:shadow-[0_10px_30px_-10px_rgba(88,101,242,0.15)]'
                  }`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.mail-action-btn')) return;
                    setSelectedMail(mail);
                    if (onOpenMail) onOpenMail(mail);
                    try { router.push(`/dashboard/mail?id=${encodeURIComponent(String(mail.id))}`); } catch {}
                  }}
                >
                  {/* Checkbox */}
                  <div className="mail-action-btn flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(String(mail.id)); }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#5865F2] border-[#5865F2]' : 'border-white/30'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Star */}
                  <div className="mail-action-btn flex-shrink-0">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          if (mail.is_starred) {
                            await fetch('/api/mail/star', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: String(mail.id) }) });
                          } else {
                            await fetch('/api/mail/star', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: String(mail.id) }) });
                          }
                          window.dispatchEvent(new CustomEvent('mail:refresh'));
                        } catch {
                          showToast('Yıldız işlemi başarısız', 'error');
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <LuStar className={`w-4 h-4 transition-colors ${mail.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-white/20 hover:text-yellow-400'}`} />
                    </button>
                  </div>

                  {/* Read/Unread icon */}
                  <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                    mail.is_read
                      ? 'border-white/5 bg-white/5 text-white/20'
                      : 'border-[#5865F2]/30 bg-[#5865F2]/20 text-[#5865F2] shadow-[0_0_15px_rgba(88,101,242,0.3)]'
                  }`}>
                    {mail.is_read ? <LuMailOpen className="w-5 h-5" /> : <LuMail className="w-5 h-5" />}
                  </div>

                  {/* Category badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.css}`}>
                      <span className="text-sm">{config.icon}</span>
                      <span className="hidden sm:inline">{config.label}</span>
                    </span>
                  </div>

                  {/* Title & preview */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm truncate ${mail.is_read ? 'font-medium text-white/60' : 'font-bold text-white'}`}>
                      {mail.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-white/30 line-clamp-1 group-hover:text-white/50 transition-colors">
                      {previewText(mail.body, 80)}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex-shrink-0 text-[10px] font-medium text-white/30 whitespace-nowrap">
                    {formatDate(mail.created_at)}
                  </div>

                  {/* Delete */}
                  <div className="mail-action-btn flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch('/api/mail', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [mail.id] }) });
                          showToast('Mesaj silindi', 'success');
                          window.dispatchEvent(new CustomEvent('mail:refresh'));
                        } catch {
                          showToast('Silme hatası', 'error');
                        }
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-all"
                    >
                      <LuTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex-shrink-0 border-t border-white/10 bg-[#0b0d12]/30 px-3 md:px-6 py-3 flex items-center justify-end gap-3 backdrop-blur-md">
            <button
              type="button"
              onClick={async () => {
                const ids = filtered.filter(m => !m.is_read).map(m => m.id);
                if (ids.length === 0) return showToast('Okunmamış mesaj yok', 'error');
                try {
                  await fetch('/api/mail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                  showToast('Tüm mesajlar okundu olarak işaretlendi', 'success');
                  window.dispatchEvent(new CustomEvent('mail:refresh'));
                } catch {
                  showToast('İşlem başarısız', 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <LuCheckCheck className="w-4 h-4" /> Tümünü Okundu Say
            </button>

            <button
              type="button"
              onClick={async () => {
                const ids = filtered.filter(m => m.category === 'reward' && !m.is_read).map(m => m.id);
                if (ids.length === 0) return showToast('Talep edilecek ödül yok', 'error');
                try {
                  await fetch('/api/mail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                  showToast('Ödüller talep edildi', 'success');
                  window.dispatchEvent(new CustomEvent('mail:refresh'));
                } catch {
                  showToast('Talep başarısız', 'error');
                }
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#5865F2] to-indigo-600 text-xs font-bold text-white shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/40 transition-all"
            >
              <LuGift className="w-4 h-4" /> Hepsini Al
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.open && (
        <div className={`fixed right-6 bottom-6 z-[9999] rounded-xl px-5 py-3 shadow-2xl text-sm font-medium backdrop-blur-xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Mail detail modal */}
      {selectedMail && (
        <MailDetailModal
          mail={selectedMail}
          onClose={() => {
            setSelectedMail(null);
            try { router.push('/dashboard/mail'); } catch {}
          }}
        />
      )}
    </section>
  );
}
