'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertOctagon, Mail, ArrowLeft, LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function AccountRejectedPage() {
  const router = useRouter();
  const [profile] = React.useState(tatadanaDb.getProfile());

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
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 p-8 shadow-xl space-y-6 text-center">
        {/* Brand */}
        <div className="flex justify-center">
          <ArdanaLogo size="md" theme="light" />
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pendaftaran Akun Ditolak
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Mohon maaf, permohonan pendaftaran akun Anda saat ini belum dapat disetujui oleh administrator Ardana.
          </p>
        </div>

        {/* Reason Card */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-left space-y-2 text-xs">
          <span className="font-bold text-rose-900 block uppercase tracking-wider text-[11px]">
            Alasan Penolakan:
          </span>
          <p className="text-rose-800 leading-relaxed">
            {profile.admin_rejection_reason || 'Data pendaftaran belum memenuhi standar verifikasi identitas sistem.'}
          </p>
        </div>

        {/* Next Steps for User */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
          <span className="font-bold text-slate-800 block uppercase tracking-wider text-[11px]">
            Langkah yang Dapat Dilakukan:
          </span>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
            <li>Periksa kembali kelengkapan profil Anda saat mendaftar.</li>
            <li>Hubungi tim support melalui email <strong className="text-brand-600">support@ardana.id</strong> atau admin di <strong className="text-brand-600">andariftri7@gmail.com</strong> untuk mengajukan banding.</li>
            <li>Atau daftar kembali menggunakan email dan identitas yang valid.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Link href="/register">
            <Button className="w-full text-xs font-bold h-10">
              Daftar Ulang dengan Email Baru
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full text-xs text-slate-500 border-slate-200 hover:bg-slate-50 h-10"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Keluar ke Halaman Utama
          </Button>
        </div>
      </div>
    </div>
  );
}
