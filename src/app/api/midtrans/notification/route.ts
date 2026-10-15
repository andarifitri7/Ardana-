import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    const { order_id, transaction_status, fraud_status } = notification;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const payments = tatadanaDb.getPayments();
    const payment = payments.find(p => p.order_id === order_id);

    if (payment) {
      if (transaction_status === 'capture' || transaction_status === 'settlement') {
        if (fraud_status === 'accept' || !fraud_status) {
          payment.status = 'paid';
          // Upgrade user
          const profile = tatadanaDb.getProfile();
          if (profile.id === payment.user_id) {
            tatadanaDb.updateProfile({
              subscription_tier: payment.plan,
              subscription_status: 'active',
            });
          }
        }
      } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
        payment.status = 'rejected';
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
