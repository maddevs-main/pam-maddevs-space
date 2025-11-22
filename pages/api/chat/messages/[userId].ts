import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { requireJwtAuth } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

// simple in-memory rate limiter (per-process). For production, replace with Redis-backed limiter.
const RATE_LIMIT_MAX = 60; // messages
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per minute
const rateMap: Map<string, { count: number; windowStart: number }> = (global as any).__CHAT_RATE_LIMIT_MAP || new Map();
(global as any).__CHAT_RATE_LIMIT_MAP = rateMap;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth: any = (req as any).auth;
  if (!auth) return res.status(401).json({ error: 'unauthenticated' });

  const userId = auth.userId;
  const authRole = auth.role;
  const otherId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId as string;
  if (!otherId) return res.status(400).json({ error: 'missing_user' });

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      // fetch messages between userId and otherId
      const q = { $or: [ { fromUserId: userId, toUserId: otherId }, { fromUserId: otherId, toUserId: userId } ] };
      const msgs = await db.collection('chat_messages').find(q).sort({ createdAt: 1 }).toArray();
      return res.json({ ok: true, messages: msgs });
    } catch (err:any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const text = String(body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'missing_text' });
      if (text.length > 2000) return res.status(400).json({ error: 'text_too_long' });

      // rate limiting per sender
      try {
        const now = Date.now();
        const key = `rl:${String(userId)}`;
        const ent = rateMap.get(key) || { count: 0, windowStart: now };
        if (now - ent.windowStart > RATE_LIMIT_WINDOW_MS) {
          ent.count = 0; ent.windowStart = now;
        }
        ent.count += 1;
        rateMap.set(key, ent);
        if (ent.count > RATE_LIMIT_MAX) {
          return res.status(429).json({ error: 'rate_limited' });
        }
      } catch (e) { /* best-effort */ }

      // enforce allowed directions: non-admins can only message admins, admin can message anyone
      if (authRole !== 'admin') {
        // ensure otherId is an admin
        const other = await db.collection('users').findOne({ _id: new ObjectId(otherId) });
        if (!other || other.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
      }

      const attachments = Array.isArray(body.attachments) ? body.attachments.map((a:any) => ({ url: a.url, name: a.name, size: a.size, type: a.type })) : [];
      const doc: any = { fromUserId: userId, toUserId: otherId, text, attachments, createdAt: new Date(), deliveredAt: null, readAt: null };
      const r = await db.collection('chat_messages').insertOne(doc);

      // broadcast to websocket clients if available, but only to relevant participants
      try {
        // @ts-ignore -- global websocket server set in /pages/api/chat/ws
        const wss: any = (global as any).__CHAT_WSS;
        const insertedIdStr = r.insertedId.toString();
        let deliveredAt: Date | null = null;
        if (wss) {
          wss.clients.forEach((client: any) => {
            try {
              const cAuth = client.__auth;
              if (!cAuth) return;

              // send to recipient
              if (String(cAuth.userId) === String(otherId)) {
                deliveredAt = new Date();
                const payloadMsg = { type: 'message', message: { ...doc, _id: insertedIdStr, deliveredAt: deliveredAt.toISOString() } };
                client.send(JSON.stringify(payloadMsg));
              }

              // send to sender as confirmation
              if (String(cAuth.userId) === String(userId)) {
                const payloadMsg = { type: 'message', message: { ...doc, _id: insertedIdStr, deliveredAt: deliveredAt ? deliveredAt.toISOString() : null } };
                client.send(JSON.stringify(payloadMsg));
              }
            } catch (e) { /* ignore per-client errors */ }
          });

          // persist deliveredAt if we delivered to recipient
          if (deliveredAt) {
            await db.collection('chat_messages').updateOne({ _id: r.insertedId }, { $set: { deliveredAt } });
          }
        }
      } catch (e) { /* ignore broadcast errors */ }

      return res.json({ ok: true, message: { ...doc, _id: r.insertedId.toString() } });
    } catch (err:any) { console.error(err); return res.status(500).json({ error: 'server_error' }); }
  }

  return res.status(405).end();
}

export default requireJwtAuth(handler, ['admin','staff','consumer']);
