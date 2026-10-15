import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/otp/service';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email dan kode verifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    const result = OTPService.verifyEmailOTP(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      profile: result.profile,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;

    // After email verified, status moves to 'pending' (Menunggu Persetujuan Admin)
    response.cookies.set('ardana_account_status', 'pending', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Verifikasi gagal.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const code = req.nextUrl.searchParams.get('code');

    if (!email || !code) {
      return NextResponse.redirect(new URL('/verify-email', req.url));
    }

    const result = OTPService.verifyEmailOTP(email, code);
    if (result.success) {
      const isProd = process.env.NODE_ENV === 'production';
      const maxAge = 60 * 60 * 24 * 7;
      const redirectUrl = new URL('/waiting-approval', req.url);
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('ardana_account_status', 'pending', {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
      return res;
    } else {
      const redirectUrl = new URL(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(result.message)}`, req.url);
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    return NextResponse.redirect(new URL('/verify-email', req.url));
  }
}
