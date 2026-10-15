import * as XLSX from 'xlsx';
import { Transaction, Profile } from '@/types';
import { formatRupiah, formatWIBDate } from '@/lib/utils';
import { ReportSummary } from './pdf-generator';

export function generateExcelReport(
  profile: Profile,
  transactions: Transaction[],
  summary: ReportSummary
): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // --- SHEET 1: RINGKASAN LAPORAN ---
  const summaryRows = [
    ['ARDANA - LAPORAN KEUANGAN PRIBADI'],
    ['ardana.id - FinTech SaaS Indonesia'],
    [],
    ['Nama Pengguna', profile.full_name],
    ['Nomor HP', profile.phone_number || '-'],
    ['Paket Langganan', profile.subscription_tier.toUpperCase()],
    ['Periode Laporan', summary.periodLabel],
    ['Waktu Generate', formatWIBDate(new Date())],
    [],
    ['RINGKASAN CASHFLOW', 'NOMINAL (IDR)'],
    ['Total Pemasukan', summary.totalIncome],
    ['Total Pengeluaran', summary.totalExpense],
    ['Net Cashflow (Surplus/Defisit)', summary.netCashflow],
    [],
    ['TOP 5 KATEGORI PENGELUARAN', 'TOTAL (IDR)', 'PERSENTASE (%)'],
    ...summary.topCategories.map(c => [c.name, c.amount, `${c.percentage}%`]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // --- SHEET 2: DAFTAR TRANSAKSI ---
  const txHeader = [
    'ID Transaksi',
    'Tanggal (WIB)',
    'Jenis',
    'Kategori',
    'Dompet',
    'Nominal (IDR)',
    'Keterangan / Catatan',
    'Sumber Pencatatan',
    'Rincian Item Struk',
  ];

  const txRows = transactions.map(tx => {
    let typeName = 'Pengeluaran';
    if (tx.type === 'income') typeName = 'Pemasukan';
    if (tx.type === 'transfer') typeName = 'Transfer Antar Dompet';

    let receiptSummary = '';
    if (tx.items && tx.items.length > 0) {
      receiptSummary = tx.items.map(i => `${i.name} (Rp ${i.price})`).join('; ');
    }

    return [
      tx.id,
      formatWIBDate(tx.transaction_date, true),
      typeName,
      tx.category?.name || 'Tanpa Kategori',
      tx.wallet?.name || 'Cash',
      tx.amount,
      tx.description,
      tx.source,
      receiptSummary,
    ];
  });

  const txSheet = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Data Transaksi');

  // --- SHEET 3: RINCIAN ITEM STRUK (Part 4.2 & Part 3) ---
  // Dipecah 1 baris per item dengan kategori dan jam transaksi sendiri
  const receiptItemsHeader = [
    'ID Transaksi Induk',
    'Tanggal & Jam (WIB)',
    'Merchant / Struk',
    'Nama Barang / Item',
    'Kategori Item',
    'Harga Item (IDR)',
    'Jumlah (Qty)',
    'Dompet Pembayaran',
  ];

  const receiptItemRows: any[] = [];
  transactions.forEach(tx => {
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach(item => {
        receiptItemRows.push([
          tx.id,
          formatWIBDate(tx.transaction_date, true),
          tx.description.replace(/^Struk di /i, ''),
          item.name,
          item.category || tx.category?.name || 'Belanja Kebutuhan',
          item.price,
          item.qty || 1,
          tx.wallet?.name || 'Cash',
        ]);
      });
    }
  });

  if (receiptItemRows.length > 0) {
    const itemsSheet = XLSX.utils.aoa_to_sheet([receiptItemsHeader, ...receiptItemRows]);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Rincian Item Struk');
  }

  // Generate binary Excel file
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}
