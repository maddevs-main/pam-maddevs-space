import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  if (req.method === 'GET') {
    try {
      const docId = new ObjectId(id);
      const existing = await db.collection('staff_finance').findOne({ _id: docId });
      if (!existing) return res.status(404).json({ error: 'not_found' });
      if (existing.tenantId !== auth.tenantId) return res.status(403).json({ error: 'forbidden' });
      if (auth.role === 'staff' && existing.userId !== auth.userId) return res.status(403).json({ error: 'forbidden' });
      return res.json({ ok: true, entry: existing });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'PATCH') {
      // allow staff to mark milestone done or confirm milestone; admin can update any field
    const body = req.body || {};
    try {
      const docId = new ObjectId(id);
      const existing = await db.collection('staff_finance').findOne({ _id: docId });
      if (!existing) return res.status(404).json({ error: 'not_found' });
      if (existing.tenantId !== auth.tenantId) return res.status(403).json({ error: 'forbidden' });

      // allow staff to mark milestone done
      if (auth.role === 'staff' && typeof body.milestoneIndex === 'number') {
        const idx = body.milestoneIndex;
        const m = existing.milestones || [];
        if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
        // staff can either mark done or confirm milestone
        if (body.action === 'mark_done') {
          m[idx].done = 1;
          await db.collection('staff_finance').updateOne({ _id: docId }, { $set: { milestones: m, updated_at: new Date() } });
          return res.json({ ok: true });
        }
        if (body.action === 'confirm_milestone') {
          m[idx].confirmedByUser = 1;
          m[idx].confirmedAt = new Date();
          await db.collection('staff_finance').updateOne({ _id: docId }, { $set: { milestones: m, updated_at: new Date() } });
          return res.json({ ok: true });
        }
      }

      // admin update: replace fields
      // admin update: replace fields or mark milestone paid
      if (auth.role === 'admin') {
        // admin can mark a milestone as paid
        if (typeof body.milestoneIndex === 'number') {
          const idx = body.milestoneIndex;
          const m = existing.milestones || [];
          if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
          if (body.action === 'mark_paid') {
            m[idx].paidByAdmin = 1;
            m[idx].paidAt = new Date();
            await db.collection('staff_finance').updateOne({ _id: docId }, { $set: { milestones: m, updated_at: new Date() } });
            return res.json({ ok: true });
          }
          if (body.action === 'unmark_paid') {
            m[idx].paidByAdmin = 0;
            delete m[idx].paidAt;
            await db.collection('staff_finance').updateOne({ _id: docId }, { $set: { milestones: m, updated_at: new Date() } });
            return res.json({ ok: true });
          }
        }

        const update: any = {};
        if (body.milestones) update.milestones = body.milestones;
        if (typeof body.total_cost !== 'undefined') update.total_cost = body.total_cost;
        if (body.notes) update.notes = body.notes;
        if (Object.keys(update).length === 0) return res.status(400).json({ error: 'no_changes' });
        update.updated_at = new Date();
        await db.collection('staff_finance').updateOne({ _id: docId }, { $set: update });
        return res.json({ ok: true });
      }

      return res.status(403).json({ error: 'forbidden' });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'DELETE') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    try {
      const docId = new ObjectId(id);
      await db.collection('staff_finance').deleteOne({ _id: docId, tenantId: auth.tenantId });
      return res.json({ ok: true });
    } catch (err:any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler);
