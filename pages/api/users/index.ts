import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const query: any = {};
      // limit to tenant unless admin wants cross-tenant (admins limited to their tenant here)
      if (auth.tenantId) query.tenantId = auth.tenantId;
      const users = await db.collection('users').find(query, { projection: { passwordHash: 0 } }).toArray();
      const out = users.map(u => {
        const seed = (u.name && String(u.name).trim()) || u.email || String(u._id);
        const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
        return { id: u._id.toString(), email: u.email, role: u.role, name: u.name, tenantId: u.tenantId, profilePic: u.profilePic || defaultAvatar };
      });
      return res.json({ ok: true, users: out });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler, ['admin']);
