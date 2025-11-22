import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const role = auth.role;
      const tenantId = auth.tenantId;
      // Return meetings depending on role and relation to meeting
      let query: any = { tenantId };
      if (role === 'admin') {
        // admin sees all meetings in tenant
        query = { tenantId };
      } else if (role === 'consumer' || role === 'staff') {
        // consumers and staff see meetings they requested or where they are attendees
        query = { tenantId, $or: [{ 'requestedBy.id': auth.userId }, { attendees: { $in: [auth.userId] } }] };
      }
      const meetings = await db.collection('meetings').find(query).toArray();
      return res.json({ ok: true, meetings });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    // allow consumer/staff to request a meeting and admin to create arbitrary meetings
    const body = req.body || {};
    const { projectId, type, title, scheduledAt } = body;
    const { link } = body;
    if (!type || !title) return res.status(400).json({ error: 'missing_fields' });

    try {
      const userDoc = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
      const meeting = {
        projectId: projectId || null,
        type,
        title,
        requestedBy: { id: auth.userId, name: userDoc?.name || userDoc?.email },
        tenantId: auth.tenantId || null,
        status: 'requested',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        link: link || null,
        attendees: body.attendees || [],
        created_at: new Date(),
        updated_at: new Date(),
      };
      const r = await db.collection('meetings').insertOne(meeting);
      return res.json({ ok: true, meetingId: r.insertedId });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler);
