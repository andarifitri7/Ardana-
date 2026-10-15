'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  Cpu,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminOverviewPage() {
  const payments = tatadanaDb.getPayments();
  const aiLogs = tatadanaDb.getAILogs();
  const providers = tatadanaDb.getAIProviders();
  const pendingPayments = payments.filter(p => p.status === 'pending_verification' || p.status === 'pending');
  const pendingUsers = tatadanaDb.getPendingApprovalUsers();
  const allUsers = tatadanaDb.getUserRecords();

  const totalRevenue = payments
    .filter(p => p.status === 'paid' || p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ringkasan Superadmin ⚡
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pusat kendali infrastruktur Ardana: AI multi-provider, persetujuan akun pengguna, dan transaksi pembayaran paket.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pengguna</span>
          <div className="text-2xl font-extrabold text-white">{allUsers.length} Akun</div>
          <Link href="/admin/users" className="text-[11px] text-rose-400 hover:underline flex items-center gap-1">
            Kelola Pengguna <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Persetujuan Akun Pengguna</span>
          <div className="text-2xl font-extrabold text-amber-400">{pendingUsers.length} Menunggu</div>
          <Link href="/admin/users" className="text-[11px] text-amber-300 hover:underline flex items-center gap-1">
            Review Verifikasi Akun <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Total Revenue Midtrans</span>
          <div className="text-2xl font-extrabold text-rose-400">{formatRupiah(totalRevenue)}</div>
          <p className="text-[11px] text-slate-400">Termasuk paket Pro Sekali Bayar</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Panggilan AI Aktif</span>
          <div className="text-2xl font-extrabold text-white">{aiLogs.length} req</div>
          <p className="text-[11px] text-slate-400">Gemini 1.5 Flash (Primary)</p>
        </div>
      </div>

      {/* Grid: AI Provider Status + Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active AI Providers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Status Provider AI</h3>
            <Link href="/admin/providers" className="text-xs text-rose-400 hover:underline">
              Kelola Provider →
            </Link>
          </div>
          <div className="space-y-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-200 block">{p.display_name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{p.model_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.is_active ? 'success' : 'slate'} className="text-[10px]">
                    {p.is_active ? 'Aktif' : 'Non-aktif'}
                  </Badge>
                  {p.priority === 1 && (
                    <Badge variant="brand" className="text-[10px]">Primary</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payments Queue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Antrian Konfirmasi Pembayaran Manual</h3>
            <Link href="/admin/payments" className="text-xs text-rose-400 hover:underline">
              Semua ({pendingPayments.length}) →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Tidak ada pembayaran manual yang menunggu approval.
              </p>
            ) : (
              pendingPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {p.user?.full_name || 'Pengguna'} ({p.order_id})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Paket {p.plan.toUpperCase()} • {formatRupiah(p.amount)}
                    </span>
                  </div>
                  <Link href="/admin/payments">
                    <Button size="sm" className="h-7 text-xs bg-brand-600 hover:bg-rose-500">
                      Review Bukti
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

