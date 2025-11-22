import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const role = auth.role as string;
      const tenantId = auth.tenantId;
      const userId = auth.userId;

      let query: any = { tenantId };
      if (role === 'admin') {
        // admin sees all tenant tasks (optionally filter by assignedTo via query param)
        if (req.query.assignedTo) query['assignedTo.id'] = String(req.query.assignedTo);
      } else if (role === 'staff') {
        // staff sees tasks assigned to them
        query = { tenantId, 'assignedTo.id': userId };
      } else {
        // other roles not allowed
        return res.status(403).json({ error: 'forbidden' });
      }

      const tasks = await db.collection('tasks').find(query).toArray();
      return res.json({ ok: true, tasks });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    // only admin can create tasks for staff
    const role = auth.role as string;
    if (role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const body = req.body || {};
    const { title, description, objectives, timeline, stages, assignedTo } = body;
    if (!title) return res.status(400).json({ error: 'missing_title' });
    if (!assignedTo || !assignedTo.id) return res.status(400).json({ error: 'missing_assignee' });

    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
      // resolve assignee name
      const assignee = await db.collection('users').findOne({ _id: new ObjectId(assignedTo.id) });

      const task: any = {
        title,
        description: description || '',
        objectives: objectives || [],
        timeline: timeline || { from: null, to: null },
        stages: (stages || []).map((s: any) => ({ name: s.name || '', progress: typeof s.progress !== 'undefined' ? Number(s.progress) : 0 })),
        assignedTo: { id: assignedTo.id, name: assignee?.name || assignee?.email || assignedTo.id },
        status: { text: 'open' },
        status_internal: 'open',
        tenantId: auth.tenantId || null,
        author: { id: auth.userId, name: user?.name || user?.email || 'Unknown' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await db.collection('tasks').insertOne(task);
      return res.json({ ok: true, task: { ...task, _id: result.insertedId } });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  return res.status(405).end();
}

export default requireAuth(handler);
