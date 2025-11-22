import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';
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
        // admin sees all tenant projects
      } else if (role === 'consumer') {
        query = { tenantId, 'author.id': userId };
      } else if (role === 'staff') {
        // staff sees projects where they are allocated
        query = { tenantId, $or: [{ people_allocated: { $in: [userId] } }, { staff: { $in: [userId] } }] };
      }

      const projects = await db.collection('projects').find(query).toArray();
      res.json({ ok: true, projects });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
    return;
  }

  if (req.method === 'POST') {
    // create project: allowed for consumer and admin
    const role = auth.role as string;
    if (!['consumer', 'admin'].includes(role)) return res.status(403).json({ error: 'forbidden' });
    const body = req.body || {};
    const { title, description, objectives, type, stage, stages, status: inputStatus, taskLog, filebase_links, credential_links, other_links, total_cost, milestones, timeline } = body;
    if (!title) return res.status(400).json({ error: 'missing_title' });

    try {
      // get user info
      const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });

      const project: any = {
        title,
        description: description || '',
        objectives: objectives || [],
        type: type || 'a',
        stage: stage || { name: 'm', percentage: 0 },
        // status: e.g. 'requested' or 'active' with percentage text
        status: inputStatus || { stage: 0, text: 'requested' },
        task_log: taskLog || [],
        filebase_links: filebase_links || [],
        credential_links: credential_links || [],
        other_links: other_links || [],
        total_cost: total_cost || 0,
        milestones: (milestones || []).map((m: any) => ({ title: m.title || '', amount: typeof m.amount !== 'undefined' ? Number(m.amount) : 0, paymentLink: m.paymentLink || '', confirmedByUser: m.confirmedByUser || 0, paidByAdmin: m.paidByAdmin || 0 })),
        stages: (stages || []).map((s: any) => ({ name: s.name || '', progress: typeof s.progress !== 'undefined' ? Number(s.progress) : 0 })),
        timeline: timeline || { from: null, to: null },
        approved: 0,
        tenantId: auth.tenantId || null,
        author: { id: auth.userId, name: user?.name || user?.email || 'Unknown' },
        status_internal: 'requested',
        people_allocated: [],
        staff: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await db.collection('projects').insertOne(project);

      // create a discovery meeting for admin review
      const meeting = {
        projectId: result.insertedId.toString(),
        type: 'discovery',
        title: `Discovery: ${project.title}`,
        requestedBy: { id: auth.userId, name: user?.name || user?.email },
        tenantId: auth.tenantId || null,
        status: 'requested',
        scheduledAt: null,
        created_at: new Date(),
      };
      await db.collection('meetings').insertOne(meeting);

      res.json({ ok: true, project: { ...project, _id: result.insertedId } });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
    return;
  }

  res.status(405).end();
}

export default requireJwtAuth(handler);
