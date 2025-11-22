import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const q: any = {};
      if (auth && auth.tenantId) {
        q.$or = [
          { tenantId: auth.tenantId },
          { tenantId: null },
          { tenantId: { $exists: false } },
        ];
      }
      const blogs = await db.collection('blogs').find(q).sort({ date: -1 }).toArray();
      const mapped = blogs.map(b => ({ ...b, id: b._id.toString() }));
      return res.json({ ok: true, blogs: mapped });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const doc = {
      title: body.title || '',
      slug: body.slug || (body.title ? String(body.title).toLowerCase().replace(/\s+/g, '-') : ''),
      excerpt: body.excerpt || '',
      author: body.author || (auth && auth.userId ? auth.userId : 'anon'),
      date: body.date ? new Date(body.date) : new Date(),
      content: body.content || '',
      imageUrl: body.imageUrl || '',
      detailImageUrl2: body.detailImageUrl2 || '',
      isPinned: !!body.isPinned,
      tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      tenantId: auth && auth.tenantId ? auth.tenantId : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const r = await db.collection('blogs').insertOne(doc as any);
      return res.json({ ok: true, id: r.insertedId.toString() });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler, ['admin']);
