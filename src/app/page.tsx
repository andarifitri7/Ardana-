'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Sparkles,
  Play,
  ArrowRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Shield,
  MessageSquare,
  Camera,
  Bot,
  Zap,
  ChevronDown,
  Star,
  Receipt,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatRupiah } from '@/lib/utils';
import { TelegramSimulatorModal } from '@/components/dashboard/TelegramSimulatorModal';
import { ArdanaLogo } from '@/components/ui/ArdanaLogo';

export default function LandingPage() {
  const [pricingCycle, setPricingCycle] = React.useState<'monthly' | 'lifetime'>('monthly');
  const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);
  const [openFaqIdx, setOpenFaqIdx] = React.useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const faqItems = [
    {
      q: 'Apakah bisa pakai foto struk di paket Starter?',
      a: 'Tidak. Fitur pemindaian foto struk dengan AI OCR berpresisi tinggi khusus disediakan untuk pengguna paket Pro. Pengguna Starter tetap dapat mencatat pengeluaran tanpa batas via pesan teks dan voice note.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di Ardana?',
      a: 'Keamanan adalah prioritas mutlak kami. 100% data keuangan tersimpan aman di database Supabase Postgres terenkripsi dengan proteksi Row Level Security (RLS). Token API dan kredensial bot Telegram Anda dienkripsi tingkat bank.',
    },
    {
      q: 'Apakah saya harus menginstall aplikasi baru di HP?',
      a: 'Sama sekali tidak! Anda cukup menggunakan aplikasi Telegram yang sudah terpasang di HP atau laptop Anda. Cukup kirim chat ke Bot Ardana, dan semua data langsung tersinkronisasi ke web dashboard kami.',
    },
    {
      q: 'Bagaimana cara bot mengenali bahasa santai seperti "15rb" atau "1.5jt"?',
      a: 'Ardana dilengkapi AI NLP FinTech modern multi-provider (Google Gemini Flash & OpenAI) yang dilatih khusus mengenali bahasa percakapan sehari-hari orang Indonesia, termasuk singkatan 15rb, 500k, 1.5jt, dan nama merchant lokal.',
    },
    {
      q: 'Apakah satu bot Telegram bisa dipakai bersama anggota keluarga?',
      a: 'Bisa! Anda bisa mengundang pasangan atau keluarga untuk mencatat ke akun dompet keluarga yang sama cukup dengan mendaftarkan nomor HP atau akun Telegram mereka di pengaturan.',
    },
    {
      q: 'Bagaimana cara kerja AI Financial Advisor?',
      a: 'AI Advisor bekerja proaktif menganalisis pola transaksi mingguan Anda. Jika pengeluaran kategori tertentu melonjak di atas 50% atau mendekati batas budget, bot akan memberikan insight dan saran penghematan personal di chat Telegram.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami menerima pembayaran instan via Midtrans (QRIS untuk semua bank & e-wallet seperti GoPay/OVO/Dana, BCA/Mandiri/BRI Virtual Account), serta opsi konfirmasi transfer manual dengan verifikasi tim admin kami.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Quick Access Bar for single localhost:3000 experience */}
      <div className="bg-slate-950 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Ardana FinTech Platform</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Pusat Navigasi Terpadu (Satu Alamat: localhost:3000)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-semibold text-xs">
            <Link href="/beranda" className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1">
              📊 Buka Dashboard
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/laporan" className="text-slate-300 hover:text-white transition-colors">
              📑 Laporan & Export
            </Link>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              ⚡ Bot Simulator
            </button>
            <span className="text-slate-700">|</span>
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
              🛡️ Superadmin
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================
          SECTION 1: NAVBAR (STICKY)
      ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#FFFCFA]/95 backdrop-blur-md border-b border-[#F3F1F2] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Ardana */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <ArdanaLogo size="md" />
          </Link>

          {/* Menu Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-brand-600 transition-colors">Fitur</a>
            <a href="#demo" className="hover:text-brand-600 transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-brand-600 transition-colors">Harga</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-brand-600 font-semibold text-xs border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" /> Test Bot
            </button>
            <Link href="/beranda">
              <Button size="sm" className="font-semibold shadow-sm bg-brand-500 hover:bg-brand-600">
                🚀 Buka Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          SECTION 2, 3, 4, 5, 6: HERO SECTION
      ============================================================ */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-rose-50/40 via-white to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Section 2: Pre-headline badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 text-brand-700 text-xs sm:text-sm font-semibold animate-fade-in shadow-sm">
            <span>✨ Catat keuangan langsung dari Telegram</span>
          </div>

          {/* Section 3: Headline H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Gaji habis sebelum akhir bulan?{' '}
            <span className="text-gradient-maroon block mt-1">
              Sudah saatnya kamu tahu ke mana uangmu pergi.
            </span>
          </h1>

          {/* Section 4: Sub-headline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Ardana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
          </p>

          {/* Section 6: CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/beranda" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-sm sm:text-base px-8 shadow-lg shadow-rose-900/20 bg-brand-500 hover:bg-brand-600">
                🚀 Buka Dashboard Sekarang <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 hover:border-rose-300 transition-colors text-sm sm:text-base shadow-sm"
            >
              <Bot className="w-4 h-4 text-brand-500" /> ⚡ Coba Bot Simulator
            </button>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full text-sm sm:text-base border-slate-300 hover:bg-slate-50">
                Daftar Akun Baru
              </Button>
            </Link>
          </div>

          {/* Section 5: Hero Section Video (Placeholder marked clearly) */}
          <div className="pt-8 max-w-4xl mx-auto">
            {/* // TODO: ganti dengan video asli presentasi produk setelah beta testing */}
            <div className="relative rounded-3xl border-2 border-slate-200/80 bg-slate-900 shadow-2xl overflow-hidden aspect-video group flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80"
                alt="Ardana Dashboard Demo Preview"
                className="w-full h-full object-cover opacity-30 group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col items-center justify-center p-6 text-white space-y-4">
                <button
                  onClick={() => setIsSimulatorOpen(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xl shadow-rose-900/30 hover:scale-110 active:scale-95 transition-all"
                  title="Putar Video Demo Ardana"
                >
                  <Play className="w-8 h-8 fill-white translate-x-0.5" />
                </button>
                <div className="text-center">
                  <span className="text-xs uppercase font-bold tracking-widest text-rose-400 block">
                    [PLACEHOLDER VIDEO DEMO PRODUK]
                  </span>
                  <span className="text-sm font-semibold text-slate-300 mt-1 block">
                    Klik untuk uji coba interaktif Simulator Bot Telegram langsung!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7 & 8: PROBLEM AWARE BULLET POINTS & SOLUSI
      ============================================================ */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="danger" className="text-xs">Fakta Keuangan Indonesia</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Kenapa Keuangan Sulit Terkontrol?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Rata-rata orang Indonesia bukan kekurangan penghasilan, melainkan kebocoran pengeluaran mikro yang tidak pernah dicatat.
            </p>
          </div>

          {/* Section 7: 3 Problem Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-red-100 bg-white space-y-3 p-6 shadow-sm">
              <span className="text-3xl">📱</span>
              <h3 className="font-bold text-slate-900 text-base">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi keuangan tradisional terlalu ribet: harus login, pilih dompet, pilih tanggal, cari kategori. Ujung-ujungnya malas mencatat dan aplikasi di-uninstall.
              </p>
            </Card>

            <Card className="border-red-100 bg-white space-y-3 p-6 shadow-sm">
              <span className="text-3xl">💸</span>
              <h3 className="font-bold text-slate-900 text-base">
                "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kopi kekinian 25rb, parkir 5rb, jajan minimarket 30rb. Tanpa disadari, pengeluaran kecil tak tercatat ini mengikis lebih dari 40% gaji bulanan Anda.
              </p>
            </Card>

            <Card className="border-red-100 bg-white space-y-3 p-6 shadow-sm">
              <span className="text-3xl">⏳</span>
              <h3 className="font-bold text-slate-900 text-base">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Budget yang dibuat di awal bulan hanya jadi angan-angan karena tidak ada alarm otomatis saat pengeluaran mulai kebablasan di tengah bulan.
              </p>
            </Card>
          </div>

          {/* Section 8: Solusi Transition */}
          <div className="mt-16 text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">
              TRANSISI SOLUSI
            </span>
            <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </h3>
            <p className="text-sm font-semibold text-brand-600">
              👉 Introducing Ardana: Asisten FinTech Pribadi di Telegram Kamu
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 9: INTERACTIVE DASHBOARD PREVIEW & TELEGRAM BOT PREVIEW
      ============================================================ */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="brand" className="text-xs">Uji Coba Interaktif</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Lihat Format Asli Balasan Bot Ardana
            </h2>
            <p className="text-sm text-slate-600">
              Setiap chat yang Anda kirim ke Telegram otomatis dibalas dengan struktur rapi dan progres budget visual.
            </p>
          </div>

          {/* Split Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Telegram Bot Phone Mockup */}
            <div className="rounded-3xl border-2 border-slate-200 bg-slate-100 p-4 shadow-xl max-w-md mx-auto w-full">
              <div className="bg-[#517da2] text-white p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
                  AD
                </div>
                <div>
                  <span className="font-bold text-sm block">Ardana Bot</span>
                  <span className="text-[11px] text-blue-100">bot terverifikasi • online</span>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="p-4 space-y-4 bg-[#efeae2] rounded-2xl my-3 max-h-[460px] overflow-y-auto font-sans text-xs sm:text-sm">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="tg-bubble-user p-3 max-w-[80%] font-medium">
                    beli bakso 15rb
                  </div>
                </div>

                {/* Bot Authentic Reply (Part 4.4 format) */}
                <div className="flex justify-start">
                  <div className="tg-bubble-bot p-3.5 max-w-[95%] whitespace-pre-wrap leading-relaxed">
{`📅 Selasa, 13 Oktober 2026 — 12:30 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp 15.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 Cash Dompet
├ Catatan : beli bakso 15rb
└ Saldo : Rp 735.000

📊 Budget Makanan bulan ini:
██████░░░░ 62% — sisa Rp 950.000
👍 Keuangan terkontrol dengan baik, pertahankan!`}
                  </div>
                </div>

                {/* Second User Message: Income */}
                <div className="flex justify-end">
                  <div className="tg-bubble-user p-3 max-w-[80%] font-medium">
                    gajian 5jt
                  </div>
                </div>

                {/* Bot Income Reply (Part 4.5 format) */}
                <div className="flex justify-start">
                  <div className="tg-bubble-bot p-3.5 max-w-[95%] whitespace-pre-wrap leading-relaxed">
{`📅 Selasa, 13 Oktober 2026 — 12:31 WIB
💰 Pemasukan tercatat!
├ Nominal : Rp 5.000.000
├ Kategori : 💼 Gaji Bulanan
├ Dompet : 👛 BCA Utama
└ Saldo baru : Rp 13.450.000

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setIsSimulatorOpen(true)}
                className="w-full text-xs font-semibold py-2.5"
              >
                Coba Ketik Sendiri di Simulator →
              </Button>
            </div>

            {/* Interactive Web Dashboard Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge variant="brand">Sinkronisasi Real-Time</Badge>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Data Langsung Masuk ke Dashboard Web Ardana
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tidak perlu rekap manual lagi. Setiap transaksi dari Telegram langsung ter-update di laporan, grafik kategori, dan status budget secara instan menggunakan Supabase Realtime.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Saldo Total</span>
                    <span className="text-lg font-extrabold text-slate-900">Rp 24.720.000</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sisa Budget</span>
                    <span className="text-lg font-extrabold text-brand-600">Rp 3.850.000</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span>🍜 Makanan & Minuman</span>
                    <span className="text-slate-600">62% terpakai</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>
              </div>

              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-md">
                  Daftar Sekarang & Hubungkan Bot
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 10: FITUR SECTION (3 ALTERNATING LAYOUTS)
      ============================================================ */}
      <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">
          {/* Feature 1: Catat via Telegram Teks & Foto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Catat Transaksi Cukup Lewat Chat Teks, VN, atau Foto Struk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cukup ketik natural seperti ngobrol: <em>"beli bensin 50rb"</em>, kirim pesan suara singkat saat berkendara, atau foto struk belanja supermarket Anda. AI Vision kami otomatis membedah tiap item dan harganya.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">✓ Parsing format lokal: 15rb, 1.5jt, 500k terdeteksi akurat</li>
                <li className="flex items-center gap-2">✓ Transkrip Voice Note otomatis via Speech-to-Text</li>
                <li className="flex items-center gap-2">✓ Multi-item OCR Struk (Paket Pro)</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1554415707-9e4466bfe03b?w=600&auto=format&fit=crop&q=80"
                alt="Foto Struk Belanja OCR"
                className="rounded-2xl object-cover h-64 w-full"
              />
            </div>
          </div>

          {/* Feature 2: Laporan & Export Otomatis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="order-2 lg:order-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="font-bold text-sm">Download Laporan Selesai</span>
                  <Badge variant="success">READY</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FileText className="w-6 h-6 text-rose-500" />
                  <div>
                    <span className="text-xs font-bold block">Ardana_Laporan_Oktober.pdf</span>
                    <span className="text-[10px] text-slate-400">Siap diunduh on-demand</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">Ardana_Laporan_Oktober.xlsx</span>
                    <span className="text-[10px] text-slate-400">Dilengkapi rincian struk per item</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Laporan & Export Otomatis di Dashboard Ardana
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tersimpan 100% di Supabase Postgres tanpa pihak ketiga. Lihat tabel transaksi lengkap dengan filter kategori, wallet, rentang tanggal, dan download laporan resmi berformat PDF & Excel (.xlsx) kapan pun Anda butuhkan.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">✓ Filter dan pencarian transaksi instan</li>
                <li className="flex items-center gap-2">✓ Export on-demand PDF & Excel</li>
                <li className="flex items-center gap-2">✓ Riwayat download tersimpan rapi</li>
              </ul>
            </div>
          </div>

          {/* Feature 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                AI Financial Advisor — Peringatan Cerdas Otomatis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukan sekadar buku catatan pasif. AI Ardana aktif mendeteksi lonjakan anomali belanja di atas 50%, pengeluaran boros lebih dari 20% budget, dan memberikan saran penghematan taktis langsung ke chat Telegram Anda.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">✓ Deteksi lonjakan belanja per kategori</li>
                <li className="flex items-center gap-2">✓ Rekomendasi actionable yang realistis</li>
                <li className="flex items-center gap-2">✓ Khusus pelanggan paket Pro</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-brand-700 font-bold text-xs">
                  <Bot className="w-4 h-4" /> AI Financial Advisor
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  "Hei Budi! Pengeluaran Makanan kamu naik 54% dibanding minggu lalu akibat makan di luar. Alokasi budget tersisa Rp 420.000 untuk 18 hari ke depan."
                </p>
                <div className="text-[11px] font-semibold text-brand-600 pt-1">
                  💡 Saran: Prioritaskan masak sendiri untuk makan malam agar budget tetap aman sampai gajian.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 11: TESTIMONI (MASONRY GRID PLACEHOLDER)
      ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="brand" className="text-xs">Cerita Pengguna</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Kata Mereka yang Sudah Memakai Ardana
            </h2>
            <p className="text-sm text-slate-500">
              // TODO: ganti dengan testimoni asli setelah fase beta user selesai
            </p>
          </div>

          {/* Masonry Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Sebelumnya selalu gagal pakai app keuangan karena ribet buka aplikasinya. Sekarang tinggal ketik di Telegram pas lagi di kasir. Bulan ini berhasil nabung 2 juta pertama!"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  DW
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900">Dimas Wahyudi</span>
                  <span className="text-[10px] text-slate-400">Software Engineer, Jakarta</span>
                </div>
              </div>
            </Card>

            <Card hoverEffect className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Fitur foto struk belanja supermarketnya gila sih. Struk 10 item langsung dirinci rapi dan saldo dompet berkurang otomatis. Worth it banget bayar Pro sekali bayar."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  SS
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900">Siti Sarah</span>
                  <span className="text-[10px] text-slate-400">Ibu Rumah Tangga & Freelancer</span>
                </div>
              </div>
            </Card>

            <Card hoverEffect className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Sebagai mahasiswa yang uang sakunya terbatas, alert budget 80% di Telegram benar-benar jadi penyelamat biar nggak kelaparan di tanggal tua."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  FA
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900">Fajar Aditya</span>
                  <span className="text-[10px] text-slate-400">Mahasiswa UI, Depok</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 12: PRICING (STARTER VS PRO)
      ============================================================ */}
      <section id="harga" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="brand" className="text-xs">Harga Transparan</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Pilih Paket Sesuai Kebutuhanmu
            </h2>
            <p className="text-sm text-slate-600">
              Mulai kendalikan keuanganmu hari ini. Tanpa biaya tersembunyi.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-semibold mt-4">
              <button
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  pricingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Starter Bulanan
              </button>
              <button
                onClick={() => setPricingCycle('lifetime')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  pricingCycle === 'lifetime' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Pro Sekali Bayar (Lifetime) ✨
              </button>
            </div>
          </div>

          {/* 2 Column Pricing Grid (Part 6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Plan Starter */}
            <Card className="flex flex-col justify-between space-y-6 p-8 border-slate-200 bg-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                  <Badge variant="slate">Langganan</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Cocok untuk pengguna pemula yang ingin mencatat keuangan via teks Telegram.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">Rp 49.000</span>
                  <span className="text-xs text-slate-400">/ bulan</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Catat transaksi via teks Telegram</li>
                  <li className="flex items-center gap-2">✓ Maksimal 50 transaksi / bulan</li>
                  <li className="flex items-center gap-2">✓ Maksimal 3 dompet, 5 kategori budget</li>
                  <li className="flex items-center gap-2">✓ Dashboard web lengkap</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada input via foto struk</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada AI Financial Advisor</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada export PDF & Excel</li>
                </ul>
              </div>

              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Pilih Starter
                </Button>
              </Link>
            </Card>

            {/* Plan Pro */}
            <Card className="flex flex-col justify-between space-y-6 p-8 border-2 border-brand-500 bg-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                PALING POPULER
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Pro Lifetime</h3>
                  <Badge variant="brand">SEKALI BAYAR</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Akses penuh selamanya tanpa biaya bulanan tambahan.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-600">Rp 99.000</span>
                  <span className="text-xs text-slate-400 font-semibold">sekali bayar selamanya</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Unlimited transaksi, wallet & kategori
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Input foto struk belanja dengan AI Vision OCR
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> AI Financial Advisor aktif proaktif
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Export unlimited laporan ke PDF & Excel (.xlsx)
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Reminder harian kustom (hingga 2x/hari)
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Prioritas customer support
                  </li>
                </ul>
              </div>

              <Link href="/register">
                <Button className="w-full shadow-lg shadow-rose-900/20">
                  Dapatkan Akses Pro Sekarang
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 13: FAQ (MINIMAL 7 PERTANYAAN RELEVAN)
      ============================================================ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="brand" className="text-xs">Tanya Jawab</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm text-slate-600">
              Segala hal yang perlu Anda ketahui tentang Ardana dan integrasi bot Telegram.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 hover:text-brand-600 transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 14: FINAL CTA (GRADIENT MAROON BACKGROUND)
      ============================================================ */}
      <section className="py-20 bg-gradient-brand text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <span className="p-2 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest inline-block">
            Mulai Bebas Finansial
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Mulai kendalikan keuanganmu hari ini.
          </h2>
          <p className="text-sm sm:text-base text-rose-100 max-w-xl mx-auto">
            Hanya butuh 2 menit untuk menghubungkan Telegram Bot dan mulai mencatat setiap rupiah yang keluar-masuk.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button size="lg" variant="white" className="shadow-xl">
                Daftar Ardana Sekarang →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 15: FOOTER (4 KOLOM)
      ============================================================ */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Kolom 1: Logo + Tagline + Sosmed */}
          <div className="space-y-4">
            <ArdanaLogo size="md" theme="dark" />
            <p className="text-slate-400 leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu. FinTech personal finance SaaS Indonesia.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-2">
              <span className="hover:text-white cursor-pointer">Telegram</span>
              <span className="hover:text-white cursor-pointer">Instagram</span>
              <span className="hover:text-white cursor-pointer">LinkedIn</span>
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Produk</span>
            <ul className="space-y-2">
              <li><a href="#fitur" className="hover:text-white">Bot Telegram FinTech</a></li>
              <li><a href="#fitur" className="hover:text-white">OCR Foto Struk AI</a></li>
              <li><a href="#demo" className="hover:text-white">Dashboard Laporan</a></li>
              <li><a href="#harga" className="hover:text-white">Paket Pro Lifetime</a></li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Perusahaan</span>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Tentang Ardana</a></li>
              <li><a href="#" className="hover:text-white">Karir</a></li>
              <li><a href="#" className="hover:text-white">Blog Keuangan</a></li>
              <li><a href="#" className="hover:text-white">Press Kit</a></li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Legal & Dukungan</span>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Kebijakan Privasi (/privacy)</a></li>
              <li><a href="#" className="hover:text-white">Syarat & Ketentuan (/terms)</a></li>
              <li><a href="#" className="hover:text-white">Keamanan Database Supabase</a></li>
              <li><span className="text-slate-500">Kontak: support@ardana.id</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-slate-900 text-center text-slate-500">
          <p>© 2026 Ardana Indonesia. Hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>

      {/* Simulator Modal Launcher */}
      <TelegramSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}


