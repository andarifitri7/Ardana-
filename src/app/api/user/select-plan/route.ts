import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('ardana_user_id')?.value;
    const body = await req.json();
    const planId = body.planId;

    const targetUserId = userId || body.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Sesi pengguna tidak valid. Silakan login kembali.' },
        { status: 401 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'ID Paket akun wajib disertakan.' },
        { status: 400 }
      );
    }

    const plan = tatadanaDb.getAccountPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Paket akun yang dipilih tidak ditemukan dalam sistem.' },
        { status: 404 }
      );
    }

    // Save chosen plan ID to database
    const updatedProfile = tatadanaDb.setUserSelectedPlan(targetUserId, plan.id);

    const response = NextResponse.json({
      success: true,
      message: `Paket ${plan.name} berhasil dipilih.`,
      profile: updatedProfile,
      plan,
      nextStep: '/payment',
    });

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7;

    response.cookies.set('ardana_selected_plan', plan.id, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set('ardana_account_status', updatedProfile.account_status || 'pending_payment', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menyimpan pilihan paket akun.' },
      { status: 400 }
    );
  }
}
