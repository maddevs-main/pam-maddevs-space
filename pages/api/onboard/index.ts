import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';

// Public endpoint to create an onboard request
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      // Public listing of onboard requests (legacy shape: return as `meetings`)
      const items = await db.collection('onboards').find({}).sort({ created_at: -1 }).toArray();
      return res.json({ ok: true, meetings: items });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const doc = {
        name: body.name || '',
        email: body.email || '',
        organisation: body.organisation || '',
        title: body.title || '',
        message: body.message || '',
        date: body.date || '',
        time: body.time || '',
        meetingId: body.meetingId || null,
        meeting_link: body.meeting_link || null,
        approved: null,
        done: false,
        tenantId: body.tenantId || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const r = await db.collection('onboards').insertOne(doc as any);
      return res.json({ ok: true, id: r.insertedId.toString() });
    }

    return res.status(405).end();
  } catch (err: any) {
    console.error('ERROR /api/onboard', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
