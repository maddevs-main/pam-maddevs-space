import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { requireJwtAuth } from '../../../lib/auth';
import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const auth: any = (req as any).auth;
  const body = req.body || {};

  const { db } = await connectToDatabase();

  // determine content
  let subject = body.subject || '';
  let html = body.html || '';
  if (body.templateId) {
    try {
      const tmpl = await db.collection('mail_templates').findOne({ _id: new ObjectId(body.templateId) });
      if (tmpl) {
        subject = tmpl.subject;
        html = tmpl.html;
      }
    } catch (e) {
      // ignore template lookup errors, use provided html/subject
    }
  }

  // recipients resolution
  let recipients: string[] = [];
  if (body.recipients === 'all') {
    const q: any = {};
    // include tenant-scoped users and legacy users without tenantId
    if (auth && auth.tenantId) {
      q.$or = [
        { tenantId: auth.tenantId },
        { tenantId: null },
        { tenantId: { $exists: false } },
      ];
    }
    const users = await db.collection('users').find(q, { projection: { email: 1 } }).toArray();
    recipients = users.map((u: any) => u.email).filter(Boolean);
  } else if (Array.isArray(body.recipientsList)) {
    recipients = body.recipientsList.map((r: any) => String(r || '').trim());
  } else if (body.recipients && typeof body.recipients === 'string') {
    // allow comma, semicolon or newline separated lists
    recipients = String(body.recipients).split(/[,;\n]+/).map((s: string) => s.trim());
  }

  // normalize: remove empties, dedupe, validate basic email pattern
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  recipients = recipients.map(r => String(r).trim()).filter(Boolean);
  recipients = Array.from(new Set(recipients));
  const valid = recipients.filter(r => emailRe.test(r));
  const invalid = recipients.filter(r => !emailRe.test(r));
  if (invalid.length) {
    // record invalid addresses in logs for debugging, but return error to caller
    console.error('invalid_recipients', invalid);
    return res.status(400).json({ error: 'invalid_recipients', invalid });
  }
  recipients = valid;

  if (!recipients.length) return res.status(400).json({ error: 'no_recipients' });

  // setup transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port: Number(process.env.MAIL_SMTP_PORT || 587),
    secure: String(process.env.MAIL_SMTP_SECURE) === 'true',
    auth: {
      user: process.env.MAIL_SMTP_USER,
      pass: process.env.MAIL_SMTP_PASS,
    },
  });

  const from = process.env.MAIL_FROM || process.env.MAIL_SMTP_USER || undefined;
  if (!from) return res.status(500).json({ error: 'missing_mail_from' });

  const results: any[] = [];

  for (const recipient of recipients) {
    try {
      // use explicit SMTP envelope to ensure correct MAIL FROM / RCPT TO
      const info = await transporter.sendMail({ from, to: recipient, subject, html, envelope: { from, to: recipient } });
      const logDoc = { templateId: body.templateId || null, subject, html, recipient, result: { ok: true, info }, createdAt: new Date(), by: auth && auth.userId ? auth.userId : null };
      await db.collection('mail_logs').insertOne(logDoc as any);
      results.push({ recipient, ok: true, info });
    } catch (err: any) {
      const logDoc = { templateId: body.templateId || null, subject, html, recipient, result: { ok: false, error: String(err) }, createdAt: new Date(), by: auth && auth.userId ? auth.userId : null };
      try { await db.collection('mail_logs').insertOne(logDoc as any); } catch (e) { console.error('failed to write log', e); }
      results.push({ recipient, ok: false, error: String(err) });
    }
  }

  const overallOk = results.every(r => r.ok);
  return res.json({ ok: overallOk, results, error: overallOk ? undefined : 'one_or_more_recipients_failed' });
}

export default requireJwtAuth(handler, ['admin']);
