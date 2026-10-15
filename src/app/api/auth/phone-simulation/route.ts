import { NextRequest, NextResponse } from 'next/server';
import { PhoneSimulationService } from '@/lib/phone/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phoneNumber, code } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Nomor handphone wajib diisi.' },
        { status: 400 }
      );
    }

    if (action === 'request') {
      const result = PhoneSimulationService.requestSimulationCode(phoneNumber);
      return NextResponse.json({
        success: true,
        isSimulation: true,
        simulatedCode: result.simulatedCode,
        normalizedPhone: result.normalizedPhone,
        message: result.message,
        expiresInSeconds: result.expiresInSeconds,
      });
    }

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { success: false, message: 'Kode verifikasi simulasi wajib diisi.' },
          { status: 400 }
        );
      }
      const result = PhoneSimulationService.verifySimulationCode(phoneNumber, code);
      return NextResponse.json({
        success: true,
        normalizedPhone: result.normalizedPhone,
        status: result.status,
        message: result.message,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Aksi tidak valid. Gunakan action: "request" atau "verify".' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Terjadi kesalahan pada verifikasi simulasi nomor HP.' },
      { status: 400 }
    );
  }
}
