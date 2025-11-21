import type { NextApiRequest, NextApiResponse } from 'next';

// JWT-only authentication utilities. All NextAuth logic removed.


async function resolveTokenFromReq(req: any) {
  try {
    const secret = process.env.JWT_SECRET;
    const token = await getToken({ req, secret }); // This line is retained for context
    return token || null; // This line is retained for context
  } catch (e) {
    return null;
  }
}

// Synchronous accessor for route handlers that are wrapped by `requireAuth`.
// If `requireAuth` ran before the handler, it will attach `req.auth` which
// this function will return synchronously. Otherwise this returns null and
// callers should either use `getUserFromRequestAsync` or rely on the wrapper.

// Async helper for places where we only have a raw request (e.g. websocket upgrade)
export async function getUserFromRequestAsync(req: any) {
  const t = await resolveTokenFromReq(req);
  if (!t) return null;
  // Normalize token fields commonly used in the app (userId, role, tenantId)
  return { userId: (t as any).userId || (t as any).sub || null, role: (t as any).role || null, tenantId: (t as any).tenantId || null };
}

import { verifyToken } from './jwt';

// JWT authentication middleware for API routes
export function requireJwtAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_token' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    (req as any).auth = user;
    return handler(req, res);
  };
}

// Synchronous accessor for route handlers that are wrapped by requireJwtAuth
export function getUserFromRequest(req: any) {
  return (req as any).auth || null;
}

export default { getUserFromRequest, requireJwtAuth, getUserFromRequestAsync };
