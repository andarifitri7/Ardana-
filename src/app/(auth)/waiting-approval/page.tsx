'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, RefreshCw, CheckCircle2, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function WaitingApprovalPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState(tatadanaDb.getProfile());
  const [isChecking, setIsChecking] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  const checkApprovalStatus = async () => {
    setIsChecking(true);
    setStatusMessage('');

    try {
      // 1. Check live status from server
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.accountStatus) {
          if (data.profile) {
            tatadanaDb.updateProfile(data.profile);
            setProfile(data.profile);
          }
          if (data.accountStatus === 'approved') {
            setStatusMessage('Selamat! Akun Anda telah disetujui. Mengalihkan ke dashboard...');
            setTimeout(() => {
              router.push(data.profile?.role === 'admin' ? '/admin' : '/beranda');
            }, 1000);
            return;
          }
          if (data.accountStatus === 'rejected') {
            router.push('/rejected');
            return;
          }
        }
      }

      // 2. Fallback to client database
      const current = tatadanaDb.getProfile();
      setProfile(current);

      if (current.account_status === 'approved') {
        setStatusMessage('Selamat! Akun Anda telah disetujui. Mengalihkan ke dashboard...');
        setTimeout(() => {
          router.push(current.role === 'admin' ? '/admin' : '/beranda');
        }, 1000);
        return;
      }

      if (current.account_status === 'rejected') {
        router.push('/rejected');
        return;
      }

      setStatusMessage('Status saat ini: Masih menunggu persetujuan administrator.');
    } catch {
      setStatusMessage('Gagal memperbarui status. Silakan coba sesaat lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  // Poll status periodically every 5 seconds
  React.useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.accountStatus === 'approved') {
              if (data.profile) tatadanaDb.updateProfile(data.profile);
              router.push(data.profile?.role === 'admin' ? '/admin' : '/beranda');
              return;
            } else if (data.accountStatus === 'rejected') {
              router.push('/rejected');
              return;
            }
          }
        }
      } catch {}

      const cur = tatadanaDb.getProfile();
      if (cur.account_status === 'approved') {
        router.push(cur.role === 'admin' ? '/admin' : '/beranda');
      } else if (cur.account_status === 'rejected') {
        router.push('/rejected');
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [router]);

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
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFCFA] via-rose-50/40 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-100 p-8 shadow-xl space-y-6 text-center">
        {/* Brand */}
        <div className="flex justify-center">
          <ArdanaLogo size="md" theme="light" />
        </div>

        {/* Big Emoji Hourglass */}
        <div className="space-y-3">
          <div className="text-6xl animate-pulse select-none">
            ⏳
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Akun Anda Sedang Menunggu Persetujuan Admin
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Pembayaran paket akun Anda telah terverifikasi secara sah. Untuk menjaga keamanan ekosistem fintech Ardana, akun baru memerlukan persetujuan administrator sebelum mendapatkan akses ke dashboard utama.
          </p>
        </div>

        {/* Account Details Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Nama Akun:</span>
            <strong className="text-slate-800">{profile.full_name}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Email:</span>
            <strong className="text-slate-800">{profile.email}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Nomor HP:</span>
            <strong className="text-slate-800">{profile.phone_number || '-'}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Verifikasi Nomor HP:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi (Mode Simulasi)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Paket Akun:</span>
            <strong className="text-brand-700 font-extrabold uppercase">
              {profile.subscription_tier || 'PRO'}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status Pembayaran:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              ✓ Pembayaran Terverifikasi
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500">Status Akun:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
              ⏳ Menunggu Persetujuan Admin
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-brand-700">
            {statusMessage}
          </div>
        )}

        {/* Refresh Status Action */}
        <div className="space-y-2.5">
          <Button
            onClick={checkApprovalStatus}
            isLoading={isChecking}
            className="w-full h-11 text-sm font-bold shadow-md shadow-brand-900/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Cek Status Persetujuan
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full text-xs text-slate-500 border-slate-200 hover:bg-slate-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Keluar dari Sesi Ini
          </Button>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400">
          Admin kami memeriksa pendaftaran secara berkala. Anda akan otomatis dialihkan begitu akun Anda disetujui.
        </p>
      </div>
    </div>
  );
}
