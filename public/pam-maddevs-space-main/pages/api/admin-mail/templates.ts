import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const templates = await db.collection('mail_templates').find({}).toArray();
      const out = templates.map(t => ({ id: t._id.toString(), name: t.name, subject: t.subject, html: t.html, createdAt: t.createdAt }));
      return res.json({ ok: true, templates: out });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.name || !body.subject || !body.html) return res.status(400).json({ error: 'missing_fields' });
      const { db } = await connectToDatabase();
      const now = new Date();
      const doc = { name: body.name, subject: body.subject, html: body.html, createdAt: now };
      const r = await db.collection('mail_templates').insertOne(doc as any);
      return res.json({ ok: true, id: r.insertedId.toString() });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler, ['admin']);
