import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout admin berhasil.',
  });

  response.cookies.delete('ardana_admin_session');
  response.cookies.delete('ardana_session_role');
  response.cookies.delete('ardana_user_id');
  response.cookies.delete('ardana_account_status');

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = { path: '/', maxAge: 0, secure: isProd, sameSite: 'lax' as const };
  response.cookies.set('ardana_admin_session', '', cookieOptions);
  response.cookies.set('ardana_session_role', '', cookieOptions);
  response.cookies.set('ardana_user_id', '', cookieOptions);
  response.cookies.set('ardana_account_status', '', cookieOptions);

  return response;
}
