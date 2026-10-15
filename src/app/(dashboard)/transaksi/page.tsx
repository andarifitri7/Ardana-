'use client';

import * as React from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowUpDown,
  Mic,
  Camera,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Transaction } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { TransferModal } from '@/components/dashboard/TransferModal';

export default function TransaksiPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [walletFilter, setWalletFilter] = React.useState<string>('all');
  const [expandedTxId, setExpandedTxId] = React.useState<string | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = React.useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

  const loadData = () => {
    setTransactions(tatadanaDb.getTransactions());
  };

  const fetchServerData = React.useCallback(async () => {
    try {
      const [txRes, walletRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/wallets'),
      ]);
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
          wData.wallets.forEach((w: any) => tatadanaDb.syncWallet(w));
        }
      }
    } catch {
      // offline fallback
      loadData();
    }
  }, []);

  React.useEffect(() => {
    loadData();
    fetchServerData();

    const handleUpdate = () => {
      loadData();
      fetchServerData();
    };
    window.addEventListener('tatadana_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Live polling every 6 seconds for Telegram transactions
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

  const wallets = tatadanaDb.getWallets();

  // Filter & Search
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (walletFilter !== 'all' && tx.wallet_id !== walletFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category?.name.toLowerCase().includes(q) || false;
      const matchItems = tx.items?.some(i => i.name.toLowerCase().includes(q)) || false;
      return matchDesc || matchCat || matchItems;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini? Saldo dompet terkait akan disesuaikan otomatis.')) {
      tatadanaDb.deleteTransaction(id);
      loadData();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Transaksi 💳
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola dan telusuri seluruh pemasukan, pengeluaran, dan transfer antar dompet Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsTransferModalOpen(true)}>
            Transfer Antar Dompet
          </Button>
          <Button size="sm" onClick={() => setIsTxModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Catat Transaksi
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Cari transaksi, item struk, kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              <option value="all">Semua Jenis Transaksi</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Transfer Antar Dompet</option>
            </select>

            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  👛 {w.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal (WIB)</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Dompet</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Transaksi</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Belum ada transaksi. Tambahkan pemasukan atau pengeluaran pertama Anda.
                        </p>
                        <Button size="sm" onClick={() => setIsTxModalOpen(true)}>
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Catat Transaksi Sekarang
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada transaksi yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';
                    const hasItems = tx.items && tx.items.length > 0;
                    const isExpanded = expandedTxId === tx.id;

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
                                  onClick={() => toggleExpand(tx.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-brand-700 hover:bg-rose-200 transition-colors text-[10px] font-bold"
                                  title="Klik untuk melihat rincian item struk"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>{tx.items!.length} item</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            {tx.voice_transcript && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">
                                🎙️ Transkrip: "{tx.voice_transcript}"
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {tx.category?.emoji || '🏷️'} {tx.category?.name || 'Lainnya'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                            👛 {tx.wallet?.name || 'Cash'}
                            {tx.destination_wallet && (
                              <span className="text-slate-400"> → 👛 {tx.destination_wallet.name}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              {tx.source === 'telegram_text' && <><MessageSquare className="w-3 h-3 text-sky-500" /> Telegram</>}
                              {tx.source === 'telegram_receipt' && <><Camera className="w-3 h-3 text-purple-500" /> Struk OCR</>}
                              {tx.source === 'telegram_voice' && <><Mic className="w-3 h-3 text-emerald-500" /> Voice Note</>}
                              {tx.source === 'web' && <><Globe className="w-3 h-3 text-brand-500" /> Web</>}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                            <span className={isExpense ? 'text-rose-600' : isIncome ? 'text-emerald-600' : 'text-blue-600'}>
                              {isExpense ? '- ' : isIncome ? '+ ' : ''}
                              {formatRupiah(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Multi-Item Receipt Row (Part 3 requirement) */}
                        {hasItems && isExpanded && (
                          <tr className="bg-rose-50/40 border-b border-rose-100">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white rounded-xl p-4 border border-rose-200/60 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-brand-500" />
                                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                                      Rincian Item Foto Struk Belanja ({tx.items!.length} Produk)
                                    </h4>
                                  </div>
                                  <span className="text-xs font-semibold text-brand-600">
                                    Total Struk: {formatRupiah(tx.amount)}
                                  </span>
                                </div>
                                <div className="divide-y divide-slate-100 text-xs">
                                  {tx.items!.map((item, idx) => (
                                    <div key={idx} className="py-2 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                                        <span className="font-medium text-slate-800">{item.name}</span>
                                        {item.category && (
                                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-semibold text-slate-900">{formatRupiah(item.price)}</span>
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
        </CardContent>
      </Card>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={loadData}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}


