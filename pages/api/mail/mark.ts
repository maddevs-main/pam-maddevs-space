import type { NextApiRequest, NextApiResponse } from 'next';
import { requireJwtAuth } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const id = String(req.query.id || req.body?.id || '').trim();
  const mark = req.body?.mark; // expected 'read' or 'unread'
  if (!id || !mark) return res.status(400).json({ ok: false, error: 'missing_params' });
  try {
    const { db } = await connectToDatabase();
    const update: any = {};
    if (mark === 'read') update.read = true;
    else if (mark === 'unread') update.read = false;
    else return res.status(400).json({ ok: false, error: 'invalid_mark' });

    const r = await db.collection('incoming_mail').updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (r.matchedCount && r.matchedCount > 0) return res.json({ ok: true });
    return res.status(404).json({ ok: false, error: 'not_found' });
  } catch (err: any) {
    console.error('mark-mail-error', err);
    return res.status(500).json({ ok: false, error: 'db_error', details: String(err) });
  }
}

export default requireJwtAuth(handler, ['admin']);
