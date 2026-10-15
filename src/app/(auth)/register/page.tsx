'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { tatadanaDb } from '@/lib/store/mock-db';
import { validateIndonesianPhone } from '@/lib/phone/service';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');

  // Phone simulation verification state
  const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = React.useState(false);
  const [simulatedCodeReceived, setSimulatedCodeReceived] = React.useState<string | null>(null);
  const [enteredPhoneCode, setEnteredPhoneCode] = React.useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = React.useState(false);
  const [phoneFeedback, setPhoneFeedback] = React.useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Handle request simulation phone code
  const handleRequestPhoneCode = async () => {
    setPhoneFeedback(null);
    setError('');

    const validation = validateIndonesianPhone(phone);
    if (!validation.isValid) {
      setPhoneFeedback({
        type: 'error',
        message: validation.error || 'Format nomor HP tidak valid. Gunakan format nomor Indonesia (contoh: 081234567890).',
      });
      return;
    }

    try {
      setIsRequestingOtp(true);
      const res = await fetch('/api/auth/phone-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          phoneNumber: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal meminta kode verifikasi simulasi.');
      }

      setSimulatedCodeReceived(data.simulatedCode);
      setEnteredPhoneCode(data.simulatedCode); // Auto-fill for convenience
      setPhoneFeedback({
        type: 'info',
        message: data.message,
      });
    } catch (err: any) {
      setPhoneFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan meminta kode simulasi.',
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Handle verify simulation phone code
  const handleVerifyPhoneCode = async () => {
    if (!enteredPhoneCode.trim()) {
      setPhoneFeedback({
        type: 'error',
        message: 'Masukkan 6 digit kode simulasi yang tertera.',
      });
      return;
    }

    try {
      setIsVerifyingPhone(true);
      const res = await fetch('/api/auth/phone-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phoneNumber: phone.trim(),
          code: enteredPhoneCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kode verifikasi simulasi tidak valid.');
      }

      setIsPhoneVerified(true);
      setPhoneFeedback({
        type: 'success',
        message: '✅ Nomor handphone berhasil diverifikasi (Status: simulated_verified).',
      });
    } catch (err: any) {
      setPhoneFeedback({
        type: 'error',
        message: err.message || 'Gagal memverifikasi kode simulasi.',
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleCopyCode = () => {
    if (simulatedCodeReceived) {
      navigator.clipboard.writeText(simulatedCodeReceived);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Format email tidak valid. Gunakan format contoh@domain.com.');
      }

      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter demi keamanan akun Anda.');
      }

      const phoneValidation = validateIndonesianPhone(phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Format nomor HP tidak valid. Masukkan nomor HP Indonesia yang sah.');
      }

      if (!isPhoneVerified) {
        throw new Error('Harap selesaikan simulasi verifikasi nomor HP terlebih dahulu.');
      }

      // Register new user via API (Requirement 1: NO email OTP for users!)
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phoneNumber: phone.trim(),
          phoneVerified: true,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok || !registerData.success) {
        throw new Error(registerData.message || 'Pendaftaran gagal.');
      }

      // Sync active user client-side
      tatadanaDb.syncProfile(registerData.profile);
      tatadanaDb.setActiveUser(registerData.profile.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ardana_current_user_id', registerData.profile.id);
      }

      // Requirement 3: Redirect directly to Pilih Paket Akun page!
      router.push('/select-plan');
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal.');
      setIsLoading(false);
    }
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
              Registrasi Akun Baru
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Catat Keuangan.<br />Semudah Chat.
            </h2>
          </div>
          <p className="text-sm text-rose-100 max-w-sm leading-relaxed">
            Daftar dalam sekejap tanpa repot OTP email. Dapatkan akses ke bot Telegram pintar, manajemen dompet dinamis, dan rekomendasi AI fintech.
          </p>

          <div className="space-y-2.5 text-xs text-rose-100 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Tanpa Verifikasi OTP Email untuk Pengguna
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Verifikasi Nomor Handphone Indonesia (Simulasi)
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Pilihan Paket Berlangganan Fleksibel
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Persetujuan Akun Terjamin oleh Admin
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-rose-200">
          © 2026 Ardana Indonesia • FinTech Telegram Pintar
        </div>

        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KANAN (60%): Form Register */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Daftar Sekarang ✨
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Langkah 1 dari 3
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lengkapi data diri dan verifikasi nomor HP Anda untuk memilih paket.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nama Lengkap"
              placeholder="Contoh: Ahmad Pratama"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Email (Identitas Akun & Login)"
              type="email"
              placeholder="ahmad@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint="Email digunakan sebagai identitas akun dan login tanpa perlu kode OTP."
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Minimal 6 karakter..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Nomor HP + Simulasi Verifikasi */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Nomor Handphone (Format Indonesia: 08xx atau +628xx)
              </label>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsPhoneVerified(false);
                      setSimulatedCodeReceived(null);
                    }}
                    disabled={isPhoneVerified}
                    required
                  />
                </div>
                {!isPhoneVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestPhoneCode}
                    isLoading={isRequestingOtp}
                    className="shrink-0 text-xs h-10 px-3 border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    Kirim Kode Simulasi
                  </Button>
                )}
              </div>

              {/* Mode Simulasi Banner */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Mode Simulasi Pengujian:</strong>
                  <p className="text-amber-800 mt-0.5">
                    Integrasi SMS/WhatsApp OTP nyata belum diaktifkan. Sistem menghasilkan kode simulasi langsung di layar agar Anda dapat menguji alur pendaftaran.
                  </p>
                </div>
              </div>

              {/* Simulation Code Display & Verification Box */}
              {simulatedCodeReceived && !isPhoneVerified && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      Kode Verifikasi Simulasi:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>

                  <div className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-brand-200 shadow-inner">
                    <span className="font-mono text-xl font-extrabold tracking-widest text-brand-700">
                      {simulatedCodeReceived}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan 6-digit kode"
                      value={enteredPhoneCode}
                      onChange={(e) => setEnteredPhoneCode(e.target.value)}
                      maxLength={6}
                      className="text-center font-mono font-bold tracking-wider"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleVerifyPhoneCode}
                      isLoading={isVerifyingPhone}
                      className="shrink-0 text-xs px-4"
                    >
                      Verifikasi
                    </Button>
                  </div>
                </div>
              )}

              {/* Verified Badge */}
              {isPhoneVerified && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Nomor HP Terverifikasi (Mode Simulasi)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneVerified(false);
                      setSimulatedCodeReceived(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Ubah Nomor
                  </button>
                </div>
              )}

              {phoneFeedback && (
                <p
                  className={`text-xs ${
                    phoneFeedback.type === 'error'
                      ? 'text-red-600 font-semibold'
                      : phoneFeedback.type === 'success'
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {phoneFeedback.message}
                </p>
              )}
            </div>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              disabled={!isPhoneVerified}
              className="w-full shadow-md mt-2"
            >
              Lanjutkan ke Pilih Paket Akun <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Masuk di Sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
