'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Building2,
  QrCode,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { AccountPlan, PaymentTransaction, PaymentType, PaymentStatus } from '@/types';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function PaymentPage() {
  const router = useRouter();
  const [plan, setPlan] = React.useState<AccountPlan | null>(null);
  const [payment, setPayment] = React.useState<PaymentTransaction | null>(null);
  const [paymentType, setPaymentType] = React.useState<PaymentType>('manual_transfer');
  const [selectedBank, setSelectedBank] = React.useState<'bca' | 'mandiri'>('bca');
  const [proofImageUrl, setProofImageUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedBank, setCopiedBank] = React.useState(false);
  const [copiedTotal, setCopiedTotal] = React.useState(false);

  // Fetch current payment and plan status
  const loadPaymentData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/payment');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.plan) setPlan(data.plan);
          if (data.payment) {
            setPayment(data.payment);
            if (data.payment.proof_image_url) {
              setProofImageUrl(data.payment.proof_image_url);
            }
            if (data.payment.payment_type) {
              setPaymentType(data.payment.payment_type);
            }
          }
          if (data.paymentStatus === 'paid' && data.accountStatus === 'pending_admin_approval') {
            router.push('/waiting-approval');
          }
        }
      }
    } catch {
      // Fallback to local store
      const cur = tatadanaDb.getProfile();
      if (cur?.selected_plan_id) {
        const p = tatadanaDb.getAccountPlan(cur.selected_plan_id);
        if (p) setPlan(p);
      }
      const pay = tatadanaDb.getUserLatestPayment(cur.id);
      if (pay) setPayment(pay);
    }
  }, [router]);

  React.useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // Periodic polling for status updates (e.g. if admin approves payment)
  React.useEffect(() => {
    const timer = setInterval(() => {
      loadPaymentData();
    }, 4000);
    return () => clearInterval(timer);
  }, [loadPaymentData]);

  const bankAccounts = {
    bca: {
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8001234567',
      accountHolder: 'PT ARDANA TATA DANA',
    },
    mandiri: {
      bankName: 'Bank Mandiri',
      accountNumber: '1230009876543',
      accountHolder: 'PT ARDANA TATA DANA',
    },
  };

  const handleCopy = (text: string, type: 'bank' | 'total') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedTotal(true);
      setTimeout(() => setCopiedTotal(false), 2000);
    }
  };

  const handleSampleProof = (sampleUrl: string) => {
    setProofImageUrl(sampleUrl);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImageUrl.trim()) {
      setFeedback({
        type: 'error',
        message: 'Harap sertakan tautan bukti transfer atau unggah foto struk transfer Anda.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan?.id,
          paymentType,
          proofImageUrl: proofImageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirimkan bukti pembayaran.');
      }

      setPayment(data.payment);
      setFeedback({
        type: 'success',
        message: '✅ Bukti pembayaran berhasil diunggah! Pembayaran kini sedang dalam antrean verifikasi admin.',
      });

      // Reload fresh data
      loadPaymentData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal mengirimkan bukti transfer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ardana_current_user_id');
      localStorage.removeItem('tatadana_store_v1');
      sessionStorage.clear();
      tatadanaDb.clearClientSession();
      window.location.href = '/login?switch=1';
    }
  };

  const paymentStatus: PaymentStatus = payment ? payment.status : 'unpaid';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top bar with Admin & Logout actions */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <Link
            href="/admin/login"
            className="text-xs text-slate-500 hover:text-brand-600 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-brand-600" /> Masuk Portal Admin (/admin/login)
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            Keluar / Ganti Akun <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <ArdanaLogo size="md" theme="light" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
            <CreditCard className="w-3.5 h-3.5 text-brand-500" /> Langkah 3 dari 3: Pembayaran Paket
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Pembayaran Paket Akun
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Selesaikan pembayaran Anda menggunakan transfer manual atau QRIS. Setelah pembayaran diverifikasi, akun Anda akan disetujui oleh admin.
          </p>
        </div>

        {/* Status Callout Banner */}
        {paymentStatus === 'pending_verification' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-sm font-bold">Menunggu Verifikasi Pembayaran oleh Admin</strong>
              <p className="text-xs text-amber-800 leading-relaxed">
                Bukti transfer Anda telah diterima dengan ID Transaksi <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">{payment?.order_id}</code>. Tim administrator kami akan memvalidasi mutasi rekening Anda sesegera mungkin.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'paid' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-sm font-bold">Pembayaran Telah Diverifikasi Sah!</strong>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Pembayaran Anda telah dinyatakan lunas. Akun Anda kini berada pada tahap persetujuan final administrator.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => router.push('/waiting-approval')}
                  size="sm"
                  className="text-xs font-bold"
                >
                  Lihat Status Persetujuan Admin <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KIRI (2 Kolom): Instruksi & Form Pembayaran */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pilihan Metode Pembayaran */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Pilih Metode Pembayaran
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('manual_transfer')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    paymentType === 'manual_transfer'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Building2 className={`w-5 h-5 mt-0.5 ${paymentType === 'manual_transfer' ? 'text-brand-600' : 'text-slate-400'}`} />
                  <div>
                    <strong className="block text-xs font-extrabold text-slate-900">
                      Transfer Bank Manual
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      BCA, Mandiri (Unggah Bukti Transfer)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('midtrans_qris')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    paymentType === 'midtrans_qris'
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <QrCode className={`w-5 h-5 mt-0.5 ${paymentType === 'midtrans_qris' ? 'text-brand-600' : 'text-slate-400'}`} />
                  <div>
                    <strong className="block text-xs font-extrabold text-slate-900">
                      QRIS / GoPay (Instant)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Scan kode QRIS langsung dari aplikasi e-wallet
                    </span>
                  </div>
                </button>
              </div>

              {/* Sub-metode Manual Transfer Bank */}
              {paymentType === 'manual_transfer' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBank('bca')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        selectedBank === 'bca'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      BCA (Bank Central Asia)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBank('mandiri')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        selectedBank === 'mandiri'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      Bank Mandiri
                    </button>
                  </div>

                  {/* Rekening Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{bankAccounts[selectedBank].bankName}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Verifikasi Manual</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider">
                        {bankAccounts[selectedBank].accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAccounts[selectedBank].accountNumber, 'bank')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 hover:text-white transition-colors"
                      >
                        {copiedBank ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiedBank ? 'Tersalin' : 'Salin Rekening'}
                      </button>
                    </div>

                    <div className="text-xs text-slate-300">
                      Atas Nama: <strong className="text-white">{bankAccounts[selectedBank].accountHolder}</strong>
                    </div>
                  </div>

                  {/* Instruksi Transfer */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                    <strong className="block text-slate-800 font-bold">Instruksi Pembayaran:</strong>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Buka m-Banking atau ATM bank Anda.</li>
                      <li>Pilih menu <strong>Transfer Antar Rekening</strong> ke nomor rekening di atas.</li>
                      <li>Masukkan nominal tepat sebesar <strong>{formatRupiah(plan?.price || 99000)}</strong>.</li>
                      <li>Simpan bukti transfer Anda (struk ATM / tangkapan layar m-Banking).</li>
                      <li>Unggah bukti transfer pada formulir di bawah ini.</li>
                    </ol>
                  </div>

                  {/* Form Upload Bukti Transfer */}
                  <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Bukti Transfer / Resi Pembayaran
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... atau tautan gambar bukti transfer"
                        value={proofImageUrl}
                        onChange={(e) => setProofImageUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Masukkan tautan foto/screenshot struk bukti transfer yang sah.
                      </p>
                    </div>

                    {/* Preset Sample Proof for Quick Demo Verification */}
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        Opsi Pengujian Cepat (Sample Demo Proof):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSampleProof('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3 text-brand-500" /> Gunakan Contoh Bukti Transfer Valid
                        </button>
                      </div>
                    </div>

                    {/* Preview Image if Available */}
                    {proofImageUrl && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">Pratinjau Bukti Transfer:</span>
                        <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 flex justify-center">
                          <img
                            src={proofImageUrl}
                            alt="Bukti Transfer"
                            className="max-h-48 rounded-lg object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {feedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          feedback.type === 'error'
                            ? 'bg-red-50 border border-red-200 text-red-700'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      disabled={paymentStatus === 'paid'}
                      className="w-full shadow-md"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {paymentStatus === 'pending_verification'
                        ? 'Perbarui Bukti Transfer'
                        : 'Kirim & Konfirmasi Bukti Transfer'}
                    </Button>
                  </form>
                </div>
              )}

              {/* QRIS Simulator Section */}
              {paymentType === 'midtrans_qris' && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-2xl border border-slate-200 shadow-md">
                    <QrCode className="w-40 h-40 text-slate-900 mx-auto" />
                    <span className="block text-[11px] font-bold text-slate-500 mt-2 font-mono">
                      NMID: ID102026ARDANA01
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <strong className="block text-slate-900 font-bold">
                      Scan QRIS Menggunakan Aplikasi E-Wallet / Mobile Banking
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Mendukung GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, dll.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProofImageUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
                        setPaymentType('manual_transfer');
                        setFeedback({
                          type: 'info',
                          message: 'Beralih ke unggah bukti pembayaran untuk verifikasi resmi.',
                        });
                      }}
                      className="text-xs"
                    >
                      Beralih ke Unggah Bukti Manual →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KANAN (1 Kolom): Rincian Tagihan & Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                Rincian Tagihan
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Paket Akun:</span>
                  <strong className="text-slate-900">{plan?.name || 'Paket Pro Unlimited'}</strong>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Durasi:</span>
                  <span className="text-slate-700">{plan?.duration || '1 Bulan'}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Harga Paket:</span>
                  <span className="text-slate-700">{formatRupiah(plan?.price || 99000)}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Biaya Administrasi:</span>
                  <span className="text-emerald-600 font-bold">Rp 0 (Gratis)</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-200">
                  <span className="text-sm font-bold text-slate-900">Total Tagihan:</span>
                  <div className="text-right">
                    <strong className="text-xl font-extrabold text-brand-700">
                      {formatRupiah(plan?.price || 99000)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy((plan?.price || 99000).toString(), 'total')}
                      className="block text-[10px] text-brand-600 hover:underline mt-0.5"
                    >
                      {copiedTotal ? '✓ Nominal Tersalin' : 'Salin Nominal'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Status Pembayaran:</span>
                <div>
                  {paymentStatus === 'paid' ? (
                    <Badge variant="brand" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      ✓ Pembayaran Terverifikasi (Paid)
                    </Badge>
                  ) : paymentStatus === 'pending_verification' ? (
                    <Badge variant="brand" className="bg-amber-100 text-amber-800 border-amber-200">
                      ⏳ Menunggu Verifikasi Pembayaran
                    </Badge>
                  ) : (
                    <Badge variant="slate" className="bg-slate-100 text-slate-700">
                      Belum Dibayar (Unpaid)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Ganti Paket Link */}
              <div className="pt-2 text-center">
                <Link
                  href="/select-plan"
                  className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti Pilihan Paket
                </Link>
              </div>
            </div>

            {/* Keamanan & Kebijakan */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Transaksi Terlindungi
              </div>
              <p className="leading-relaxed">
                Pembayaran Anda tercatat secara aman dalam database. Akun aktif sepenuhnya setelah disetujui oleh admin Ardana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
