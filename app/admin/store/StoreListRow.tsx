'use client';

import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { LuPencil, LuTrash2 } from 'react-icons/lu';

export type StoreListMetaItem = {
  label: string;
  value: string;
};

type StoreListPanelProps = {
  loading?: boolean;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
};

export function StoreListPanel({ loading, emptyMessage, isEmpty, children }: StoreListPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-white/45 sm:px-5">Yükleniyor…</p>
      ) : isEmpty ? (
        <p className="px-4 py-8 text-center text-sm text-white/45 sm:px-5">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-white/[0.06]">{children}</div>
      )}
    </div>
  );
}

type StoreListRowProps = {
  icon: IconType;
  iconClassName?: string;
  title: string;
  titleMono?: boolean;
  subtitle?: string | null;
  meta: StoreListMetaItem[];
  value: string;
  valueHint?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function StoreListRow({
  icon: Icon,
  iconClassName = 'bg-[#5865F2]/20 text-[#a5b4ff]',
  title,
  titleMono = false,
  subtitle,
  meta,
  value,
  valueHint,
  onEdit,
  onDelete,
}: StoreListRowProps) {
  return (
    <div className="group px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 sm:hidden">
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-semibold text-white ${
                    titleMono ? 'font-mono tracking-wide' : ''
                  }`}
                >
                  {title}
                </p>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">{value}</p>
                {valueHint ? <p className="text-[10px] text-white/35">{valueHint}</p> : null}
              </div>
            </div>

            <div className="hidden sm:block">
              <p
                className={`truncate text-sm font-semibold text-white ${
                  titleMono ? 'font-mono tracking-wide' : ''
                }`}
              >
                {title}
              </p>
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>
              ) : null}
            </div>

            {meta.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {meta.map((item) => (
                  <p key={`${item.label}-${item.value}`} className="text-[11px] text-white/40">
                    <span className="text-white/25">{item.label}</span>
                    <span className="mx-1 text-white/15">·</span>
                    <span className="text-white/55">{item.value}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-white">{value}</p>
            {valueHint ? <p className="text-[10px] text-white/35">{valueHint}</p> : null}
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                aria-label="Düzenle"
                title="Düzenle"
              >
                <LuPencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 text-rose-300/70 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
                aria-label="Sil"
                title="Sil"
              >
                <LuTrash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
