'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  CreditCard,
  Zap,
  HelpCircle,
  Clock,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';
import { AccountPlan } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { ACCOUNT_PLANS } from '@/lib/constants/plans';
import { tatadanaDb } from '@/lib/store/mock-db';

export default function SelectPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = React.useState<AccountPlan[]>(ACCOUNT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>('plan_pro');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Load existing user plan selection if saved
  React.useEffect(() => {
    async function loadPlansAndUser() {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.plans?.length > 0) {
            setPlans(data.plans);
          }
        }

        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.success && pData.profile?.selected_plan_id) {
            setSelectedPlanId(pData.profile.selected_plan_id);
          }
        }
      } catch {
        // Fallback to local store
        const cur = tatadanaDb.getProfile();
        if (cur?.selected_plan_id) {
          setSelectedPlanId(cur.selected_plan_id);
        }
      }
    }
    loadPlansAndUser();
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan pilihan paket akun.');
      }

      // Update client-side store
      try {
        tatadanaDb.setUserSelectedPlan(tatadanaDb.getActiveUserId(), selectedPlan.id);
      } catch {}

      // Navigate to payment page
      router.push('/payment');
    } catch (err: any) {
      setError(err.message || 'Gagal melanjutkan ke pembayaran.');
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top bar with Admin & Logout actions */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <Link
            href="/admin/login"
            className="text-xs text-slate-500 hover:text-brand-600 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-4 h-4 text-brand-600" /> Masuk Portal Admin (/admin/login)
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
            <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Langkah 2 dari 3: Pilih Paket Langganan
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Paket Akun TataDana
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Pilih paket akun yang paling sesuai dengan kebutuhan pencatatan finansial Anda. Dapatkan asisten AI personal, pelacakan bot Telegram tanpa batas, dan laporan keuangan komprehensif.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer relative rounded-3xl p-6 sm:p-8 transition-all flex flex-col justify-between border-2 ${
                  isSelected
                    ? 'border-brand-600 bg-white shadow-xl shadow-brand-900/10 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3.5 right-6">
                    <span className="bg-brand-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md tracking-wider uppercase">
                      Paling Populer ⭐
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Plan Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {formatRupiah(plan.price)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {plan.duration}</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fasilitas yang Didapatkan:
                    </span>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    className="w-full text-xs font-bold h-11"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(plan.id);
                    }}
                  >
                    {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary & Proceed Button */}
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-brand-200 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Ringkasan Pilihan Anda
              </span>
              <h4 className="text-base font-extrabold text-slate-900">{selectedPlan.name}</h4>
              <p className="text-xs text-slate-500">Durasi: {selectedPlan.duration}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Biaya</span>
              <div className="text-xl font-extrabold text-brand-700">
                {formatRupiah(selectedPlan.price)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/register')}
              className="text-xs border-slate-200 hover:bg-slate-100 order-2 sm:order-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onClick={handleConfirmPlan}
              className="flex-1 shadow-md order-1 sm:order-2"
            >
              Lanjutkan ke Pembayaran <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Reassurance */}
        <div className="text-center text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          🔒 Pembayaran diproses dengan aman. Akun Anda akan diaktifkan secara resmi setelah pembayaran diverifikasi oleh admin.
        </div>
      </div>
    </div>
  );
}
