import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { action, scheduledAt, note } = body;
    try {
      const meetingId = new ObjectId(id);
      const meeting = await db.collection('meetings').findOne({ _id: meetingId, tenantId: auth.tenantId });
      if (!meeting) return res.status(404).json({ error: 'not_found' });

      const update: any = { updated_at: new Date() };
      // map actions to intuitive statuses: schedule -> upcoming, approve -> completed (and approve project), decline -> declined, complete -> completed
      if (action === 'schedule') {
        update.status = 'upcoming';
        update.scheduledAt = scheduledAt ? new Date(scheduledAt) : new Date();
        if (body.link) update.link = body.link;
      } else if (action === 'approve') {
        update.status = 'approved';
        if (scheduledAt) update.scheduledAt = new Date(scheduledAt);
        if (body.link) update.link = body.link;
      } else if (action === 'decline') {
        update.status = 'declined';
      } else if (action === 'complete') {
        update.status = 'completed';
      }
      if (note) update.note = note;


      await db.collection('meetings').updateOne({ _id: meetingId }, { $set: update });

      // If approving and linked to a project, mark project approved
      if (action === 'approve' && meeting.projectId) {
        try {
          await db.collection('projects').updateOne({ _id: new ObjectId(meeting.projectId) }, { $set: { approved: 1, status_internal: 'approved', 'status.text': 'approved', updated_at: new Date() } });
        } catch (e) {
          console.warn('could not update project for meeting approve', e);
        }
      }

      return res.json({ ok: true });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler);
