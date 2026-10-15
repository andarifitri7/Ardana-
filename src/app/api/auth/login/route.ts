import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRec = tatadanaDb.getUserByEmail(cleanEmail);

    if (!userRec) {
      return NextResponse.json(
        { success: false, message: 'Akun dengan email ini tidak ditemukan.' },
        { status: 401 }
      );
    }

    // Requirement 1: Admin account cannot log in via user login page
    if (userRec.role === 'admin' || userRec.profile.is_superadmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun administrator hanya dapat masuk melalui portal login admin (/admin/login).',
        },
        { status: 403 }
      );
    }

    const profile = tatadanaDb.authenticateUser(cleanEmail, password);

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    const rawStatus = profile.account_status || 'pending_payment';
    const accountStatus = rawStatus;

    const response = NextResponse.json({
      success: true,
      message: 'Autentikasi kredensial berhasil.',
      profile,
      accountStatus,
    });

    response.cookies.set('ardana_user_id', profile.id, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('ardana_session_role', 'user', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('ardana_account_status', accountStatus, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    if (profile.selected_plan_id) {
      response.cookies.set('ardana_selected_plan', profile.selected_plan_id, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    const latestPay = tatadanaDb.getUserLatestPayment(profile.id);
    if (latestPay) {
      response.cookies.set('ardana_payment_status', latestPay.status, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    // Ensure admin session cookie is deleted when logging in as regular user
    response.cookies.delete('ardana_admin_session');

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Login gagal.' },
      { status: 401 }
    );
  }
}
