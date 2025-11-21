import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, signToken } from './jwt';

const COOKIE_NAME = 'pam_token';

export function setLoginCookie(res: NextApiResponse, token: string, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${COOKIE_NAME}=${token}`, `HttpOnly`, `Path=/`, `Max-Age=${maxAge}`, `SameSite=Lax`];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearLoginCookie(res: NextApiResponse) {
  const parts = [`${COOKIE_NAME}=`, `HttpOnly`, `Path=/`, `Max-Age=0`, `SameSite=Lax`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function getTokenFromReq(req: NextApiRequest) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  const parts = cookie.split(';').map(c => c.trim());
  for (const p of parts) {
    if (p.startsWith(COOKIE_NAME + '=')) {
      return p.split('=')[1];
    }
  }
  return null;
}

export function getUserFromRequest(req: NextApiRequest) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload;
}

export function requireAuth(handler: any, roles?: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const payload = getUserFromRequest(req);
    if (!payload) return res.status(401).json({ error: 'unauthenticated' });
    if (roles && roles.length > 0 && !roles.includes(payload.role)) return res.status(403).json({ error: 'forbidden' });
    (req as any).auth = payload;
    return handler(req, res);
  };
}

export default { setLoginCookie, clearLoginCookie, getUserFromRequest, requireAuth };
