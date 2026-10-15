import { NextRequest, NextResponse } from 'next/server';
import { MidtransClient } from '@/lib/midtrans/client';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, paymentType = 'midtrans_qris', proofImageUrl } = body;

    const profile = tatadanaDb.getProfile();

    const payment = await MidtransClient.createPayment({
      userId: profile.id,
      plan: plan || 'pro',
      paymentType,
      proofImageUrl,
    });

    return NextResponse.json({
      success: true,
      payment,
      snapUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${payment.order_id}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
