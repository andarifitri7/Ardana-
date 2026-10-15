'use client';

import * as React from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { PaymentTransaction } from '@/types';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentTransaction[]>(tatadanaDb.getPayments());
  const [selectedProofUrl, setSelectedProofUrl] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState('');

  const loadData = () => {
    setPayments([...tatadanaDb.getPayments()]);
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm(`Konfirmasi verifikasi pembayaran order ${orderId} sebagai LUNAS? Akun pengguna akan beralih ke antrean persetujuan admin.`)) return;
    try {
      const res = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Pembayaran ${orderId} berhasil diverifikasi!`);
        loadData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch {
      alert('Gagal memverifikasi pembayaran.');
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm(`Yakin ingin menolak pembayaran order ${orderId}?`)) return;
    try {
      const res = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order ${orderId} telah ditolak.`);
        loadData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch {
      alert('Gagal menolak pembayaran.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Approval Pembayaran 💳
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola pembayaran Midtrans dan verifikasi bukti transfer manual dari pengguna.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order ID & Waktu</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Paket & Nominal</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Bukti Transfer</th>
                <th className="py-3 px-4 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {payments.map((p) => {
                const isPending = p.status === 'pending' || p.status === 'pending_verification';
                const isApproved = p.status === 'approved' || p.status === 'paid';

                return (
                  <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-white block">{p.order_id}</span>
                      <span className="text-[10px] text-slate-500">{formatWIBDate(p.created_at, true)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200 block">{p.user?.full_name || 'Budi Pratama'}</span>
                      <span className="text-[10px] text-slate-500">{p.user?.phone_number || '081234567890'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-rose-400 block">{formatRupiah(p.amount)}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Paket {p.plan}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase font-semibold text-[11px] text-slate-300">
                        {p.payment_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                        className="text-[10px]"
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.proof_image_url ? (
                        <button
                          onClick={() => setSelectedProofUrl(p.proof_image_url!)}
                          className="flex items-center gap-1.5 text-xs text-rose-400 hover:underline"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Otomatis Midtrans</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isPending ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(p.order_id)}
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-500"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(p.order_id)}
                            className="h-7 text-[11px] px-2.5"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Image Modal */}
      <Modal
        isOpen={!!selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
        title="Bukti Transfer Pembayaran"
        description="Periksa keaslian bukti transfer bank pengguna sebelum menyetujui."
      >
        <div className="space-y-4">
          {selectedProofUrl && (
            <img
              src={selectedProofUrl}
              alt="Bukti Transfer"
              className="w-full max-h-96 object-contain rounded-xl border border-slate-200"
            />
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedProofUrl(null)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

