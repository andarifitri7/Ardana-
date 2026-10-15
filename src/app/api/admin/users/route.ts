import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function GET(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('ardana_admin_session')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;

    if (!adminSession || sessionRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya administrator yang dapat mengakses data ini.' },
        { status: 403 }
      );
    }

    const allRecords = tatadanaDb.getUserRecords();
    const payments = tatadanaDb.getPayments();

    const users = allRecords.map((u) => {
      const userPayment = payments.find((p) => p.user_id === u.id);
      const plan = u.profile.selected_plan_id
        ? tatadanaDb.getAccountPlan(u.profile.selected_plan_id)
        : tatadanaDb.getAccountPlans().find((p) => p.tier === u.profile.subscription_tier);

      const rawAccountStatus = u.account_status || u.profile.account_status || 'pending_payment';
      const phoneStatus =
        u.profile.phone_verification_status ||
        u.phone_verification_status ||
        (u.profile.phone_verified ? 'simulated_verified' : 'unverified');

      return {
        id: u.id,
        email: u.email,
        full_name: u.profile.full_name,
        role: u.role,
        phone_number: u.profile.phone_number || '-',
        phone_verification_status: phoneStatus,
        phone_verified: Boolean(u.profile.phone_verified),
        selected_plan_id: u.profile.selected_plan_id || (plan ? plan.id : null),
        plan_name: plan ? plan.name : (u.profile.subscription_tier === 'pro' ? 'Paket Pro' : 'Paket Starter'),
        plan_price: plan ? plan.price : (u.profile.subscription_tier === 'pro' ? 99000 : 49000),
        payment_order_id: userPayment ? userPayment.order_id : '-',
        payment_status: userPayment ? userPayment.status : 'unpaid',
        payment_proof_url: userPayment?.proof_image_url || null,
        payment_type: userPayment?.payment_type || '-',
        account_status: rawAccountStatus,
        admin_rejection_reason: u.admin_rejection_reason || u.profile.admin_rejection_reason || null,
        created_at: u.profile.created_at,
        approved_at: u.profile.approved_at || null,
        profile: {
          ...u.profile,
          phone_verification_status: phoneStatus,
          account_status: rawAccountStatus,
        },
      };
    });

    const pendingCount = users.filter(
      (u) => u.account_status === 'pending_admin_approval' || u.account_status === 'pending'
    ).length;

    const pendingPaymentCount = users.filter(
      (u) => u.account_status === 'pending_payment' || u.payment_status === 'pending_verification'
    ).length;

    return NextResponse.json({
      success: true,
      users,
      pendingCount,
      pendingPaymentCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat pengguna.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('ardana_admin_session')?.value;
    const sessionRole = req.cookies.get('ardana_session_role')?.value;

    if (!adminSession || sessionRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya administrator yang dapat melakukan aksi ini.' },
        { status: 403 }
      );
    }

    const { action, userId, orderId, reason } = await req.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action wajib disertakan.' },
        { status: 400 }
      );
    }

    const adminEmail = 'andariftri7@gmail.com';

    // 1. Verify Payment Action
    if (action === 'verify_payment') {
      const targetOrderId = orderId || tatadanaDb.getUserLatestPayment(userId)?.order_id;
      if (!targetOrderId) {
        return NextResponse.json(
          { success: false, message: 'Order ID atau Transaksi Pembayaran tidak ditemukan untuk pengguna ini.' },
          { status: 400 }
        );
      }

      const result = tatadanaDb.verifyUserPayment(targetOrderId, adminEmail);
      return NextResponse.json({
        success: true,
        message: `Pembayaran ${targetOrderId} berhasil diverifikasi! Akun pengguna kini masuk antrean persetujuan admin.`,
        payment: result.payment,
        profile: result.profile,
      });
    }

    // 2. Approve User Account Action
    if (action === 'approve') {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'User ID wajib disertakan.' },
          { status: 400 }
        );
      }

      const updated = tatadanaDb.approveUser(userId, adminEmail);
      return NextResponse.json({
        success: true,
        message: `Akun ${updated.full_name} (${updated.email}) berhasil disetujui! Pengguna kini dapat mengakses dashboard user.`,
        profile: updated,
        accountStatus: 'approved',
      });
    }

    // 3. Reject User Account Action
    if (action === 'reject') {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'User ID wajib disertakan.' },
          { status: 400 }
        );
      }

      const updated = tatadanaDb.rejectUser(userId, reason, adminEmail);
      return NextResponse.json({
        success: true,
        message: `Akun ${updated.full_name} telah ditolak.`,
        profile: updated,
        accountStatus: 'rejected',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action tidak dikenal. Gunakan verify_payment, approve, atau reject.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses aksi admin.' },
      { status: 400 }
    );
  }
}
