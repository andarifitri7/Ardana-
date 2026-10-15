import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Profile } from '@/types';
import { formatRupiah, formatWIBDate } from '@/lib/utils';

export interface ReportSummary {
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  topCategories: { name: string; amount: number; percentage: number }[];
}

export function generatePDFReport(
  profile: Profile,
  transactions: Transaction[],
  summary: ReportSummary
): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const brandBurgundy: [number, number, number] = [100, 30, 50]; // #641E32
  const brandMaroon: [number, number, number] = [129, 45, 70]; // #812D46
  const darkGray: [number, number, number] = [48, 39, 42]; // #30272A Dark Charcoal
  const lightGray: [number, number, number] = [130, 119, 123]; // #82777B Muted Gray

  // --- HEADER SECTION ---
  doc.setFillColor(brandBurgundy[0], brandBurgundy[1], brandBurgundy[2]);
  doc.rect(0, 0, 210, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ARDANA  |  Laporan Keuangan Pribadi', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ardana.id', 185, 12);

  // --- USER & PERIOD INFO ---
  let yPos = 28;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ringkasan Keuangan: ${profile.full_name}`, 14, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text(`Periode: ${summary.periodLabel}  •  Dicetak: ${formatWIBDate(new Date())}`, 14, yPos);

  // --- SUMMARY KPI BOXES ---
  yPos += 8;
  const boxWidth = 58;
  const boxHeight = 22;

  // Total Pemasukan Box
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(34, 197, 94); // green-500
  doc.roundedRect(14, yPos, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PEMASUKAN', 18, yPos + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(summary.totalIncome), 18, yPos + 16);

  // Total Pengeluaran Box
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(239, 68, 68); // red-500
  doc.roundedRect(76, yPos, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL PENGELUARAN', 80, yPos + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(summary.totalExpense), 80, yPos + 16);

  // Net Cashflow Box
  const isPositive = summary.netCashflow >= 0;
  doc.setFillColor(245, 232, 235); // #F5E8EB Soft Blush
  doc.setDrawColor(brandMaroon[0], brandMaroon[1], brandMaroon[2]);
  doc.roundedRect(138, yPos, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 30, 50);
  doc.text('NET CASHFLOW (SURPLUS)', 142, yPos + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${isPositive ? '+' : ''}${formatRupiah(summary.netCashflow)}`, 142, yPos + 16);

  // --- TRANSACTIONS TABLE ---
  yPos += 30;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Daftar Transaksi', 14, yPos);

  const tableRows = transactions.map((tx, idx) => {
    let typeLabel = 'Pengeluaran';
    if (tx.type === 'income') typeLabel = 'Pemasukan';
    if (tx.type === 'transfer') typeLabel = 'Transfer';

    let desc = tx.description;
    if (tx.items && tx.items.length > 0) {
      desc += `\n[${tx.items.length} item struk: ${tx.items.map(i => i.name).join(', ')}]`;
    }

    return [
      (idx + 1).toString(),
      formatWIBDate(tx.transaction_date, false),
      desc,
      tx.category?.name || '-',
      tx.wallet?.name || 'Cash',
      typeLabel,
      (tx.type === 'expense' ? '- ' : '+ ') + formatRupiah(tx.amount),
    ];
  });

  autoTable(doc, {
    startY: yPos + 4,
    head: [['No', 'Tanggal', 'Keterangan', 'Kategori', 'Dompet', 'Jenis', 'Nominal']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: brandMaroon,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkGray,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 60 },
      3: { cellWidth: 32 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20 },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber} • Ardana FinTech Indonesia • Rahasia & Pribadi`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(str, 14, 290);
    },
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
