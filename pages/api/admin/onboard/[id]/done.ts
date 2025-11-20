import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';
import sendMail from '../../../../../lib/sendMail';
import { getOnboardDoneMailHTML, getMeetingStatusMailHTML } from '../../../../../lib/mailTemplates';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });
  const { db } = await connectToDatabase();
  try {
    const oId = new ObjectId(String(id));
    const body = req.body || {};
    const done = !!body.done;
    await db.collection('onboards').updateOne({ _id: oId }, { $set: { done, updated_at: new Date() } });

    // send notification that meeting is complete
    try {
      const onboard = await db.collection('onboards').findOne({ _id: oId });
      const recipients: string[] = [];
      if (onboard && onboard.email) recipients.push(String(onboard.email));
      const authUser: any = (req as any).auth;
      if (authUser && authUser.userId) {
        try {
          const adminUser = await db.collection('users').findOne({ _id: new ObjectId(String(authUser.userId)) });
          if (adminUser && adminUser.email) recipients.push(String(adminUser.email));
        } catch (e) {}
      }

      let subject = 'Meeting completed';
      let html = '<p>The meeting has been marked complete.</p>';
      try {
        const tmpl = await db.collection('mail_templates').findOne({ name: 'onboard-completed' });
        if (tmpl) {
          subject = tmpl.subject || subject;
          html = tmpl.html || html;
        } else {
          html = getOnboardDoneMailHTML(onboard);
          subject = `meeting completed - ${onboard?.organisation || ''} - ${onboard?.name || ''}`;
        }
      } catch (e) {
        html = getOnboardDoneMailHTML(onboard);
      }

      if (recipients.length) {
        await sendMail({ db, recipients, subject, html, by: authUser && authUser.userId ? String(authUser.userId) : null });
      }

      // also notify internal admin mailbox (MAIL_FROM)
      try {
        const internal = process.env.MAIL_FROM;
        if (internal) {
          const statusHtml = getMeetingStatusMailHTML(onboard, done ? 'Done' : 'Incomplete');
          const statusSubject = `onboard ${done ? 'Done' : 'Incomplete'} - ${onboard?.name || ''}`;
          await sendMail({ db, recipients: [internal], subject: statusSubject, html: statusHtml, by: authUser && authUser.userId ? String(authUser.userId) : null });
        }
      } catch (e) {
        console.error('internal mail failed', e);
      }
    } catch (e) {
      console.error('mail send failed', e);
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

export default requireAuth(handler, ['admin']);
