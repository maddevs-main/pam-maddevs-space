import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';

// This endpoint now reads from MongoDB `incoming_mail` collection with pagination.
// Use admin-only access.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const page = Math.max(0, Number(req.query.page || 0));
  // allow page sizes between 5 and 20, default 20
  const limit = Math.max(5, Math.min(20, Number(req.query.limit || 20)));

  try {
    const { db } = await connectToDatabase();
    const query: any = {};
    const cursor = db.collection('incoming_mail').find(query).sort({ receivedAt: -1 }).skip(page * limit).limit(limit);
    const items = await cursor.toArray();
    const out = items.map((it: any) => ({ id: it._id.toString(), sender: it.sender, senderEmail: it.senderEmail, recipientEmail: it.recipientEmail, subject: it.subject, body: it.body, timestamp: it.receivedAt, read: !!it.read }));
    const total = await db.collection('incoming_mail').countDocuments(query);
    return res.json({ ok: true, emails: out, page, limit, total });
  } catch (err: any) {
    console.error('db-list-error', err);
    return res.status(500).json({ ok: false, error: 'db_error', details: String(err) });
  }
}

export default requireAuth(handler, ['admin']);
