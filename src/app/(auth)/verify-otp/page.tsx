'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') || tatadanaDb.getProfile().phone_number || '081234567890';

  const [phoneNumber, setPhoneNumber] = React.useState(initialPhone);
  const [otpCode, setOtpCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [resendStatus, setResendStatus] = React.useState('');

  const defaultSimulatorCode = process.env.NEXT_PUBLIC_OTP_SIMULATOR_CODE || '123456';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Kode OTP salah.');
      }

      // Successful verification
      tatadanaDb.updateProfile({ phone_verified: true, phone_number: phoneNumber });
      router.push('/beranda');
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('Mengirim ulang OTP...');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      setResendStatus(data.message || 'Kode OTP baru telah dikirim.');
      setTimeout(() => setResendStatus(''), 4000);
    } catch {
      setResendStatus('Gagal mengirim ulang.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Verifikasi Nomor Handphone 📱
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Masukkan 6-digit kode OTP yang dikirimkan ke <strong>{phoneNumber}</strong>
          </p>
        </div>

        {/* Development simulator badge */}
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-brand-800 text-center space-y-1">
          <span className="font-bold block">💡 Mode Pengujian (Simulator OTP)</span>
          <p className="text-[11px] text-brand-700">
            Gunakan kode OTP testing default: <strong className="font-mono text-brand-600 font-extrabold text-sm">{defaultSimulatorCode}</strong>
          </p>
          <button
            type="button"
            onClick={() => setOtpCode(defaultSimulatorCode)}
            className="text-[11px] text-brand-700 underline font-semibold hover:text-brand-900"
          >
            Klik untuk isi otomatis {defaultSimulatorCode}
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="Kode Verifikasi OTP"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            className="text-center font-mono text-xl tracking-widest h-12"
            maxLength={6}
            required
          />

          {error && <p className="text-xs text-red-600 text-center font-semibold">{error}</p>}
          {resendStatus && <p className="text-xs text-brand-600 text-center font-medium">{resendStatus}</p>}

          <Button type="submit" size="lg" isLoading={isLoading} className="w-full shadow-md">
            Verifikasi & Masuk Dashboard →
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResend}
            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" /> Kirim Ulang OTP
          </button>
          <Link href="/login" className="hover:text-slate-800">
            Ganti Nomor
          </Link>
        </div>
      </div>
    </div>
  );
}

