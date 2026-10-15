import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { generatePDFReport, ReportSummary } from '@/lib/reports/pdf-generator';
import { generateExcelReport } from '@/lib/reports/excel-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileIdOrName = params.id;
    const profile = tatadanaDb.getProfile();

    // Check Plan Restriction: Starter cannot download reports
    if (profile.subscription_tier === 'starter') {
      return NextResponse.json(
        { error: 'Fitur unduh laporan hanya tersedia untuk paket Pro.' },
        { status: 403 }
      );
    }

    const exportHistory = tatadanaDb.getExportHistory();
    const item = exportHistory.find(
      (h) => h.id === fileIdOrName || h.file_name === fileIdOrName || h.file_url.includes(fileIdOrName)
    );

    const isPdf = item ? item.file_type === 'pdf' : fileIdOrName.toLowerCase().endsWith('.pdf');
    const transactions = tatadanaDb.getTransactions();

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashflow = totalIncome - totalExpense;

    const catMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catName = t.category?.name || 'Lainnya';
        catMap.set(catName, (catMap.get(catName) || 0) + t.amount);
      });

    const topCategories = Array.from(catMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const periodLabel = item?.period_label || 'Semua Periode';
    const summary: ReportSummary = {
      periodLabel,
      totalIncome,
      totalExpense,
      netCashflow,
      topCategories,
    };

    if (isPdf) {
      const pdfBuffer = generatePDFReport(profile, transactions, summary);
      const fileName = item?.file_name || `Ardana_Laporan_${fileIdOrName}.pdf`;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } else {
      const excelBuffer = generateExcelReport(profile, transactions, summary);
      const fileName = item?.file_name || `Ardana_Laporan_${fileIdOrName}.xlsx`;

      return new NextResponse(excelBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }
  } catch (error: any) {
    console.error('Error downloading report:', error);
    return NextResponse.json({ error: error.message || 'File tidak ditemukan' }, { status: 404 });
  }
}
