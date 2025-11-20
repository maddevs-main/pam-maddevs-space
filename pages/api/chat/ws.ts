import type { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer } from 'ws';
import { getUserFromRequest } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';

// This API route upgrades to a WebSocket server. Requires `ws` dependency.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((res as any).socket.server.wss) {
    // already set up
    return res.end();
  }

  const server: any = (res as any).socket.server;
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: any, socket: any, head: any) => {
    // only accept upgrades on this path
    if (request.url && request.url.startsWith('/api/chat/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        // attach minimal auth info to ws client for server-side handling
        try {
          const payload = getUserFromRequest(request as any);
          (ws as any).__auth = payload || null;
        } catch (e) { (ws as any).__auth = null; }
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (socket: any) => {
    // broadcast presence to others
    try {
      const myAuth = socket.__auth || null;
      const presenceMsg = JSON.stringify({ type: 'presence', userId: myAuth?.userId, online: true });
      wss.clients.forEach((c: any) => {
        try { if (c !== socket) c.send(presenceMsg); } catch (e) {}
      });

      // proactively mark undelivered messages as delivered for this user
      // and notify senders if connected. This ensures immediate delivery status when recipient comes online.
      (async () => {
        try {
          if (!myAuth || !myAuth.userId) return;
          const { db } = await connectToDatabase();
          const pending = await db.collection('chat_messages').find({ toUserId: String(myAuth.userId), deliveredAt: null }).toArray();
          if (pending && pending.length) {
            const now = new Date();
            const ids = pending.map((p:any) => p._id);
            await db.collection('chat_messages').updateMany({ _id: { $in: ids } }, { $set: { deliveredAt: now } });

            // notify senders for each pending message they sent
            for (const msg of pending) {
              const notify = JSON.stringify({ type: 'delivered', messageId: String(msg._id), to: String(msg.toUserId), from: String(msg.fromUserId), deliveredAt: now.toISOString() });
              wss.clients.forEach((c: any) => {
                try {
                  const cAuth = c.__auth;
                  if (!cAuth) return;
                  if (String(cAuth.userId) === String(msg.fromUserId) || String(cAuth.userId) === String(msg.toUserId)) {
                    c.send(notify);
                  }
                } catch (e) {}
              });
            }
          }
        } catch (e) { /* ignore DB errors */ }
      })();
    } catch (e) { }

    socket.on('message', async (data: any) => {
      try {
        const parsed = JSON.parse(String(data));
        // handle client 'read' events to mark messages as read
        if (parsed && parsed.type === 'read' && parsed.with) {
          const myAuth = socket.__auth || null;
          if (!myAuth || !myAuth.userId) return;
          try {
            const { db } = await connectToDatabase();
            const filter = { fromUserId: String(parsed.with), toUserId: String(myAuth.userId), readAt: null };
            const now = new Date();
            const r = await db.collection('chat_messages').updateMany(filter, { $set: { readAt: now } });

            // notify the other participant (if connected)
            const notify = JSON.stringify({ type: 'read', from: myAuth.userId, with: parsed.with, readAt: now.toISOString(), modifiedCount: r.modifiedCount });
            wss.clients.forEach((c: any) => {
              try {
                const cAuth = c.__auth;
                if (!cAuth) return;
                if (String(cAuth.userId) === String(parsed.with) || String(cAuth.userId) === String(myAuth.userId)) {
                  c.send(notify);
                }
              } catch (e) {}
            });
          } catch (e) { /* ignore DB errors */ }
          return;
        }

        // fallback: broadcast parsed payload to all clients (for misc signals)
        const out = JSON.stringify(parsed);
        wss.clients.forEach((c: any) => {
          try { c.send(out); } catch (e) {}
        });
      } catch (e) { /* ignore malformed */ }
    });

    socket.on('close', () => {
      try {
        const myAuth = socket.__auth || null;
        const presenceMsg = JSON.stringify({ type: 'presence', userId: myAuth?.userId, online: false });
        wss.clients.forEach((c: any) => { try { c.send(presenceMsg); } catch (e) {} });
      } catch (e) {}
    });
  });

  // expose on global so other API endpoints can broadcast
  (global as any).__CHAT_WSS = wss;
  (res as any).socket.server.wss = wss;
  res.end();
}
