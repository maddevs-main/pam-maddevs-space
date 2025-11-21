import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  const { db } = await connectToDatabase();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  let projId: any = null;
  try {
    projId = new ObjectId(id as string);
  } catch (e) {
    projId = null; // id is not a valid ObjectId
  }

  if (req.method === 'GET') {
    const role = auth.role as string;
    const tenantId = auth.tenantId;
    const userId = auth.userId;

    // First, try to find within the tenant by ObjectId
    let project: any = null;
    if (projId && tenantId) {
      project = await db.collection('projects').findOne({ _id: projId, tenantId });
    }

    // If not found, try string `id` within the tenant
    if (!project && tenantId) {
      project = await db.collection('projects').findOne({ id: id as any, tenantId });
    }

    // If still not found, in dev provide diagnostics for easier debugging
    if (!project) {
      if (process.env.NODE_ENV !== 'production') {
        const foundById = projId ? await db.collection('projects').findOne({ _id: projId }) : null;
        const foundByStringId = await db.collection('projects').findOne({ id: id as any });
        return res.status(404).json({ error: 'not_found', debug: { auth, id, projId: !!projId, foundById: !!foundById, foundByIdTenantId: foundById?.tenantId || null, foundByStringId: !!foundByStringId } });
      }
      return res.status(404).json({ error: 'not_found' });
    }

    // Authorization: ensure the requesting user is allowed to view this project
    // Admins must be in the same tenant
    if (role === 'admin') {
      if (project.tenantId !== tenantId) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true, project });
    }

    // Consumers can view their own projects
    if (role === 'consumer') {
      if (String(project.author?.id) !== String(userId)) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true, project });
    }

    // Staff can view projects where they are allocated or in staff list
    if (role === 'staff') {
      const allocated = Array.isArray(project.people_allocated) && project.people_allocated.includes(userId);
      const inStaff = Array.isArray(project.staff) && project.staff.includes(userId);
      if (!allocated && !inStaff) return res.status(404).json({ error: 'not_found' });
      return res.json({ ok: true, project });
    }

    // Default deny
    return res.status(404).json({ error: 'not_found' });
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const project = await db.collection('projects').findOne({ _id: projId, tenantId: auth.tenantId });
    if (!project) return res.status(404).json({ error: 'not_found' });
    const role = auth.role as string;

    // consumer confirms a milestone
    if (body.action === 'confirm_milestone' && typeof body.milestoneIndex === 'number') {
      const idx = body.milestoneIndex;
      if (role === 'consumer') {
        if (project.author?.id !== auth.userId) return res.status(403).json({ error: 'forbidden' });
      }
      const m = project.milestones || [];
      if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
      m[idx].confirmedByUser = 1;
      m[idx].confirmedAt = new Date();
      await db.collection('projects').updateOne({ _id: projId }, { $set: { milestones: m, updated_at: new Date() } });
      return res.json({ ok: true });
    }

    // allow adding links to whitelisted fields (consumer or admin)
    if (body.action === 'add_link' && typeof body.field === 'string' && typeof body.link === 'string') {
      const allowedFields = ['filebase_links', 'credential_links', 'other_links'];
      const field = body.field;
      if (!allowedFields.includes(field)) return res.status(400).json({ error: 'invalid_field' });
      // basic url validation
      const link = (body.link || '').toString().trim();
      if (!/^https?:\/\//i.test(link) && !/^data:/i.test(link)) return res.status(400).json({ error: 'invalid_link' });
      // consumer must be owner
      if (auth.role === 'consumer') {
        if (project.author?.id !== auth.userId) return res.status(403).json({ error: 'forbidden' });
      } else if (auth.role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
      }
      await db.collection('projects').updateOne({ _id: projId }, { $push: { [field]: link }, $set: { updated_at: new Date() } });
      return res.json({ ok: true });
    }

    // admin can remove a link by index from whitelisted fields
    if (body.action === 'remove_link' && typeof body.field === 'string' && typeof body.index === 'number') {
      if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      const allowedFields = ['filebase_links', 'credential_links', 'other_links'];
      const field = body.field;
      if (!allowedFields.includes(field)) return res.status(400).json({ error: 'invalid_field' });
      const idx = Number(body.index);
      const arr = Array.isArray(project[field]) ? project[field] : [];
      if (idx < 0 || idx >= arr.length) return res.status(400).json({ error: 'invalid_index' });
      arr.splice(idx, 1);
      await db.collection('projects').updateOne({ _id: projId }, { $set: { [field]: arr, updated_at: new Date() } });
      return res.json({ ok: true });
    }

    // admin marks milestone paid/unpaid
    if ((body.action === 'mark_paid' || body.action === 'unmark_paid') && typeof body.milestoneIndex === 'number') {
      if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      const idx = body.milestoneIndex;
      const m = project.milestones || [];
      if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
      if (body.action === 'mark_paid') {
        m[idx].paidByAdmin = 1;
        m[idx].paidAt = new Date();
      } else {
        m[idx].paidByAdmin = 0;
        delete m[idx].paidAt;
      }
      await db.collection('projects').updateOne({ _id: projId }, { $set: { milestones: m, updated_at: new Date() } });
      return res.json({ ok: true });
    }

    // partial update via PATCH (used by some UI flows)
    if (body.action === 'update' && body.payload) {
      const payload = body.payload || {};
      if (role === 'admin') {
        const updated = { ...project, ...payload, updated_at: new Date() };
        delete updated._id;
        await db.collection('projects').updateOne({ _id: projId }, { $set: updated });
        return res.json({ ok: true });
      }
      if (role === 'staff') {
        const allowed = ['deliverables', 'people_allocated', 'status', 'description', 'files'];
        const update: any = {};
        for (const k of allowed) if (k in payload) update[k] = payload[k];
        if (Object.keys(update).length === 0) return res.status(403).json({ error: 'nothing_allowed' });
        update.updated_at = new Date();
        await db.collection('projects').updateOne({ _id: projId }, { $set: update });
        return res.json({ ok: true });
      }
      if (role === 'consumer') {
        if (project.author?.id !== auth.userId) return res.status(403).json({ error: 'forbidden' });
        const allowed = ['description', 'files'];
        const update: any = {};
        for (const k of allowed) if (k in payload) update[k] = payload[k];
        if (Object.keys(update).length === 0) return res.status(403).json({ error: 'nothing_allowed' });
        update.updated_at = new Date();
        await db.collection('projects').updateOne({ _id: projId }, { $set: update });
        return res.json({ ok: true });
      }
    }

    return res.status(403).json({ error: 'forbidden' });
  }

  if (req.method === 'PUT') {
    // allow admin full update; staff/consumer limited
    const role = auth.role as string;
    const body = req.body || {};

    const project = await db.collection('projects').findOne({ _id: projId, tenantId: auth.tenantId });
    if (!project) return res.status(404).json({ error: 'not_found' });

    if (role === 'admin') {
      // admin may update most fields
      const updated = { ...project, ...body, updated_at: new Date() };
      delete updated._id;
      await db.collection('projects').updateOne({ _id: projId }, { $set: updated });
      return res.json({ ok: true });
    }

    if (role === 'staff') {
      // staff can update only selected fields (deliverables, people_allocated, status, description)
      const allowed = ['deliverables', 'people_allocated', 'status', 'description', 'files'];
      const update: any = {};
      for (const k of allowed) if (k in body) update[k] = body[k];
      if (Object.keys(update).length === 0) return res.status(403).json({ error: 'nothing_allowed' });
      update.updated_at = new Date();
      await db.collection('projects').updateOne({ _id: projId }, { $set: update });
      return res.json({ ok: true });
    }

    if (role === 'consumer') {
      // consumer can only update a small set of fields for their own projects
      if (project.author?.id !== auth.userId) return res.status(403).json({ error: 'forbidden' });
      const allowed = ['description', 'files'];
      // allow consumer confirm milestone action
      if (body.action === 'confirm_milestone' && typeof body.milestoneIndex === 'number') {
        const idx = body.milestoneIndex;
        const m = project.milestones || [];
        if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
        m[idx].confirmedByUser = 1;
        m[idx].confirmedAt = new Date();
        await db.collection('projects').updateOne({ _id: projId }, { $set: { milestones: m, updated_at: new Date() } });
        return res.json({ ok: true });
      }
      const update: any = {};
      for (const k of allowed) if (k in body) update[k] = body[k];
      if (Object.keys(update).length === 0) return res.status(403).json({ error: 'nothing_allowed' });
      update.updated_at = new Date();
      await db.collection('projects').updateOne({ _id: projId }, { $set: update });
      return res.json({ ok: true });
    }

    // admin can mark milestone paid for projects
    if (role === 'admin' && typeof body.milestoneIndex === 'number') {
      const idx = body.milestoneIndex;
      const m = project.milestones || [];
      if (!m[idx]) return res.status(400).json({ error: 'invalid_index' });
      if (body.action === 'mark_paid') {
        m[idx].paidByAdmin = 1;
        m[idx].paidAt = new Date();
        await db.collection('projects').updateOne({ _id: projId }, { $set: { milestones: m, updated_at: new Date() } });
        return res.json({ ok: true });
      }
      if (body.action === 'unmark_paid') {
        m[idx].paidByAdmin = 0;
        delete m[idx].paidAt;
        await db.collection('projects').updateOne({ _id: projId }, { $set: { milestones: m, updated_at: new Date() } });
        return res.json({ ok: true });
      }
    }

    return res.status(403).json({ error: 'forbidden' });
  }

  if (req.method === 'DELETE') {
    // only admin
    if (auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    await db.collection('projects').deleteOne({ _id: projId, tenantId: auth.tenantId });
    return res.json({ ok: true });
  }

  res.status(405).end();
}

export default requireAuth(handler);
