import { NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function GET() {
  try {
    const plans = tatadanaDb.getAccountPlans().filter(p => p.is_active);
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat paket akun.' },
      { status: 500 }
    );
  }
}
