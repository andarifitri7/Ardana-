'use client';

import * as React from 'react';
import {
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Transaction, ExportHistoryItem, Profile } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

type SortField = 'tanggal' | 'nominal' | 'kategori' | 'wallet';
type SortDirection = 'asc' | 'desc';

export default function LaporanPage() {
  const [profile, setProfile] = React.useState<Profile>(tatadanaDb.getProfile());
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [exportHistory, setExportHistory] = React.useState<ExportHistoryItem[]>([]);

  // Filters
  const [activePreset, setActivePreset] = React.useState<'all' | 'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [walletFilter, setWalletFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedTxId, setExpandedTxId] = React.useState<string | null>(null);

  const applyPreset = (preset: 'all' | 'harian' | 'mingguan' | 'bulanan' | 'tahunan') => {
    setActivePreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'harian') {
      const todayStr = toYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'mingguan') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(toYMD(sevenDaysAgo));
      setEndDate(toYMD(now));
    } else if (preset === 'bulanan') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toYMD(firstDay));
      setEndDate(toYMD(lastDay));
    } else if (preset === 'tahunan') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(toYMD(firstDay));
      setEndDate(toYMD(lastDay));
    } else {
      setStartDate('');
      setEndDate('');
    }
    setCurrentPage(1);
  };

  // Sorting
  const [sortField, setSortField] = React.useState<SortField>('tanggal');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const loadData = () => {
    setProfile(tatadanaDb.getProfile());
    setTransactions(tatadanaDb.getTransactions());
    setExportHistory(tatadanaDb.getExportHistory());
  };

  const fetchServerData = React.useCallback(async () => {
    try {
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success && Array.isArray(txData.transactions)) {
          setTransactions(txData.transactions);
          txData.transactions.forEach((tx: any) => tatadanaDb.syncTransaction(tx));
        }
      }
    } catch {
      // offline fallback
    }
  }, []);

  React.useEffect(() => {
    loadData();
    fetchServerData();

    // Supabase / In-app Realtime listener for transaction changes
    const handleDataUpdate = () => {
      loadData();
      fetchServerData();
    };

    window.addEventListener('tatadana_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      window.removeEventListener('tatadana_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, [fetchServerData]);

  const wallets = tatadanaDb.getWallets();
  const categories = tatadanaDb.getCategories();

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (walletFilter !== 'all' && tx.wallet_id !== walletFilter) return false;
    if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false;
    if (startDate) {
      if (new Date(tx.transaction_date).getTime() < new Date(startDate).getTime()) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(tx.transaction_date).getTime() > end.getTime()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category?.name.toLowerCase().includes(q) || false;
      const matchItems = tx.items?.some((i) => i.name.toLowerCase().includes(q)) || false;
      return matchDesc || matchCat || matchItems;
    }
    return true;
  });

  // Sorted transactions
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'tanggal') {
      comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    } else if (sortField === 'nominal') {
      comparison = a.amount - b.amount;
    } else if (sortField === 'kategori') {
      const catA = a.category?.name || '';
      const catB = b.category?.name || '';
      comparison = catA.localeCompare(catB);
    } else if (sortField === 'wallet') {
      const walA = a.wallet?.name || '';
      const walB = b.wallet?.name || '';
      comparison = walA.localeCompare(walB);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sorted.length);
  const paginatedTransactions = sorted.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // KPI Summaries
  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // Top 5 categories
  const catMap = new Map<string, number>();
  filtered
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = t.category?.name || 'Lainnya';
      catMap.set(name, (catMap.get(name) || 0) + t.amount);
    });
  const topCategories = Array.from(catMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Trigger PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setExportError(null);
    try {
      const res = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          transactions: sorted,
          profile,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal export PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ardana_Laporan_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      loadData();
    } catch (err: any) {
      setExportError(err.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Trigger Excel Export
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    setExportError(null);
    try {
      const res = await fetch('/api/reports/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          transactions: sorted,
          profile,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal export Excel');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ardana_Laporan_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      loadData();
    } catch (err: any) {
      setExportError(err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline opacity-70" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand-600 ml-1 inline font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand-600 ml-1 inline font-bold" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laporan Keuangan 📊
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis ringkasan cashflow, rincian transaksi tersimpan di Supabase, dan export ke PDF/Excel.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            isLoading={isExportingPDF}
            className="border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-500"
          >
            <FileText className="w-4 h-4 mr-1.5 text-rose-500" /> Export PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            isLoading={isExportingExcel}
            className="border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-500"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" /> Export Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Plan restriction alert if Starter */}
      {profile.subscription_tier === 'starter' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian Paket Starter:</strong> Fitur export PDF, Excel, dan filter lanjutan dibatasi. Upgrade ke Pro untuk akses tak terbatas.
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="h-7 text-xs px-3 shrink-0"
            onClick={() => {
              tatadanaDb.updateProfile({ subscription_tier: 'pro' });
              loadData();
            }}
          >
            Upgrade ke Pro
          </Button>
        </div>
      )}

      {exportError && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {exportError}
        </div>
      )}

      {/* Summary KPI Cards for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Pemasukan</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalIncome)}</div>
              <p className="text-[11px] text-slate-400">Periode terpilih</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Total Pengeluaran</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalExpense)}</div>
              <p className="text-[11px] text-slate-400">Periode terpilih</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Net Cashflow</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {netCashflow >= 0 ? '+' : ''}{formatRupiah(netCashflow)}
              </div>
              <p className="text-[11px] text-slate-400">{netCashflow >= 0 ? 'Surplus Keuangan' : 'Defisit Keuangan'}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-brand-500 border border-rose-100">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar with All Part 3 Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Quick Period Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>Pilihan Periode Cepat:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Semua Periode' },
                { id: 'harian', label: '📅 Hari Ini (Harian)' },
                { id: 'mingguan', label: '📊 7 Hari (Mingguan)' },
                { id: 'bulanan', label: '🗓️ Bulan Ini (Bulanan)' },
                { id: 'tahunan', label: '🌟 Tahun Ini (Tahunan)' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activePreset === p.id
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Rentang Tanggal: Dari */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 text-xs"
              />
            </div>

            {/* Rentang Tanggal: Sampai */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 text-xs"
              />
            </div>

            {/* Jenis Transaksi (Part 3) */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Jenis Transaksi</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Semua Jenis</option>
                <option value="expense">💸 Pengeluaran</option>
                <option value="income">💰 Pemasukan</option>
                <option value="transfer">🔄 Transfer</option>
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dompet */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Dompet</label>
              <select
                value={walletFilter}
                onChange={(e) => {
                  setWalletFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    👛 {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              placeholder="Cari transaksi berdasarkan catatan atau item..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs flex-1 border-none shadow-none focus:ring-0 p-0"
            />
            {(startDate || endDate || categoryFilter !== 'all' || walletFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCategoryFilter('all');
                  setWalletFilter('all');
                  setTypeFilter('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold shrink-0"
              >
                Reset Filter
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Report Table with Column Sorting & Pagination */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tabel Transaksi Lengkap ({filtered.length} Data)</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik judul kolom untuk mengurutkan (sort). Data live tersinkronisasi via Supabase Realtime.
            </p>
          </div>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  {/* Sortable Tanggal */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => handleSort('tanggal')}
                  >
                    <span className="flex items-center">
                      Tanggal (WIB) {renderSortIndicator('tanggal')}
                    </span>
                  </th>

                  <th className="py-3 px-4">Keterangan</th>

                  {/* Sortable Kategori */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => handleSort('kategori')}
                  >
                    <span className="flex items-center">
                      Kategori {renderSortIndicator('kategori')}
                    </span>
                  </th>

                  {/* Sortable Wallet */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => handleSort('wallet')}
                  >
                    <span className="flex items-center">
                      Dompet {renderSortIndicator('wallet')}
                    </span>
                  </th>

                  <th className="py-3 px-4">Jenis</th>

                  {/* Sortable Nominal */}
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => handleSort('nominal')}
                  >
                    <span className="flex items-center justify-end">
                      Nominal {renderSortIndicator('nominal')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Transaksi</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Belum ada transaksi. Tambahkan pemasukan atau pengeluaran pertama Anda untuk melihat laporan keuangan lengkap.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada transaksi yang sesuai dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const hasItems = tx.items && tx.items.length > 0;
                    const isExpanded = expandedTxId === tx.id;
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';

                    return (
                      <React.Fragment key={tx.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {formatWIBDate(tx.transaction_date, true)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{tx.description}</span>
                              {hasItems && (
                                <button
                                  onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-brand-700 hover:bg-rose-200 text-[10px] font-bold transition-colors"
                                  title="Klik untuk expand rincian per item"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>{tx.items!.length} item</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            {tx.voice_transcript && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5 font-normal">
                                🎙️ Transkrip: "{tx.voice_transcript}"
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {tx.category?.emoji || '🏷️'} {tx.category?.name || 'Lainnya'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                            👛 {tx.wallet?.name || 'Cash'}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={isExpense ? 'danger' : isIncome ? 'success' : 'brand'}>
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                            <span className={isExpense ? 'text-rose-600' : isIncome ? 'text-emerald-600' : 'text-blue-600'}>
                              {isExpense ? '- ' : isIncome ? '+ ' : ''}{formatRupiah(tx.amount)}
                            </span>
                          </td>
                        </tr>

                        {/* Expandable Receipt Items (Part 3 requirement) */}
                        {hasItems && isExpanded && (
                          <tr className="bg-rose-50/40 border-b border-rose-100">
                            <td colSpan={6} className="p-4">
                              <div className="bg-white rounded-xl p-4 border border-rose-200/60 shadow-sm space-y-2">
                                <div className="flex items-center justify-between border-b pb-2">
                                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5 text-brand-600" />
                                    Rincian Barang Foto Struk Belanja
                                  </h5>
                                  <span className="text-xs font-semibold text-brand-600">
                                    Total: {formatRupiah(tx.amount)}
                                  </span>
                                </div>
                                <div className="divide-y divide-slate-100 text-xs">
                                  {tx.items!.map((it, idx) => (
                                    <div key={idx} className="py-1.5 flex items-center justify-between">
                                      <span className="text-slate-700 font-medium">
                                        {idx + 1}. {it.name}
                                        {it.category && (
                                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            {it.category}
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-semibold text-slate-900">{formatRupiah(it.price)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls (Part 3 requirement) */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan{' '}
              <strong className="text-slate-800">
                {sorted.length === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              sampai{' '}
              <strong className="text-slate-800">
                {endIndex}
              </strong>{' '}
              dari <strong className="text-slate-800">{sorted.length}</strong> transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelumnya
              </Button>

              <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-lg">
                Halaman {safePage} / {totalPages}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 text-xs"
              >
                Berikutnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Export Tersimpan (Part 3) */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat File Export</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Daftar file PDF dan Excel yang pernah digenerate</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama File</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Total Data</th>
                  <th className="py-3 px-4">Waktu Generate</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {exportHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      {item.file_type === 'pdf' ? (
                        <FileText className="w-4 h-4 text-rose-500" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>{item.file_name}</span>
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-slate-500">{item.file_type}</td>
                    <td className="py-3 px-4 text-slate-600">{item.period_label}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{item.total_records} transaksi</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatWIBDate(item.created_at, true)}</td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={`/api/reports/download/${item.id}`}
                        download={item.file_name}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                        >
                          <Download className="w-3 h-3 mr-1" /> Unduh Ulang
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


