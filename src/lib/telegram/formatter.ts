import { formatRupiah, formatWIBDate, generateProgressBar } from '@/lib/utils';
import { Transaction, Wallet, Category, Budget, Profile } from '@/types';

export class TelegramFormatter {
  /**
   * Format bot reply for Expense (Part 4.4)
   */
  static formatExpenseReply(options: {
    transaction: Transaction;
    wallet: Wallet;
    category?: Category;
    budget?: Budget;
    currentCategorySpent?: number;
    transcript?: string;
  }): string {
    const { transaction, wallet, category, budget, currentCategorySpent = 0, transcript } = options;
    const dateStr = formatWIBDate(transaction.transaction_date, true);
    const catEmoji = category?.emoji || '🏷️';
    const catName = category?.name || 'Lainnya';

    let message = '';
    if (transcript) {
      message += `🎙️ Transkrip: "${transcript}"\n\n`;
    }

    message += `📅 ${dateStr}\n`;
    message += `💸 Pengeluaran tercatat!\n`;
    message += `├ Nominal : ${formatRupiah(transaction.amount)}\n`;
    message += `├ Kategori : ${catEmoji} ${catName}\n`;
    message += `├ Dompet : 👛 ${wallet.name}\n`;
    message += `├ Catatan : ${transaction.description}\n`;
    message += `└ Saldo : ${formatRupiah(wallet.balance)}\n\n`;

    // Budget section
    if (budget && budget.amount_monthly > 0) {
      const percentage = Math.min(100, Math.round((currentCategorySpent / budget.amount_monthly) * 100));
      const sisa = Math.max(0, budget.amount_monthly - currentCategorySpent);
      const progressBar = generateProgressBar(percentage);

      message += `📊 Budget ${catName} bulan ini:\n`;
      message += `${progressBar} ${percentage}% — sisa ${formatRupiah(sisa)}\n`;

      if (percentage >= 100) {
        message += `🚨 Perhatian: Budget kategori ini sudah habis terpakai!`;
      } else if (percentage >= 80) {
        message += `⚠️ Peringatan: Pengeluaran sudah mendekati batas budget (≥80%)! Kendalikan belanja ya.`;
      } else {
        message += `👍 Keuangan terkontrol dengan baik, pertahankan!`;
      }
    } else {
      message += `💡 Tips: Kamu belum mengatur budget untuk kategori ini. Buka menu Budget di dashboard Ardana!`;
    }

    return message;
  }

  /**
   * Format bot reply for Income (Part 4.5)
   */
  static formatIncomeReply(options: {
    transaction: Transaction;
    wallet: Wallet;
    category?: Category;
    transcript?: string;
  }): string {
    const { transaction, wallet, category, transcript } = options;
    const dateStr = formatWIBDate(transaction.transaction_date, true);
    const catName = category?.name || '💼 Pemasukan';

    let message = '';
    if (transcript) {
      message += `🎙️ Transkrip: "${transcript}"\n\n`;
    }

    message += `📅 ${dateStr}\n`;
    message += `💰 Pemasukan tercatat!\n`;
    message += `├ Nominal : ${formatRupiah(transaction.amount)}\n`;
    message += `├ Kategori : ${catName}\n`;
    message += `├ Dompet : 👛 ${wallet.name}\n`;
    message += `└ Saldo baru : ${formatRupiah(wallet.balance)}\n\n`;
    message += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

    return message;
  }

  /**
   * Format bot reply for Transfer
   */
  static formatTransferReply(options: {
    transaction: Transaction;
    sourceWallet: Wallet;
    destWallet?: Wallet;
    transcript?: string;
  }): string {
    const { transaction, sourceWallet, destWallet, transcript } = options;
    const dateStr = formatWIBDate(transaction.transaction_date, true);

    let message = '';
    if (transcript) {
      message += `🎙️ Transkrip: "${transcript}"\n\n`;
    }

    message += `📅 ${dateStr}\n`;
    message += `🔄 Transfer berhasil dicatat!\n`;
    message += `├ Nominal : ${formatRupiah(transaction.amount)}\n`;
    message += `├ Dari : 👛 ${sourceWallet.name} (Sisa: ${formatRupiah(sourceWallet.balance)})\n`;
    if (destWallet) {
      message += `└ Ke : 👛 ${destWallet.name} (Saldo: ${formatRupiah(destWallet.balance)})\n`;
    } else {
      message += `└ Catatan : ${transaction.description}\n`;
    }
    return message;
  }

  /**
   * Format Pro Receipt OCR reply
   */
  static formatReceiptReply(options: {
    transaction: Transaction;
    wallet: Wallet;
    merchant: string;
    itemsCount: number;
  }): string {
    const { transaction, wallet, merchant, itemsCount } = options;
    const dateStr = formatWIBDate(transaction.transaction_date, true);

    let message = `📅 ${dateStr}\n`;
    message += `🧾 Struk Berhasil Dipindai!\n`;
    message += `├ Merchant : 🏪 ${merchant}\n`;
    message += `├ Total : ${formatRupiah(transaction.amount)}\n`;
    message += `├ Rincian : ${itemsCount} item struk tersimpan rapi\n`;
    message += `├ Dompet : 👛 ${wallet.name}\n`;
    message += `└ Saldo : ${formatRupiah(wallet.balance)}\n\n`;
    message += `✨ Detail item struk bisa dilihat kapan saja di menu Laporan Ardana.`;
    return message;
  }

  /**
   * Format /saldo command
   */
  static formatSaldoList(wallets: Wallet[]): string {
    let message = `👛 Saldo Dompet Ardana:\n\n`;
    let total = 0;
    wallets.forEach(w => {
      total += w.balance;
      const isDef = w.is_default ? ' (Utama)' : '';
      message += `• ${w.name}${isDef} : ${formatRupiah(w.balance)}\n`;
    });
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💵 Total Keseluruhan : ${formatRupiah(total)}`;
    return message;
  }

  /**
   * Format /hari ini command
   */
  static formatTodaySummary(transactions: Transaction[]): string {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(t => new Date(t.transaction_date).toDateString() === today);

    const income = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    let message = `📊 Rekap Transaksi Hari Ini (${formatWIBDate(new Date(), false)}):\n\n`;
    message += `💰 Pemasukan : ${formatRupiah(income)}\n`;
    message += `💸 Pengeluaran : ${formatRupiah(expense)}\n`;
    message += `📉 Net Hari Ini : ${formatRupiah(income - expense)}\n\n`;
    message += `Daftar transaksi hari ini (${todayTx.length}):\n`;

    if (todayTx.length === 0) {
      message += `_Belum ada transaksi hari ini._`;
    } else {
      todayTx.slice(0, 8).forEach(t => {
        const symbol = t.type === 'income' ? '🟢 +' : '🔴 -';
        message += `${symbol} ${formatRupiah(t.amount)} (${t.description})\n`;
      });
      if (todayTx.length > 8) {
        message += `...dan ${todayTx.length - 8} transaksi lainnya.`;
      }
    }
    return message;
  }

  /**
   * Format /minggu ini atau /mingguan command
   */
  static formatWeeklySummary(transactions: Transaction[]): string {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTx = transactions.filter(t => new Date(t.transaction_date).getTime() >= sevenDaysAgo.getTime());
    const inc = weekTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = weekTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    let message = `📊 Rekap Mingguan (7 Hari Terakhir):\n\n`;
    message += `💰 Total Pemasukan : ${formatRupiah(inc)}\n`;
    message += `💸 Total Pengeluaran : ${formatRupiah(exp)}\n`;
    message += `📈 Net Cashflow : ${inc >= exp ? '+' : ''}${formatRupiah(inc - exp)}\n`;
    message += `Total Transaksi : ${weekTx.length} kali\n\n`;

    const catMap = new Map<string, number>();
    weekTx.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || 'Lainnya';
      catMap.set(name, (catMap.get(name) || 0) + t.amount);
    });
    const topCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topCats.length > 0) {
      message += `🏷️ Top Pengeluaran Mingguan:\n`;
      topCats.forEach(([cat, amt]) => {
        message += `• ${cat} : ${formatRupiah(amt)}\n`;
      });
    }
    return message;
  }

  /**
   * Format /bulan ini atau /bulanan command
   */
  static formatMonthlySummary(transactions: Transaction[]): string {
    const now = new Date();
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const inc = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, number>();
    monthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.category?.name || 'Lainnya';
        catMap.set(name, (catMap.get(name) || 0) + t.amount);
      });

    const catBreakdown = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amt]) => `• ${name} : ${formatRupiah(amt)}`)
      .join('\n');

    let message = `🗓️ Rekap Bulanan (${formatWIBDate(now, false)}):\n\n`;
    message += `💰 Total Pemasukan : ${formatRupiah(inc)}\n`;
    message += `💸 Total Pengeluaran : ${formatRupiah(exp)}\n`;
    message += `📊 Arus Kas Net : ${inc >= exp ? '+' : ''}${formatRupiah(inc - exp)}\n`;
    message += `Total Transaksi : ${monthTx.length} kali\n\n`;
    message += `🏷️ Top Kategori:\n${catBreakdown || 'Belum ada pengeluaran'}\n\n`;
    message += `Semua data tersimpan rapi di database Ardana.`;
    return message;
  }

  /**
   * Format /tahun ini atau /tahunan command
   */
  static formatYearlySummary(transactions: Transaction[]): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearTx = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getFullYear() === currentYear;
    });

    const inc = yearTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = yearTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, number>();
    yearTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.category?.name || 'Lainnya';
        catMap.set(name, (catMap.get(name) || 0) + t.amount);
      });

    const catBreakdown = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amt]) => `• ${name} : ${formatRupiah(amt)}`)
      .join('\n');

    let message = `🌟 Rekap Tahunan (Tahun ${currentYear}):\n\n`;
    message += `💰 Total Pemasukan Tahun Ini : ${formatRupiah(inc)}\n`;
    message += `💸 Total Pengeluaran Tahun Ini : ${formatRupiah(exp)}\n`;
    message += `📈 Net Saldo Akumulatif : ${inc >= exp ? '+' : ''}${formatRupiah(inc - exp)}\n`;
    message += `Total Transaksi Tercatat : ${yearTx.length} kali\n\n`;
    message += `🏷️ Top Kategori Pengeluaran Tahun Ini:\n${catBreakdown || 'Belum ada pengeluaran'}\n\n`;
    message += `Lihat grafik perkembangan bulanan di dashboard Ardana!`;
    return message;
  }

  /**
   * Format /budget command
   */
  static formatBudgetStatus(budgetsWithSpent: (Budget & { category?: Category; spent: number })[]): string {
    let message = `🎯 Status Budget Bulan Ini:\n\n`;
    if (budgetsWithSpent.length === 0) {
      return message + `Belum ada budget yang diatur. Silakan atur budget di web dashboard Ardana!`;
    }

    budgetsWithSpent.forEach(b => {
      const catName = b.category?.name || 'Kategori';
      const pct = Math.min(100, Math.round((b.spent / b.amount_monthly) * 100));
      const sisa = Math.max(0, b.amount_monthly - b.spent);
      const bar = generateProgressBar(pct, 8);
      message += `• ${catName}\n  ${bar} ${pct}% | Sisa: ${formatRupiah(sisa)}\n`;
    });
    return message;
  }

  /**
   * Format /bantuan command
   */
  static formatHelp(): string {
    return `🤖 Panduan Penggunaan Bot Ardana:

1️⃣ Mencatat via Teks:
• "beli bakso 15rb"
• "gajian 5jt"
• "isi bensin 50k"
• "bayar listrik 250.000"

2️⃣ Mencatat via Voice Note:
• Kirim pesan suara (maks 60 dtk) menyebutkan pengeluaran/pemasukan.

3️⃣ Mencatat via Foto Struk (Paket Pro):
• Foto dan kirim struk belanjaanmu.

📌 Daftar Command:
/saldo - Cek saldo semua dompet
/hari ini - Rekap transaksi hari ini
/minggu ini - Rekap 7 hari terakhir
/bulan ini - Rekap bulan berjalan
/budget - Cek progress budget
/sheet atau /laporan - Buka laporan web Ardana
/bantuan - Tampilkan panduan ini

Ada pertanyaan? Kunjungi https://ardana.id`;
  }

  /**
   * Format AI Financial Advisor message (Part 4.7)
   */
  static formatFinancialAdvisor(profile: Profile, analysis: string, suggestion: string): string {
    return `🤖 Financial Advisor
Hei ${profile.full_name}! ${analysis}
💡 Saran: ${suggestion}`;
  }

  /**
   * Daily Reminder format (Part 4.8)
   */
  static formatDailyReminder(): string {
    return `⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`;
  }

  /**
   * Quota reached message (Part 4.9)
   */
  static formatQuotaExceeded(): string {
    return `⚠️ Kuota Transaksi Bulanan Tercapai!
Paket Starter dibatasi maksimal 50 transaksi per bulan.
Upgrade ke paket Pro untuk transaksi unlimited, scan foto struk OCR, & AI Advisor!

🚀 Upgrade sekarang di: https://ardana.id`;
  }

  /**
   * Upgrade required for receipt OCR
   */
  static formatProUpgradeRequired(): string {
    return [
      '🌟 Fitur Foto Struk Khusus Paket Pro!',
      'Fitur pemindaian foto struk dengan AI Vision hanya tersedia bagi pengguna Pro.',
      '',
      'Dengan Pro kamu bisa:',
      '✅ Scan struk belanja otomatis',
      '✅ Rincian item per baris',
      '✅ AI Financial Advisor aktif',
      '✅ Export Laporan ke PDF & Excel',
      '',
      '🚀 Upgrade sekarang di web Ardana Settings.',
    ].join('\n');
  }

  /**
   * Saving places menu (Requirement 4)
   */
  static formatSavingPlacesMenu(): string {
    return [
      '🏛️ *PANDUAN TEMPAT MENYIMPAN UANG — ARDANA FINTECH*',
      'Menyimpan uang di tempat yang tepat sangat krusial agar keuanganmu optimal antara keamanan, likuiditas, dan imbal hasil.',
      '',
      'Silakan pilih metode atau instrumen berikut untuk mempelajari rincian lengkapnya:',
      '',
      '1. 🏦 *Rekening Tabungan Bank* — Likuiditas instan, transaksi harian, dijamin LPS.',
      '2. 📱 *E-Wallet (Dompet Digital)* — Praktis untuk belanja & QRIS mikro, bukan simpanan LPS.',
      '3. 📑 *Deposito Berjangka* — Bunga lebih tinggi, dana terkunci jangka waktu, dijamin LPS.',
      '4. 📈 *Reksa Dana Pasar Uang (RDPU)* — Instrumen investasi pasar modal, potensi hasil lebih tinggi, bebas pajak.',
      '5. 🪙 *Logam Mulia / Kas Fisik* — Aset lindung nilai inflasi jangka panjang.',
      '',
      'Ketik nama opsi (misal: "tabungan bank", "deposito", "rdpu", "e-wallet") atau gunakan tombol pilihan interaktif di bawah!',
    ].join('\n');
  }

  /**
   * Detailed breakdown for chosen saving place (Requirement 4)
   */
  static formatSavingPlaceDetail(place: any): string {
    const kelebihanStr = (place.kelebihan || []).map((k: string) => `- ${k}`).join('\n');
    const risikoStr = (place.risiko || []).map((r: string) => `- ${r}`).join('\n');
    const tipsStr = (place.halDiperhatikan || []).map((t: string) => `- ${t}`).join('\n');
    const eduNote = place.isInvestment
      ? '⚠️ Opsi ini merupakan *instrumen investasi pasar modal*, bukan simpanan bank konvensional.'
      : 'ℹ️ Opsi ini merupakan *tempat penyimpanan dana / simpanan likuid*.';

    return [
      `${place.emoji} *${(place.name || '').toUpperCase()}* [${place.badge}]`,
      `_${place.shortDesc}_`,
      '',
      '🎯 *Fungsi Utama:*',
      place.fungsi,
      '',
      '✅ *Kelebihan:*',
      kelebihanStr,
      '',
      '⚠️ *Risiko & Hal yang Perlu Diperhatikan:*',
      risikoStr,
      '',
      '💧 *Tingkat Likuiditas:*',
      place.likuiditas,
      '',
      '🛡️ *Status Penjaminan Lembaga:*',
      place.lpsGuarantee,
      '',
      '📌 *Tips Ardana FinTech:*',
      tipsStr,
      '',
      'ℹ️ *Catatan Edukasi FinTech:*',
      eduNote,
      'Memilih opsi ini adalah langkah edukasi perencanaan keuangan dan *TIDAK* memindahkan atau mendebit saldo uang riil Anda.',
    ].join('\n');
  }
}

