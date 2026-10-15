'use client';

import * as React from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowRightLeft,
  Building2,
  Smartphone,
  Banknote,
  CreditCard,
  Trash2,
  Edit3,
  Archive,
  ArchiveRestore,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah } from '@/lib/utils';
import { Wallet, WalletType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TransferModal } from '@/components/dashboard/TransferModal';
import { showToast } from '@/components/ui/Toast';

export default function WalletPage() {
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = React.useState<'active' | 'archived'>('active');
  const [isLoading, setIsLoading] = React.useState(false);

  // Add Wallet Modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [addName, setAddName] = React.useState('');
  const [addType, setAddType] = React.useState<WalletType>('bank');
  const [addBalance, setAddBalance] = React.useState('');
  const [addColor, setAddColor] = React.useState('#812D46');
  const [addIsDefault, setAddIsDefault] = React.useState(false);

  // Edit Wallet Modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingWallet, setEditingWallet] = React.useState<Wallet | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editType, setEditType] = React.useState<WalletType>('bank');
  const [editColor, setEditColor] = React.useState('#812D46');
  const [editIsDefault, setEditIsDefault] = React.useState(false);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    // 1. Instantly load from client tatadanaDb
    const localWallets = tatadanaDb.getWallets(undefined, true);
    setWallets(localWallets);

    // 2. Sync with /api/wallets
    try {
      const res = await fetch('/api/wallets?includeArchived=true');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wallets)) {
          setWallets(data.wallets);
          data.wallets.forEach((w: Wallet) => tatadanaDb.syncWallet(w));
        }
      }
    } catch {
      // Keep localWallets if network fails
    }
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('tatadana_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tatadana_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Filter active and archived wallets
  const activeWallets = React.useMemo(
    () => wallets.filter((w) => !w.is_archived && w.is_active !== false),
    [wallets]
  );

  const archivedWallets = React.useMemo(
    () => wallets.filter((w) => w.is_archived || w.is_active === false),
    [wallets]
  );

  const totalBalance = React.useMemo(
    () => activeWallets.reduce((s, w) => s + w.balance, 0),
    [activeWallets]
  );

  // Icon mapping
  const getIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'ewallet':
        return Smartphone;
      case 'cash':
        return Banknote;
      case 'investment':
        return TrendingUp;
      default:
        return CreditCard;
    }
  };

  // Set default wallet
  const handleSetDefault = async (id: string) => {
    try {
      await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true }),
      });
    } catch {}

    tatadanaDb.updateWallet(id, { is_default: true });
    loadData();
    showToast({
      title: 'Dompet Utama Diperbarui',
      message: 'Dompet terpilih dijadikan dompet default untuk pencatatan otomatis.',
      type: 'success',
    });
  };

  // Open Edit Modal
  const openEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setEditName(wallet.name);
    setEditType(wallet.type);
    setEditColor(wallet.color || '#812D46');
    setEditIsDefault(Boolean(wallet.is_default));
    setIsEditModalOpen(true);
  };

  // Submit Edit Wallet
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;

    if (!editName.trim()) {
      alert('Nama dompet tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    try {
      await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWallet.id,
          name: editName.trim(),
          type: editType,
          color: editColor,
          is_default: editIsDefault,
        }),
      });
    } catch {}

    tatadanaDb.updateWallet(editingWallet.id, {
      name: editName.trim(),
      type: editType,
      color: editColor,
      is_default: editIsDefault,
    });

    setIsLoading(false);
    setIsEditModalOpen(false);
    setEditingWallet(null);
    loadData();

    showToast({
      title: 'Dompet Diperbarui',
      message: `Informasi dompet "${editName.trim()}" berhasil disimpan!`,
      type: 'success',
    });
  };

  // Create New Wallet
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialBal = parseInt(addBalance.replace(/[^0-9]/g, ''), 10) || 0;

    if (!addName.trim()) {
      alert('Nama dompet wajib diisi.');
      return;
    }

    let icon = 'Wallet';
    if (addType === 'bank') icon = 'Building2';
    if (addType === 'ewallet') icon = 'Smartphone';
    if (addType === 'cash') icon = 'Banknote';
    if (addType === 'investment') icon = 'TrendingUp';

    setIsLoading(true);
    let createdWallet: Wallet | null = null;
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          type: addType,
          balance: initialBal,
          color: addColor,
          icon,
          is_default: addIsDefault,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wallet) {
          createdWallet = data.wallet;
        }
      }
    } catch {}

    if (createdWallet) {
      tatadanaDb.syncWallet(createdWallet);
    } else {
      tatadanaDb.addWallet({
        name: addName.trim(),
        type: addType,
        balance: initialBal,
        is_default: addIsDefault,
        color: addColor,
        icon,
      });
    }

    setIsLoading(false);
    setIsAddModalOpen(false);
    setAddName('');
    setAddBalance('');
    setAddIsDefault(false);
    loadData();

    showToast({
      title: 'Dompet Ditambahkan',
      message: `Dompet "${addName.trim()}" berhasil dibuat!`,
      type: 'success',
    });
  };

  // Archive Wallet
  const handleArchiveWallet = async (wallet: Wallet) => {
    const confirmMsg = `Arsipkan dompet "${wallet.name}"?\n\nDompet yang diarsipkan akan dinonaktifkan dari transaksi baru, namun semua riwayat transaksi Anda sebelumnya tetap aman terjaga.`;
    if (!confirm(confirmMsg)) return;

    try {
      await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wallet.id, action: 'archive' }),
      });
    } catch {}

    tatadanaDb.archiveWallet(wallet.id);
    loadData();

    showToast({
      title: 'Dompet Diarsipkan',
      message: `Dompet "${wallet.name}" telah dipindahkan ke tab Diarsipkan.`,
      type: 'info',
    });
  };

  // Unarchive / Reactivate Wallet
  const handleUnarchiveWallet = async (wallet: Wallet) => {
    try {
      await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wallet.id, action: 'unarchive' }),
      });
    } catch {}

    tatadanaDb.unarchiveWallet(wallet.id);
    loadData();

    showToast({
      title: 'Dompet Diaktifkan Kembali',
      message: `Dompet "${wallet.name}" kini aktif kembali dan dapat digunakan untuk transaksi!`,
      type: 'success',
    });
  };

  // Delete Wallet Permanently
  const handleDeleteWallet = async (wallet: Wallet) => {
    if (!confirm(`Hapus dompet "${wallet.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      await fetch('/api/wallets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wallet.id }),
      });
    } catch {}

    tatadanaDb.deleteWallet(wallet.id);
    loadData();

    showToast({
      title: 'Dompet Dihapus',
      message: `Dompet "${wallet.name}" berhasil dihapus.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengelolaan Dompet Dinamis 👛
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola saldo tunai, rekening bank, dan e-wallet secara mandiri. Tentukan 1 dompet utama untuk transaksi otomatis dari Telegram.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeWallets.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setIsTransferModalOpen(true)}>
              <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Transfer Antar Dompet
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Dompet
          </Button>
        </div>
      </div>

      {/* Overview Total Balance Card */}
      <Card className="bg-gradient-to-r from-rose-500 to-amber-500 text-white border-none shadow-md shadow-brand-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Total Kekayaan Bersih (Net Worth)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatRupiah(totalBalance)}
            </div>
            <p className="text-xs text-rose-100">
              Terdistribusi di {activeWallets.length} dompet aktif (Bank, Tunai, & E-Wallet)
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 self-start sm:self-auto">
            <WalletIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Filter Tabs: Aktif vs Diarsipkan */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <WalletIcon className="w-4 h-4" />
          <span>Dompet Aktif</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {activeWallets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'archived'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Diarsipkan</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {archivedWallets.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: ACTIVE WALLETS */}
      {activeTab === 'active' && (
        <>
          {activeWallets.length === 0 ? (
            /* Friendly Empty State */
            <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-brand-600 shadow-inner">
                <WalletIcon className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Kamu Belum Memiliki Dompet Terdaftar
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Ardana menggunakan sistem dompet dinamis. Yuk, tambahkan dompet pertamamu (misal: Rekening Bank BCA, Dompet Tunai, atau GoPay/DANA) agar transaksi keuanganmu bisa mulai dicatat dan dihitung dengan akurat! 💰
                </p>
              </div>
              <div className="pt-2">
                <Button onClick={() => setIsAddModalOpen(true)} className="px-6">
                  <Plus className="w-4 h-4 mr-1.5" /> Tambah Dompet Pertama
                </Button>
              </div>
            </div>
          ) : (
            /* Active Wallets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeWallets.map((w) => {
                const IconComponent = getIcon(w.type);

                return (
                  <Card key={w.id} hoverEffect className="space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Top Row: Icon + Name + Default Badge / Action */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-3 rounded-xl text-white shadow-sm shrink-0"
                            style={{ backgroundColor: w.color }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{w.name}</h3>
                            <span className="text-xs text-slate-400 capitalize">{w.type}</span>
                          </div>
                        </div>

                        {w.is_default ? (
                          <Badge variant="brand" className="text-[10px] shrink-0">
                            ⭐ Utama (Telegram)
                          </Badge>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(w.id)}
                            className="text-[11px] text-slate-400 hover:text-brand-600 font-medium transition-colors shrink-0 underline decoration-slate-300"
                            title="Jadikan dompet utama untuk transaksi Telegram"
                          >
                            Set Utama
                          </button>
                        )}
                      </div>

                      {/* Balance Display */}
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Saldo Saat Ini
                        </span>
                        <span className="text-2xl font-extrabold text-slate-900">
                          {formatRupiah(w.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Toolbar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(w)}
                          className="text-slate-600 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors"
                          title="Edit Informasi Dompet"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {activeWallets.length >= 2 && (
                          <button
                            onClick={() => setIsTransferModalOpen(true)}
                            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                          </button>
                        )}
                      </div>

                      {/* Archive action */}
                      <button
                        onClick={() => handleArchiveWallet(w)}
                        className="text-slate-400 hover:text-amber-600 font-medium flex items-center gap-1 transition-colors p-1"
                        title="Arsipkan / Nonaktifkan Dompet"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Arsipkan</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: ARCHIVED WALLETS */}
      {activeTab === 'archived' && (
        <>
          {archivedWallets.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Archive className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Tidak Ada Dompet yang Diarsipkan
                </h3>
                <p className="text-xs text-slate-500">
                  Dompet yang dinonaktifkan akan disimpan di sini. Anda dapat mengaktifkannya kembali kapan saja tanpa kehilangan riwayat transaksi.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedWallets.map((w) => {
                const IconComponent = getIcon(w.type);

                return (
                  <Card key={w.id} className="space-y-4 relative bg-slate-50/80 border-slate-200 opacity-90 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-3 rounded-xl text-white shadow-sm grayscale shrink-0"
                            style={{ backgroundColor: w.color }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-700 text-base">{w.name}</h3>
                            <span className="text-xs text-slate-400 capitalize">{w.type}</span>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          📦 Diarsipkan
                        </Badge>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Sisa Saldo Terakhir
                        </span>
                        <span className="text-2xl font-bold text-slate-700">
                          {formatRupiah(w.balance)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleUnarchiveWallet(w)}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ArchiveRestore className="w-4 h-4" /> Aktifkan Kembali
                      </button>

                      <button
                        onClick={() => handleDeleteWallet(w)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Hapus Dompet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL: TAMBAH DOMPET BARU */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Dompet Baru"
        description="Buat rekening bank, e-wallet, atau dompet tunai baru untuk mengatur keuanganmu."
      >
        <form onSubmit={handleCreateWallet} className="space-y-4 text-left">
          <Input
            label="Nama Dompet"
            placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai..."
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipe Dompet
              </label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as WalletType)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet (GoPay, DANA, OVO...)</option>
                <option value="cash">Uang Tunai (Cash)</option>
                <option value="investment">Investasi / RDPU</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Warna Label
              </label>
              <input
                type="color"
                value={addColor}
                onChange={(e) => setAddColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1 cursor-pointer"
              />
            </div>
          </div>

          <Input
            label="Saldo Awal (Rp)"
            type="number"
            placeholder="Contoh: 500000 (boleh 0 jika belum ada saldo)"
            value={addBalance}
            onChange={(e) => setAddBalance(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={addIsDefault}
              onChange={(e) => setAddIsDefault(e.target.checked)}
              className="rounded text-brand-500 focus:ring-brand-500 h-4 w-4"
            />
            <span>Jadikan Dompet Utama untuk transaksi otomatis dari Telegram</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Buat Dompet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT DOMPET */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWallet(null);
        }}
        title="Edit Dompet"
        description="Perbarui nama, tipe, dan warna label dompet."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          <Input
            label="Nama Dompet"
            placeholder="Contoh: BCA Tabungan Bisnis..."
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipe Dompet
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as WalletType)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Uang Tunai (Cash)</option>
                <option value="investment">Investasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Warna Label
              </label>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1 cursor-pointer"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={editIsDefault}
              onChange={(e) => setEditIsDefault(e.target.checked)}
              className="rounded text-brand-500 focus:ring-brand-500 h-4 w-4"
            />
            <span>Jadikan Dompet Utama untuk transaksi Telegram</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingWallet(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Antar Dompet Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
