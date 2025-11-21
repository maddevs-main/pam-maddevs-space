import { Db, ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

type SendMailOpts = {
  db: Db;
  recipients: string[];
  subject: string;
  html: string;
  by?: string | null;
};

export async function sendMail({ db, recipients, subject, html, by = null }: SendMailOpts) {
  if (!recipients || !recipients.length) return { ok: false, error: 'no_recipients' };

  // normalize recipients: accept comma/semicolon/newline separated strings as well
  if (typeof (recipients as any) === 'string') {
    recipients = (recipients as any).split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
  }
  recipients = recipients.map(r => String(r).trim()).filter(Boolean);
  recipients = Array.from(new Set(recipients));
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = recipients.filter(r => !emailRe.test(r));
  if (invalid.length) return { ok: false, error: 'invalid_recipients', invalid };

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
  if (!from) return { ok: false, error: 'missing_mail_from' };

  const results: any[] = [];

  for (const recipient of recipients) {
    try {
      const info = await transporter.sendMail({ from, to: recipient, subject, html, envelope: { from, to: recipient } });
      const logDoc = { templateId: null, subject, html, recipient, result: { ok: true, info }, createdAt: new Date(), by };
      await db.collection('mail_logs').insertOne(logDoc as any);
      results.push({ recipient, ok: true, info });
    } catch (err: any) {
      const logDoc = { templateId: null, subject, html, recipient, result: { ok: false, error: String(err) }, createdAt: new Date(), by };
      try { await db.collection('mail_logs').insertOne(logDoc as any); } catch (e) { console.error('failed to write log', e); }
      results.push({ recipient, ok: false, error: String(err) });
    }
  }

  const overallOk = results.every((r: any) => r.ok);
  return { ok: overallOk, results, error: overallOk ? undefined : 'one_or_more_recipients_failed' };
}

export default sendMail;
