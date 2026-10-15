'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Sparkles, ArrowRight, Lock, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = React.useState<'email' | 'phone'>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (loginMethod === 'phone') {
        // Send OTP and redirect to verification
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        const data = await res.json();
        if (data.success) {
          router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
          return;
        } else {
          throw new Error(data.message || 'Gagal mengirim OTP.');
        }
      }

      // Email/password login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Email atau password salah.');
      }

      // Synchronize client-side active user
      tatadanaDb.syncProfile(data.profile);
      tatadanaDb.setActiveUser(data.profile.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ardana_current_user_id', data.profile.id);
      }

      const status = data.accountStatus || data.profile.account_status;

      if (data.profile.role === 'admin') {
        router.push('/admin');
        return;
      }

      if (status === 'pending_payment') {
        if (data.profile.selected_plan_id) {
          router.push('/payment');
        } else {
          router.push('/select-plan');
        }
        return;
      }

      if (status === 'pending' || status === 'pending_admin_approval') {
        router.push('/waiting-approval');
        return;
      }

      if (status === 'rejected') {
        router.push('/rejected');
        return;
      }

      if (status === 'approved') {
        router.push('/beranda');
        return;
      }

      router.push('/select-plan');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Fitur Masuk dengan Google saat ini sedang dalam pengembangan. Silakan masuk menggunakan Email dan Password.');
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* KIRI (40%): Branding Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-brand p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <Link href="/">
            <ArdanaLogo size="lg" theme="dark" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-200">
              Personal Finance FinTech
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Keuanganmu.<br />Terkontrol.
            </h2>
          </div>
          <p className="text-sm text-rose-100 max-w-sm leading-relaxed">
            Catat pengeluaran dan pemasukan langsung dari percakapan santai di Telegram. Data tersimpan rapi & real-time.
          </p>
        </div>

        <div className="relative z-10 text-xs text-rose-200">
          © 2026 Ardana Indonesia • Terintegrasi Telegram Bot & Supabase
        </div>

        {/* Decorative background glow circles */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KANAN (60%): Form Login */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Ardana 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola dompet dan pantau budget keuangan pribadimu.
            </p>
          </div>

          {/* Integrated Auth Switcher (Requirement 4) */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              className="flex-1 pb-3 text-sm font-bold border-b-2 border-brand-600 text-brand-700 flex items-center justify-center gap-1.5"
            >
              Sudah punya akun? Login
            </button>
            <Link
              href="/register"
              className="flex-1 pb-3 text-sm font-medium text-slate-400 hover:text-slate-700 text-center transition-colors"
            >
              Belum punya akun? Daftar Sekarang
            </Link>
          </div>

          {/* Login Method Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`py-2 rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`py-2 rounded-lg transition-all ${
                loginMethod === 'phone' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Nomor Handphone (OTP)
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 rounded-xl border border-slate-300 hover:border-slate-400 bg-white font-semibold text-xs sm:text-sm text-slate-700 flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">atau</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginMethod === 'email' ? (
              <>
                <Input
                  label="Email"
                  type="email"
                  placeholder="budi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            ) : (
              <Input
                label="Nomor Handphone"
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hint="Kode verifikasi OTP akan dikirimkan ke nomor ini."
                required
              />
            )}

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
              {loginMethod === 'phone' ? 'Kirim Kode OTP →' : 'Masuk ke Akun'}
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 space-y-2">
            <div>
              Belum punya akun Ardana?{' '}
              <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
                Daftar Sekarang
              </Link>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-brand-500" /> Masuk ke Portal Administrator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

