'use client';

import Image from 'next/image';
import type { MailItem } from '../types';
import { useEffect, useState, useRef } from 'react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import {
  LuReply,
  LuReplyAll,
  LuForward,
  LuArchive,
  LuTrash2,
  LuMoveVertical,
  LuStar,
  LuPrinter,
  LuDownload,
  LuChevronLeft,
  LuClock,
  LuShield,
  LuMailOpen
} from 'react-icons/lu';

// Category to sender mapping
const SENDER_CONFIG = {
  announcement: {
    name: 'Sistem Duyuruları',
    email: 'announcements@system.local',
    avatar: '🔔',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
  system: {
    name: 'Sistem Yöneticisi',
    email: 'system@noreply.local',
    avatar: '⚙️',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
  maintenance: {
    name: 'Bakım Ekibi',
    email: 'maintenance@system.local',
    avatar: '🔧',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
  sponsor: {
    name: 'İş Ortaklıkları',
    email: 'partnerships@system.local',
    avatar: '💼',
    avatarUrl: '/gif/from.gif',
    verified: false
  },
  update: {
    name: 'Ürün Güncellemeleri',
    email: 'updates@system.local',
    avatar: '✨',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
  lottery: {
    name: 'Kampanya Yönetimi',
    email: 'campaigns@system.local',
    avatar: '🎉',
    avatarUrl: '/gif/from.gif',
    verified: false
  },
  reward: {
    name: 'Ödül Merkezi',
    email: 'rewards@system.local',
    avatar: '🎁',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
  order: {
    name: 'Sipariş Yönetimi',
    email: 'orders@system.local',
    avatar: '📦',
    avatarUrl: '/gif/from.gif',
    verified: true
  },
} as const;

type MailDetailModalProps = {
  mail: MailItem | null;
  onClose: () => void;
  renderBody?: (body: string) => React.ReactNode;
};

const isVideoUrl = (url: string) => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export default function MailDetailModal({ mail, onClose }: MailDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    if (mail && !mail.is_read) {
      void (async () => {
        try {
          await fetch('/api/mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mail.id })
          });
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent('mail:refresh'));
        } catch {}
      })();
    }
  }, [mail]);

  const [recipient, setRecipient] = useState<{ id: string; username: string; avatar: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (typeof mail !== 'undefined' && mail?.user_id) {
      void (async () => {
        try {
          const res = await fetch(`/api/discord/user/${mail.user_id}`);
          if (!mounted) return;
          if (res.ok) {
            const data = await res.json();
            setRecipient({ id: data.id, username: data.username, avatar: data.avatar ?? null });
          }
        } catch {}
      })();
    } else {
      try {
        queueMicrotask(() => { if (mounted) setRecipient(null); });
      } catch {
        setTimeout(() => { if (mounted) setRecipient(null); }, 0);
      }
    }
    return () => { mounted = false; };
  }, [mail?.user_id, mail]);

  if (!mail) return null;

  const sender = SENDER_CONFIG[mail.category as keyof typeof SENDER_CONFIG] || SENDER_CONFIG.order;
  type SenderType = typeof SENDER_CONFIG[keyof typeof SENDER_CONFIG];
  const senderTyped = sender as SenderType;
  const avatarUrl = (senderTyped as { avatarUrl?: string }).avatarUrl;

  const renderEmailBody = (body: string, category: string) => {
    if (!body) return null;
    const safeBody = sanitizeHtml(body);

    const parser = typeof window !== 'undefined' ? new DOMParser() : null;
    const doc = parser ? parser.parseFromString(body, 'text/html') : null;

    const textContent = (el: Element | null) => (el ? el.textContent || '' : '');

    // Receipt-style rendering for order/reward
    if (category === 'order' || category === 'reward') {
      try {
        type MailMetadata = {
          items?: Array<{ title: string; total: number }>;
          subtotal?: number;
          discount?: number;
          total?: number;
          purchase_date?: string;
          coupon_code?: string;
          coupon_pct?: number;
        };
        const meta: MailMetadata | undefined = (mail as { metadata?: MailMetadata })?.metadata;
        if (meta && typeof meta === 'object') {
          const items = Array.isArray(meta.items) ? meta.items : [];
          const subtotal = Number(meta.subtotal || 0);
          const discount = Number(meta.discount || 0);
          const total = Number(meta.total || 0);

          return (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5865F2]">Dijital Makbuz</div>
                  <div className="text-lg font-bold text-white mt-1">{mail.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Tarih</div>
                  <div className="text-xs text-white/50 mt-1">{new Date(meta.purchase_date || mail.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((it: { title: string; total: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-sm text-white/80 truncate">{it.title}</div>
                    <div className="text-sm font-bold font-mono text-indigo-400">{Number(it.total).toFixed(2)} Papel</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm px-1">
                  <div className="text-white/40 font-medium">Ara Toplam</div>
                  <div className="font-bold text-white/60">{subtotal.toFixed(2)} Papel</div>
                </div>
                <div className="flex justify-between text-sm mt-2 px-1">
                  <div className="text-white/40 font-medium">İndirim</div>
                  <div className="font-bold text-emerald-400">{discount.toFixed(2)} Papel</div>
                </div>
                {meta && (meta.coupon_code || meta.coupon_pct) && (
                  <div className="mt-3 px-1">
                    <div className="inline-flex items-center gap-3 px-3 py-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-sm">
                      <div className="text-emerald-300 font-medium">Kupon uygulandı</div>
                      <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs font-mono text-emerald-200 border border-emerald-500/30">{meta.coupon_code ?? ''}</div>
                      {meta.coupon_pct && <div className="text-emerald-400 text-sm">{`(${meta.coupon_pct}%)`}</div>}
                    </div>
                  </div>
                )}
                <div className="flex justify-between mt-4 px-1 items-center">
                  <div className="text-lg font-bold text-white">Toplam</div>
                  <div className="text-xl font-black text-white">{total.toFixed(2)} Papel</div>
                </div>
              </div>
            </div>
          );
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // fall back to parsing the body below
      }

      const table = doc ? doc.querySelector('table') : null;
      const items: Array<{ label: string; qty?: string; price?: number }> = [];

      if (table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        rows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('th,td')).map(c => (c.textContent || '').trim());
          if (cells.length >= 2) {
            const label = cells.slice(0, -1).join(' – ');
            const rawPrice = cells[cells.length - 1].replace(/[^0-9.,-]/g, '').replace(',', '.');
            const price = Number(rawPrice) || 0;
            items.push({ label, price });
          }
        });
      } else {
        const lines = (doc ? doc.body.textContent || '' : body).split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
          const m = line.match(/(.+?)\s+[–-]\s*([0-9,.]+)/);
          if (m) {
            items.push({ label: m[1].trim(), price: Number(m[2].replace(',', '.')) || 0 });
          }
        });
      }

      const total = items.reduce((s, it) => s + (it.price || 0), 0);

      return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#5865F2]">Dijital Makbuz</div>
              <div className="text-lg font-bold text-white mt-1">{mail.title}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Tarih</div>
              <div className="text-xs text-white/50 mt-1">{new Date(mail.created_at).toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-sm text-white/80 truncate">{it.label}</div>
                <div className="text-sm font-bold font-mono text-indigo-400">{it.price ? it.price.toFixed(2) : '-'}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between px-1">
            <div className="text-sm text-white/40 font-medium">Toplam</div>
            <div className="text-xl font-black text-white">{total.toFixed(2)} ₺</div>
          </div>
        </div>
      );
    }

    // System alert rendering
    if (category === 'system' || category === 'maintenance') {
      return (
        <div className="mt-4 text-white/70 leading-relaxed">
          <div className="mail-body-content" dangerouslySetInnerHTML={{ __html: safeBody }} />
          {doc && doc.querySelector('pre') && (
            <pre className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-xs text-white/60 overflow-auto">{textContent(doc.querySelector('pre'))}</pre>
          )}
        </div>
      );
    }

    // General HTML
    return (
      <div className="mt-4 text-white/70 leading-relaxed">
        <div className="mail-body-content" dangerouslySetInnerHTML={{ __html: safeBody }} />
      </div>
    );
  };

  const formatFullDate = (date: string) => {
    const d = new Date(date);
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getShortDate = (date: string) => {
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

  return (
    <>
      <style jsx global>{`
        .mail-modal-enter {
          animation: mailModalIn 0.25s ease-out;
        }

        @keyframes mailModalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .mail-modal-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .mail-modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .mail-modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .mail-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .mail-body-content a {
          color: #818cf8;
          text-decoration: underline;
        }

        .mail-body-content a:hover {
          color: #a5b4fc;
        }

        .mail-body-content p {
          margin-bottom: 0.75rem;
        }

        .mail-body-content ul, .mail-body-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .mail-body-content li {
          margin-bottom: 0.25rem;
        }

        .mail-body-content h1, .mail-body-content h2, .mail-body-content h3 {
          color: white;
          font-weight: 700;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
        }

        .mail-body-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
        }

        .mail-body-content th,
        .mail-body-content td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-align: left;
        }

        .mail-body-content th {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClickOutside}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className="mail-modal-enter relative w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0d0f14]/95 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >

          {/* Top Action Bar */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Geri dön"
              >
                <LuChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Arşivle"
              >
                <LuArchive className="w-5 h-5" />
              </button>

              <button
                className="p-2 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                aria-label="Sil"
              >
                <LuTrash2 className="w-5 h-5" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              <button
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Okunmadı işaretle"
              >
                <LuMailOpen className="w-5 h-5" />
              </button>

              <button
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Snooze"
              >
                <LuClock className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Yazdır"
              >
                <LuPrinter className="w-5 h-5" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Daha fazla"
                >
                  <LuMoveVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-white/10 bg-[#12141a] shadow-2xl py-1 z-50">
                    <button className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      Yanıtla
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      Herkese yanıtla
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      İlet
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      Etiket ekle
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      Klasöre taşı
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 overflow-y-auto mail-modal-scrollbar">
            <div className="max-w-3xl mx-auto px-6 sm:px-12 py-8">

              {/* Subject */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
                {mail.title}
              </h1>

              {/* Email Header */}
              <div className="mb-6 pb-6 border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-lg font-medium ${avatarUrl ? '' : 'bg-[#5865F2]/20 text-[#5865F2]'}`}>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${sender.name} avatar`}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="select-none">{sender.avatar}</span>
                      )}
                    </div>

                    {/* Sender Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          {sender.name}
                        </span>
                        {sender.verified && (
                          <LuShield className="w-3.5 h-3.5 text-[#5865F2]" title="Doğrulanmış gönderici" />
                        )}
                      </div>
                      <div className="text-xs text-white/40 flex items-center gap-1">
                        <span>bana</span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <div className="text-xs text-white/40 text-right">
                      <div>{getShortDate(mail.created_at)}</div>
                      <button
                        className="text-white/30 hover:text-white/50 mt-1 transition-colors"
                        title={formatFullDate(mail.created_at)}
                      >
                        ({formatFullDate(mail.created_at).split(',')[1]?.trim()})
                      </button>
                    </div>
                    <button
                      onClick={() => setStarred(!starred)}
                      className="p-1 rounded-lg hover:bg-white/5 transition-all"
                      aria-label="Yıldız ekle"
                    >
                      <LuStar className={`w-5 h-5 transition-colors ${starred ? 'fill-yellow-400 text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`} />
                    </button>
                    <button
                      className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                      aria-label="Yanıtla"
                    >
                      <LuReply className="w-5 h-5" />
                    </button>
                    <button
                      className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                      aria-label="Daha fazla"
                    >
                      <LuMoveVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Detailed Header */}
                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/50">
                  <div className="flex gap-2">
                    <span className="font-semibold w-12 text-white/30">Kimden:</span>
                    <span>{sender.name} &lt;{sender.email}&gt;</span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <span className="font-semibold w-12 text-white/30">Tarih:</span>
                    <span>{formatFullDate(mail.created_at)}</span>
                  </div>
                  <div className="flex gap-2 mt-1.5 items-center">
                    <span className="font-semibold w-12 text-white/30">Kime:</span>
                    {recipient ? (
                      <div className="flex items-center gap-2">
                        {recipient.avatar ? (
                          <Image src={recipient.avatar} alt={recipient.username} width={20} height={20} className="w-5 h-5 rounded-full" unoptimized />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">{recipient.username?.slice(0, 1)?.toUpperCase()}</div>
                        )}
                        <span>{recipient.username}</span>
                      </div>
                    ) : (
                      <span>bana</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="mb-8">
                {renderEmailBody(mail.body ?? '', mail.category)}
              </div>

              {/* Attachment */}
              {mail.image_url && (
                <div className="mb-6">
                  <div className="text-sm text-white/60 font-medium mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    1 Ek
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                    {isVideoUrl(mail.image_url) ? (
                      <video
                        src={mail.image_url}
                        controls
                        className="w-full max-h-[500px] object-contain bg-black"
                      />
                    ) : (
                      <div className="relative group">
                        <Image
                          src={mail.image_url}
                          alt="Ek"
                          width={1200}
                          height={600}
                          className="w-full h-auto object-contain max-h-[500px]"
                          unoptimized
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 hover:bg-black/70 transition-all">
                            <LuDownload className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              {mail.details_url && (
                <div className="mt-8 p-5 rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <div className="font-semibold text-white mb-1">Daha fazla bilgi</div>
                      <div className="text-white/40">Bu mesajla ilgili detaylı bilgi için tıklayın</div>
                    </div>
                    <a
                      href={mail.details_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5865F2] to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/40 transition-all"
                    >
                      Detayları Görüntüle
                    </a>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-8 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all">
                  <LuReply className="w-4 h-4" />
                  Yanıtla
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all">
                  <LuReplyAll className="w-4 h-4" />
                  Herkese Yanıtla
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all">
                  <LuForward className="w-4 h-4" />
                  İlet
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
