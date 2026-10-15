import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/otp/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: 'Nomor HP wajib diisi' }, { status: 400 });
    }

    const res = await OTPService.sendPhoneOTP(phoneNumber);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
