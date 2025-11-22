import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { db } = await connectToDatabase();
    const page = Math.max(0, Number(req.query.page || 0));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 20)));

    const total = await db.collection('mail_logs').countDocuments({});
    const cursor = db.collection('mail_logs').find({}).sort({ createdAt: -1 }).skip(page * limit).limit(limit);
    const logs = await cursor.toArray();
    const out = logs.map(l => ({ id: l._id.toString(), templateId: l.templateId, subject: l.subject, recipients: l.recipients, recipient: l.recipient, result: l.result, createdAt: l.createdAt }));
    return res.json({ ok: true, logs: out, total, page, limit });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireJwtAuth(handler, ['admin']);
