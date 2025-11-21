import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Public listing of blogs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { db } = await connectToDatabase();
    const blogs = await db
      .collection('blogs')
      .find({}, { sort: { date: -1 } as any })
      .toArray();

    const mapped = blogs.map(b => ({ ...b, id: b._id.toString() }));
    return res.json({ ok: true, blogs: mapped });
  } catch (err: any) {
    console.error('GET /api/blogs error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
