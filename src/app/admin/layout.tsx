'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Cpu,
  Users,
  CreditCard,
  FileCode2,
  FileSearch,
  ArrowLeft,
  Eye,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser] = React.useState(tatadanaDb.getProfile('usr_admin_main'));

  // Do not render admin sidebar on /admin/login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const adminNav = [
    { label: 'Ringkasan Superadmin', href: '/admin', icon: ShieldAlert, exact: true },
    { label: 'Kelola Provider AI', href: '/admin/providers', icon: Cpu },
    { label: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
    { label: 'Approval Pembayaran', href: '/admin/payments', icon: CreditCard },
    { label: 'AI Execution Logs', href: '/admin/logs', icon: FileCode2 },
    { label: 'Audit Security Log', href: '/admin/audit', icon: FileSearch },
  ];

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ardana_current_user_id');
      localStorage.removeItem('tatadana_store_v1');
      sessionStorage.clear();
      tatadanaDb.clearClientSession();
    }
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <ArdanaLogo size="sm" theme="dark" variant="mark" />
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block">
                  Ardana <span className="text-brand-500">Admin</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
                  Portal Administrator
                </span>
              </div>
            </div>
            <Badge variant="warning" className="text-[10px]">ROOT</Badge>
          </div>

          {/* Admin User Card Info */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Akun Terverifikasi
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-900 text-brand-200 font-bold">
                ADMIN
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {adminUser.full_name || 'Andari Fitri'}
            </div>
            <div className="text-[11px] text-slate-400 truncate font-mono">
              {adminUser.email || 'andariftri7@gmail.com'}
            </div>
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-2">
          {/* Admin Logout Button */}
          <button
            onClick={handleAdminLogout}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition-colors border border-red-900/30"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" /> Keluar dari Admin
            </span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900/95 text-slate-100">
        <div className="max-w-6xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
