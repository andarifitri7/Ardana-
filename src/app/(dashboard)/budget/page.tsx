'use client';

import * as React from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Bell,
  Sparkles,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function BudgetPage() {
  const [budgets, setBudgets] = React.useState(tatadanaDb.getBudgets());
  const [categories, setCategories] = React.useState(tatadanaDb.getCategories().filter(c => c.type === 'expense'));
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCatId, setSelectedCatId] = React.useState('');
  const [amountInput, setAmountInput] = React.useState('');

  const loadData = () => {
    setBudgets(tatadanaDb.getBudgets());
    setCategories(tatadanaDb.getCategories().filter(c => c.type === 'expense'));
  };

  React.useEffect(() => {
    loadData();
    if (categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }

    const handleUpdate = () => loadData();
    window.addEventListener('tatadana_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tatadana_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount_monthly, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountInput.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) return;

    tatadanaDb.setBudget(selectedCatId, parsedAmount);
    loadData();
    setIsModalOpen(false);
    setAmountInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Target Budget Bulanan 🎯
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kendalikan pengeluaranmu. Sistem akan otomatis mengirimkan notifikasi Telegram saat budget mencapai 80% dan 100%.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Pasang Target Budget
        </Button>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-rose-50/60 to-white border-rose-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Total Budget Bulan Ini
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatRupiah(totalSpent)}
              </span>
              <span className="text-sm font-medium text-slate-500">
                dari alokasi {formatRupiah(totalBudget)} ({overallPercentage}%)
              </span>
            </div>
            <ProgressBar value={overallPercentage} className="h-3" />
          </div>

          <div className="flex items-center gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-800 block">Aman (&lt;80%)</span>
                <span className="text-slate-400">Pengeluaran wajar</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-800 block">Waspada (80%)</span>
                <span className="text-slate-400">Alert Telegram 1</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-800 block">Habis (100%)</span>
                <span className="text-slate-400">Alert Telegram 2</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const cat = b.category;
          const percentage = Math.min(100, Math.round((b.spent / b.amount_monthly) * 100));
          const remaining = Math.max(0, b.amount_monthly - b.spent);
          const isOver = b.spent >= b.amount_monthly;
          const isWarning = percentage >= 80 && !isOver;

          return (
            <Card key={b.id} hoverEffect className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {cat?.emoji || '🏷️'}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cat?.name}</h3>
                    <span className="text-[11px] text-slate-400">Target: {formatRupiah(b.amount_monthly)}</span>
                  </div>
                </div>

                <Badge variant={isOver ? 'danger' : isWarning ? 'warning' : 'success'}>
                  {isOver ? '100% HABIS' : isWarning ? '80% PERINGATAN' : 'TERKONTROL'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Terpakai: {formatRupiah(b.spent)}</span>
                  <span className={isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-900'}>
                    {percentage}%
                  </span>
                </div>
                <ProgressBar value={percentage} />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Sisa Budget: <strong className="text-slate-700">{formatRupiah(remaining)}</strong></span>
                  {b.alert_100_sent ? (
                    <span className="text-rose-600 font-bold">🚨 Alert 100% terkirim</span>
                  ) : b.alert_80_sent ? (
                    <span className="text-amber-600 font-bold">🔔 Alert 80% terkirim</span>
                  ) : null}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCatId(b.category_id);
                    setAmountInput(b.amount_monthly.toString());
                    setIsModalOpen(true);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Ubah Alokasi
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Atur Target Budget Bulanan"
        description="Pilih kategori pengeluaran dan tentukan batas anggaran maksimal per bulan."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kategori Pengeluaran
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Batas Anggaran Bulanan (Rp)"
            type="number"
            placeholder="Contoh: 1500000"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

