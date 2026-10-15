# TataDana — FinTech Personal Finance SaaS Indonesia 🇮🇩

> **Catat keuangan semudah chat — langsung dari Telegram kamu**

TataDana adalah aplikasi manajemen keuangan pribadi modern yang terintegrasi secara *native* dengan Telegram Bot dan Supabase Postgres. Pengguna dapat mencatat pemasukan dan pengeluaran cukup dengan mengirim pesan teks santai (misal: `"beli bakso 15rb"`, `"gajian 5jt"`), pesan suara (Voice Note), atau foto struk belanja yang langsung diproses oleh AI Vision OCR.

---

## 🏗️ Tech Stack & Arsitektur

- **Framework**: [Next.js 14/15 App Router](https://nextjs.org/) (TypeScript, React 18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan tema Fintech Orange-Putih Modern & geometric font (Plus Jakarta Sans)
- **Database & Auth**: [Supabase](https://supabase.com/) (Postgres dengan Row Level Security & Functions Trigger)
- **Migrations SQL**: `supabase/migrations/001_initial_schema.sql`
- **Telegram Bot**: Native Webhook (`/api/telegram/webhook`) dengan **Idempotency Protection** (`update_id`) dan format respons WIB (Asia/Jakarta)
- **AI Multi-Provider Engine**: Google Gemini (1.5 Flash sebagai primary vision OCR + audio STT + text parsing) dengan failover arsitektur ke OpenAI GPT-4o Mini & DeepSeek V3
- **Payment Gateway**: Midtrans (QRIS, VA BCA/Mandiri/BRI, GoPay) + Opsi approval transfer manual dari Superadmin Dashboard
- **Export Generator**: jsPDF + jspdf-autotable (PDF) dan SheetJS xlsx (Excel)

---

## 📁 Struktur Direktori

```
tatadana/
├── .env.example                  # Template kredensial lingkungan
├── .env.local                    # Konfigurasi dev lokal
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # DDL Postgres, RLS, Trigger, & Seed awal
├── public/
│   └── logo.svg                  # Brand asset TataDana
├── src/
│   ├── app/
│   │   ├── (auth)/               # Halaman Login, Register, & Verify OTP
│   │   ├── (dashboard)/          # Halaman Beranda, Transaksi, Laporan, Budget, Wallet, Settings
│   │   ├── admin/                # Portal Superadmin (AI Providers, Users, Payments, Audit Logs)
│   │   ├── api/
│   │   │   ├── telegram/         # Webhook, Test Connection getMe/setWebhook, & Simulator
│   │   │   ├── reports/          # Generator on-demand Export PDF & Excel
│   │   │   ├── midtrans/         # Pembayaran Midtrans Snap & webhook notification
│   │   │   └── otp/              # Service pengiriman & verifikasi OTP nomor HP
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing Page 15 section Part 7
│   ├── components/
│   │   ├── dashboard/            # Modals (Transaksi, Transfer, Simulator Telegram)
│   │   └── ui/                   # Button, Card, Badge, Modal, ProgressBar, Input, Skeleton
│   ├── lib/
│   │   ├── ai/                   # Multi-provider AI, Gemini Flash, & NLP parser bahasa Indonesia
│   │   ├── telegram/             # BotHandler, Client, & Formatter reply 4.4 & 4.5
│   │   ├── reports/              # Generator PDF & Excel
│   │   ├── midtrans/             # Klien transaksi Midtrans
│   │   ├── store/                # Mock DB & sync store lokal untuk offline/instant dev
│   │   ├── supabase/             # Browser, Server, & Admin Client
│   │   └── utils.ts              # Format Rupiah, WIB Date, Progress Bar ASCII
│   └── types/
│       └── index.ts              # Domain interfaces & TypeScript definitions
```

---

## 🚀 Panduan Memulai (Quickstart)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel utama:
- `TELEGRAM_BOT_TOKEN`: Token bot dari `@BotFather`
- `GEMINI_API_KEY`: API Key Google AI Studio
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Kredensial project Supabase
- `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY`: Kredensial sandbox Midtrans
- `WEBHOOK_BASE_URL`: URL publik backend (misal: `https://tatadana.id`)

### 3. Eksekusi Migrasi Database Supabase
Jalankan file SQL di Dashboard SQL Editor Supabase atau CLI:
```bash
supabase db push
# Atau eksekusi file supabase/migrations/001_initial_schema.sql
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

---

## ⚡ Fitur Utama & Pengujian

1. **Telegram Webhook & Test Runner**:
   - Di dashboard user, buka menu **Settings → Tab Telegram Bot**.
   - Masukkan token dan klik **"Test Koneksi"** (memanggil `getMe` dan mendaftarkan URL webhook).
   - Gunakan tombol **"Tes Bot Telegram"** untuk menguji pengiriman chat `"beli bakso 15rb"`, `"gajian 5jt"`, pesan suara, atau foto struk langsung di browser tanpa perlu HP.
2. **Format Balasan Bot**:
   - Pengeluaran: Format emoji lengkap, dompet default, saldo baru, serta visual progress bar budget (`██████░░░░ 62% — sisa Rp...`).
   - Pemasukan: Format nominal, kategori, dompet, saldo baru, dan motivasi menabung.
3. **Multi-Wallet**:
   - Kelola dompet Cash, BCA, Mandiri, GoPay, dan lakukan transfer instan antar dompet.
4. **Laporan & Export**:
   - Halaman `📊 Laporan` menyediakan filter per rentang tanggal, kategori, dan dompet.
   - Tombol **Export PDF** dan **Export Excel (.xlsx)** menghasilkan file laporan terstruktur.
5. **Superadmin Portal**:
   - Akses di `/admin`.
   - Kelola provider AI (Single vs Paralel Failover mode).
   - Approval bukti pembayaran manual Midtrans.
   - Audit security log setiap kali admin menginspeksi data transaksi pengguna.
