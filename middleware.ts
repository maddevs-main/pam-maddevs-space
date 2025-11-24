import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Middleware to enforce admin/staff/consumer routes access using JWT in Authorization header
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedAdmin = pathname.startsWith('/admin');
  const protectedStaff = pathname.startsWith('/staff');
  const protectedConsumerMeetings = pathname === '/dashboard/meetings' || pathname.startsWith('/dashboard/meetings/');

  if (!protectedAdmin && !protectedStaff && !protectedConsumerMeetings) return NextResponse.next();

  // Get JWT from Authorization header
  const authHeader = req.headers.get('authorization');
  let user: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    user = verifyToken(token);
    if (!user) {
      // If bearer token failed, allow NextAuth cookie to be respected
      const hasNextAuthCookie = Boolean(
        (req.cookies.get && req.cookies.get('__Secure-next-auth.session-token')) ||
        (req.cookies.get && req.cookies.get('next-auth.session-token')) ||
        (req.cookies.get && req.cookies.get('__Host-next-auth.session-token'))
      );
      if (hasNextAuthCookie) return NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  } else {
    // Try legacy cookie token first (pam_token)
    const cookieToken = req.cookies.get && req.cookies.get('pam_token') ? req.cookies.get('pam_token')!.value : null;
    if (cookieToken) {
      user = verifyToken(cookieToken);
      if (!user) {
        // If legacy cookie is invalid but a NextAuth cookie exists, allow it
        const hasNextAuthCookie = Boolean(
          (req.cookies.get && req.cookies.get('__Secure-next-auth.session-token')) ||
          (req.cookies.get && req.cookies.get('next-auth.session-token')) ||
          (req.cookies.get && req.cookies.get('__Host-next-auth.session-token'))
        );
        if (hasNextAuthCookie) return NextResponse.next();
        const url = req.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
      }
    } else {
      // If there's a NextAuth session cookie present, allow the request to continue
      // and let server-side/session checks handle auth. This avoids forcing an
      // Authorization header for normal cookie-based NextAuth sessions.
      const hasNextAuthCookie = Boolean(
        (req.cookies.get && req.cookies.get('__Secure-next-auth.session-token')) ||
        (req.cookies.get && req.cookies.get('next-auth.session-token')) ||
        (req.cookies.get && req.cookies.get('__Host-next-auth.session-token'))
      );
      if (hasNextAuthCookie) {
        return NextResponse.next();
      }

      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  // Role-based access enforcement
  if (protectedAdmin && user && user.role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  if (protectedStaff && user && user.role !== 'staff') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  if (protectedConsumerMeetings && user && user.role !== 'consumer') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Token and role are valid
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/dashboard/meetings', '/dashboard/meetings/:path*'],
};
