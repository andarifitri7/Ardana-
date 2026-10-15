'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  ShieldAlert,
  Send,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import { tatadanaDb } from '@/lib/store/mock-db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TelegramSimulatorModal } from '@/components/dashboard/TelegramSimulatorModal';
import { EditProfileModal } from '@/components/dashboard/EditProfileModal';
import { PRESET_AVATARS } from '@/lib/constants/avatars';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = React.useState(tatadanaDb.getProfile());
  const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(tatadanaDb.getProfile());
    };

    handleProfileUpdate();
    window.addEventListener('tatadana_data_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    // Sync fresh profile from server API
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          tatadanaDb.syncProfile(data.profile);
          setProfile(data.profile);
        }
      })
      .catch(() => {});

    // Check for admin access denied redirect
    if (typeof window !== 'undefined' && window.location.search.includes('admin_access_denied')) {
      showToast({
        title: 'Akses Ditolak',
        message: 'Halaman administrator hanya dapat diakses oleh akun dengan peran Admin.',
        type: 'error',
      });
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    return () => {
      window.removeEventListener('tatadana_data_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [pathname]);

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
      window.location.href = '/login';
    }
  };

  const navItems = [
    { label: 'Beranda', href: '/beranda', icon: Home },
    { label: 'Transaksi', href: '/transaksi', icon: CreditCard },
    { label: 'Laporan', href: '/laporan', icon: BarChart3 },
    { label: 'Budget', href: '/budget', icon: Target },
    { label: 'Wallet', href: '/wallet', icon: WalletIcon },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-5 sticky top-0 h-screen select-none">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <Link href="/beranda" className="flex items-center gap-3 px-1 group">
            <ArdanaLogo size="md" />
          </Link>

          {/* User Tier Status Card */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Paket Akun</span>
              <Badge variant={profile.subscription_tier === 'pro' ? 'brand' : 'slate'}>
                {profile.subscription_tier.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {profile.subscription_tier === 'pro'
                ? '✨ Fitur Pro Unlimited & AI Advisor Aktif'
                : `Terpakai ${profile.monthly_tx_count}/50 kuota transaksi bulan ini`}
            </p>
            {profile.subscription_tier === 'starter' && (
              <Button
                size="sm"
                variant="primary"
                className="w-full text-xs h-7 rounded-lg"
                onClick={() => {
                  window.location.href = '/select-plan';
                }}
              >
                <Sparkles className="w-3 h-3 mr-1" /> Upgrade ke Pro
              </Button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm shadow-rose-900/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {/* Quick Bot Simulator Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs font-medium border-slate-200 hover:border-brand-500 hover:bg-rose-50/50"
            onClick={() => setIsSimulatorOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-brand-500" /> Tes Bot Telegram
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Button>

          {/* User Card with Edit Profile Trigger */}
          <div className="pt-2">
            <div
              onClick={() => setIsEditProfileOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEditProfileOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-rose-50/60 cursor-pointer transition-all group border border-transparent hover:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              title="Klik untuk ganti profil"
              aria-label="Buka menu ganti profil"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={profile.full_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                    }}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-brand-500/40 transition-all"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="truncate text-left">
                  <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                    {profile.full_name}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {profile.email || profile.phone_number || 'Profil Pengguna'}
                  </span>
                </div>
              </div>
              <div className="p-1 rounded-lg text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                <UserCog className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-1.5">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                Ganti Profil
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP NAVBAR --- */}
      <header className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <Link href="/beranda" className="flex items-center gap-2">
          <ArdanaLogo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs px-2.5" onClick={() => setIsSimulatorOpen(true)}>
            <Send className="w-3 h-3 text-brand-500 mr-1" /> Tes Bot
          </Button>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-brand-500/40 transition-all focus:outline-none"
            title="Ganti Profil"
            aria-label="Ganti Profil"
          >
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={profile.full_name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
              }}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm pt-16">
          <div className="bg-white p-5 rounded-b-3xl shadow-xl space-y-4">
            {/* Mobile User Card */}
            <div
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsEditProfileOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  setIsEditProfileOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-brand-100 cursor-pointer hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              aria-label="Buka menu ganti profil"
            >
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={profile.full_name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                  }}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900">{profile.full_name}</h4>
                  <p className="text-[11px] text-slate-400">{profile.email || profile.phone_number}</p>
                </div>
              </div>
              <Badge variant="brand" className="text-[10px]">Ganti Profil</Badge>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Keluar
            </Button>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1 overflow-y-auto min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>

      {/* Interactive Telegram Test Simulator Modal */}
      <TelegramSimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />

      {/* Quick Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={(updated) => setProfile(updated)}
      />

      {/* Global Toast Feedback Container */}
      <ToastContainer />
    </div>
  );
}

