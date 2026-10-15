import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const currentProfile = tatadanaDb.getProfile();
    const ok = tatadanaDb.approvePayment(orderId, currentProfile.id);

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    tatadanaDb.addAuditLog('approve_payment', undefined, { orderId });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi sah! Akun pengguna kini beralih ke antrean persetujuan admin.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
