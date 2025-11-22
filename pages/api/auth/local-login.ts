import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import bcrypt from 'bcrypt';
import { signToken } from '../../../lib/jwt';
import { setLoginCookie } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

  try {
    const { db } = await connectToDatabase();
    console.log('[local-login] attempt for', email);
    const user = await db.collection('users').findOne({ email });
    console.log('[local-login] user found:', !!user, user?.email, user?.role);
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    console.log('[local-login] password ok:', ok);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const payload = { userId: user._id.toString(), role: user.role, tenantId: user.tenantId || null };
    const token = signToken(payload);
    setLoginCookie(res, token);
    console.log('[local-login] token issued length:', token?.length || 0, 'for', email, 'role:', user.role);
    console.log('[local-login] req.host=', req.headers.host, 'origin=', req.headers.origin, 'accept=', req.headers.accept, 'cookie=', req.headers.cookie);

    // NOTE: legacy endpoint. The application now uses NextAuth for authentication.
    // For compatibility we will return a deprecation response instructing clients to use NextAuth.
    const accept = (req.headers.accept || '').toString();
    if (accept.includes('text/html')) {
      // Redirect browser clients to the NextAuth sign-in page.
      res.writeHead(302, { Location: '/api/auth/signin' });
      return res.end();
    }
    return res.status(410).json({ error: 'deprecated', message: 'Use NextAuth signIn (client: signIn from next-auth/react or POST to /api/auth/callback/credentials).' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
}
