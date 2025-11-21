import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { code } = req.query;
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'missing_code' });

  try {
    const { db } = await connectToDatabase();
    if (req.method === 'DELETE') {
      // only admin can delete/revoke invites
      if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      const result = await db.collection('invites').deleteOne({ code, tenantId: auth.tenantId });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireJwtAuth(handler, ['admin']);
