import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import bcrypt from 'bcrypt';
import { signToken } from '../../../lib/jwt';

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

    const payload = { id: user._id.toString(), email: user.email, role: user.role, name: user.name, tenantId: user.tenantId || null };
    const token = signToken(payload);
    // Return JWT and user info in response
    return res.json({ ok: true, token, user: payload });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
}
