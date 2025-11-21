import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { requireJwtAuth } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { id } = req.query as any;
  const { db } = await connectToDatabase();

  if (!id) return res.status(400).json({ error: 'missing_id' });

  try {
    const oId = new ObjectId(String(id));
    if (req.method === 'GET') {
      const q: any = { _id: oId };
      const auth: any = (req as any).auth;
      if (auth && auth.tenantId) {
        q.$or = [
          { tenantId: auth.tenantId },
          { tenantId: null },
          { tenantId: { $exists: false } },
        ];
      }
      const doc = await db.collection('blogs').findOne(q);
      if (!doc) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true, blog: { ...doc, id: doc._id.toString() } });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const upd: any = {
        title: body.title || '',
        slug: body.slug || '',
        excerpt: body.excerpt || '',
        author: body.author || '',
        date: body.date ? new Date(body.date) : new Date(),
        content: body.content || '',
        imageUrl: body.imageUrl || '',
        detailImageUrl2: body.detailImageUrl2 || '',
        isPinned: !!body.isPinned,
        tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
        updated_at: new Date(),
      };
      const q2: any = { _id: oId };
      const auth2: any = (req as any).auth;
      if (auth2 && auth2.tenantId) {
        q2.$or = [
          { tenantId: auth2.tenantId },
          { tenantId: null },
          { tenantId: { $exists: false } },
        ];
      }
      await db.collection('blogs').updateOne(q2, { $set: upd });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const q3: any = { _id: oId };
      const auth3: any = (req as any).auth;
      if (auth3 && auth3.tenantId) {
        q3.$or = [
          { tenantId: auth3.tenantId },
          { tenantId: null },
          { tenantId: { $exists: false } },
        ];
      }
      await db.collection('blogs').deleteOne(q3);
      return res.json({ ok: true });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }

  return res.status(405).end();
}

export default requireJwtAuth(handler, ['admin']);
