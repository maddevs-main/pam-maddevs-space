import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const userId = new ObjectId(id as string);
  const { db } = await connectToDatabase();

  if (req.method === 'PATCH') {
    // admin-only
    if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const body = req.body || {};
    const allowed: any = {};
    if (body.role) allowed.role = body.role;
    if (typeof body.active !== 'undefined') allowed.active = !!body.active;
    if (body.name) allowed.name = body.name;
    if (Object.keys(allowed).length === 0) return res.status(400).json({ error: 'nothing_to_update' });
    allowed.updatedAt = new Date();
    await db.collection('users').updateOne({ _id: userId, tenantId: auth.tenantId }, { $set: allowed });
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    // admin-only: delete (or deactivate) user
    if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    await db.collection('users').deleteOne({ _id: userId, tenantId: auth.tenantId });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}

export default requireAuth(handler, ['admin']);
