'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { tatadanaDb } from '@/lib/store/mock-db';

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [nominal, setNominal] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [walletId, setWalletId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');

  const wallets = tatadanaDb.getWallets();
  const categories = tatadanaDb.getCategories().filter(c => c.type === type);

  React.useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(tatadanaDb.getDefaultWallet()?.id || wallets[0].id);
    }
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [type, isOpen, wallets, walletId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedNominal = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    if (!parsedNominal || parsedNominal <= 0) {
      setError('Masukkan nominal transaksi yang valid.');
      return;
    }
    if (!description.trim()) {
      setError('Masukkan catatan transaksi.');
      return;
    }

    try {
      tatadanaDb.addTransaction({
        type,
        amount: parsedNominal,
        wallet_id: walletId,
        category_id: categoryId,
        description: description.trim(),
        source: 'web',
      });
      onSuccess();
      onClose();
      setNominal('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Baru"
      description="Tambah pemasukan atau pengeluaran secara manual ke dompet Anda."
    >
      {wallets.length === 0 ? (
        <div className="p-6 text-center space-y-3 bg-amber-50/80 rounded-2xl border border-amber-200">
          <p className="text-sm font-semibold text-amber-900">
            Sepertinya kamu belum punya dompet yang terdaftar. Yuk, tambahkan dompet terlebih dahulu melalui dashboard agar transaksi kamu bisa dicatat dengan benar. 💰
          </p>
          <div>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              👛 Buka Menu Dompet
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💸 Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg transition-all ${
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Pemasukan
          </button>
        </div>

        {/* Nominal */}
        <Input
          label="Nominal (Rp)"
          type="number"
          placeholder="Contoh: 50000"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          required
        />

        {/* Category & Wallet */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Dompet
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  👛 {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <Input
          label="Catatan Transaksi"
          placeholder="Misal: Makan Siang Nasi Padang..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary">
            Simpan Transaksi
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
}
