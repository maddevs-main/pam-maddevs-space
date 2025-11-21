import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

// Legacy cookie helpers are retained for compatibility but new auth uses NextAuth.
export function setLoginCookie(res: NextApiResponse, token: string, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production';
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const parts = [`pam_token=${token}`, `HttpOnly`, `Path=/`, `Max-Age=${maxAge}`, `Expires=${expires}`, `SameSite=Lax`];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearLoginCookie(res: NextApiResponse) {
  const expires = new Date(0).toUTCString();
  const parts = [`pam_token=`, `HttpOnly`, `Path=/`, `Max-Age=0`, `Expires=${expires}`, `SameSite=Lax`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

async function resolveTokenFromReq(req: any) {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    const token = await getToken({ req, secret });
    return token || null;
  } catch (e) {
    return null;
  }
}

// Synchronous accessor for route handlers that are wrapped by `requireAuth`.
// If `requireAuth` ran before the handler, it will attach `req.auth` which
// this function will return synchronously. Otherwise this returns null and
// callers should either use `getUserFromRequestAsync` or rely on the wrapper.
export function getUserFromRequest(req: any) {
  return (req as any).auth || null;
}

// Async helper for places where we only have a raw request (e.g. websocket upgrade)
export async function getUserFromRequestAsync(req: any) {
  const t = await resolveTokenFromReq(req);
  if (!t) return null;
  // Normalize token fields commonly used in the app (userId, role, tenantId)
  return { userId: (t as any).userId || (t as any).sub || null, role: (t as any).role || null, tenantId: (t as any).tenantId || null };
}

export function requireAuth(handler: any, roles?: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const t = await resolveTokenFromReq(req as any);
    if (!t) return res.status(401).json({ error: 'unauthenticated' });
    const payload = { userId: (t as any).userId || (t as any).sub || null, role: (t as any).role || null, tenantId: (t as any).tenantId || null };
    if (roles && roles.length > 0 && !roles.includes(payload.role)) return res.status(403).json({ error: 'forbidden' });
    (req as any).auth = payload;
    return handler(req, res);
  };
}

export default { setLoginCookie, clearLoginCookie, getUserFromRequest, requireAuth, getUserFromRequestAsync };
