import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif.' },
        { status: 401 }
      );
    }

    const user = tatadanaDb.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const rawStatus = user.account_status || user.profile.account_status || 'pending_payment';
    const accountStatus = rawStatus;

    const response = NextResponse.json({
      success: true,
      accountStatus,
      profile: user.profile,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;

    // Refresh cookies
    response.cookies.set('ardana_account_status', accountStatus, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    if (user.profile.selected_plan_id) {
      response.cookies.set('ardana_selected_plan', user.profile.selected_plan_id, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memeriksa status akun.' },
      { status: 500 }
    );
  }
}
