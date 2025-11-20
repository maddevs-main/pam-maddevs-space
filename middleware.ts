import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to enforce admin routes access. It calls /api/auth/me to validate session and role.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Protect specific role-scoped routes server-side
  // admin routes -> require admin
  // staff routes -> require staff
  // consumer meetings route -> require consumer
  const origin = req.nextUrl.origin;
  const protectedAdmin = pathname.startsWith('/admin');
  const protectedStaff = pathname.startsWith('/staff');
  const protectedConsumerMeetings = pathname === '/dashboard/meetings' || pathname.startsWith('/dashboard/meetings/');

  if (!protectedAdmin && !protectedStaff && !protectedConsumerMeetings) return NextResponse.next();

  try {
    const meRes = await fetch(origin + '/api/auth/me', { headers: { cookie: req.headers.get('cookie') || '' } });
    if (!meRes.ok) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    const data = await meRes.json();
    const role = data?.user?.role;

    if (protectedAdmin) {
      if (role !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (protectedStaff) {
      if (role !== 'staff') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (protectedConsumerMeetings) {
      if (role !== 'consumer') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/dashboard/meetings', '/dashboard/meetings/:path*'],
};
