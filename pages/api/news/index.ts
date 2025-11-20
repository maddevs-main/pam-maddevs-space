import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { db } = await connectToDatabase();
    const news = await db.collection('news').find({}).sort({ date: -1 }).toArray();
    const mapped = news.map(n => ({ ...n, id: n._id.toString() }));
    return res.json({ ok: true, news: mapped });
  } catch (err: any) {
    console.error('GET /api/news error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
