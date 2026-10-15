import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { validateIndonesianPhone } from '@/lib/phone/service';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phoneNumber, phoneVerified } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // Email format validation (RFC-compliant standard regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid. Gunakan format contoh@domain.com.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter demi keamanan akun Anda.' },
        { status: 400 }
      );
    }

    // Validate phone number if provided (Requirement 2)
    let validatedPhone: string | undefined = undefined;
    if (phoneNumber) {
      const phoneValidation = validateIndonesianPhone(phoneNumber);
      if (!phoneValidation.isValid) {
        return NextResponse.json(
          { success: false, message: phoneValidation.error || 'Format nomor handphone tidak valid.' },
          { status: 400 }
        );
      }
      validatedPhone = phoneValidation.normalized;
    }

    // Register user with strict role 'user', 0 transactions, and status 'pending_payment'
    // Requirement 1: User does NOT need email OTP to complete registration.
    const { profile } = tatadanaDb.registerUser({
      email: cleanEmail,
      password,
      fullName: fullName.trim(),
      phoneNumber: validatedPhone,
      phoneVerified: Boolean(phoneVerified),
      phoneVerificationStatus: phoneVerified ? 'simulated_verified' : 'unverified',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil! Akun Anda telah dibuat. Silakan pilih paket akun.',
      profile,
      nextStep: '/select-plan',
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days

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

    response.cookies.set('ardana_account_status', 'pending_payment', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // Ensure no admin token or stale onboarding tokens exist for new users
    response.cookies.delete('ardana_admin_session');
    response.cookies.delete('ardana_selected_plan');
    response.cookies.delete('ardana_payment_status');

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Pendaftaran gagal.' },
      { status: 400 }
    );
  }
}
