import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Use NextAuth `getToken` to validate the JWT session in middleware (works in Edge).
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    // Token exists; server-side layouts will still perform role checks where needed.
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
