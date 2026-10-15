import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;
    const accountStatus = req.cookies.get('ardana_account_status')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    if (accountStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Akses Dibatasi: Akun Anda belum disetujui oleh admin.' },
        { status: 403 }
      );
    }

    const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true';

    const wallets = tatadanaDb.getWallets(userId, includeArchived);

    return NextResponse.json({
      success: true,
      wallets,
      totalBalance: wallets.filter(w => !w.is_archived && w.is_active !== false).reduce((s, w) => s + w.balance, 0),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat dompet.' },
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
        { success: false, message: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
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
    const { name, type, balance, color, icon, is_default, currency } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nama dompet wajib diisi.' },
        { status: 400 }
      );
    }

    const newWallet = tatadanaDb.addWallet(
      {
        name: name.trim(),
        type: type || 'cash',
        balance: Number(balance) || 0,
        color: color || '#812D46',
        icon: icon || 'Building2',
        is_default: Boolean(is_default),
        currency: currency || 'IDR',
      },
      userId
    );

    return NextResponse.json({
      success: true,
      message: `Dompet "${newWallet.name}" berhasil ditambahkan!`,
      wallet: newWallet,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menambahkan dompet.' },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;
    const accountStatus = req.cookies.get('ardana_account_status')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
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
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID dompet wajib disertakan.' },
        { status: 400 }
      );
    }

    if (action === 'archive') {
      const archived = tatadanaDb.archiveWallet(id, userId);
      return NextResponse.json({
        success: true,
        message: 'Dompet berhasil diarsipkan.',
        wallet: archived,
      });
    }

    if (action === 'unarchive') {
      const unarchived = tatadanaDb.unarchiveWallet(id, userId);
      return NextResponse.json({
        success: true,
        message: 'Dompet berhasil diaktifkan kembali.',
        wallet: unarchived,
      });
    }

    const updated = tatadanaDb.updateWallet(id, updates, userId);
    return NextResponse.json({
      success: true,
      message: 'Informasi dompet berhasil diperbarui.',
      wallet: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memperbarui dompet.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;
    const accountStatus = req.cookies.get('ardana_account_status')?.value;

    if (!userId || sessionRole !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    if (accountStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Akses Dibatasi: Akun Anda belum disetujui oleh admin.' },
        { status: 403 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID dompet wajib disertakan.' },
        { status: 400 }
      );
    }

    const success = tatadanaDb.deleteWallet(id, userId);
    return NextResponse.json({
      success,
      message: success ? 'Dompet berhasil dihapus atau diarsipkan.' : 'Gagal menghapus dompet.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menghapus dompet.' },
      { status: 400 }
    );
  }
}
