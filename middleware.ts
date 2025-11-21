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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const user = verifyToken(token);
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Role-based access enforcement
  if (protectedAdmin && user.role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  if (protectedStaff && user.role !== 'staff') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  if (protectedConsumerMeetings && user.role !== 'consumer') {
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
