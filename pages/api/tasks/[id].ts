import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'missing_id' });
  const taskId = new ObjectId(id);

  if (req.method === 'GET') {
    try {
      const task = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
      if (!task) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true, task });
    } catch (err: any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const action = body.action || 'update';

    try {
      const role = auth.role as string;
      if (action === 'update') {
        // admin updates task fields
        if (role !== 'admin') return res.status(403).json({ error: 'forbidden' });
        const payload = body.payload || {};
        payload.updated_at = new Date();
        await db.collection('tasks').updateOne({ _id: taskId }, { $set: payload });
        return res.json({ ok: true });
      }

      if (action === 'status') {
        // staff can update their status (complete/ in_progress)
        const { status } = body;
        if (!status) return res.status(400).json({ error: 'missing_status' });
        // confirm allowed role or ownership
        if (role === 'staff') {
          // ensure assigned to this staff
          const task = await db.collection('tasks').findOne({ _id: taskId });
          if (!task) return res.status(404).json({ error: 'not_found' });
          if (String(task.assignedTo?.id) !== String(auth.userId)) return res.status(403).json({ error: 'forbidden' });
          // if staff is attempting to mark completed, ensure all stages are 100
          if (status === 'completed' || status === 'done') {
            const stages = Array.isArray(task.stages) ? task.stages : [];
            const allDone = stages.length === 0 ? true : stages.every((s:any) => Number(s.progress) >= 100);
            if (!allDone) return res.status(400).json({ error: 'stages_not_complete' });
          }
        } else if (role !== 'admin') {
          return res.status(403).json({ error: 'forbidden' });
        }
        await db.collection('tasks').updateOne({ _id: taskId }, { $set: { status: { text: status }, status_internal: status, updated_at: new Date() } });
        return res.json({ ok: true });
      }

      // allow adding links to whitelisted fields (consumer or admin)
      if (action === 'add_link' && typeof body.field === 'string' && typeof body.link === 'string') {
        const task = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        if (!task) return res.status(404).json({ error: 'not_found' });
        const allowedFields = ['filebase_links', 'credential_links', 'other_links', 'links'];
        const field = body.field;
        if (!allowedFields.includes(field)) return res.status(400).json({ error: 'invalid_field' });
        const link = (body.link || '').toString().trim();
        if (!/^https?:\/\//i.test(link) && !/^data:/i.test(link)) return res.status(400).json({ error: 'invalid_link' });
        // consumer must be owner; staff may add links if assigned; admin allowed
        if (auth.role === 'consumer') {
          if (task.author?.id !== auth.userId) return res.status(403).json({ error: 'forbidden' });
        } else if (auth.role === 'staff') {
          if (String(task.assignedTo?.id) !== String(auth.userId)) return res.status(403).json({ error: 'forbidden' });
        } else if (auth.role !== 'admin') {
          return res.status(403).json({ error: 'forbidden' });
        }
        await db.collection('tasks').updateOne({ _id: taskId }, { $push: { [field]: link }, $set: { updated_at: new Date() } });
        const updated = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        return res.json({ ok: true, task: updated });
      }

      // admin can remove a link by index from whitelisted fields
      if (action === 'remove_link' && typeof body.field === 'string' && typeof body.index === 'number') {
        if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
        const task = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        if (!task) return res.status(404).json({ error: 'not_found' });
        const allowedFields = ['filebase_links', 'credential_links', 'other_links', 'links'];
        const field = body.field;
        if (!allowedFields.includes(field)) return res.status(400).json({ error: 'invalid_field' });
        const idx = Number(body.index);
        const arr = Array.isArray(task[field]) ? task[field] : [];
        if (idx < 0 || idx >= arr.length) return res.status(400).json({ error: 'invalid_index' });
        arr.splice(idx, 1);
        await db.collection('tasks').updateOne({ _id: taskId }, { $set: { [field]: arr, updated_at: new Date() } });
        const updatedAfterRemove = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        return res.json({ ok: true, task: updatedAfterRemove });
      }

      // allow staff/admin to update a specific stage's progress
      if (action === 'update_stage_progress' && typeof body.stageIndex === 'number' && typeof body.progress !== 'undefined') {
        const task = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        if (!task) return res.status(404).json({ error: 'not_found' });
        const idx = Number(body.stageIndex);
        const progress = Number(body.progress);
        if (!Array.isArray(task.stages) || idx < 0 || idx >= task.stages.length) return res.status(400).json({ error: 'invalid_index' });
        // only assigned staff or admin may update progress
        if (role === 'staff') {
          if (String(task.assignedTo?.id) !== String(auth.userId)) return res.status(403).json({ error: 'forbidden' });
        } else if (role !== 'admin') {
          return res.status(403).json({ error: 'forbidden' });
        }
        // clamp progress
        const clamped = Math.max(0, Math.min(100, Math.round(progress)));
        const stages = Array.isArray(task.stages) ? task.stages : [];
        stages[idx] = { ...(stages[idx] || {}), progress: clamped };
        await db.collection('tasks').updateOne({ _id: taskId }, { $set: { stages, updated_at: new Date() } });
        const updatedTask = await db.collection('tasks').findOne({ _id: taskId, tenantId: auth.tenantId });
        return res.json({ ok: true, task: updatedTask });
      }

      return res.status(400).json({ error: 'unknown_action' });
    } catch (err: any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  if (req.method === 'DELETE') {
    // admin only
    const role = auth.role as string;
    if (role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    try {
      await db.collection('tasks').deleteOne({ _id: taskId, tenantId: auth.tenantId });
      return res.json({ ok: true });
    } catch (err: any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  return res.status(405).end();
}

export default requireAuth(handler);
