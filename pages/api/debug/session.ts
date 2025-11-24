import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { verifyToken } from '../../../lib/jwt';

// Debug endpoint to inspect auth cookies and resolved tokens.
// Enabled only when DEBUG_AUTH=true or in development.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const enabled = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV === 'development';
  if (!enabled) return res.status(403).json({ error: 'disabled' });

  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    const token = await getToken({ req, secret });

    // Extract pam_token from cookie header if present
    const cookieHeader = req.headers.cookie || '';
    const pamMatch = String(cookieHeader).match(/(^|; )pam_token=([^;]+)/);
    const pamRaw = pamMatch ? decodeURIComponent(pamMatch[2]) : null;
    const pamVerified = pamRaw ? verifyToken(pamRaw) : null;

    // Build a safe response without exposing secret material
    return res.json({
      ok: true,
      env: { NODE_ENV: process.env.NODE_ENV },
      cookies: cookieHeader,
      nextAuthToken: token || null,
      pam: { raw: pamRaw ? '[present]' : null, verified: pamVerified || null },
    });
  } catch (err: any) {
    console.error('[debug/session] error', err);
    return res.status(500).json({ error: 'server_error', detail: String(err && err.message) });
  }
}
