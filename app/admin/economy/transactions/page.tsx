'use client';

import { useEffect, useState, useCallback } from 'react';
import { LuSearch, LuChevronLeft, LuChevronRight, LuFilter, LuX } from 'react-icons/lu';

type Transaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const LEDGER_TYPES = [
  { value: '', label: 'Tümü' },
  { value: 'earn_message', label: 'Mesaj Kazancı' },
  { value: 'earn_voice', label: 'Ses Kazancı' },
  { value: 'purchase', label: 'Satın Alma' },
  { value: 'transfer_in', label: 'Transfer (Gelen)' },
  { value: 'transfer_out', label: 'Transfer (Giden)' },
  { value: 'transfer_tax', label: 'Transfer Vergisi' },
  { value: 'admin_adjust', label: 'Admin Düzenleme' },
  { value: 'refund', label: 'İade' },
  { value: 'promotion', label: 'Promosyon' },
];

const TYPE_COLORS: Record<string, string> = {
  earn_message: 'bg-emerald-500/10 text-emerald-400',
  earn_voice: 'bg-teal-500/10 text-teal-400',
  purchase: 'bg-red-500/10 text-red-400',
  transfer_in: 'bg-blue-500/10 text-blue-400',
  transfer_out: 'bg-orange-500/10 text-orange-400',
  transfer_tax: 'bg-amber-500/10 text-amber-400',
  admin_adjust: 'bg-purple-500/10 text-purple-400',
  refund: 'bg-yellow-500/10 text-yellow-400',
  promotion: 'bg-cyan-500/10 text-cyan-400',
};

const TYPE_LABELS: Record<string, string> = Object.fromEntries(LEDGER_TYPES.filter(t => t.value).map(t => [t.value, t.label]));

const fmt = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [type, setType] = useState('');
  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (type) params.set('type', type);
      if (userId.trim()) params.set('userId', userId.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/economy/transactions?${params}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotal(data.total);
        setPageSize(data.pageSize);
      }
    } catch (err) {
      console.warn('İşlem geçmişi alınamadı:', err);
    }
    setLoading(false);
  }, [type, userId, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [type, userId, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasActiveFilters = Boolean(type || userId || dateFrom || dateTo);

  const clearFilters = () => {
    setType('');
    setUserId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">İşlem Geçmişi</h1>
          <p className="mt-1 text-sm text-white/40">Tüm ekonomi işlemlerinin detaylı kaydı</p>
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
            hasActiveFilters
              ? 'border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2]'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <LuFilter className="h-4 w-4" />
          Filtreler
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5865F2] text-[10px] text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filtre Paneli */}
      {filtersOpen && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">Filtreler</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                <LuX className="h-3 w-3" /> Temizle
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* İşlem Tipi */}
            <div>
              <label className="mb-1.5 block text-xs text-white/40">İşlem Tipi</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5865F2]/50"
              >
                {LEDGER_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[#1a1b23]">{t.label}</option>
                ))}
              </select>
            </div>
            {/* Kullanıcı ID */}
            <div>
              <label className="mb-1.5 block text-xs text-white/40">Kullanıcı ID</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Discord User ID"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#5865F2]/50"
                />
              </div>
            </div>
            {/* Tarih Aralığı */}
            <div>
              <label className="mb-1.5 block text-xs text-white/40">Başlangıç Tarihi</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5865F2]/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/40">Bitiş Tarihi</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5865F2]/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sonuç Özeti */}
      <div className="flex items-center justify-between text-sm text-white/40">
        <span>Toplam {fmt.format(total).replace(/,\d+$/, '')} işlem bulundu</span>
        <span>Sayfa {page} / {totalPages}</span>
      </div>

      {/* Tablo */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1116]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase text-white/30">
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3 text-right">Miktar</th>
                <th className="px-4 py-3 text-right">Sonraki Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#5865F2]" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/30">
                    İşlem bulunamadı
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-white/50">
                      {dateFmt.format(new Date(tx.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-white/60">{tx.userId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[tx.type] ?? 'bg-white/5 text-white/50'}`}>
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}{fmt.format(tx.amount)} ₽
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-white/40">
                      {tx.balanceAfter != null ? `${fmt.format(tx.balanceAfter)} ₽` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 disabled:opacity-30"
          >
            <LuChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) {
              p = i + 1;
            } else if (page <= 3) {
              p = i + 1;
            } else if (page >= totalPages - 2) {
              p = totalPages - 4 + i;
            } else {
              p = page - 2 + i;
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                  page === p
                    ? 'bg-[#5865F2] text-white'
                    : 'border border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 disabled:opacity-30"
          >
            <LuChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
