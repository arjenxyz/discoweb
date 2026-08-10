'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

type StoreItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive';
  role_id: string | null;
  duration_days: number;
};

type RoleOption = {
  id: string;
  name: string;
  color: number;
};

function AdminStoreProductCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [roleResults, setRoleResults] = useState<RoleOption[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [durationDays, setDurationDays] = useState('43200'); // minutes (30 days default)
  const [itemStatus, setItemStatus] = useState<'active' | 'inactive'>('active');
  const [itemSaving, setItemSaving] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;

    const loadItem = async () => {
      setLoadingItem(true);
      const response = await fetch('/api/admin/store-items');
      if (response.ok) {
        const data = (await response.json()) as StoreItem[];
        const item = data.find((entry) => entry.id === editId);
        if (item) {
          setTitle(item.title);
          setDescription(item.description ?? '');
          setPrice(String(item.price));
          setRoleId(item.role_id ?? '');
          setDurationDays(String(item.duration_days));
          setItemStatus(item.status);
        } else {
          setError('Düzenlenecek ürün bulunamadı.');
        }
      } else {
        setError('Ürün bilgisi alınamadı.');
      }
      setLoadingItem(false);
    };

    void loadItem();
  }, [editId]);

  useEffect(() => {
    if (!roleId) {
      const timer = setTimeout(() => {
        setSelectedRoleName('');
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      const response = await fetch(`/api/admin/roles?query=${encodeURIComponent(roleId)}&limit=5`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = (await response.json()) as RoleOption[];
        const exact = data.find((item) => item.id === roleId);
        setSelectedRoleName(exact?.name ?? '');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [roleId]);

  useEffect(() => {
    if (!roleQuery || roleQuery.trim().length < 2) {
      const timer = setTimeout(() => {
        setRoleResults([]);
        setRoleError(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setRoleLoading(true);
      setRoleError(null);

      const response = await fetch(`/api/admin/roles?query=${encodeURIComponent(roleQuery)}&limit=20`, {
        credentials: 'include'
      });
      if (!response.ok) {
        setRoleError('Roller alınamadı.');
        setRoleResults([]);
        setRoleLoading(false);
        return;
      }

      const data = (await response.json()) as RoleOption[];
      setRoleResults(data);
      setRoleLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [roleQuery]);

  const handleCreateItem = async () => {
    setItemSaving(true);
    setError(null);

    const payload = {
      title,
      description: description || null,
      price: Number(price),
      status: itemStatus,
      roleId: roleId || null,
      durationDays: Number(durationDays),
    };

    const response = await fetch('/api/admin/store-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      setError('Ürün kaydedilemedi.');
      setItemSaving(false);
      return;
    }

    setTitle('');
    setDescription('');
    setPrice('');
    setRoleId('');
    setDurationDays('43200');
    setItemStatus('active');
    setItemSaving(false);
  };

  const handleUpdateItem = async () => {
    if (!editId) return;
    setItemSaving(true);
    setError(null);

    const payload = {
      id: editId,
      title,
      description: description || null,
      price: Number(price),
      status: itemStatus,
      roleId: roleId || null,
      durationDays: Number(durationDays),
    };

    const response = await fetch('/api/admin/store-items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError('Ürün güncellenemedi.');
      setItemSaving(false);
      return;
    }

    setItemSaving(false);
    router.push('/admin/store/products');
  };

  const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35';
  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white/85 placeholder:text-white/25 focus:border-[#5865F2]/50 focus:outline-none';

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Mağaza</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
            {editId ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h1>
        </div>
        <Link
          href="/admin/store/products"
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
        >
          Liste
        </Link>
      </div>

      {(error || loadingItem) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/60">
          {loadingItem ? 'Yükleniyor…' : error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="grid gap-3.5">
            <div>
              <label className={labelClass}>Ürün adı</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Örn. VIP Rol"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Rol</label>
              <input
                value={roleQuery}
                onChange={(event) => setRoleQuery(event.target.value)}
                placeholder="Rol adı ara…"
                className={fieldClass}
              />
              {(roleLoading || roleError || roleResults.length > 0) && (
                <div className="mt-2 space-y-1.5">
                  {roleLoading && <p className="text-xs text-white/40">Aranıyor…</p>}
                  {roleError && <p className="text-xs text-rose-300">{roleError}</p>}
                  {roleResults.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1.5">
                      {roleResults.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            setRoleId(role.id);
                            setRoleQuery(role.name);
                            setSelectedRoleName(role.name);
                            setRoleResults([]);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-white/70 transition hover:bg-[#5865F2]/15 hover:text-white"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: role.color
                                  ? `#${role.color.toString(16).padStart(6, '0')}`
                                  : '#5865F2',
                              }}
                            />
                            <span className="truncate">{role.name}</span>
                          </span>
                          <span className="ml-2 shrink-0 text-[10px] text-white/30">{role.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input
                value={roleId}
                onChange={(event) => {
                  setRoleId(event.target.value);
                  setSelectedRoleName('');
                }}
                placeholder="Rol ID"
                className={`${fieldClass} mt-2 font-mono text-xs`}
              />
              {(selectedRoleName || roleId) && (
                <p className="mt-1.5 truncate text-[11px] text-white/40">
                  {selectedRoleName ? `Seçili: ${selectedRoleName}` : `ID: ${roleId}`}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Açıklama</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Kısa ürün açıklaması"
                rows={2}
                className={`${fieldClass} resize-y`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Fiyat (papel)</label>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="250"
                  type="number"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Durum</label>
                <select
                  value={itemStatus}
                  onChange={(event) => setItemStatus(event.target.value as 'active' | 'inactive')}
                  className={fieldClass}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Süre</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <div className="relative">
                  <input
                    value={(() => {
                      const m = Number(durationDays);
                      return m > 0 ? String(Math.floor(m / 1440)) : '0';
                    })()}
                    onChange={(event) => {
                      const d = Math.max(0, Number(event.target.value) || 0);
                      const cur = Number(durationDays) || 0;
                      const h = Math.floor((cur % 1440) / 60);
                      const mn = cur % 60;
                      setDurationDays(String(d * 1440 + h * 60 + mn));
                    }}
                    type="number"
                    min="0"
                    placeholder="0"
                    className={`${fieldClass} mt-0 pr-9`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                    gün
                  </span>
                </div>
                <div className="relative">
                  <input
                    value={(() => {
                      const m = Number(durationDays);
                      return m > 0 ? String(Math.floor((m % 1440) / 60)) : '0';
                    })()}
                    onChange={(event) => {
                      const h = Math.max(0, Math.min(23, Number(event.target.value) || 0));
                      const cur = Number(durationDays) || 0;
                      const d = Math.floor(cur / 1440);
                      const mn = cur % 60;
                      setDurationDays(String(d * 1440 + h * 60 + mn));
                    }}
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0"
                    className={`${fieldClass} mt-0 pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                    saat
                  </span>
                </div>
                <div className="relative">
                  <input
                    value={(() => {
                      const m = Number(durationDays);
                      return m > 0 ? String(m % 60) : '0';
                    })()}
                    onChange={(event) => {
                      const mn = Math.max(0, Math.min(59, Number(event.target.value) || 0));
                      const cur = Number(durationDays) || 0;
                      const d = Math.floor(cur / 1440);
                      const h = Math.floor((cur % 1440) / 60);
                      setDurationDays(String(d * 1440 + h * 60 + mn));
                    }}
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    className={`${fieldClass} mt-0 pr-8`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                    dk
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: '30dk', value: 30 },
                  { label: '1sa', value: 60 },
                  { label: '1g', value: 1440 },
                  { label: '7g', value: 10080 },
                  { label: '30g', value: 43200 },
                  { label: '∞', value: 0 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDurationDays(String(preset.value))}
                    className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition ${
                      Number(durationDays) === preset.value
                        ? 'border-[#5865F2]/45 bg-[#5865F2]/20 text-[#a5b4ff]'
                        : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={editId ? handleUpdateItem : handleCreateItem}
                disabled={itemSaving || !title || !price || !roleId || durationDays === ''}
                className="rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {itemSaving ? 'Kaydediliyor…' : editId ? 'Güncelle' : 'Kaydet'}
              </button>
              {editId && (
                <Link
                  href="/admin/store/products"
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Vazgeç
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">İpuçları</p>
          <ul className="mt-3 space-y-2 text-xs text-white/45">
            <li>Rol seçilince satın alma otomatik rol verir.</li>
            <li>Süre 0 = kalıcı rol.</li>
            <li>Pasif ürünler satın alınamaz.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoreProductCreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminStoreProductCreatePageContent />
    </Suspense>
  );
}
