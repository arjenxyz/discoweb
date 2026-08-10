'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuCheck, LuX } from 'react-icons/lu';
import { isLocalDevBypassClient } from '@/lib/localDevBypass';
import { lockBodyScroll } from '@/lib/lockBodyScroll';
import { useTranslation } from '@/lib/i18nContext';

type SwitchGuild = {
  id: string;
  name: string;
  isAdmin: boolean;
  isSetup: boolean;
  isOwner: boolean;
  iconUrl: string | null;
};

const LOCAL_DEV_GUILD: SwitchGuild = {
  id: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? '1465698764453838882',
  name: 'Local Development',
  isAdmin: true,
  isSetup: true,
  isOwner: true,
  iconUrl: null,
};

function readSelectedGuildId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem('selectedGuildId');
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(/(?:^|;\s*)selected_guild_id=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function loadCachedGuilds(): SwitchGuild[] {
  if (isLocalDevBypassClient()) {
    try {
      const raw = localStorage.getItem('adminGuilds');
      if (raw) {
        const parsed = JSON.parse(raw) as SwitchGuild[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fall through
    }
    return [LOCAL_DEV_GUILD];
  }

  try {
    const raw = localStorage.getItem('adminGuilds');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SwitchGuild[];
    return Array.isArray(parsed) ? parsed.filter((g) => g.isAdmin || g.isOwner) : [];
  } catch {
    return [];
  }
}

function clampOffsetY(offsetY: number, panelHeight: number): number {
  const margin = 16;
  const maxUp = Math.max(0, (window.innerHeight - panelHeight) / 2 - margin);
  const maxDown = maxUp;
  return Math.min(maxDown, Math.max(-maxUp, offsetY));
}

export default function AdminServerSwitchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startY: number; originOffset: number }>({
    active: false,
    startY: 0,
    originOffset: 0,
  });
  const [guilds, setGuilds] = useState<SwitchGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    return lockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(readSelectedGuildId());
    setGuilds(loadCachedGuilds());
    setOffsetY(0);
    setLoading(false);
  }, [open]);

  const onDragMove = useCallback((clientY: number) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const panelHeight = panelRef.current?.offsetHeight ?? 320;
    const next = clampOffsetY(drag.originOffset + (clientY - drag.startY), panelHeight);
    setOffsetY(next);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerMove = (event: PointerEvent) => onDragMove(event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      if (!dragRef.current.active) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (touch) onDragMove(touch.clientY);
    };
    const onUp = () => endDrag();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [endDrag, onDragMove, open]);

  const startDrag = (clientY: number) => {
    dragRef.current = {
      active: true,
      startY: clientY,
      originOffset: offsetY,
    };
    setDragging(true);
  };

  const handleSelect = useCallback(
    (guild: SwitchGuild) => {
      if (switchingId) return;
      const canSetup = !guild.isSetup && (guild.isOwner || guild.isAdmin);
      if (!guild.isSetup && !canSetup) return;

      setSwitchingId(guild.id);
      document.cookie = `selected_guild_id=${guild.id}; path=/`;
      localStorage.setItem('selectedGuildId', guild.id);

      if (guild.isSetup) {
        window.location.assign('/admin');
        return;
      }

      onClose();
      router.push('/auth/setup');
    },
    [onClose, router, switchingId],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('admin.shell.close_menu')}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-switch-server-title"
        style={{ transform: `translateY(${offsetY}px)` }}
        className={`relative z-10 flex max-h-[min(80vh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e14] shadow-2xl shadow-black/50 will-change-transform ${
          dragging ? 'transition-none' : 'transition-transform duration-200 ease-out'
        }`}
      >
        <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-[#5865F2]/25 blur-[70px]" />

        <div
          className="relative cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest('button')) return;
            event.preventDefault();
            startDrag(event.clientY);
          }}
        >
          <div className="flex justify-center pt-3">
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-4 pt-3">
            <div className="min-w-0">
              <h2 id="admin-switch-server-title" className="text-base font-semibold text-white">
                {t('admin.shell.change_server')}
              </h2>
              <p className="mt-0.5 text-xs text-white/40">{t('admin.shell.switch_server_hint')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label={t('admin.shell.close_menu')}
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : guilds.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
              <p className="text-sm text-white/70">{t('select_server.empty_title')}</p>
              <p className="mt-1 text-xs text-white/40">{t('select_server.empty_body')}</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {guilds.map((guild) => {
                const isCurrent = selectedId === guild.id;
                const canSetup = !guild.isSetup && (guild.isOwner || guild.isAdmin);
                const canEnter = guild.isSetup || canSetup;
                const roleLabel = guild.isOwner
                  ? t('select_server.role_owner')
                  : guild.isAdmin
                    ? t('select_server.role_admin')
                    : t('select_server.role_member');
                const busy = switchingId === guild.id;

                return (
                  <li key={guild.id}>
                    <button
                      type="button"
                      disabled={!canEnter || Boolean(switchingId)}
                      onClick={() => handleSelect(guild)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        isCurrent
                          ? 'border-[#5865F2]/40 bg-[#5865F2]/12'
                          : canEnter
                            ? 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                            : 'cursor-not-allowed border-transparent bg-white/[0.02] opacity-50'
                      } ${busy ? 'opacity-70' : ''}`}
                    >
                      {guild.iconUrl ? (
                        <Image
                          src={guild.iconUrl}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#5865F2]/25 text-sm font-bold text-white">
                          {guild.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{guild.name}</p>
                          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                            {roleLabel}
                          </span>
                        </div>
                        {!guild.isSetup && canSetup && (
                          <p className="mt-0.5 text-[11px] text-[#a5b4ff]">
                            {t('select_server.setup_required')}
                          </p>
                        )}
                        {isCurrent && (
                          <p className="mt-0.5 text-[11px] text-[#a5b4ff]/80">
                            {t('admin.shell.switch_server_current')}
                          </p>
                        )}
                      </div>

                      {isCurrent ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/25 text-[#a5b4ff]">
                          <LuCheck className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
