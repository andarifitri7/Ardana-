'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { tatadanaDb } from '@/lib/store/mock-db';

export function TransferModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const wallets = tatadanaDb.getWallets();
  const [sourceWalletId, setSourceWalletId] = React.useState(wallets[0]?.id || '');
  const [destWalletId, setDestWalletId] = React.useState(wallets[1]?.id || '');
  const [nominal, setNominal] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen && wallets.length >= 2) {
      if (!sourceWalletId || !wallets.some(w => w.id === sourceWalletId)) {
        setSourceWalletId(wallets[0].id);
      }
      if (!destWalletId || !wallets.some(w => w.id === destWalletId) || destWalletId === wallets[0].id) {
        setDestWalletId(wallets[1].id);
      }
    }
  }, [isOpen, wallets, sourceWalletId, destWalletId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (sourceWalletId === destWalletId) {
      setError('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }

    const parsedNominal = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    if (!parsedNominal || parsedNominal <= 0) {
      setError('Masukkan nominal transfer yang valid.');
      return;
    }

    const srcWallet = wallets.find(w => w.id === sourceWalletId);
    if (srcWallet && srcWallet.balance < parsedNominal) {
      setError('Saldo dompet asal tidak mencukupi.');
      return;
    }

    try {
      tatadanaDb.addTransaction({
        type: 'transfer',
        amount: parsedNominal,
        wallet_id: sourceWalletId,
        destination_wallet_id: destWalletId,
        description: description.trim() || `Transfer dari ${srcWallet?.name} ke ${wallets.find(w => w.id === destWalletId)?.name}`,
        source: 'web',
      });
      onSuccess();
      onClose();
      setNominal('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan transfer.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Antar Dompet"
      description="Pindahkan dana antar rekening bank atau e-wallet Anda."
    >
      {wallets.length < 2 ? (
        <div className="p-6 text-center space-y-3 bg-amber-50/80 rounded-2xl border border-amber-200">
          <p className="text-sm font-semibold text-amber-900">
            Fitur transfer memerlukan minimal 2 dompet aktif. Yuk, tambahkan dompet terlebih dahulu! 👛
          </p>
          <div>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Ke Menu Dompet
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Dari Dompet
            </label>
            <select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  👛 {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Ke Dompet
            </label>
            <select
              value={destWalletId}
              onChange={(e) => setDestWalletId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  👛 {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Nominal Transfer (Rp)"
          type="number"
          placeholder="Contoh: 100000"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          required
        />

        <Input
          label="Catatan (Opsional)"
          placeholder="Misal: Top up GoPay dari BCA..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary">
            Kirim Transfer
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
}
