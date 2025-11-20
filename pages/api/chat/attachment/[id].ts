import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id as string;
  if (!id) return res.status(400).end();
  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection('attachments').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    const buf = doc.data && doc.data.buffer ? doc.data.buffer : null;
    if (!buf) return res.status(404).json({ error: 'no_data' });
    res.setHeader('Content-Type', doc.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.name || 'attachment'}"`);
    return res.send(Buffer.from(buf));
  } catch (e:any) {
    console.error('attachment fetch error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default handler;
