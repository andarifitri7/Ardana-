import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminSession = request.cookies.get('ardana_admin_session')?.value;
  const sessionRole = request.cookies.get('ardana_session_role')?.value;
  const userId = request.cookies.get('ardana_user_id')?.value;
  const accountStatus = request.cookies.get('ardana_account_status')?.value;
  const selectedPlan = request.cookies.get('ardana_selected_plan')?.value;

  const isAdmin = Boolean(adminSession && sessionRole === 'admin');
  const isRegularUser = Boolean(userId && sessionRole === 'user');

  // 1. ADMIN API PROTECTION (/api/admin/:path*)
  if (pathname.startsWith('/api/admin')) {
    // Whitelist admin auth login
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses Ditolak: Anda tidak memiliki hak akses administrator untuk API ini.',
        },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 2. ADMIN PAGES PROTECTION (/admin/:path*)
  if (pathname.startsWith('/admin')) {
    // Admin login page
    if (pathname === '/admin/login') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      // Always allow accessing /admin/login so administrator can log in even if a user cookie exists
      return NextResponse.next();
    }

    if (!isAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3. USER ONBOARDING & AUTH PAGES PROTECTION
  const authRoutes = [
    '/login',
    '/register',
    '/select-plan',
    '/payment',
    '/waiting-approval',
    '/rejected',
    '/verify-email',
    '/verify-otp',
  ];
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    // If request explicitly wants to switch accounts or logout (?switch=1 or ?logout=1)
    if (request.nextUrl.searchParams.get('switch') === '1' || request.nextUrl.searchParams.get('logout') === '1') {
      const response = NextResponse.next();
      response.cookies.delete('ardana_user_id');
      response.cookies.delete('ardana_session_role');
      response.cookies.delete('ardana_account_status');
      response.cookies.delete('ardana_selected_plan');
      response.cookies.delete('ardana_payment_status');
      return response;
    }

    // Admin is strictly barred from all user authentication flows
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Unauthenticated user trying to access protected onboarding pages
    if (!isRegularUser && (pathname === '/select-plan' || pathname === '/payment' || pathname === '/waiting-approval' || pathname === '/rejected')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isRegularUser) {
      // Approved user accessing any auth/onboarding page -> send to user dashboard
      if (accountStatus === 'approved') {
        return NextResponse.redirect(new URL('/beranda', request.url));
      }

      // User pending payment (choosing plan or completing payment)
      if (accountStatus === 'pending_payment') {
        if (!selectedPlan) {
          if (pathname !== '/select-plan') {
            return NextResponse.redirect(new URL('/select-plan', request.url));
          }
          return NextResponse.next();
        } else {
          // If plan selected, user can stay on /payment or revisit /select-plan
          if (pathname !== '/select-plan' && pathname !== '/payment') {
            return NextResponse.redirect(new URL('/payment', request.url));
          }
          return NextResponse.next();
        }
      }

      // User waiting for admin approval after payment verified
      if (accountStatus === 'pending_admin_approval' || accountStatus === 'pending') {
        if (pathname !== '/waiting-approval') {
          return NextResponse.redirect(new URL('/waiting-approval', request.url));
        }
        return NextResponse.next();
      }

      // Rejected user
      if (accountStatus === 'rejected') {
        if (pathname !== '/rejected') {
          return NextResponse.redirect(new URL('/rejected', request.url));
        }
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  }

  // 4. USER DASHBOARD PROTECTION (/beranda, /transaksi, /laporan, /budget, /wallet, /settings)
  const userProtectedRoutes = ['/beranda', '/transaksi', '/laporan', '/budget', '/wallet', '/settings'];
  const isProtectedUserRoute = userProtectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedUserRoute) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (!isRegularUser) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Requirement 8: User cannot access main dashboard before admin approval
    if (accountStatus === 'pending_payment') {
      if (selectedPlan) {
        return NextResponse.redirect(new URL('/payment', request.url));
      }
      return NextResponse.redirect(new URL('/select-plan', request.url));
    }
    if (accountStatus === 'pending_admin_approval' || accountStatus === 'pending') {
      return NextResponse.redirect(new URL('/waiting-approval', request.url));
    }
    if (accountStatus === 'rejected') {
      return NextResponse.redirect(new URL('/rejected', request.url));
    }
    if (accountStatus !== 'approved') {
      return NextResponse.redirect(new URL('/select-plan', request.url));
    }
  }

  // 5. TRANSACTION & WALLET API PROTECTION
  if (pathname.startsWith('/api/wallets') || pathname.startsWith('/api/transactions')) {
    if (isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses Ditolak: Administrator tidak dapat melakukan transaksi keuangan pengguna.',
        },
        { status: 403 }
      );
    }

    if (!isRegularUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses Ditolak: Anda harus login sebagai pengguna terlebih dahulu.',
        },
        { status: 401 }
      );
    }

    if (accountStatus !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses Dibatasi: Akun kamu belum disetujui oleh admin untuk melakukan transaksi keuangan.',
          accountStatus,
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/wallets/:path*',
    '/api/transactions/:path*',
    '/beranda/:path*',
    '/transaksi/:path*',
    '/laporan/:path*',
    '/budget/:path*',
    '/wallet/:path*',
    '/settings/:path*',
    '/login',
    '/register',
    '/select-plan',
    '/payment',
    '/waiting-approval',
    '/rejected',
  ],
};
