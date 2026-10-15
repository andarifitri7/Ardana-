import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const ok = tatadanaDb.rejectPayment(orderId);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    tatadanaDb.addAuditLog('reject_payment', undefined, { orderId });

    return NextResponse.json({ success: true, message: 'Pembayaran ditolak' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
