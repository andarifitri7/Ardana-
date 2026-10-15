import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/otp/service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await OTPService.sendEmailOTP(cleanEmail);

    if (result.rateLimited) {
      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          retryAfterSeconds: result.retryAfterSeconds,
          message: result.message,
        },
        { status: 429 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          configured: result.configured,
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Requirement 6: NEVER return the OTP code in API response!
    return NextResponse.json({
      success: true,
      message: result.message,
      emailDelivery: result.emailDelivery,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mengirim ulang kode.' },
      { status: 400 }
    );
  }
}
