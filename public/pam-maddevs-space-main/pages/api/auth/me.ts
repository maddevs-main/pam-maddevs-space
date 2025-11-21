import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const payload: any = getUserFromRequest(req as any);
  if (!payload) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) }, { projection: { passwordHash: 0 } });
    if (!user) return res.status(404).json({ error: 'not_found' });
    // normalize id
    const out = { id: user._id.toString(), email: user.email, role: user.role, name: user.name, tenantId: user.tenantId };
    return res.json({ ok: true, user: out });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
