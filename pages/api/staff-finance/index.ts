import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const tenantId = auth.tenantId;
      if (auth.role === 'admin') {
        const items = await db.collection('staff_finance').find({ tenantId }).toArray();
        return res.json({ ok: true, items });
      } else if (auth.role === 'staff') {
        const items = await db.collection('staff_finance').find({ tenantId, userId: auth.userId }).toArray();
        return res.json({ ok: true, items });
      }
      return res.status(403).json({ error: 'forbidden' });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    // admin creates staff finance entries
    if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const body = req.body || {};
    const { userId, type, milestones, total_cost, notes, start, end } = body;
    if (!userId || !type) return res.status(400).json({ error: 'missing_fields' });
    try {
      // normalize milestones to include payment and confirmation flags
      const normalizedMilestones = (milestones || []).map((m: any) => ({
        title: m.title || '',
        amount: typeof m.amount !== 'undefined' ? Number(m.amount) : 0,
        done: m.done || 0,
        confirmedByUser: m.confirmedByUser || 0,
        paidByAdmin: m.paidByAdmin || 0,
        paymentLink: m.paymentLink || '',
      }));

      // normalize start/end to ISO strings when provided
      const normalizedStart = start ? new Date(start).toISOString() : null;
      const normalizedEnd = end ? new Date(end).toISOString() : null;

      const doc: any = {
        userId,
        type,
        milestones: normalizedMilestones,
        total_cost: typeof total_cost !== 'undefined' ? total_cost : normalizedMilestones.reduce((acc:any,m:any)=>acc + (Number(m.amount)||0), 0),
        notes: notes || '',
        start: normalizedStart,
        end: normalizedEnd,
        tenantId: auth.tenantId,
        created_by: auth.userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const r = await db.collection('staff_finance').insertOne(doc);
      return res.json({ ok: true, id: r.insertedId });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireJwtAuth(handler);
