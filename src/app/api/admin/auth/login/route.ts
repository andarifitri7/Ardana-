import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password admin wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRec = tatadanaDb.getUserByEmail(cleanEmail);

    if (!userRec) {
      return NextResponse.json(
        { success: false, message: 'Akun administrator tidak ditemukan.' },
        { status: 401 }
      );
    }

    // Role check: non-admin accounts cannot log in through admin portal
    if (userRec.role !== 'admin' && !userRec.profile.is_superadmin) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Akun ini tidak memiliki hak administrator.' },
        { status: 403 }
      );
    }

    // Server-side authentication and role check from database
    const adminProfile = tatadanaDb.authenticateAdmin(cleanEmail, password);

    // Set secure admin session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Verifikasi admin berhasil. Mengalihkan ke dashboard admin...',
      profile: adminProfile,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24; // 24 hours

    // 1. Admin session token (verified by middleware & server layouts)
    response.cookies.set('ardana_admin_session', `adm_tok_${adminProfile.id}_${Date.now()}`, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // 2. Role cookie
    response.cookies.set('ardana_session_role', 'admin', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // Requirement 1: Clear user session cookies to prevent role crosstalk
    response.cookies.delete('ardana_user_id');
    response.cookies.delete('ardana_account_status');

    return response;
  } catch (err: any) {
    const status = err.message?.includes('Akses ditolak') ? 403 : 401;
    return NextResponse.json(
      { success: false, message: err.message || 'Autentikasi admin gagal.' },
      { status }
    );
  }
}
