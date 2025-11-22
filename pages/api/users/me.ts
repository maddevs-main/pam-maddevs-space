import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (!auth) return res.status(401).json({ error: 'unauthenticated' });
  const userId = auth.userId;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { passwordHash: 0 } });
      if (!user) return res.status(404).json({ error: 'not_found' });
      // normalize id and provide a default avatar via Dicebear if profilePic missing
      const seed = (user.name && String(user.name).trim()) || user.email || String(user._id);
      const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
      const out = { id: user._id.toString(), email: user.email, name: user.name || '', organisation: user.organisation || '', bio: user.bio || '', profilePic: user.profilePic || defaultAvatar, role: user.role, tenantId: user.tenantId };
      return res.json({ ok: true, user: out });
    } catch (err: any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body || {};
      const updates: any = {};

      // allow updating of profile fields
      if (typeof body.name !== 'undefined') updates.name = body.name;
      if (typeof body.email !== 'undefined') updates.email = body.email;
      if (typeof body.organisation !== 'undefined') updates.organisation = body.organisation;
      if (typeof body.bio !== 'undefined') updates.bio = body.bio;
      if (typeof body.profilePic !== 'undefined') updates.profilePic = body.profilePic;

      // password change requires currentPassword and newPassword
      if (body.newPassword) {
        if (!body.currentPassword) return res.status(400).json({ error: 'missing_current_password' });
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).json({ error: 'not_found' });
        const ok = await bcrypt.compare(body.currentPassword, user.passwordHash || '');
        if (!ok) return res.status(403).json({ error: 'invalid_current_password' });
        const hash = await bcrypt.hash(body.newPassword, 10);
        updates.passwordHash = hash;
      }

      // check email uniqueness if provided
      if (updates.email) {
        const exists = await db.collection('users').findOne({ email: updates.email, _id: { $ne: new ObjectId(userId) } });
        if (exists) return res.status(400).json({ error: 'email_in_use' });
      }

      updates.updatedAt = new Date();
      await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: updates });

      const updated = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { passwordHash: 0 } });
      if (!updated) return res.status(500).json({ error: 'update_failed' });
      const seed2 = (updated.name && String(updated.name).trim()) || updated.email || String(updated._id);
      const defaultAvatar2 = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed2)}`;
      const out = { id: updated._id.toString(), email: updated.email, name: updated.name || '', organisation: updated.organisation || '', bio: updated.bio || '', profilePic: updated.profilePic || defaultAvatar2, role: updated.role, tenantId: updated.tenantId };
      return res.json({ ok: true, user: out });
    } catch (err: any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  return res.status(405).end();
}

export default requireJwtAuth(handler);
