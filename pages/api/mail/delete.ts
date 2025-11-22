import type { NextApiRequest, NextApiResponse } from 'next';
import { requireJwtAuth } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const id = String(req.query.id || req.body?.id || '').trim();
  if (!id) return res.status(400).json({ ok: false, error: 'missing_id' });
  try {
    const { db } = await connectToDatabase();
    const r = await db.collection('incoming_mail').deleteOne({ _id: new ObjectId(id) });
    if (r.deletedCount && r.deletedCount > 0) return res.json({ ok: true });
    return res.status(404).json({ ok: false, error: 'not_found' });
  } catch (err: any) {
    console.error('delete-mail-error', err);
    return res.status(500).json({ ok: false, error: 'db_error', details: String(err) });
  }
}

export default requireJwtAuth(handler, ['admin']);
