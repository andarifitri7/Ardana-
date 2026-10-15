export type SubscriptionTier = 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'investment' | 'other';
export type PaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';
export type PaymentType = 'midtrans_qris' | 'midtrans_va' | 'midtrans_gopay' | 'manual_transfer';
export type AccountStatus =
  | 'pending_payment'
  | 'pending_admin_approval'
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'pending_email_verification';

export type PhoneVerificationStatus = 'unverified' | 'simulated_verified' | 'verified';

export interface AccountPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  duration: string;
  billing_period: 'monthly' | 'yearly';
  description: string;
  features: string[];
  is_popular?: boolean;
  is_active: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  phone_verified: boolean;
  phone_verification_status?: PhoneVerificationStatus;
  email_verified?: boolean;
  account_status?: AccountStatus;
  selected_plan_id?: string | null;
  email_verification_code?: string | null;
  admin_rejection_reason?: string | null;
  approved_at?: string | null;
  telegram_user_id?: number | null;
  telegram_username?: string | null;
  telegram_bot_token?: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  monthly_tx_count: number;
  default_currency: string;
  currency?: string;
  is_superadmin: boolean;
  role?: 'admin' | 'user';
  saving_preference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAuthRecord {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  email_verified: boolean;
  account_status: AccountStatus;
  phone_verification_status?: PhoneVerificationStatus;
  selected_plan_id?: string | null;
  phone_simulated_code?: string | null;
  phone_simulated_expires_at?: number | null;
  email_verification_code?: string | null;
  email_verification_code_hash?: string | null;
  email_verification_expires_at?: number | null;
  email_verification_last_sent_at?: number | null;
  admin_rejection_reason?: string | null;
  profile: Profile;
}

export type SavingPlaceId = 'rekening_bank' | 'ewallet' | 'deposito' | 'rdpu' | 'tempat_lainnya';

export interface SavingPlaceInfo {
  id: SavingPlaceId;
  name: string;
  badge: string;
  emoji: string;
  categoryType: 'simpanan' | 'investasi' | 'transaksional' | 'aset_fisik';
  fungsi: string;
  kelebihan: string[];
  risiko: string[];
  likuiditas: string;
  halDiperhatikan: string[];
  lpsGuarantee: string;
  isInvestment: boolean;
  shortDesc: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  is_default: boolean;
  is_archived?: boolean;
  is_active?: boolean;
  currency?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  type: 'expense' | 'income';
  color: string;
  is_system?: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount_monthly: number;
  month: number;
  year: number;
  alert_80_sent?: boolean;
  alert_100_sent?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ReceiptItem {
  name: string;
  price: number;
  category?: string;
  qty?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  source: TransactionSource;
  items?: ReceiptItem[] | null;
  receipt_image_url?: string | null;
  audio_url?: string | null;
  voice_transcript?: string | null;
  destination_wallet_id?: string | null;
  created_at: string;
  updated_at?: string;
  wallet?: Wallet;
  destination_wallet?: Wallet;
  category?: Category;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      file_size: number;
      width: number;
      height: number;
    }>;
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    audio?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      file_size?: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
      date: number;
      text?: string;
    };
    data: string;
  };
}

export interface AIParsedTransaction {
  jenis: 'pengeluaran' | 'pemasukan' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  is_ambiguous?: boolean;
  error_reason?: string;
}

export interface AIParsedReceipt {
  merchant: string;
  date?: string;
  total: number;
  items: ReceiptItem[];
  notes?: string;
}

export interface AIProviderConfig {
  id: string;
  name: 'gemini' | 'openai' | 'deepseek';
  provider?: string;
  display_name: string;
  api_key_encrypted?: string;
  model_name: string;
  is_active: boolean;
  priority: number;
  supports_vision: boolean;
  supports_audio: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AISettings {
  id: number;
  mode: 'single' | 'parallel_failover';
  primary_provider: 'gemini' | 'openai' | 'deepseek';
  fallback_provider: 'gemini' | 'openai' | 'deepseek';
  updated_at: string;
}

export interface AILog {
  id: string;
  provider: string;
  model: string;
  task_type: 'text_parse' | 'receipt_vision' | 'voice_stt' | 'financial_advisor';
  tokens_used: number;
  latency_ms: number;
  status: 'success' | 'failed';
  error_message?: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string;
  plan: SubscriptionTier;
  plan_id?: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  proof_image_url?: string | null;
  midtrans_response?: any;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  user?: Profile;
}

export interface ExportHistoryItem {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'pdf' | 'xlsx';
  file_url: string;
  period_label: string;
  total_records: number;
  created_at: string;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_enabled: boolean;
  frequency: 1 | 2;
  time_1: string;
  time_2: string;
  last_sent_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string | null;
  target_user_id?: string | null;
  action: string;
  ip_address?: string | null;
  details?: any;
  created_at: string;
  admin_email?: string;
  target_user_name?: string;
}
