import { tatadanaDb } from '@/lib/store/mock-db';
import { PaymentTransaction, SubscriptionTier } from '@/types';

export interface CreatePaymentParams {
  userId: string;
  plan: SubscriptionTier;
  paymentType: 'midtrans_qris' | 'midtrans_va' | 'midtrans_gopay' | 'manual_transfer';
  proofImageUrl?: string;
}

export class MidtransClient {
  static getPlanPrice(plan: SubscriptionTier): number {
    return plan === 'pro' ? 99000 : 49000;
  }

  static async createPayment(params: CreatePaymentParams): Promise<PaymentTransaction> {
    const orderId = `ORD-TD-${Date.now().toString().slice(-6)}`;
    const amount = this.getPlanPrice(params.plan);

    const isManual = params.paymentType === 'manual_transfer';
    const status = isManual ? 'pending' : 'paid'; // Midtrans simulated instant payment or pending

    const payment: PaymentTransaction = {
      id: `pay_${Date.now()}`,
      user_id: params.userId,
      order_id: orderId,
      plan: params.plan,
      amount,
      payment_type: params.paymentType,
      status,
      proof_image_url: params.proofImageUrl,
      created_at: new Date().toISOString(),
    };

    tatadanaDb.getPayments().unshift(payment);

    // If instant simulated success, upgrade immediately
    if (status === 'paid') {
      tatadanaDb.updateProfile({
        subscription_tier: params.plan,
        subscription_status: 'active',
      });
    }

    return payment;
  }
}
