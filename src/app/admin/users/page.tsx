'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Download,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
  Clock,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { Profile, Transaction } from '@/types';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUserDetail, setSelectedUserDetail] = React.useState<any | null>(null);
  const [selectedProofUrl, setSelectedProofUrl] = React.useState<string | null>(null);
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'all' | 'pending_approval' | 'pending_payment' | 'approved' | 'rejected'>('all');

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsersList(data.users);
      } else {
        // Fallback to local mock db
        const records = tatadanaDb.getUserRecords();
        const payments = tatadanaDb.getPayments();
        setUsersList(records.map(r => {
          const pay = payments.find(p => p.user_id === r.id);
          const plan = r.profile.selected_plan_id ? tatadanaDb.getAccountPlan(r.profile.selected_plan_id) : null;
          return {
            id: r.id,
            email: r.email,
            full_name: r.profile.full_name,
            role: r.role,
            phone_number: r.profile.phone_number || '-',
            phone_verification_status: r.profile.phone_verification_status || (r.profile.phone_verified ? 'simulated_verified' : 'unverified'),
            phone_verified: r.profile.phone_verified,
            selected_plan_id: r.profile.selected_plan_id,
            plan_name: plan ? plan.name : (r.profile.subscription_tier === 'pro' ? 'Paket Pro' : 'Paket Starter'),
            plan_price: plan ? plan.price : (r.profile.subscription_tier === 'pro' ? 99000 : 49000),
            payment_order_id: pay ? pay.order_id : '-',
            payment_status: pay ? pay.status : 'unpaid',
            payment_proof_url: pay?.proof_image_url || null,
            account_status: r.account_status || r.profile.account_status,
            created_at: r.profile.created_at,
            profile: r.profile,
          };
        }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Action: Verifikasi Pembayaran (Requirement 7)
  const handleVerifyPayment = async (orderId: string, userName: string) => {
    if (!confirm(`Verifikasi pembayaran untuk ${userName} (Order: ${orderId}) sebagai LUNAS (Paid)?`)) return;

    try {
      setActionLoading(`pay_${orderId}`);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_payment', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Pembayaran ${orderId} berhasil diverifikasi! Akun pengguna kini masuk antrean persetujuan admin.`);
        fetchUsers();
      } else {
        alert(data.message || 'Gagal memverifikasi pembayaran.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Setujui Akun (Requirement 6 & 7)
  const handleApprove = async (userId: string, userName: string) => {
    try {
      setActionLoading(`app_${userId}`);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', userId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Akun ${userName} berhasil disetujui! Pengguna kini dapat mengakses dashboard utama.`);
        fetchUsers();
      } else {
        alert(data.message || 'Gagal menyetujui akun.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Tolak Akun (Requirement 6 & 7)
  const handleReject = async (userId: string, userName: string) => {
    const reason = window.prompt(`Masukkan alasan penolakan untuk akun ${userName}:`, 'Data pembayaran atau pendaftaran belum memenuhi kriteria.');
    if (reason === null) return;

    try {
      setActionLoading(`rej_${userId}`);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', userId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`⚠️ Akun ${userName} telah ditolak.`);
        fetchUsers();
      } else {
        alert(data.message || 'Gagal menolak akun.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((item) => {
    const matchesSearch =
      (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone_number || '').includes(searchQuery) ||
      (item.payment_order_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending_approval') {
      return item.account_status === 'pending_admin_approval' || item.account_status === 'pending';
    }
    if (activeTab === 'pending_payment') {
      return item.account_status === 'pending_payment' || item.payment_status === 'pending_verification';
    }
    if (activeTab === 'approved') {
      return item.account_status === 'approved';
    }
    if (activeTab === 'rejected') {
      return item.account_status === 'rejected';
    }
    return true;
  });

  const pendingApprovalCount = usersList.filter(
    (u) => u.account_status === 'pending_admin_approval' || u.account_status === 'pending'
  ).length;

  const pendingVerificationPayCount = usersList.filter(
    (u) => u.payment_status === 'pending_verification'
  ).length;

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Nama,Email,Nomor HP,Status Simulasi HP,Paket,Harga,Order ID,Status Bayar,Status Akun,Tgl Daftar']
        .concat(
          usersList.map((item) => {
            return `"${item.id}","${item.full_name || ''}","${item.email || ''}","${item.phone_number || ''}","${item.phone_verification_status}","${item.plan_name}","${item.plan_price}","${item.payment_order_id}","${item.payment_status}","${item.account_status}","${item.created_at}"`;
          })
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ardana_Pendaftaran_User_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pendaftaran & Manajemen Pengguna 👥
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola alur pendaftaran user: nomor HP (simulasi), paket akun, verifikasi pembayaran manual, dan persetujuan akun.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="bg-brand-600 hover:bg-rose-500 text-xs font-semibold"
        >
          <Download className="w-4 h-4 mr-1.5" /> Export Data (CSV)
        </Button>
      </div>

      {/* Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingVerificationPayCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl shrink-0">
                💳
              </div>
              <div>
                <h4 className="font-bold text-amber-200 text-sm">
                  {pendingVerificationPayCount} Pembayaran Menunggu Verifikasi
                </h4>
                <p className="text-xs text-amber-300/80">
                  User telah mengunggah bukti transfer manual. Periksa bukti dan klik Verifikasi Pembayaran.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('pending_payment')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Lihat ({pendingVerificationPayCount})
            </Button>
          </div>
        )}

        {pendingApprovalCount > 0 && (
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-rose-300 flex items-center justify-center text-xl shrink-0">
                ⏳
              </div>
              <div>
                <h4 className="font-bold text-rose-200 text-sm">
                  {pendingApprovalCount} Akun Menunggu Persetujuan Admin
                </h4>
                <p className="text-xs text-rose-300/80">
                  Pembayaran telah terverifikasi lunas. Setujui akun agar user dapat membuka dashboard.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('pending_approval')}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Lihat ({pendingApprovalCount})
            </Button>
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Semua ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'pending_approval'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Menunggu Persetujuan ({pendingApprovalCount})
          </button>
          <button
            onClick={() => setActiveTab('pending_payment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'pending_payment'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Verifikasi Pembayaran ({pendingVerificationPayCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Disetujui ({usersList.filter((u) => u.account_status === 'approved').length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Ditolak ({usersList.filter((u) => u.account_status === 'rejected').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <Input
            placeholder="Cari user (nama, email, order ID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Pengguna & Email</th>
                <th className="py-3.5 px-4">No. HP & Status Simulasi</th>
                <th className="py-3.5 px-4">Paket & Harga</th>
                <th className="py-3.5 px-4">Transaksi & Pembayaran</th>
                <th className="py-3.5 px-4">Bukti Transfer</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4">Tgl Daftar</th>
                <th className="py-3.5 px-4 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                    {loading ? 'Memuat data pendaftaran pengguna...' : 'Tidak ada data pengguna yang sesuai filter.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const isPendingApproval =
                    item.account_status === 'pending_admin_approval' || item.account_status === 'pending';
                  const isApproved = item.account_status === 'approved';
                  const isRejected = item.account_status === 'rejected';
                  const isPendingPayment = item.account_status === 'pending_payment';

                  const isPaymentPaid = item.payment_status === 'paid';
                  const isPaymentPending = item.payment_status === 'pending_verification';

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      {/* 1. Nama & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white font-bold">{item.full_name || 'Tanpa Nama'}</strong>
                            {item.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">{item.email}</span>
                        </div>
                      </td>

                      {/* 2. No HP & Status Simulasi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-slate-200 block text-xs">{item.phone_number || '-'}</span>
                          {item.phone_verification_status === 'simulated_verified' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> simulated_verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full">
                              unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Paket & Harga */}
                      <td className="py-3.5 px-4">
                        <div>
                          <strong className="text-white block font-extrabold">{item.plan_name}</strong>
                          <span className="text-slate-400 text-[11px]">{formatRupiah(item.plan_price)}</span>
                        </div>
                      </td>

                      {/* 4. Transaksi & Status Pembayaran */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] text-slate-300 block">
                            {item.payment_order_id}
                          </span>
                          <div>
                            {item.payment_status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                ✓ Paid (Lunas)
                              </span>
                            ) : item.payment_status === 'pending_verification' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                                ⏳ Menunggu Verifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                                Belum Bayar (Unpaid)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Bukti Transfer */}
                      <td className="py-3.5 px-4">
                        {item.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofUrl(item.payment_proof_url)}
                            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 hover:underline font-semibold"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Tidak ada</span>
                        )}
                      </td>

                      {/* 6. Status Akun */}
                      <td className="py-3.5 px-4">
                        {isPendingApproval && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⏳ Menunggu Persetujuan
                          </span>
                        )}
                        {isPendingPayment && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ Menunggu Pembayaran
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Disetujui (Approved)
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            ✕ Ditolak (Rejected)
                          </span>
                        )}
                      </td>

                      {/* 7. Tanggal Daftar */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {item.created_at ? formatWIBDate(item.created_at).slice(0, 11) : '-'}
                      </td>

                      {/* 8. Tindakan Admin */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* Tombol Verifikasi Pembayaran jika pending_verification */}
                          {isPaymentPending && item.payment_order_id !== '-' && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(item.payment_order_id, item.full_name)}
                              disabled={actionLoading === `pay_${item.payment_order_id}`}
                              className="h-7 text-[10px] px-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold"
                            >
                              ✓ Verifikasi Bayar
                            </Button>
                          )}

                          {/* Tombol Setujui Akun: Hanya aktif jika pembayaran terverifikasi paid atau sudah di approve */}
                          {!isApproved && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item.id, item.full_name)}
                              disabled={!isPaymentPaid || actionLoading === `app_${item.id}`}
                              title={
                                !isPaymentPaid
                                  ? 'Pembayaran belum terverifikasi sah. Verifikasi pembayaran terlebih dahulu sebelum menyetujui akun.'
                                  : 'Setujui akun user ini'
                              }
                              className={`h-7 text-[10px] px-2.5 font-bold ${
                                isPaymentPaid
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              ✓ Setujui Akun
                            </Button>
                          )}

                          {/* Tombol Tolak Akun */}
                          {!isRejected && item.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(item.id, item.full_name)}
                              disabled={actionLoading === `rej_${item.id}`}
                              className="h-7 text-[10px] px-2 border-rose-500/40 text-rose-400 hover:bg-rose-950/40"
                            >
                              ✕ Tolak
                            </Button>
                          )}

                          {/* Tombol Lihat Detail */}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedUserDetail(item)}
                            className="h-7 text-[10px] px-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
                          >
                            <Eye className="w-3 h-3 mr-1" /> Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lihat Detail User (Requirement 7) */}
      {selectedUserDetail && (
        <Modal
          isOpen={Boolean(selectedUserDetail)}
          onClose={() => setSelectedUserDetail(null)}
          title={`Rincian Pengguna: ${selectedUserDetail.full_name}`}
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[11px]">Nama Lengkap</span>
                <strong className="text-white text-sm">{selectedUserDetail.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Akun</span>
                <strong className="text-white font-mono">{selectedUserDetail.email}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor Handphone</span>
                <strong className="text-white font-mono">{selectedUserDetail.phone_number}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status Verifikasi Nomor HP</span>
                <Badge variant="brand" className="bg-emerald-950 text-emerald-300 border-emerald-500/30">
                  {selectedUserDetail.phone_verification_status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[11px]">Paket Dipilih</span>
                <strong className="text-white">{selectedUserDetail.plan_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Harga Paket</span>
                <strong className="text-emerald-400">{formatRupiah(selectedUserDetail.plan_price)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Order ID Transaksi</span>
                <span className="font-mono text-slate-300">{selectedUserDetail.payment_order_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status Pembayaran</span>
                <strong className={selectedUserDetail.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedUserDetail.payment_status?.toUpperCase()}
                </strong>
              </div>
            </div>

            {selectedUserDetail.payment_proof_url && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block text-[11px]">Bukti Pembayaran:</span>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-center">
                  <img
                    src={selectedUserDetail.payment_proof_url}
                    alt="Bukti Transfer"
                    className="max-h-56 rounded-lg object-contain"
                  />
                </div>
              </div>
            )}

            {selectedUserDetail.admin_rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                <strong>Alasan Penolakan:</strong> {selectedUserDetail.admin_rejection_reason}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserDetail(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Preview Bukti Transfer (Requirement 7) */}
      {selectedProofUrl && (
        <Modal
          isOpen={Boolean(selectedProofUrl)}
          onClose={() => setSelectedProofUrl(null)}
          title="Pratinjau Bukti Pembayaran Pengguna"
        >
          <div className="space-y-4">
            <div className="p-2 bg-slate-900 rounded-2xl border border-slate-800 flex justify-center">
              <img
                src={selectedProofUrl}
                alt="Bukti Pembayaran"
                className="max-h-96 rounded-xl object-contain shadow-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProofUrl(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
