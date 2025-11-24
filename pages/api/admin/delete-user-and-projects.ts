import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (req.method !== 'POST') return res.status(405).end();
  if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'missing_userId' });

  const { db } = await connectToDatabase();
  try {
    // Delete projects authored by user
    const projRes = await db.collection('projects').deleteMany({ 'author.id': String(userId), tenantId: auth.tenantId });
    // Delete user
    const userRes = await db.collection('users').deleteOne({ _id: new ObjectId(String(userId)), tenantId: auth.tenantId });
    return res.json({ ok: true, projectsDeleted: projRes.deletedCount || 0, userDeleted: userRes.deletedCount || 0 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireJwtAuth(handler, ['admin']);
