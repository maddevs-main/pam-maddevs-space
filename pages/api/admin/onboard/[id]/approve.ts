import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../../lib/mongodb';
import { requireJwtAuth } from '../../../../../lib/auth';
import sendMail from '../../../../../lib/sendMail';
import {
  getOnboardConfirmedMailHTML,
  getOnboardRejectedMailHTML,
  getMeetingStatusMailHTML,
} from '../../../../../lib/mailTemplates';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'missing_id' });
  const { db } = await connectToDatabase();
  try {
    const oId = new ObjectId(String(id));
    const body = req.body || {};
    const approved = !!body.approved;
    const meeting_link = body.meeting_link || null;
    await db.collection('onboards').updateOne({ _id: oId }, { $set: { approved, meeting_link, updated_at: new Date() } });
        
        // Try to send notification emails (client + admin)
        try {
          // fetch onboard row to get client email/name
          const onboard = await db.collection('onboards').findOne({ _id: oId });
          const recipients: string[] = [];
          if (onboard && onboard.email) recipients.push(String(onboard.email));

          // fetch admin user email
          const authUser: any = (req as any).auth;
          if (authUser && authUser.userId) {
            try {
              const adminUser = await db.collection('users').findOne({ _id: new ObjectId(String(authUser.userId)) });
              if (adminUser && adminUser.email) recipients.push(String(adminUser.email));
            } catch (e) {
              // ignore
            }
          }

          // attempt to use a mail template named for onboard approvals if present
          let subject = approved ? 'Your meeting has been approved' : 'Your meeting has been rejected';
          let html = approved
            ? `<p>Your meeting request has been <strong>approved</strong>.</p>${meeting_link ? `<p>Meeting link: <a href="${meeting_link}">${meeting_link}</a></p>` : ''}`
            : '<p>Your meeting request has been <strong>rejected</strong>.</p>';

          try {
            const tmplName = approved ? 'onboard-approved' : 'onboard-rejected';
            const tmpl = await db.collection('mail_templates').findOne({ name: tmplName });
            if (tmpl) {
              subject = tmpl.subject || subject;
              html = tmpl.html || html;
            } else {
              // fallback to legacy HTML builder that includes calendar links when approved
              if (approved) {
                html = getOnboardConfirmedMailHTML(onboard);
                subject = `meeting confirmed - ${onboard?.organisation || ''} - ${onboard?.name || ''}`;
              } else {
                html = getOnboardRejectedMailHTML(onboard);
                subject = `meeting denied - ${onboard?.organisation || ''} - ${onboard?.name || ''}`;
              }
            }
          } catch (e) {
            // ignore template lookup errors and use defaults above
            if (approved) html = getOnboardConfirmedMailHTML(onboard);
            else html = getOnboardRejectedMailHTML(onboard);
          }

          if (recipients.length) {
            await sendMail({ db, recipients, subject, html, by: authUser && authUser.userId ? String(authUser.userId) : null });
          }

          // also notify internal admin mailbox (MAIL_FROM) about the status change
          try {
            const internal = process.env.MAIL_FROM;
            if (internal) {
              const statusHtml = getMeetingStatusMailHTML(onboard, approved ? 'Confirmed' : 'Rejected');
              const statusSubject = `onboard ${approved ? 'Confirmed' : 'Rejected'} - ${onboard?.name || ''}`;
              await sendMail({ db, recipients: [internal], subject: statusSubject, html: statusHtml, by: authUser && authUser.userId ? String(authUser.userId) : null });
            }
          } catch (e) {
            // ignore internal notification errors
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

export default requireJwtAuth(handler, ['admin']);
