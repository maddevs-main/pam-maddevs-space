import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const auth: any = (req as any).auth;
  try {
    const { db } = await connectToDatabase();
    const q: any = {};
    // If the admin has a tenant, prefer tenant-scoped documents but also
    // include legacy documents that have no tenantId (null or missing).
    if (auth && auth.tenantId) {
      q.$or = [
        { tenantId: auth.tenantId },
        { tenantId: null },
        { tenantId: { $exists: false } },
      ];
    }
    // Legacy collection is named `onboards` (plural) in the maddevs-og DB
    const meetings = await db.collection('onboards').find(q).sort({ createdAt: -1, created_at: -1 }).toArray();
    return res.json({ ok: true, meetings });
  } catch (err: any) {
    console.error('GET /api/admin/onboard/all', err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireAuth(handler, ['admin']);
