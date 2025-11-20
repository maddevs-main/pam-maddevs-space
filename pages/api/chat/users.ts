import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';

// Returns list of users for admin (with profilePic), or for non-admin returns the admin contact
export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { db } = await connectToDatabase();
    if (auth.role === 'admin') {
      const query: any = {};
      if (auth.tenantId) query.tenantId = auth.tenantId;
      const users = await db.collection('users').find(query, { projection: { passwordHash: 0 } }).toArray();
      const out = users.map(u => {
        const seed = (u.name && String(u.name).trim()) || u.email || String(u._id);
        const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
        return { id: u._id.toString(), name: u.name || '', email: u.email, role: u.role, profilePic: u.profilePic || defaultAvatar };
      });
      return res.json({ ok: true, users: out });
    }

    // non-admins: return a single admin contact (their tenant admin) — simple implementation: find any admin in tenant
    const admin = await db.collection('users').findOne({ tenantId: auth.tenantId, role: 'admin' }, { projection: { passwordHash: 0 } });
    if (!admin) return res.status(404).json({ error: 'no_admin' });
    const seed = (admin.name && String(admin.name).trim()) || admin.email || String(admin._id);
    const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
    return res.json({ ok: true, users: [{ id: admin._id.toString(), name: admin.name || '', email: admin.email, role: 'admin', profilePic: admin.profilePic || defaultAvatar }] });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}, ['admin','staff','consumer']);
