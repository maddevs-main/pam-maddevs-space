import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequestAsync } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequestAsync(req);
  if (!user || !user.userId) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const { db } = await connectToDatabase();
    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user.userId) }, { projection: { passwordHash: 0 } });
    if (!userDoc) return res.status(404).json({ error: 'not_found' });
    const out = { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role, name: userDoc.name, tenantId: userDoc.tenantId };
    return res.json({ ok: true, user: out });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
