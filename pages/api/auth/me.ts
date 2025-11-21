import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/nextAuth';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session || !session.user || !(session.user as any).id) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId((session.user as any).id) }, { projection: { passwordHash: 0 } });
    if (!user) return res.status(404).json({ error: 'not_found' });
    const out = { id: user._id.toString(), email: user.email, role: user.role, name: user.name, tenantId: user.tenantId };
    return res.json({ ok: true, user: out });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
