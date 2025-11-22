import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import connectToDatabase from '../../../lib/mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // admin only
  try {
    // read env
    const host = process.env.MAIL_IMAP_HOST;
    const port = Number(process.env.MAIL_IMAP_PORT || 993);
    const secure = String(process.env.MAIL_IMAP_SECURE || 'true') === 'true';
    const user = process.env.MAIL_IMAP_USER;
    const pass = process.env.MAIL_IMAP_PASS;

    if (!host || !user || !pass) return res.status(400).json({ ok: false, error: 'missing_imap_config' });

    // allow a max number of messages to process in one run to avoid long blocking
    // hard cap to 40 to avoid storage blowups even if env is misconfigured
    const DEFAULT_MAX = 40;
    const MAX_PROCESS = Math.min(DEFAULT_MAX, Number(process.env.MAIL_SYNC_MAX || DEFAULT_MAX));
    const RETRIES = 2;
    let attempt = 0;
    let lastErr: any = null;
    const saved: any[] = [];

    while (attempt < RETRIES) {
      attempt++;
      const client = new ImapFlow({ host, port, secure, auth: { user, pass }, logger: false });
      try {
        // set a connection timeout guard
        const timeout = Number(process.env.MAIL_IMAP_CONN_TIMEOUT_MS || 20000);
        const connPromise = client.connect();
        const race = Promise.race([connPromise, new Promise((_, rej) => setTimeout(() => rej(new Error('imap_connect_timeout')), timeout))]);
        await race;

        await client.mailboxOpen('INBOX');

        const lock = await client.getMailboxLock('INBOX');
        try {
          // search for unseen messages
          const uidsRes = await client.search({ seen: false });
          const uids = Array.isArray(uidsRes) ? uidsRes : [];
          const uidsSlice = uids.slice(-Math.max(0, Math.min(MAX_PROCESS, uids.length)));
          let processed = 0;
          for await (const msg of client.fetch(uidsSlice.length ? uidsSlice : '1:*', { source: true, flags: true, internalDate: true })) {
            if (processed >= MAX_PROCESS) break;
            processed++;
            try {
              const parsed = await simpleParser(msg.source as Buffer);
              const from = parsed.from && parsed.from.value && parsed.from.value[0] ? parsed.from.value[0] : undefined;
              const to = parsed.to && parsed.to.value && parsed.to.value[0] ? parsed.to.value[0] : undefined;
              const messageId = parsed.messageId || (`imap-${msg.uid}`);
              const receivedAt = parsed.date ? parsed.date : (msg.internalDate ? new Date(msg.internalDate) : new Date());
              const rawHtml = parsed.html || parsed.textAsHtml || parsed.text || '';
              const clean = sanitizeHtml(rawHtml || '', { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','h1','h2','h3']), allowedAttributes: { a: ['href','name','target'], img: ['src','alt'] } });

              // persist to DB if not exists
              const { db } = await connectToDatabase();
              const exists = await db.collection('incoming_mail').findOne({ messageId });
              if (!exists) {
                const doc = {
                  messageId,
                  sender: (from && (from.name || from.address)) || 'Unknown',
                  senderEmail: (from && from.address) || '',
                  recipientEmail: (to && to.address) || '',
                  subject: parsed.subject || '(no subject)',
                  body: clean,
                  receivedAt,
                  read: Array.isArray(msg.flags) ? msg.flags.includes('\\Seen') : false,
                  rawHeaders: parsed.headerLines || [],
                  createdAt: new Date(),
                };
                const r = await db.collection('incoming_mail').insertOne(doc as any);
                saved.push({ id: r.insertedId.toString(), subject: doc.subject });
              }
            } catch (e) {
              console.error('msg-parse-save-failed', e);
            }
          }
        } finally { try { lock.release(); } catch (e) {} }

        try { await client.logout(); } catch (e) {}
        // success - break retry loop
        lastErr = null;
        break;
      } catch (err: any) {
        console.error(`imap-sync-attempt-${attempt}-failed`, err);
        lastErr = err;
        try { await client.logout(); } catch (e) {}
        // wait a bit before retrying
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    if (lastErr) {
      console.error('sync-failed-after-retries', lastErr);
      return res.status(500).json({ ok: false, error: 'sync_failed', details: String(lastErr) });
    }

    return res.json({ ok: true, savedCount: saved.length, saved });
  } catch (err: any) {
    console.error('sync-error', err);
    return res.status(500).json({ ok: false, error: 'sync_failed', details: String(err) });
  }
}

export default requireAuth(handler, ['admin']);
