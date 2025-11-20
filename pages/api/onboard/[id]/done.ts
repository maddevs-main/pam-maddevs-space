import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });
  try {
    const { db } = await connectToDatabase();
    const oId = new ObjectId(String(id));
    const body = req.body || {};
    const done = !!body.done;
    await db.collection('onboards').updateOne({ _id: oId }, { $set: { done, updated_at: new Date() } });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
