import { NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';

export async function POST() {
  tatadanaDb.clearClientSession();
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil.',
  });

  response.cookies.delete('ardana_user_id');
  response.cookies.delete('ardana_session_role');
  response.cookies.delete('ardana_admin_session');
  response.cookies.delete('ardana_account_status');
  response.cookies.delete('ardana_selected_plan');
  response.cookies.delete('ardana_payment_status');

  // Explicitly invalidate cookies with maxAge 0 across all browser scopes
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = { path: '/', maxAge: 0, secure: isProd, sameSite: 'lax' as const };
  response.cookies.set('ardana_user_id', '', cookieOptions);
  response.cookies.set('ardana_session_role', '', cookieOptions);
  response.cookies.set('ardana_admin_session', '', cookieOptions);
  response.cookies.set('ardana_account_status', '', cookieOptions);
  response.cookies.set('ardana_selected_plan', '', cookieOptions);
  response.cookies.set('ardana_payment_status', '', cookieOptions);

  return response;
}
