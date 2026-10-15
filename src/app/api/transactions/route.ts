import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;
    const accountStatus = req.cookies.get('ardana_account_status')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif.' },
        { status: 401 }
      );
    }

    if (accountStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Akses Dibatasi: Akun Anda belum disetujui oleh admin.' },
        { status: 403 }
      );
    }

    const transactions = tatadanaDb.getTransactions(userId);
    const wallets = tatadanaDb.getWallets(userId);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = wallets
      .filter(w => !w.is_archived && w.is_active !== false)
      .reduce((sum, w) => sum + w.balance, 0);

    return NextResponse.json({
      success: true,
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        totalBalance,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat transaksi.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;
    const accountStatus = req.cookies.get('ardana_account_status')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif.' },
        { status: 401 }
      );
    }

    if (accountStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Akses Dibatasi: Akun Anda belum disetujui oleh admin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, amount, wallet_id, category_id, description, source, items, receipt_image_url } = body;

    if (!type || !amount || !description) {
      return NextResponse.json(
        { success: false, message: 'Tipe, nominal, dan keterangan transaksi wajib diisi.' },
        { status: 400 }
      );
    }

    const newTx = tatadanaDb.addTransaction(
      {
        type,
        amount: Number(amount),
        wallet_id,
        category_id,
        description: description.trim(),
        source: source || 'web',
        items,
        receipt_image_url,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil disimpan.',
      transaction: newTx,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menyimpan transaksi.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif.' },
        { status: 401 }
      );
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID transaksi wajib disertakan.' },
        { status: 400 }
      );
    }

    const success = tatadanaDb.deleteTransaction(id);
    return NextResponse.json({
      success,
      message: success ? 'Transaksi berhasil dihapus.' : 'Transaksi tidak ditemukan.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menghapus transaksi.' },
      { status: 400 }
    );
  }
}
