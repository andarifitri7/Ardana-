'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Plus,
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah, formatWIBDate, generateProgressBar } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { TransferModal } from '@/components/dashboard/TransferModal';

export default function BerandaPage() {
  const [profile, setProfile] = React.useState(tatadanaDb.getProfile());
  const [wallets, setWallets] = React.useState(tatadanaDb.getWallets());
  const [transactions, setTransactions] = React.useState(tatadanaDb.getTransactions());
  const [budgets, setBudgets] = React.useState(tatadanaDb.getBudgets());
  const [categories, setCategories] = React.useState(tatadanaDb.getCategories());
  const [periodFilter, setPeriodFilter] = React.useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');

  const [isTxModalOpen, setIsTxModalOpen] = React.useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

  const refreshData = () => {
    setProfile(tatadanaDb.getProfile());
    setWallets(tatadanaDb.getWallets());
    setTransactions(tatadanaDb.getTransactions());
    setBudgets(tatadanaDb.getBudgets());
    setCategories(tatadanaDb.getCategories());
  };

  const fetchServerData = React.useCallback(async () => {
    try {
      const [txRes, walletRes, profileRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/wallets'),
        fetch('/api/user/profile'),
      ]);
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.success && pData.profile) {
          tatadanaDb.syncProfile(pData.profile);
          setProfile(pData.profile);
        }
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success && Array.isArray(txData.transactions)) {
          setTransactions(txData.transactions);
          txData.transactions.forEach((tx: any) => tatadanaDb.syncTransaction(tx));
        }
      }
      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.success && Array.isArray(wData.wallets)) {
          setWallets(wData.wallets);
          wData.wallets.forEach((w: any) => tatadanaDb.syncWallet(w));
        }
      }
      setBudgets(tatadanaDb.getBudgets());
      setCategories(tatadanaDb.getCategories());
    } catch {
      // offline or mock fallback
    }
  }, []);

  React.useEffect(() => {
    refreshData();
    fetchServerData();

    const handleUpdate = () => refreshData();
    window.addEventListener('tatadana_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Live sync polling every 6 seconds for Telegram transactions
    const pollInterval = setInterval(() => {
      fetchServerData();
    }, 6000);

    const handleFocus = () => {
      fetchServerData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('tatadana_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [fetchServerData]);

  // --- DYNAMIC PERIOD FILTER CALCULATIONS ---
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const now = new Date();

  // Filter transactions based on periodFilter ('harian' | 'mingguan' | 'bulanan' | 'tahunan')
  const periodFilteredTx = React.useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.transaction_date);
      if (periodFilter === 'harian') {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (periodFilter === 'mingguan') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate.getTime() >= sevenDaysAgo.getTime() && txDate.getTime() <= now.getTime();
      } else if (periodFilter === 'bulanan') {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (periodFilter === 'tahunan') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, periodFilter, now]);

  const periodLabel = {
    harian: 'Hari Ini',
    mingguan: 'Minggu Ini (7 Hari)',
    bulanan: 'Bulan Ini',
    tahunan: 'Tahun Ini (' + now.getFullYear() + ')',
  }[periodFilter];

  const periodIncome = periodFilteredTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const periodExpense = periodFilteredTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Scaled budget according to period
  const budgetRatio = {
    harian: 1 / 30,
    mingguan: 7 / 30,
    bulanan: 1,
    tahunan: 12,
  }[periodFilter];

  const totalPeriodBudget = Math.round(budgets.reduce((sum, b) => sum + b.amount_monthly, 0) * budgetRatio);
  const remainingBudget = Math.max(0, totalPeriodBudget - periodExpense);

  // Category breakdown for Pie / Distribution Chart
  const categoryExpenses: { name: string; emoji: string; color: string; amount: number; percentage: number }[] = [];
  categories.filter(c => c.type === 'expense').forEach(cat => {
    const spent = periodFilteredTx
      .filter(t => t.type === 'expense' && t.category_id === cat.id)
      .reduce((s, t) => s + t.amount, 0);
    if (spent > 0) {
      categoryExpenses.push({
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        amount: spent,
        percentage: periodExpense > 0 ? Math.round((spent / periodExpense) * 100) : 0,
      });
    }
  });
  categoryExpenses.sort((a, b) => b.amount - a.amount);

  // Dynamic Chart Bars for cashflow based on periodFilter
  const dynamicChartData = React.useMemo(() => {
    if (periodFilter === 'harian') {
      const buckets = [
        { label: 'Pagi (06-12)', start: 6, end: 12 },
        { label: 'Siang (12-15)', start: 12, end: 15 },
        { label: 'Sore (15-18)', start: 15, end: 18 },
        { label: 'Malam (18-24)', start: 18, end: 24 },
      ];
      return buckets.map(b => {
        const txsInBucket = periodFilteredTx.filter(t => {
          const hours = new Date(t.transaction_date).getHours();
          return hours >= b.start && hours < b.end;
        });
        return {
          label: b.label,
          income: txsInBucket.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txsInBucket.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    } else if (periodFilter === 'mingguan') {
      const days = [];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toDateString();
        const txsOnDay = transactions.filter(t => new Date(t.transaction_date).toDateString() === dayStr);
        days.push({
          label: `${dayNames[d.getDay()]} (${d.getDate()})`,
          income: txsOnDay.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txsOnDay.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return days;
    } else if (periodFilter === 'tahunan') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      return months.map((m, idx) => {
        const txsInMonth = transactions.filter(t => {
          const d = new Date(t.transaction_date);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === idx;
        });
        return {
          label: m,
          income: txsInMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txsInMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    } else {
      // Bulanan (default): 6 bulan terakhir dinamis dari data user (0 jika belum ada transaksi)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const past6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const y = d.getFullYear();
        const txsInMonth = transactions.filter(t => {
          const td = new Date(t.transaction_date);
          return td.getFullYear() === y && td.getMonth() === mIdx;
        });
        past6Months.push({
          label: i === 0 ? `${monthNames[mIdx]} (Bulan Ini)` : monthNames[mIdx],
          income: txsInMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txsInMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return past6Months;
    }
  }, [periodFilter, periodFilteredTx, transactions, now]);

  return (
    <div className="space-y-6">
      {/* --- TOP GREETING & HEADER BAR --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-brand-500">{profile.full_name}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau arus kas dan budget keuanganmu secara real-time dari Telegram & Web.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                  periodFilter === p
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => setIsTxModalOpen(true)} className="rounded-xl shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Catat Transaksi
          </Button>
        </div>
      </div>

      {/* --- ONBOARDING CHECKLIST FOR NEW USERS --- */}
      <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/80 to-amber-50/50 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-brand-500 text-white text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Onboarding Checklist Ardana
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Selesaikan 3 langkah cepat ini untuk pengalaman pencatatan keuangan otomatis maksimal:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-slate-800 hover:bg-rose-100/50 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>1. Hubungkan Telegram</span>
            </Link>
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-slate-800 hover:bg-rose-100/50 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. Atur Dompet Utama</span>
            </Link>
            <Link
              href="/budget"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-slate-800 hover:bg-rose-100/50 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>3. Pasang Target Budget</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- 4 PRIMARY STATS CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <Card hoverEffect className="relative overflow-hidden border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Total</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalBalance)}</div>
              <p className="text-[11px] text-slate-400">Gabungan dari {wallets.length} dompet aktif</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-brand-500 border border-rose-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 2: Pemasukan Periode */}
        <Card hoverEffect className="relative overflow-hidden border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Pemasukan {periodLabel}</span>
              <div className="text-2xl font-extrabold text-emerald-600">{formatRupiah(periodIncome)}</div>
              <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Rekap transaksi {periodLabel.toLowerCase()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 3: Pengeluaran Periode */}
        <Card hoverEffect className="relative overflow-hidden border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Pengeluaran {periodLabel}</span>
              <div className="text-2xl font-extrabold text-rose-600">{formatRupiah(periodExpense)}</div>
              <p className="text-[11px] text-slate-400">Total belanja & tagihan {periodLabel.toLowerCase()}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 4: Budget Tersisa */}
        <Card hoverEffect className="relative overflow-hidden border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Budget Tersisa ({periodLabel})</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(remainingBudget)}</div>
              <p className="text-[11px] text-slate-400">
                Dari target kuota {formatRupiah(totalPeriodBudget)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-brand-500 border border-rose-100">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* --- CHARTS & ANALYTICS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Cashflow Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arus Kas: {periodLabel}</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Perbandingan pemasukan vs pengeluaran ({periodLabel})</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Pengeluaran
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {dynamicChartData.map((item, idx) => {
                const maxVal = Math.max(1000000, ...dynamicChartData.map(d => Math.max(d.income, d.expense)));
                const incHeight = Math.min(100, Math.round((item.income / maxVal) * 100));
                const expHeight = Math.min(100, Math.round((item.expense / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-48">
                      {/* Income Bar */}
                      <div
                        className="w-1/2 max-w-[24px] bg-emerald-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                        style={{ height: item.income > 0 ? `${Math.max(6, incHeight)}%` : '0%' }}
                        title={`Pemasukan: ${formatRupiah(item.income)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 max-w-[24px] bg-brand-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                        style={{ height: item.expense > 0 ? `${Math.max(6, expHeight)}%` : '0%' }}
                        title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-600 truncate max-w-full text-center" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {periodFilteredTx.length === 0 && (
              <p className="text-center text-xs text-slate-400 pt-3 pb-1">
                Belum ada transaksi pada periode ini. Semua data pemasukan dan pengeluaran dimulai dari Rp0.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Category Pie / Distribution Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Distribusi pengeluaran {periodLabel.toLowerCase()}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada transaksi pengeluaran {periodLabel.toLowerCase()}.</p>
            ) : (
              categoryExpenses.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-bold text-slate-900">{cat.percentage}% ({formatRupiah(cat.amount)})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))
            )}
            <div className="pt-2">
              <Link
                href="/laporan"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 justify-center"
              >
                Lihat Analisa Lengkap di Halaman Laporan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- 10 RECENT TRANSACTIONS TABLE --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>10 Transaksi Terbaru</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Tercatat real-time dari Telegram Bot & Web</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsTransferModalOpen(true)} className="text-xs">
              Transfer Dompet
            </Button>
            <Link href="/transaksi">
              <Button size="sm" variant="ghost" className="text-xs text-brand-600">
                Semua Transaksi <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Keterangan</th>
                  <th className="pb-3 px-3">Kategori</th>
                  <th className="pb-3 px-3">Dompet</th>
                  <th className="pb-3 px-3">Sumber</th>
                  <th className="pb-3 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Transaksi</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Belum ada transaksi. Tambahkan pemasukan atau pengeluaran pertama Anda.
                        </p>
                        <Button size="sm" onClick={() => setIsTxModalOpen(true)}>
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Catat Transaksi Pertama
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatWIBDate(tx.transaction_date, false)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.description}</span>
                          {tx.items && tx.items.length > 0 && (
                            <span className="p-1 rounded bg-rose-100 text-brand-700" title={`${tx.items.length} item struk`}>
                              <Receipt className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {tx.category?.emoji || '🏷️'} {tx.category?.name || 'Lainnya'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                        👛 {tx.wallet?.name || 'Cash'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                          {tx.source === 'telegram_text' && '💬 Telegram'}
                          {tx.source === 'telegram_receipt' && '📸 Struk OCR'}
                          {tx.source === 'telegram_voice' && '🎙️ Voice Note'}
                          {tx.source === 'web' && '💻 Web App'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isExpense ? 'text-rose-600' : isIncome ? 'text-emerald-600' : 'text-blue-600'}>
                          {isExpense ? '- ' : isIncome ? '+ ' : ''}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={refreshData}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}

