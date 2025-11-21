import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { db } = await connectToDatabase();
    const query: any = { tenantId: auth.tenantId };
    const invites = await db.collection('invites').find(query).toArray();
    const out = invites.map(i => ({ code: i.code, role: i.role, tenantId: i.tenantId, used: !!i.used, expiresAt: i.expiresAt }));
    return res.json({ ok: true, invites: out });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireAuth(handler, ['admin']);
