'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { tatadanaDb } from '@/lib/store/mock-db';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const [email, setEmail] = React.useState(emailParam);
  const [code, setCode] = React.useState(codeParam);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  React.useEffect(() => {
    if (codeParam) {
      setCode(codeParam);
    }
    // If no email in query param, read from active profile
    if (!email) {
      const activeProfile = tatadanaDb.getProfile();
      if (activeProfile?.email) {
        setEmail(activeProfile.email);
      }
    }
  }, [email, codeParam]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan 6-digit kode verifikasi email.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verifikasi kode gagal.');
      }

      setSuccessMsg('Email berhasil diverifikasi! Mengalihkan ke status persetujuan admin...');
      setTimeout(() => {
        router.push('/waiting-approval');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi kode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Kode verifikasi baru telah dikirimkan ke email Anda.');
      } else {
        throw new Error(data.message || 'Gagal mengirim ulang kode.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang kode.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFCFA] via-rose-50/40 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-100 p-8 shadow-xl space-y-6 text-center">
        {/* Brand */}
        <div className="flex justify-center">
          <ArdanaLogo size="md" theme="light" />
        </div>

        {/* Step Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <span>Tahap 1 dari 2: Verifikasi Kepemilikan Email</span>
        </div>

        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Periksa Kotak Masuk Email
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Kami telah mengirimkan 6-digit kode verifikasi ke alamat email:
            <br />
            <strong className="text-slate-800 font-semibold">{email || 'email Anda'}</strong>
          </p>
        </div>

        {/* Inbox / Spam Folder Guidance */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-brand-600" />
            <span>Petunjuk Penerimaan Email:</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            Periksa folder <strong>Kotak Masuk (Inbox)</strong> atau folder <strong>Spam / Junk</strong> email Anda. Kode verifikasi OTP berlaku selama <strong>10 menit</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
              Masukkan 6-Digit Kode Verifikasi
            </label>
            <Input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Contoh: 123456"
              className="text-center text-2xl font-mono tracking-widest h-14"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
              {successMsg}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full h-11 text-sm font-bold shadow-md shadow-brand-900/10">
            Verifikasi Email & Lanjutkan
          </Button>
        </form>

        {/* Resend and back */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            Belum menerima kode? Kirim ulang
          </button>
          <Link href="/login" className="text-slate-400 hover:text-slate-600 mt-2">
            ← Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFCFA] via-rose-50/40 to-slate-100 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rose-100 p-8 shadow-xl text-center space-y-4">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Memuat halaman verifikasi...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
