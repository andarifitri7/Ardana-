import { AccountPlan, SubscriptionTier } from '@/types';

export const ACCOUNT_PLANS: AccountPlan[] = [
  {
    id: 'plan_starter',
    tier: 'starter',
    name: 'Paket Starter',
    price: 49000,
    duration: '1 Bulan',
    billing_period: 'monthly',
    description: 'Pilihan hemat untuk memulai pencatatan dan pengelolaan keuangan pribadi secara teratur.',
    features: [
      'Hingga 50 transaksi tercatat setiap bulan',
      'Pencatatan cepat via Telegram (Teks & Voice note)',
      'Manajemen multi-dompet dan kategori mandiri',
      'Ringkasan arus kas keuangan bulanan',
      'Simulasi notifikasi pengingat transaksi harian',
    ],
    is_popular: false,
    is_active: true,
  },
  {
    id: 'plan_pro',
    tier: 'pro',
    name: 'Paket Pro Unlimited',
    price: 99000,
    duration: '1 Bulan',
    billing_period: 'monthly',
    description: 'Solusi terlengkap tanpa batas transaksi, didukung pemindaian struk AI Vision & ekspor laporan resmi.',
    features: [
      'Transaksi tanpa batas (Unlimited kuota bulanan)',
      'Pemindai Struk Belanja Otomatis (AI Vision OCR)',
      'Konsultasi Cerdas Multi-AI (Gemini, GPT-4o, DeepSeek)',
      'Ekspor Laporan Keuangan Lengkap ke PDF & Excel resmi',
      'Notifikasi Peringatan Budget Cerdas 80% dan 100%',
      'Dukungan prioritas tim Ardana',
    ],
    is_popular: true,
    is_active: true,
  },
];

export function getAccountPlanById(planId: string): AccountPlan | undefined {
  return ACCOUNT_PLANS.find((p) => p.id === planId);
}

export function getAccountPlanByTier(tier: SubscriptionTier): AccountPlan | undefined {
  return ACCOUNT_PLANS.find((p) => p.tier === tier);
}

export function getDefaultPlan(): AccountPlan {
  return ACCOUNT_PLANS.find((p) => p.is_popular) || ACCOUNT_PLANS[0];
}
