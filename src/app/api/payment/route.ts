import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { PaymentType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi pengguna aktif.' },
        { status: 401 }
      );
    }

    const user = tatadanaDb.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const planId = user.profile.selected_plan_id || 'plan_pro';
    const plan = tatadanaDb.getAccountPlan(planId);
    const payment = tatadanaDb.getUserLatestPayment(userId);

    const response = NextResponse.json({
      success: true,
      profile: user.profile,
      plan,
      payment: payment || null,
      accountStatus: user.profile.account_status,
      paymentStatus: payment ? payment.status : 'unpaid',
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;

    response.cookies.set('ardana_account_status', user.profile.account_status || 'pending_payment', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    if (user.profile.selected_plan_id) {
      response.cookies.set('ardana_selected_plan', user.profile.selected_plan_id, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    if (payment) {
      response.cookies.set('ardana_payment_status', payment.status, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat status pembayaran.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const body = await req.json();
    const targetUserId = userId || body.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Sesi pengguna tidak valid. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const user = tatadanaDb.getUserById(targetUserId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const planId = body.planId || user.profile.selected_plan_id;
    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'Anda belum memilih paket akun. Silakan pilih paket terlebih dahulu.' },
        { status: 400 }
      );
    }

    const plan = tatadanaDb.getAccountPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Paket akun tidak valid.' },
        { status: 404 }
      );
    }

    const paymentType: PaymentType = body.paymentType || 'manual_transfer';
    const proofImageUrl: string | undefined = body.proofImageUrl?.trim();

    // Prevent re-processing if user's payment is already paid
    const existingPayment = tatadanaDb.getUserLatestPayment(targetUserId);
    if (existingPayment && existingPayment.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Pembayaran akun Anda telah terverifikasi sebelumnya.',
        payment: existingPayment,
      });
    }

    // Server-side payment creation/update enforcing exact database price
    const payment = tatadanaDb.createOrUpdatePayment({
      userId: targetUserId,
      planId: plan.id,
      paymentType,
      proofImageUrl,
    });

    const response = NextResponse.json({
      success: true,
      message: proofImageUrl
        ? 'Bukti pembayaran berhasil diunggah! Status pembayaran kini Menunggu Verifikasi Admin.'
        : 'Instruksi pembayaran berhasil dibuat.',
      payment,
      accountStatus: user.profile.account_status,
      paymentStatus: payment.status,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;

    response.cookies.set('ardana_account_status', user.profile.account_status || 'pending_payment', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('ardana_selected_plan', plan.id, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('ardana_payment_status', payment.status, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses pembayaran.' },
      { status: 400 }
    );
  }
}
