import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { generatePDFReport, ReportSummary } from '@/lib/reports/pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = req.cookies.get('ardana_user_id')?.value;
    const profile = userId ? tatadanaDb.getProfile(userId) : (body.profile || tatadanaDb.getProfile());

    // Check Plan Restriction: Starter cannot export PDF/Excel
    if (profile.subscription_tier === 'starter') {
      return NextResponse.json(
        {
          error: 'Fitur Export Laporan PDF hanya tersedia untuk paket Pro.',
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    const { startDate, endDate, transactions: clientTransactions } = body;
    let transactions = Array.isArray(clientTransactions) && clientTransactions.length > 0
      ? clientTransactions
      : (userId ? tatadanaDb.getTransactions(userId) : tatadanaDb.getTransactions());

    if (startDate && endDate && (!clientTransactions || clientTransactions.length === 0)) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      transactions = transactions.filter((t: any) => {
        const d = new Date(t.transaction_date).getTime();
        return d >= start && d <= end;
      });
    }

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashflow = totalIncome - totalExpense;

    // Top categories
    const catMap = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
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

    const periodLabel = startDate && endDate
      ? `${startDate} s/d ${endDate}`
      : 'Semua Periode (Bulan Ini)';

    const summary: ReportSummary = {
      periodLabel,
      totalIncome,
      totalExpense,
      netCashflow,
      topCategories,
    };

    const pdfBuffer = generatePDFReport(profile, transactions, summary);
    const fileName = `Ardana_Laporan_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Save to export history
    tatadanaDb.addExportHistory({
      user_id: profile.id,
      file_name: fileName,
      file_type: 'pdf',
      file_url: `/api/reports/download/${fileName}`,
      period_label: periodLabel,
      total_records: transactions.length,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat file PDF' }, { status: 500 });
  }
}
