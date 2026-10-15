import {
  Profile,
  Wallet,
  Category,
  Budget,
  Transaction,
  PaymentTransaction,
  ExportHistoryItem,
  ReminderSetting,
  AIProviderConfig,
  AISettings,
  AILog,
  AuditLog,
  UserAuthRecord,
  AccountPlan,
  PhoneVerificationStatus,
  PaymentType,
  PaymentStatus,
} from '@/types';
import { formatRupiah, getWIBISOString } from '@/lib/utils';
import { sendTelegramMessage } from '@/lib/telegram/client';
import { hashPassword, verifyPassword } from '@/lib/auth/security';
import { ACCOUNT_PLANS, getAccountPlanById } from '@/lib/constants/plans';
import { validateIndonesianPhone, PhoneSimulationService } from '@/lib/phone/service';

// ==============================================================================
// 1. INITIAL USERS & PROFILES
// ==============================================================================

// Primary Admin Account (andariftri7@gmail.com)
export const initialAdminProfile: Profile = {
  id: 'usr_admin_main',
  full_name: 'Andari Fitri (Admin)',
  email: 'andariftri7@gmail.com',
  avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  phone_number: '081199887766',
  phone_verified: true,
  phone_verification_status: 'simulated_verified',
  email_verified: true,
  account_status: 'approved',
  selected_plan_id: 'plan_pro',
  telegram_user_id: 998877665,
  telegram_username: 'andarifitriadm',
  telegram_bot_token: '8617525755:AAG_HgYbAPgxGcUFQa930NQHyHUlS1fcAxs',
  subscription_tier: 'pro',
  subscription_status: 'active',
  monthly_tx_count: 0,
  default_currency: 'IDR',
  currency: 'IDR',
  is_superadmin: true,
  role: 'admin',
  saving_preference: 'deposito',
  created_at: '2026-09-01T08:00:00+07:00',
  updated_at: new Date().toISOString(),
};

// Existing Demo User (Budi Pratama - usr_tatadana_demo_01)
export const initialProfile: Profile = {
  id: 'usr_tatadana_demo_01',
  full_name: 'Budi Pratama',
  email: 'budi.pratama@ardana.id',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  phone_number: '081234567890',
  phone_verified: true,
  phone_verification_status: 'simulated_verified',
  email_verified: true,
  account_status: 'approved',
  selected_plan_id: 'plan_pro',
  telegram_user_id: 123456789,
  telegram_username: 'budipratama',
  telegram_bot_token: '8617525755:AAG_HgYbAPgxGcUFQa930NQHyHUlS1fcAxs',
  subscription_tier: 'pro',
  subscription_status: 'active',
  monthly_tx_count: 14,
  default_currency: 'IDR',
  currency: 'IDR',
  is_superadmin: false,
  role: 'user',
  saving_preference: 'rekening_bank',
  created_at: '2026-09-01T08:00:00+07:00',
  updated_at: new Date().toISOString(),
};

// Internal Initial Auth User Records
export const initialAuthUsers: UserAuthRecord[] = [
  {
    id: 'usr_admin_main',
    email: 'andariftri7@gmail.com',
    password_hash: hashPassword(process.env.ADMIN_PASSWORD || 'AdminArdana2026!'),
    role: 'admin',
    email_verified: true,
    account_status: 'approved',
    phone_verification_status: 'simulated_verified',
    selected_plan_id: 'plan_pro',
    profile: initialAdminProfile,
  },
  {
    id: 'usr_tatadana_demo_01',
    email: 'budi.pratama@ardana.id',
    password_hash: hashPassword('password123'),
    role: 'user',
    email_verified: true,
    account_status: 'approved',
    phone_verification_status: 'simulated_verified',
    selected_plan_id: 'plan_pro',
    profile: initialProfile,
  },
];

// ==============================================================================
// 2. INITIAL DATA TIED TO USERS
// ==============================================================================

export const initialWallets: Wallet[] = [
  {
    id: 'w_cash',
    user_id: 'usr_tatadana_demo_01',
    name: 'Cash Dompet',
    type: 'cash',
    balance: 750000,
    is_default: true,
    color: '#812D46',
    icon: 'Banknote',
    created_at: '2026-09-01T08:00:00+07:00',
    updated_at: '2026-10-13T10:00:00+07:00',
  },
  {
    id: 'w_bca',
    user_id: 'usr_tatadana_demo_01',
    name: 'BCA Utama',
    type: 'bank',
    balance: 8450000,
    is_default: false,
    color: '#641E32',
    icon: 'Building2',
    created_at: '2026-09-01T08:00:00+07:00',
    updated_at: '2026-10-13T10:00:00+07:00',
  },
  {
    id: 'w_gopay',
    user_id: 'usr_tatadana_demo_01',
    name: 'GoPay Saldo',
    type: 'ewallet',
    balance: 350000,
    is_default: false,
    color: '#C98F9D',
    icon: 'Smartphone',
    created_at: '2026-09-01T08:00:00+07:00',
    updated_at: '2026-10-13T10:00:00+07:00',
  },
  // Admin Wallet
  {
    id: 'w_admin_cash',
    user_id: 'usr_admin_main',
    name: 'Kas Operasional Admin',
    type: 'bank',
    balance: 0,
    is_default: true,
    color: '#641E32',
    icon: 'Building2',
    created_at: '2026-09-01T08:00:00+07:00',
    updated_at: '2026-10-13T10:00:00+07:00',
  },
];

export const initialCategories: Category[] = [
  { id: 'cat_food', user_id: 'usr_tatadana_demo_01', name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#812D46', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_transport', user_id: 'usr_tatadana_demo_01', name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#641E32', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_bills', user_id: 'usr_tatadana_demo_01', name: 'Tagihan & Utilitas', emoji: '🏠', type: 'expense', color: '#C98F9D', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_shopping', user_id: 'usr_tatadana_demo_01', name: 'Belanja Harian', emoji: '👕', type: 'expense', color: '#30272A', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_entertainment', user_id: 'usr_tatadana_demo_01', name: 'Hiburan', emoji: '🎮', type: 'expense', color: '#82777B', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_health', user_id: 'usr_tatadana_demo_01', name: 'Kesehatan', emoji: '💊', type: 'expense', color: '#521626', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_salary', user_id: 'usr_tatadana_demo_01', name: 'Gaji Bulanan', emoji: '💰', type: 'income', color: '#166534', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_freelance', user_id: 'usr_tatadana_demo_01', name: 'Freelance & Side Job', emoji: '💼', type: 'income', color: '#15803d', is_system: true, created_at: '2026-09-01' },
  { id: 'cat_investment', user_id: 'usr_tatadana_demo_01', name: 'Hasil Investasi', emoji: '📈', type: 'income', color: '#047857', is_system: true, created_at: '2026-09-01' },
];

export const initialBudgets: Budget[] = [
  { id: 'b_food', user_id: 'usr_tatadana_demo_01', category_id: 'cat_food', amount_monthly: 2500000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false, created_at: '2026-10-01', updated_at: '2026-10-01' },
  { id: 'b_transport', user_id: 'usr_tatadana_demo_01', category_id: 'cat_transport', amount_monthly: 1000000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false, created_at: '2026-10-01', updated_at: '2026-10-01' },
  { id: 'b_shopping', user_id: 'usr_tatadana_demo_01', category_id: 'cat_shopping', amount_monthly: 1500000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false, created_at: '2026-10-01', updated_at: '2026-10-01' },
  { id: 'b_bills', user_id: 'usr_tatadana_demo_01', category_id: 'cat_bills', amount_monthly: 2000000, month: 10, year: 2026, alert_80_sent: true, alert_100_sent: true, created_at: '2026-10-01', updated_at: '2026-10-01' },
];

export const initialTransactions: Transaction[] = [
  {
    id: 'tx_01',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_bca',
    category_id: 'cat_salary',
    type: 'income',
    amount: 14500000,
    description: 'Gaji Kantor Oktober',
    transaction_date: '2026-10-01T09:00:00+07:00',
    source: 'web',
    created_at: '2026-10-01T09:00:00+07:00',
  },
  {
    id: 'tx_02',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_bca',
    category_id: 'cat_bills',
    type: 'expense',
    amount: 1850000,
    description: 'Sewa Kos & Listrik Bulanan',
    transaction_date: '2026-10-02T14:10:00+07:00',
    source: 'web',
    created_at: '2026-10-02T14:10:00+07:00',
  },
  {
    id: 'tx_03',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_cash',
    category_id: 'cat_food',
    type: 'expense',
    amount: 35000,
    description: 'Nasi Goreng Kambing',
    transaction_date: '2026-10-03T19:40:00+07:00',
    source: 'telegram_text',
    created_at: '2026-10-03T19:40:00+07:00',
  },
  {
    id: 'tx_04',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_gopay',
    category_id: 'cat_transport',
    type: 'expense',
    amount: 45000,
    description: 'GoCar ke SCBD',
    transaction_date: '2026-10-04T08:15:00+07:00',
    source: 'telegram_text',
    created_at: '2026-10-04T08:15:00+07:00',
  },
  {
    id: 'tx_05',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_bca',
    category_id: 'cat_freelance',
    type: 'income',
    amount: 3200000,
    description: 'Fee Desain Landing Page',
    transaction_date: '2026-10-05T16:00:00+07:00',
    source: 'web',
    created_at: '2026-10-05T16:00:00+07:00',
  },
  {
    id: 'tx_06',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_cash',
    category_id: 'cat_food',
    type: 'expense',
    amount: 15000,
    description: 'beli bakso 15rb',
    transaction_date: '2026-10-07T12:30:00+07:00',
    source: 'telegram_text',
    created_at: '2026-10-07T12:30:00+07:00',
  },
  {
    id: 'tx_07',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_bca',
    category_id: 'cat_shopping',
    type: 'expense',
    amount: 285000,
    description: 'Belanja Superindo Mingguan',
    transaction_date: '2026-10-09T18:00:00+07:00',
    source: 'telegram_receipt',
    receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e420193af42?w=500&auto=format&fit=crop&q=60',
    items: [
      { name: 'Susu UHT Full Cream 1L', price: 22000, category: 'Makanan & Minuman', qty: 2 },
      { name: 'Roti Gandum', price: 18000, category: 'Makanan & Minuman', qty: 1 },
      { name: 'Deterjen Cair 800ml', price: 35000, category: 'Tagihan & Utilitas', qty: 1 },
      { name: 'Minyak Goreng 2L', price: 38000, category: 'Makanan & Minuman', qty: 1 },
      { name: 'Buah Apel Fuji 1kg', price: 45000, category: 'Makanan & Minuman', qty: 1 },
      { name: 'Dada Ayam Fillet 500g', price: 38000, category: 'Makanan & Minuman', qty: 1 },
      { name: 'Snack Biskuit', price: 15000, category: 'Makanan & Minuman', qty: 2 },
      { name: 'Sabun Mandi Refill 450ml', price: 26000, category: 'Kesehatan', qty: 1 },
      { name: 'Plastik Sampah Roll', price: 11000, category: 'Tagihan & Utilitas', qty: 1 },
    ],
    created_at: '2026-10-09T18:00:00+07:00',
  },
  {
    id: 'tx_08',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_cash',
    category_id: 'cat_transport',
    type: 'expense',
    amount: 50000,
    description: 'Bensin Pertamax Motor',
    transaction_date: '2026-10-10T14:15:00+07:00',
    source: 'telegram_voice',
    voice_transcript: 'isi bensin pertamax lima puluh ribu',
    created_at: '2026-10-10T14:15:00+07:00',
  },
  {
    id: 'tx_09',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_bca',
    category_id: 'cat_entertainment',
    type: 'expense',
    amount: 186000,
    description: 'Langganan Netflix & Spotify',
    transaction_date: '2026-10-11T10:00:00+07:00',
    source: 'web',
    created_at: '2026-10-11T10:00:00+07:00',
  },
  {
    id: 'tx_10',
    user_id: 'usr_tatadana_demo_01',
    wallet_id: 'w_gopay',
    category_id: 'cat_food',
    type: 'expense',
    amount: 42000,
    description: 'Kopi Susu & Croissant Senopati',
    transaction_date: '2026-10-12T16:20:00+07:00',
    source: 'telegram_text',
    created_at: '2026-10-12T16:20:00+07:00',
  },
];

export const initialReminders: ReminderSetting = {
  id: 'rem_01',
  user_id: 'usr_tatadana_demo_01',
  is_enabled: true,
  frequency: 2,
  time_1: '12:00',
  time_2: '20:00',
  last_sent_at: '2026-10-13T12:00:00+07:00',
  created_at: '2026-09-01T08:00:00+07:00',
};

export const initialAIProviders: AIProviderConfig[] = [
  { id: 'p_gemini', name: 'gemini', provider: 'gemini', display_name: 'Google Gemini 1.5 Flash', model_name: 'gemini-1.5-flash', is_active: true, priority: 1, supports_vision: true, supports_audio: true, created_at: '2026-09-01' },
  { id: 'p_openai', name: 'openai', provider: 'openai', display_name: 'OpenAI GPT-4o Mini', model_name: 'gpt-4o-mini', is_active: true, priority: 2, supports_vision: true, supports_audio: true, created_at: '2026-09-01' },
  { id: 'p_deepseek', name: 'deepseek', provider: 'deepseek', display_name: 'DeepSeek Chat (V3)', model_name: 'deepseek-chat', is_active: true, priority: 3, supports_vision: false, supports_audio: false, created_at: '2026-09-01' },
];

export const initialAISettings: AISettings = {
  id: 1,
  mode: 'single',
  primary_provider: 'gemini',
  fallback_provider: 'openai',
  updated_at: '2026-10-01',
};

export const initialAILogs: AILog[] = [
  {
    id: 'log_01',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    task_type: 'text_parse',
    tokens_used: 120,
    latency_ms: 340,
    status: 'success',
    created_at: '2026-10-13T10:15:00+07:00',
  },
  {
    id: 'log_02',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    task_type: 'receipt_vision',
    tokens_used: 480,
    latency_ms: 1250,
    status: 'success',
    created_at: '2026-10-13T09:30:00+07:00',
  },
];

export const initialPayments: PaymentTransaction[] = [
  {
    id: 'pay_01',
    user_id: 'usr_tatadana_demo_01',
    order_id: 'ORD-TD-2026-001',
    plan: 'pro',
    plan_id: 'plan_pro',
    amount: 99000,
    payment_type: 'midtrans_qris',
    status: 'paid',
    created_at: '2026-09-01T10:00:00+07:00',
    user: initialProfile,
  },
  {
    id: 'pay_02',
    user_id: 'usr_test_02',
    order_id: 'ORD-TD-2026-002',
    plan: 'pro',
    plan_id: 'plan_pro',
    amount: 99000,
    payment_type: 'manual_transfer',
    status: 'pending_verification',
    proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    created_at: '2026-10-13T08:30:00+07:00',
    user: {
      ...initialProfile,
      id: 'usr_test_02',
      full_name: 'Anisa Rahmawati',
      phone_number: '081399887766',
      subscription_tier: 'starter',
      role: 'user',
    },
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud_01',
    admin_id: 'usr_admin_main',
    target_user_id: 'usr_test_02',
    action: 'view_user_transactions',
    ip_address: '103.144.170.1',
    details: { reason: 'Investigasi kendala foto struk belum masuk' },
    created_at: '2026-10-13T09:00:00+07:00',
    admin_email: 'andariftri7@gmail.com',
    target_user_name: 'Anisa Rahmawati',
  },
];

export const initialExportHistory: ExportHistoryItem[] = [
  {
    id: 'exp_01',
    user_id: 'usr_tatadana_demo_01',
    file_name: 'Ardana_Laporan_Oktober_2026.pdf',
    file_type: 'pdf',
    file_url: '/api/reports/download/exp_01',
    period_label: '1 Okt 2026 - 13 Okt 2026',
    total_records: 10,
    created_at: '2026-10-13T10:00:00+07:00',
  },
];

// ==============================================================================
// 3. MULTI-USER DATA STORE WITH COMPLETE ISOLATION & RBAC
// ==============================================================================

class TataDanaDataStore {
  private users: UserAuthRecord[] = [...initialAuthUsers];
  private activeUserId: string = 'usr_tatadana_demo_01';
  private wallets: Wallet[] = [...initialWallets];
  private categories: Category[] = [...initialCategories];
  private budgets: Budget[] = [...initialBudgets];
  private transactions: Transaction[] = [...initialTransactions];
  private reminders: ReminderSetting = initialReminders;
  private aiProviders: AIProviderConfig[] = [...initialAIProviders];
  private aiSettings: AISettings = initialAISettings;
  private aiLogs: AILog[] = [...initialAILogs];
  private payments: PaymentTransaction[] = [...initialPayments];
  private auditLogs: AuditLog[] = [...initialAuditLogs];
  private exportHistory: ExportHistoryItem[] = [...initialExportHistory];
  private accountPlans: AccountPlan[] = [...ACCOUNT_PLANS];
  private processedUpdates = new Set<number>();

  constructor() {
    this.ensureAdminExists();
    this.loadFromStorage();
  }

  /**
   * Secure bootstrap for andariftri7@gmail.com as primary superadmin
   */
  private ensureAdminExists() {
    const adminEmail = 'andariftri7@gmail.com';
    const adminIdx = this.users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminArdana2026!';

    if (adminIdx === -1) {
      this.users.unshift({
        id: 'usr_admin_main',
        email: adminEmail,
        password_hash: hashPassword(adminPassword),
        role: 'admin',
        email_verified: true,
        account_status: 'approved',
        profile: initialAdminProfile,
      });
    } else {
      // Ensure admin has correct role and permissions
      this.users[adminIdx].role = 'admin';
      this.users[adminIdx].email_verified = true;
      this.users[adminIdx].account_status = 'approved';
      this.users[adminIdx].profile.role = 'admin';
      this.users[adminIdx].profile.is_superadmin = true;
      this.users[adminIdx].profile.email_verified = true;
      this.users[adminIdx].profile.account_status = 'approved';
      if (!this.users[adminIdx].password_hash) {
        this.users[adminIdx].password_hash = hashPassword(adminPassword);
      }
    }
  }

  public reloadFromStorage() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const filePath = path.join(process.cwd(), '.data', 'tatadana-store.json');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
            this.users = parsed.users;
            this.ensureAdminExists();
          }
          if (parsed.wallets) this.wallets = parsed.wallets;
          if (parsed.categories) this.categories = parsed.categories;
          if (parsed.budgets) this.budgets = parsed.budgets;
          if (parsed.transactions) this.transactions = parsed.transactions;
          if (parsed.reminders) this.reminders = parsed.reminders;
          if (parsed.aiProviders) this.aiProviders = parsed.aiProviders;
          if (parsed.aiSettings) this.aiSettings = parsed.aiSettings;
          if (parsed.payments) this.payments = parsed.payments;
          if (parsed.accountPlans && Array.isArray(parsed.accountPlans)) this.accountPlans = parsed.accountPlans;
          if (parsed.exportHistory) this.exportHistory = parsed.exportHistory;
          if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        }
      } catch {
        // fallback
      }
      return;
    }

    try {
      let activeId = localStorage.getItem('ardana_current_user_id');
      if (!activeId && typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)ardana_user_id=([^;]+)/);
        if (cookieMatch && cookieMatch[1]) {
          activeId = decodeURIComponent(cookieMatch[1]);
          localStorage.setItem('ardana_current_user_id', activeId);
        }
      }
      if (activeId) {
        this.activeUserId = activeId;
      }

      const saved = localStorage.getItem('tatadana_store_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.users = parsed.users.map((u: UserAuthRecord) => {
            // Keep legacy accounts approved
            if (u.id === 'usr_tatadana_demo_01' || u.id === 'usr_admin_main' || u.email === 'andariftri7@gmail.com') {
              return {
                ...u,
                email_verified: true,
                account_status: 'approved' as const,
                profile: {
                  ...u.profile,
                  email_verified: true,
                  account_status: 'approved' as const,
                },
              };
            }
            return u;
          });
          this.ensureAdminExists();
        }
        if (parsed.activeUserId && !activeId) this.activeUserId = parsed.activeUserId;
        if (parsed.wallets) this.wallets = parsed.wallets;
        if (parsed.categories) this.categories = parsed.categories;
        if (parsed.budgets) this.budgets = parsed.budgets;
        if (parsed.transactions) this.transactions = parsed.transactions;
        if (parsed.reminders) this.reminders = parsed.reminders;
        if (parsed.aiProviders) this.aiProviders = parsed.aiProviders;
        if (parsed.aiSettings) this.aiSettings = parsed.aiSettings;
        if (parsed.payments) this.payments = parsed.payments;
        if (parsed.accountPlans && Array.isArray(parsed.accountPlans)) this.accountPlans = parsed.accountPlans;
        if (parsed.exportHistory) this.exportHistory = parsed.exportHistory;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
      }
    } catch {
      // fallback to initial
    }
  }

  public saveToStorage() {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const dirPath = path.join(process.cwd(), '.data');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, 'tatadana-store.json');
        fs.writeFileSync(filePath, JSON.stringify({
          users: this.users,
          activeUserId: this.activeUserId,
          wallets: this.wallets,
          categories: this.categories,
          budgets: this.budgets,
          transactions: this.transactions,
          reminders: this.reminders,
          aiProviders: this.aiProviders,
          aiSettings: this.aiSettings,
          payments: this.payments,
          accountPlans: this.accountPlans,
          exportHistory: this.exportHistory,
          auditLogs: this.auditLogs,
        }, null, 2), 'utf8');
      } catch {
        // ignore
      }
      return;
    }

    try {
      localStorage.setItem('ardana_current_user_id', this.activeUserId);
      localStorage.setItem('tatadana_store_v1', JSON.stringify({
        users: this.users,
        activeUserId: this.activeUserId,
        wallets: this.wallets,
        categories: this.categories,
        budgets: this.budgets,
        transactions: this.transactions,
        reminders: this.reminders,
        aiProviders: this.aiProviders,
        aiSettings: this.aiSettings,
        payments: this.payments,
        accountPlans: this.accountPlans,
        exportHistory: this.exportHistory,
        auditLogs: this.auditLogs,
      }));
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    } catch {
      // ignore
    }
  }

  // ============================================================================
  // USER AUTHENTICATION & MULTI-USER MANAGEMENT
  // ============================================================================

  getActiveUserId(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ardana_current_user_id');
      if (stored) return stored;
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)ardana_user_id=([^;]+)/);
        if (cookieMatch && cookieMatch[1]) {
          return decodeURIComponent(cookieMatch[1]);
        }
      }
    }
    return this.activeUserId;
  }

  setActiveUser(userId: string): Profile | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    this.activeUserId = userId;
    this.saveToStorage();
    return user.profile;
  }

  getAllUsers(): Profile[] {
    return this.users.map(u => u.profile);
  }

  /**
   * Authenticate regular user login
   */
  authenticateUser(email: string, password: string): Profile {
    const user = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('Akun dengan email ini tidak ditemukan.');
    }
    if (!verifyPassword(password, user.password_hash)) {
      throw new Error('Password yang Anda masukkan salah.');
    }
    this.activeUserId = user.id;
    this.saveToStorage();
    return user.profile;
  }

  /**
   * Authenticate admin login with strict server/database role verification
   */
  authenticateAdmin(email: string, password: string): Profile {
    this.ensureAdminExists();
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Akun administrator tidak ditemukan.');
    }

    if (!verifyPassword(password, user.password_hash)) {
      throw new Error('Password admin salah.');
    }

    if (user.role !== 'admin' && !user.profile.is_superadmin) {
      throw new Error('Akses ditolak: Akun ini tidak memiliki hak administrator.');
    }

    this.activeUserId = user.id;
    this.saveToStorage();
    return user.profile;
  }

  /**
   * Register a new user with strictly Rp0 balance and ZERO transactions
   * Requirement 1: No email OTP for users.
   * Requirement 2: Simulated phone verification (simulated_verified).
   * Requirement 3 & 6: Initial status is pending_payment (redirected to plan selection).
   */
  registerUser(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    phoneVerified?: boolean;
    phoneVerificationStatus?: PhoneVerificationStatus;
  }): { profile: Profile; rawCode: string; verificationCode: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan login ke akun Anda.');
    }

    // Validate phone number if provided
    let normalizedPhone: string | null = null;
    let isPhoneVerified = Boolean(data.phoneVerified);
    let phoneVerificationStatus: PhoneVerificationStatus =
      data.phoneVerificationStatus || (isPhoneVerified ? 'simulated_verified' : 'unverified');

    if (data.phoneNumber) {
      const val = validateIndonesianPhone(data.phoneNumber);
      if (!val.isValid) {
        throw new Error(val.error || 'Format nomor HP tidak valid.');
      }
      normalizedPhone = val.normalized;
      // If phone is provided and marked verified, guarantee simulated_verified status
      if (isPhoneVerified) {
        phoneVerificationStatus = 'simulated_verified';
      }
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const hashedPassword = hashPassword(data.password);

    // Initial new user profile (Role strictly USER, zero transactions, pending_payment)
    const newProfile: Profile = {
      id: newUserId,
      full_name: data.fullName.trim(),
      email: cleanEmail,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      phone_number: normalizedPhone,
      phone_verified: isPhoneVerified,
      phone_verification_status: phoneVerificationStatus,
      email_verified: false,
      account_status: 'pending_payment',
      selected_plan_id: null,
      email_verification_code: null,
      telegram_user_id: null,
      telegram_username: null,
      telegram_bot_token: null,
      subscription_tier: 'starter',
      subscription_status: 'inactive',
      monthly_tx_count: 0,
      default_currency: 'IDR',
      currency: 'IDR',
      is_superadmin: false,
      role: 'user', // NEVER assign admin from registration!
      saving_preference: null,
      created_at: getWIBISOString(),
      updated_at: getWIBISOString(),
    };

    const newRecord: UserAuthRecord = {
      id: newUserId,
      email: cleanEmail,
      password_hash: hashedPassword,
      role: 'user',
      email_verified: false,
      account_status: 'pending_payment',
      phone_verification_status: phoneVerificationStatus,
      selected_plan_id: null,
      profile: newProfile,
    };

    this.users.push(newRecord);

    // Standard starting categories for new user (WITHOUT static/hardcoded wallets!)
    const defaultUserCategories: Category[] = [
      { id: `cat_${newUserId}_food`, user_id: newUserId, name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#812D46', is_system: true, created_at: getWIBISOString() },
      { id: `cat_${newUserId}_transport`, user_id: newUserId, name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#641E32', is_system: true, created_at: getWIBISOString() },
      { id: `cat_${newUserId}_bills`, user_id: newUserId, name: 'Tagihan & Utilitas', emoji: '🏠', type: 'expense', color: '#C98F9D', is_system: true, created_at: getWIBISOString() },
      { id: `cat_${newUserId}_salary`, user_id: newUserId, name: 'Gaji Bulanan', emoji: '💰', type: 'income', color: '#166534', is_system: true, created_at: getWIBISOString() },
    ];
    this.categories.push(...defaultUserCategories);

    // Automatically set as active user for registration flow
    this.activeUserId = newUserId;
    this.saveToStorage();

    this.addAuditLog('Pendaftaran pengguna baru berhasil', newUserId, {
      email: cleanEmail,
      account_status: 'pending_payment',
      phone_verification_status: phoneVerificationStatus,
    });

    return { profile: newProfile, rawCode: '', verificationCode: '' };
  }

  /**
   * Tahap 1: Verifikasi Kode Email -> Status menjadi 'pending' (Menunggu Persetujuan)
   */
  verifyEmail(email: string, code: string): { success: boolean; message: string; profile?: Profile } {
    const cleanEmail = email.trim().toLowerCase();
    const userIdx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (userIdx === -1) {
      return { success: false, message: 'Akun dengan email ini tidak ditemukan.' };
    }

    const user = this.users[userIdx];
    if (user.account_status === 'approved') {
      return { success: true, message: 'Akun sudah disetujui sebelumnya.', profile: user.profile };
    }

    const cleanCode = code.trim();
    const now = Date.now();

    // Check expiry
    if (user.email_verification_expires_at && now > user.email_verification_expires_at) {
      return { success: false, message: 'Kode verifikasi telah kedaluwarsa (10 menit). Silakan minta kode baru.' };
    }

    let isMatch = false;
    if (user.email_verification_code_hash) {
      isMatch = verifyPassword(`otp_${cleanCode}`, user.email_verification_code_hash);
    }
    if (!isMatch && user.email_verification_code && user.email_verification_code === cleanCode) {
      isMatch = true;
    }

    if (!isMatch) {
      return { success: false, message: 'Kode verifikasi email salah atau tidak valid.' };
    }

    // Email Verified -> Transition to pending (Menunggu Persetujuan Admin)
    user.email_verified = true;
    user.account_status = 'pending';
    user.email_verification_code = null;
    user.email_verification_code_hash = null;
    user.email_verification_expires_at = null;
    user.profile.email_verified = true;
    user.profile.account_status = 'pending';
    user.profile.email_verification_code = null;
    user.profile.updated_at = new Date().toISOString();

    this.saveToStorage();

    this.addAuditLog('Email berhasil diverifikasi, status akun menjadi Menunggu Persetujuan Admin', user.id, {
      email: cleanEmail,
      account_status: 'pending',
    });

    // Notify admin via Telegram if configured
    try {
      const admin = this.users.find(u => u.role === 'admin' && u.profile.is_superadmin);
      if (admin && admin.profile.telegram_bot_token && admin.profile.telegram_user_id) {
        sendTelegramMessage(
          admin.profile.telegram_bot_token,
          admin.profile.telegram_user_id,
          `🔔 *PENDAFTARAN BARU MENUNGGU PERSETUJUAN ADMIN*\n\n` +
          `👤 Nama: *${user.profile.full_name}*\n` +
          `✉️ Email: \`${user.email}\`\n` +
          `📱 HP: ${user.profile.phone_number || '-'}\n` +
          `✅ Verifikasi Email: Selesai\n` +
          `⏳ Status: *Menunggu Persetujuan Admin*\n\n` +
          `Silakan buka portal admin Ardana di https://ardana.id/admin untuk menyetujui akun ini.`
        ).catch(() => {});
      }
    } catch {
      // ignore telegram notification failure
    }

    return {
      success: true,
      message: 'Email berhasil diverifikasi! Akun Anda kini menunggu persetujuan admin.',
      profile: user.profile,
    };
  }

  /**
   * Resend verification email code with rate-limiting and hashing
   */
  resendVerificationCode(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('Akun tidak ditemukan.');

    const now = Date.now();
    if (user.email_verification_last_sent_at) {
      const elapsed = Math.floor((now - user.email_verification_last_sent_at) / 1000);
      if (elapsed < 60) {
        throw new Error(`Harap tunggu ${60 - elapsed} detik sebelum meminta pengiriman ulang kode.`);
      }
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = hashPassword(`otp_${newCode}`);

    user.email_verification_code = newCode;
    user.email_verification_code_hash = hashedCode;
    user.email_verification_expires_at = now + 10 * 60 * 1000;
    user.email_verification_last_sent_at = now;
    user.profile.email_verification_code = null;
    this.saveToStorage();
    return newCode;
  }

  // ============================================================================
  // ACCOUNT PLANS & PACKAGES
  // ============================================================================

  getAccountPlans(): AccountPlan[] {
    return this.accountPlans;
  }

  getAccountPlan(planId: string): AccountPlan | undefined {
    return this.accountPlans.find(p => p.id === planId) || getAccountPlanById(planId);
  }

  updateAccountPlan(id: string, data: Partial<AccountPlan>): AccountPlan | null {
    const idx = this.accountPlans.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.accountPlans[idx] = { ...this.accountPlans[idx], ...data };
    this.saveToStorage();
    return this.accountPlans[idx];
  }

  setUserSelectedPlan(userId: string, planId: string): Profile {
    const plan = this.getAccountPlan(planId);
    if (!plan) {
      throw new Error('Paket akun tidak valid atau tidak ditemukan.');
    }

    const userIdx = this.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    this.users[userIdx].profile.selected_plan_id = plan.id;
    this.users[userIdx].profile.subscription_tier = plan.tier;
    this.users[userIdx].selected_plan_id = plan.id;
    this.users[userIdx].profile.updated_at = new Date().toISOString();

    // If an unpaid payment exists, update its plan and amount accordingly
    const existingPayment = this.payments.find(p => p.user_id === userId && p.status !== 'paid');
    if (existingPayment) {
      existingPayment.plan = plan.tier;
      existingPayment.plan_id = plan.id;
      existingPayment.amount = plan.price;
    }

    this.saveToStorage();

    this.addAuditLog('Pengguna memilih paket akun', userId, {
      plan_id: plan.id,
      plan_name: plan.name,
      plan_price: plan.price,
    });

    return this.users[userIdx].profile;
  }

  getUserLatestPayment(userId: string): PaymentTransaction | undefined {
    return this.payments.find(p => p.user_id === userId);
  }

  createOrUpdatePayment(params: {
    userId: string;
    planId: string;
    paymentType: PaymentType;
    proofImageUrl?: string;
  }): PaymentTransaction {
    const plan = this.getAccountPlan(params.planId);
    if (!plan) {
      throw new Error('Paket yang dipilih tidak valid.');
    }

    const user = this.users.find(u => u.id === params.userId);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    // Server-enforced price from database
    const verifiedAmount = plan.price;

    // Check existing payment for this user to prevent duplicate processing
    const existingIdx = this.payments.findIndex(
      p => p.user_id === params.userId && p.status !== 'failed' && p.status !== 'rejected'
    );

    if (existingIdx !== -1) {
      const existing = this.payments[existingIdx];
      // If already paid, prevent re-charging
      if (existing.status === 'paid') {
        return existing;
      }

      existing.plan = plan.tier;
      existing.plan_id = plan.id;
      existing.amount = verifiedAmount;
      existing.payment_type = params.paymentType;
      if (params.proofImageUrl) {
        existing.proof_image_url = params.proofImageUrl;
        existing.status = 'pending_verification';
      }
      this.saveToStorage();
      return existing;
    }

    const orderId = `ORD-TD-${Date.now().toString().slice(-6)}`;
    const status: PaymentStatus = params.proofImageUrl ? 'pending_verification' : 'unpaid';

    const newPayment: PaymentTransaction = {
      id: `pay_${Date.now()}`,
      user_id: params.userId,
      order_id: orderId,
      plan: plan.tier,
      plan_id: plan.id,
      amount: verifiedAmount,
      payment_type: params.paymentType,
      status,
      proof_image_url: params.proofImageUrl || null,
      created_at: new Date().toISOString(),
      user: user.profile,
    };

    this.payments.unshift(newPayment);
    this.saveToStorage();

    this.addAuditLog('Transaksi pembayaran paket dibuat', params.userId, {
      order_id: orderId,
      plan: plan.name,
      amount: verifiedAmount,
      payment_type: params.paymentType,
      status,
    });

    return newPayment;
  }

  verifyUserPayment(orderId: string, adminId: string): { success: boolean; payment: PaymentTransaction; profile: Profile } {
    const pIdx = this.payments.findIndex(p => p.order_id === orderId || p.id === orderId);
    if (pIdx === -1) {
      throw new Error('Transaksi pembayaran tidak ditemukan.');
    }

    const payment = this.payments[pIdx];
    payment.status = 'paid';
    payment.approved_by = adminId;
    payment.approved_at = new Date().toISOString();

    const userIdx = this.users.findIndex(u => u.id === payment.user_id);
    if (userIdx !== -1) {
      const user = this.users[userIdx];
      user.profile.subscription_tier = payment.plan;
      // Requirement 6: Once payment verified, account status becomes pending_admin_approval
      if (user.account_status !== 'approved') {
        user.account_status = 'pending_admin_approval';
        user.profile.account_status = 'pending_admin_approval';
        user.profile.updated_at = new Date().toISOString();
      }
    }

    this.saveToStorage();

    this.addAuditLog('Verifikasi pembayaran berhasil (Order disetujui)', payment.user_id, {
      order_id: payment.order_id,
      amount: payment.amount,
      admin_id: adminId,
    });

    return {
      success: true,
      payment,
      profile: userIdx !== -1 ? this.users[userIdx].profile : initialProfile,
    };
  }

  /**
   * Tahap 2: Admin Menyetujui Akun Pengguna -> status 'approved'
   * Requirement 6: Jika pembayaran belum terverifikasi, jangan izinkan admin menyetujui aktivasi paket berbayar!
   */
  approveUser(userId: string, adminId?: string): Profile {
    const userIdx = this.users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('Pengguna tidak ditemukan.');

    const user = this.users[userIdx];
    if (user.account_status === 'approved') {
      return user.profile; // Idempotent check
    }

    // Check payment status for paid package
    const plan = user.profile.selected_plan_id ? this.getAccountPlan(user.profile.selected_plan_id) : null;
    const isPaidPlan = plan ? plan.price > 0 : user.profile.subscription_tier === 'pro';

    if (isPaidPlan) {
      const userPayment = this.payments.find(p => p.user_id === userId);
      if (!userPayment || userPayment.status !== 'paid') {
        throw new Error('Aktivasi paket berbayar tidak dapat disetujui: Pembayaran belum terverifikasi sah.');
      }
    }

    user.account_status = 'approved';
    user.email_verified = true;
    user.admin_rejection_reason = null;
    user.profile.account_status = 'approved';
    user.profile.email_verified = true;
    user.profile.subscription_status = 'active';
    user.profile.approved_at = new Date().toISOString();
    user.profile.admin_rejection_reason = null;
    user.profile.updated_at = new Date().toISOString();

    this.saveToStorage();

    this.addAuditLog('Akun pengguna disetujui oleh admin', userId, {
      account_status: 'approved',
      approved_by: adminId || 'admin',
      approved_at: user.profile.approved_at,
    });

    // Notify user via Telegram if user connected
    try {
      if (user.profile.telegram_bot_token && user.profile.telegram_user_id) {
        sendTelegramMessage(
          user.profile.telegram_bot_token,
          user.profile.telegram_user_id,
          `🎉 *AKUN ARDANA KAMU TELAH DISETUJUI!*\n\n` +
          `Halo ${user.profile.full_name}, akunmu telah disetujui oleh administrator.\n` +
          `Sekarang kamu dapat login ke dashboard dan mulai mencatat keuanganmu secara cerdas. 💰`
        ).catch(() => {});
      }
    } catch {
      // ignore
    }

    return user.profile;
  }

  /**
   * Tahap 2: Admin Menolak Akun Pengguna -> status 'rejected'
   */
  rejectUser(userId: string, reason?: string, adminId?: string): Profile {
    const userIdx = this.users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('Pengguna tidak ditemukan.');

    const user = this.users[userIdx];
    if (user.account_status === 'rejected') {
      return user.profile; // Idempotent check
    }

    const rejectionReason = reason || 'Data pendaftaran belum memenuhi kriteria kebijakan keamanan sistem Ardana.';

    user.account_status = 'rejected';
    user.admin_rejection_reason = rejectionReason;
    user.profile.account_status = 'rejected';
    user.profile.admin_rejection_reason = rejectionReason;
    user.profile.updated_at = new Date().toISOString();

    this.saveToStorage();

    this.addAuditLog('Akun pengguna ditolak oleh admin', userId, {
      account_status: 'rejected',
      admin_id: adminId || 'admin',
      reason: rejectionReason,
    });

    // Notify user via Telegram if user connected
    try {
      if (user.profile.telegram_bot_token && user.profile.telegram_user_id) {
        sendTelegramMessage(
          user.profile.telegram_bot_token,
          user.profile.telegram_user_id,
          `⚠️ *PEMBERITAHUAN PENDAFTARAN ARDANA*\n\n` +
          `Mohon maaf ${user.profile.full_name}, pendaftaran akunmu belum dapat disetujui oleh admin.\n` +
          `Alasan: ${rejectionReason}\n\n` +
          `Hubungi support@ardana.id jika Anda memerlukan informasi lebih lanjut.`
        ).catch(() => {});
      }
    } catch {
      // ignore
    }

    return user.profile;
  }

  getPendingApprovalUsers(): Profile[] {
    return this.users.filter(u => u.account_status === 'pending' || u.account_status === 'pending_admin_approval').map(u => u.profile);
  }

  getUserRecords(): UserAuthRecord[] {
    return this.users;
  }

  getUserById(userId: string): UserAuthRecord | undefined {
    return this.users.find(u => u.id === userId);
  }

  getUserByEmail(email: string): UserAuthRecord | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserByTelegramId(telegramId: number | string): UserAuthRecord | undefined {
    return this.users.find(u => u.profile && Number(u.profile.telegram_user_id) === Number(telegramId));
  }

  // ============================================================================
  // PROFILE & SAVING PREFERENCES
  // ============================================================================

  getProfile(userId?: string): Profile {
    const targetId = userId || this.getActiveUserId();
    const user = this.users.find(u => u.id === targetId);
    if (user) return user.profile;
    if (targetId && targetId !== 'usr_tatadana_demo_01' && targetId !== 'usr_admin_main') {
      return {
        id: targetId,
        full_name: 'Pengguna Ardana',
        email: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        phone_number: null,
        phone_verified: false,
        email_verified: false,
        account_status: 'pending',
        email_verification_code: null,
        telegram_user_id: null,
        telegram_username: null,
        telegram_bot_token: null,
        subscription_tier: 'starter',
        subscription_status: 'active',
        monthly_tx_count: 0,
        default_currency: 'IDR',
        currency: 'IDR',
        is_superadmin: false,
        role: 'user',
        saving_preference: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return initialProfile;
  }

  updateProfile(data: Partial<Profile>, userId?: string): Profile {
    if (typeof window === 'undefined') {
      this.loadFromStorage();
    }
    const targetId = userId || this.activeUserId;
    const userIdx = this.users.findIndex(u => u.id === targetId);

    if (userIdx === -1) {
      throw new Error(`Pengguna dengan ID "${targetId}" tidak ditemukan.`);
    }

    const currentProfile = this.users[userIdx].profile;
    const updatedCurrency = data.currency || data.default_currency || currentProfile.default_currency || 'IDR';

    // Disallow role or superadmin escalation from general updateProfile
    const safeData: Partial<Profile> = { ...data };
    delete (safeData as any).role;
    delete (safeData as any).is_superadmin;

    // Synchronize user.email if email is updated so login by email continues to work
    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      this.users[userIdx].email = cleanEmail;
      safeData.email = cleanEmail;
    }

    if (data.full_name) {
      safeData.full_name = data.full_name.trim();
    }

    if (data.phone_number !== undefined) {
      safeData.phone_number = data.phone_number ? data.phone_number.trim() : null;
    }

    this.users[userIdx].profile = {
      ...currentProfile,
      ...safeData,
      default_currency: updatedCurrency,
      currency: updatedCurrency,
      updated_at: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.users[userIdx].profile;
  }

  updatePassword(userId: string, newPassword: string): boolean {
    if (typeof window === 'undefined') {
      this.loadFromStorage();
    }
    const userIdx = this.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      throw new Error(`Pengguna dengan ID "${userId}" tidak ditemukan.`);
    }
    this.users[userIdx].password_hash = hashPassword(newPassword);
    this.users[userIdx].profile.updated_at = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  syncProfile(profile: Profile): void {
    const idx = this.users.findIndex(u => u.id === profile.id);
    if (idx !== -1) {
      this.users[idx].profile = {
        ...this.users[idx].profile,
        ...profile,
        updated_at: profile.updated_at || new Date().toISOString(),
      };
      if (profile.email) {
        this.users[idx].email = profile.email.toLowerCase();
      }
    } else {
      this.users.push({
        id: profile.id,
        email: profile.email ? profile.email.toLowerCase() : '',
        password_hash: '',
        role: profile.role || 'user',
        email_verified: profile.email_verified || false,
        account_status: profile.account_status || 'approved',
        profile,
      });
    }
    this.activeUserId = profile.id;
    this.saveToStorage();
  }

  clearClientSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ardana_current_user_id');
        localStorage.removeItem('tatadana_store_v1');
        sessionStorage.clear();
      } catch {
        // ignore
      }
    }
    this.activeUserId = '';
  }

  /**
   * Save user saving place preference (Requirement 4)
   */
  setSavingPreference(preferenceId: string, userId?: string): Profile {
    return this.updateProfile({ saving_preference: preferenceId }, userId);
  }

  // ============================================================================
  // WALLETS (DYNAMIC & USER-MANAGED — NO HARDCODED DEFAULTS)
  // ============================================================================

  /**
   * Get user wallets. Do NOT auto-create static wallets if empty!
   */
  getWallets(userId?: string, includeArchived = false): Wallet[] {
    const targetId = userId || this.getActiveUserId();
    return this.wallets.filter(w => {
      if (w.user_id !== targetId) return false;
      if (!includeArchived) {
        return !w.is_archived && w.is_active !== false;
      }
      return true;
    });
  }

  /**
   * Get only active, non-archived wallets for transaction selection
   */
  getActiveWallets(userId?: string): Wallet[] {
    return this.getWallets(userId, false);
  }

  /**
   * Returns default wallet or null if user has no wallets yet
   */
  getDefaultWallet(userId?: string): Wallet | null {
    const activeWallets = this.getActiveWallets(userId);
    if (activeWallets.length === 0) return null;
    return activeWallets.find(w => w.is_default) || activeWallets[0] || null;
  }

  addWallet(
    data: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { currency?: string },
    userId?: string
  ): Wallet {
    const targetId = userId || this.activeUserId;
    const existingActive = this.getActiveWallets(targetId);

    // If first wallet, automatically set as default
    const shouldBeDefault = data.is_default || existingActive.length === 0;

    const newWallet: Wallet = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: targetId,
      name: data.name.trim(),
      type: data.type,
      balance: data.balance || 0,
      is_default: shouldBeDefault,
      is_archived: false,
      is_active: true,
      currency: data.currency || 'IDR',
      color: data.color || '#812D46',
      icon: data.icon || 'Building2',
      created_at: getWIBISOString(),
      updated_at: getWIBISOString(),
    };

    if (shouldBeDefault) {
      this.wallets = this.wallets.map(w => w.user_id === targetId ? { ...w, is_default: false } : w);
    }

    this.wallets.push(newWallet);
    this.saveToStorage();

    this.addAuditLog('Dompet baru ditambahkan oleh pengguna', targetId, {
      wallet_id: newWallet.id,
      name: newWallet.name,
      type: newWallet.type,
      balance: newWallet.balance,
    });

    return newWallet;
  }

  syncWallet(wallet: Wallet): void {
    const idx = this.wallets.findIndex(w => w.id === wallet.id);
    if (idx !== -1) {
      this.wallets[idx] = { ...this.wallets[idx], ...wallet };
    } else {
      if (wallet.is_default) {
        this.wallets = this.wallets.map(w => w.user_id === wallet.user_id ? { ...w, is_default: false } : w);
      }
      this.wallets.push(wallet);
    }
    this.saveToStorage();
  }

  updateWallet(id: string, data: Partial<Wallet>, userId?: string): Wallet | null {
    const idx = this.wallets.findIndex(w => w.id === id);
    if (idx === -1) return null;
    const targetId = userId || this.wallets[idx].user_id;

    if (data.is_default) {
      this.wallets = this.wallets.map(w => w.user_id === targetId ? { ...w, is_default: false } : w);
    }

    this.wallets[idx] = {
      ...this.wallets[idx],
      ...data,
      updated_at: getWIBISOString(),
    };
    this.saveToStorage();
    return this.wallets[idx];
  }

  archiveWallet(id: string, userId?: string): Wallet | null {
    const wallet = this.updateWallet(id, { is_archived: true, is_active: false, is_default: false }, userId);
    if (wallet) {
      // Re-assign default wallet if needed
      const remaining = this.getActiveWallets(wallet.user_id);
      if (remaining.length > 0 && !remaining.some(w => w.is_default)) {
        this.updateWallet(remaining[0].id, { is_default: true }, wallet.user_id);
      }
    }
    return wallet;
  }

  unarchiveWallet(id: string, userId?: string): Wallet | null {
    return this.updateWallet(id, { is_archived: false, is_active: true }, userId);
  }

  deleteWallet(id: string, userId?: string): boolean {
    const target = this.wallets.find(w => w.id === id);
    if (!target) return false;
    const targetId = userId || target.user_id;

    // Check if wallet has transactions: if it does, archive instead of hard delete to preserve history
    const hasTransactions = this.transactions.some(t => t.wallet_id === id || t.destination_wallet_id === id);
    if (hasTransactions) {
      this.archiveWallet(id, targetId);
      return true;
    }

    this.wallets = this.wallets.filter(w => w.id !== id);
    const remaining = this.getActiveWallets(targetId);
    if (remaining.length > 0 && !remaining.some(w => w.is_default)) {
      this.updateWallet(remaining[0].id, { is_default: true }, targetId);
    }
    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  getCategories(userId?: string): Category[] {
    const targetId = userId || this.getActiveUserId();
    const userCats = this.categories.filter(c => c.user_id === targetId);
    if (userCats.length === 0) {
      // Provide system categories if user has none
      return initialCategories.map(c => ({ ...c, user_id: targetId }));
    }
    return userCats;
  }

  addCategory(data: Omit<Category, 'id' | 'user_id' | 'created_at'>, userId?: string): Category {
    const targetId = userId || this.activeUserId;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      user_id: targetId,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.categories.push(newCat);
    this.saveToStorage();
    return newCat;
  }

  updateCategory(id: string, data: Partial<Category>): Category | null {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...data };
    this.saveToStorage();
    return this.categories[idx];
  }

  deleteCategory(id: string): boolean {
    this.categories = this.categories.filter(c => c.id !== id);
    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // BUDGETS (ISOLATED BY USER ID)
  // ============================================================================

  getBudgets(userId?: string): (Budget & { category?: Category; spent: number })[] {
    const targetId = userId || this.getActiveUserId();
    const userBudgets = this.budgets.filter(b => b.user_id === targetId);
    const userCats = this.getCategories(targetId);
    const userTxs = this.getTransactions(targetId);

    return userBudgets.map(b => {
      const cat = userCats.find(c => c.id === b.category_id);
      const spent = userTxs
        .filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...b,
        category: cat,
        spent,
      };
    });
  }

  setBudget(categoryId: string, amount: number, userId?: string): Budget {
    const targetId = userId || this.activeUserId;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const existingIdx = this.budgets.findIndex(
      b => b.user_id === targetId && b.category_id === categoryId && b.month === month && b.year === year
    );

    if (existingIdx !== -1) {
      this.budgets[existingIdx].amount_monthly = amount;
      this.budgets[existingIdx].updated_at = now.toISOString();
      this.saveToStorage();
      return this.budgets[existingIdx];
    }

    const newBudget: Budget = {
      id: `b_${Date.now()}`,
      user_id: targetId,
      category_id: categoryId,
      amount_monthly: amount,
      month,
      year,
      alert_80_sent: false,
      alert_100_sent: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    this.budgets.push(newBudget);
    this.saveToStorage();
    return newBudget;
  }

  // ============================================================================
  // TRANSACTIONS (STRICT DATA ISOLATION BY USER ID)
  // ============================================================================

  getTransactions(userId?: string): Transaction[] {
    const targetId = userId || this.getActiveUserId();
    const userWallets = this.getWallets(targetId);
    const userCats = this.getCategories(targetId);

    // Filter strictly by target user ID!
    const userTxs = this.transactions.filter(t => t.user_id === targetId);

    return userTxs.map(t => ({
      ...t,
      wallet: userWallets.find(w => w.id === t.wallet_id),
      destination_wallet: t.destination_wallet_id ? userWallets.find(w => w.id === t.destination_wallet_id) : undefined,
      category: userCats.find(c => c.id === t.category_id),
    }));
  }

  addTransaction(
    data: {
      type: 'expense' | 'income' | 'transfer';
      amount: number;
      wallet_id?: string;
      category_id?: string;
      description: string;
      transaction_date?: string;
      source?: 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice';
      items?: any[];
      receipt_image_url?: string;
      voice_transcript?: string;
      destination_wallet_id?: string;
    },
    userId?: string
  ): Transaction {
    const targetId = userId || this.activeUserId;
    const userWallets = this.getActiveWallets(targetId);
    if (userWallets.length === 0) {
      throw new Error('Anda belum memiliki dompet aktif. Silakan tambahkan dompet terlebih dahulu melalui menu Dompet.');
    }
    const defaultWallet = userWallets.find(w => w.is_default) || userWallets[0];
    const targetWalletId = data.wallet_id || defaultWallet?.id;
    if (!targetWalletId) {
      throw new Error('Dompet tidak valid. Pilih dompet yang terdaftar.');
    }

    const walletIdx = this.wallets.findIndex(w => w.id === targetWalletId && w.user_id === targetId);
    if (walletIdx === -1) {
      throw new Error('Dompet yang dipilih tidak ditemukan atau bukan milik Anda.');
    }

    // Check balance sufficiency for expense
    if (data.type === 'expense' && this.wallets[walletIdx].balance < data.amount) {
      throw new Error(`Saldo dompet ${this.wallets[walletIdx].name} tidak mencukupi (Saldo saat ini: ${formatRupiah(this.wallets[walletIdx].balance)}, dibutuhkan: ${formatRupiah(data.amount)}).`);
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: targetId,
      wallet_id: targetWalletId,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      transaction_date: data.transaction_date || getWIBISOString(),
      source: data.source || 'web',
      items: data.items,
      receipt_image_url: data.receipt_image_url,
      voice_transcript: data.voice_transcript,
      destination_wallet_id: data.destination_wallet_id,
      created_at: getWIBISOString(),
    };

    // Update wallet balances precisely
    if (data.type === 'expense') {
      this.wallets[walletIdx].balance -= data.amount;
    } else if (data.type === 'income') {
      this.wallets[walletIdx].balance += data.amount;
    } else if (data.type === 'transfer') {
      this.wallets[walletIdx].balance -= data.amount;
      if (data.destination_wallet_id) {
        const destIdx = this.wallets.findIndex(w => w.id === data.destination_wallet_id && w.user_id === targetId);
        if (destIdx !== -1) {
          this.wallets[destIdx].balance += data.amount;
        }
      }
    }
    this.wallets[walletIdx].updated_at = getWIBISOString();

    // Update user monthly tx count
    const userIdx = this.users.findIndex(u => u.id === targetId);
    if (userIdx !== -1) {
      this.users[userIdx].profile.monthly_tx_count += 1;
    }

    this.transactions.unshift(newTx);

    // Check automatic budget alerts
    if (data.type === 'expense' && data.category_id) {
      this.checkAndDispatchBudgetAlert(data.category_id, data.amount, targetId);
    }

    this.saveToStorage();

    const currentWallets = this.getWallets(targetId);
    const currentCats = this.getCategories(targetId);

    return {
      ...newTx,
      wallet: currentWallets.find(w => w.id === targetWalletId),
      category: currentCats.find(c => c.id === data.category_id),
    };
  }

  syncTransaction(tx: Transaction, userId?: string): void {
    const targetId = userId || tx.user_id || this.activeUserId;
    const existing = this.transactions.find(t => t.id === tx.id);
    if (!existing) {
      const formattedTx = { ...tx, user_id: targetId };
      this.transactions.unshift(formattedTx);

      const walletIdx = this.wallets.findIndex(w => w.id === tx.wallet_id && w.user_id === targetId);
      if (walletIdx !== -1) {
        if (tx.type === 'expense') {
          this.wallets[walletIdx].balance -= tx.amount;
        } else if (tx.type === 'income') {
          this.wallets[walletIdx].balance += tx.amount;
        } else if (tx.type === 'transfer') {
          this.wallets[walletIdx].balance -= tx.amount;
          if (tx.destination_wallet_id) {
            const destIdx = this.wallets.findIndex(w => w.id === tx.destination_wallet_id && w.user_id === targetId);
            if (destIdx !== -1) {
              this.wallets[destIdx].balance += tx.amount;
            }
          }
        }
      }

      const userIdx = this.users.findIndex(u => u.id === targetId);
      if (userIdx !== -1) {
        this.users[userIdx].profile.monthly_tx_count += 1;
      }

      if (tx.type === 'expense' && tx.category_id) {
        this.checkAndDispatchBudgetAlert(tx.category_id, 0, targetId);
      }

      this.saveToStorage();
    }
  }

  private checkAndDispatchBudgetAlert(categoryId: string, addedAmount: number, userId: string) {
    const userBudgets = this.budgets.filter(b => b.user_id === userId);
    const budget = userBudgets.find(b => b.category_id === categoryId);
    if (!budget || budget.amount_monthly <= 0) return;

    const currentSpent = this.transactions
      .filter(t => t.user_id === userId && t.type === 'expense' && t.category_id === categoryId)
      .reduce((sum, t) => sum + t.amount, 0) + addedAmount;

    const percentage = Math.round((currentSpent / budget.amount_monthly) * 100);
    const userProfile = this.getProfile(userId);
    const botToken = userProfile.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = userProfile.telegram_user_id || 123456789;

    if (currentSpent >= budget.amount_monthly && !budget.alert_100_sent) {
      budget.alert_100_sent = true;
      budget.alert_80_sent = true;
      const alertMessage = `🚨 *ALERT BUDGET 100% TERLEWATI!*

Budget bulananmu sudah habis terpakai (100%)!
├ Total Pengeluaran : ${formatRupiah(currentSpent)}
├ Batas Budget : ${formatRupiah(budget.amount_monthly)}
└ Sisa Alokasi : Rp 0

💡 *Saran FinTech:* Tahan pengeluaran untuk pos ini hingga awal bulan depan agar keuanganmu tetap stabil! 💪`;
      sendTelegramMessage(botToken, chatId, alertMessage).catch(() => {});
    } else if (currentSpent >= budget.amount_monthly * 0.8 && !budget.alert_80_sent) {
      budget.alert_80_sent = true;
      const remaining = Math.max(0, budget.amount_monthly - currentSpent);
      const alertMessage = `⚠️ *ALERT BUDGET MENDEKATI BATAS (${percentage}%)!*

Pengeluaranmu sudah mencapai ${percentage}% dari budget bulan ini!
├ Total Pengeluaran : ${formatRupiah(currentSpent)}
├ Batas Budget : ${formatRupiah(budget.amount_monthly)}
└ Sisa Budget : ${formatRupiah(remaining)}

💡 *Saran FinTech:* Berhati-hati dengan pengeluaran di sisa hari bulan ini agar tidak defisit! 🎯`;
      sendTelegramMessage(botToken, chatId, alertMessage).catch(() => {});
    }
  }

  deleteTransaction(id: string): boolean {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return false;

    const walletIdx = this.wallets.findIndex(w => w.id === tx.wallet_id && w.user_id === tx.user_id);
    if (walletIdx !== -1) {
      if (tx.type === 'expense') {
        this.wallets[walletIdx].balance += tx.amount;
      } else if (tx.type === 'income') {
        this.wallets[walletIdx].balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        this.wallets[walletIdx].balance += tx.amount;
        if (tx.destination_wallet_id) {
          const destIdx = this.wallets.findIndex(w => w.id === tx.destination_wallet_id && w.user_id === tx.user_id);
          if (destIdx !== -1) {
            this.wallets[destIdx].balance -= tx.amount;
          }
        }
      }
    }

    this.transactions = this.transactions.filter(t => t.id !== id);
    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // REMINDERS & AI & AUDIT LOGS
  // ============================================================================

  getReminders(): ReminderSetting { return this.reminders; }
  updateReminders(data: Partial<ReminderSetting>): ReminderSetting {
    this.reminders = { ...this.reminders, ...data };
    this.saveToStorage();
    return this.reminders;
  }

  getAIProviders(): AIProviderConfig[] { return this.aiProviders; }
  updateAIProvider(id: string, data: Partial<AIProviderConfig>): AIProviderConfig | null {
    const idx = this.aiProviders.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.aiProviders[idx] = { ...this.aiProviders[idx], ...data, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.aiProviders[idx];
  }

  getAISettings(): AISettings { return this.aiSettings; }
  updateAISettings(data: Partial<AISettings>): AISettings {
    this.aiSettings = { ...this.aiSettings, ...data, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.aiSettings;
  }

  getAILogs(): AILog[] { return this.aiLogs; }
  addAILog(log: Omit<AILog, 'id' | 'created_at'>): AILog {
    const newLog: AILog = {
      id: `log_${Date.now()}`,
      ...log,
      created_at: new Date().toISOString(),
    };
    this.aiLogs.unshift(newLog);
    return newLog;
  }

  getPayments(): PaymentTransaction[] { return this.payments; }
  approvePayment(orderId: string, adminId: string): boolean {
    try {
      this.verifyUserPayment(orderId, adminId);
      return true;
    } catch {
      return false;
    }
  }

  rejectPayment(orderId: string): boolean {
    const idx = this.payments.findIndex(p => p.order_id === orderId || p.id === orderId);
    if (idx === -1) return false;
    this.payments[idx].status = 'failed';
    this.saveToStorage();
    return true;
  }

  getExportHistory(userId?: string): ExportHistoryItem[] {
    const targetId = userId || this.getActiveUserId();
    return this.exportHistory.filter(e => e.user_id === targetId);
  }

  addExportHistory(item: Omit<ExportHistoryItem, 'id' | 'created_at'>): ExportHistoryItem {
    const newItem: ExportHistoryItem = {
      id: `exp_${Date.now()}`,
      ...item,
      created_at: new Date().toISOString(),
    };
    this.exportHistory.unshift(newItem);
    this.saveToStorage();
    return newItem;
  }

  isUpdateProcessed(updateId: number): boolean {
    return this.processedUpdates.has(updateId);
  }

  markUpdateProcessed(updateId: number) {
    this.processedUpdates.add(updateId);
  }

  getAuditLogs(): AuditLog[] { return this.auditLogs; }

  addAuditLog(action: string, targetUserId?: string, details?: any) {
    const activeProfile = this.getProfile();
    const log: AuditLog = {
      id: `aud_${Date.now()}`,
      admin_id: activeProfile.id,
      target_user_id: targetUserId,
      action,
      ip_address: '127.0.0.1',
      details,
      created_at: new Date().toISOString(),
      admin_email: activeProfile.email || 'andariftri7@gmail.com',
    };
    this.auditLogs.unshift(log);
    this.saveToStorage();
  }

  resetToDefault() {
    this.users = [...initialAuthUsers];
    this.activeUserId = 'usr_tatadana_demo_01';
    this.wallets = [...initialWallets];
    this.categories = [...initialCategories];
    this.budgets = [...initialBudgets];
    this.transactions = [...initialTransactions];
    this.reminders = { ...initialReminders };
    this.aiProviders = [...initialAIProviders];
    this.aiSettings = { ...initialAISettings };
    this.payments = [...initialPayments];
    this.auditLogs = [...initialAuditLogs];
    this.saveToStorage();
  }
}

// Global Singleton (persisted on globalThis to prevent split-brain across Fast Refresh in Next.js)
const globalForTataDana = globalThis as unknown as { tatadanaDb?: TataDanaDataStore };
export const tatadanaDb = globalForTataDana.tatadanaDb || new TataDanaDataStore();
if (process.env.NODE_ENV !== 'production') globalForTataDana.tatadanaDb = tatadanaDb;
