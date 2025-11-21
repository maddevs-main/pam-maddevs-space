// Legacy-compatible mail template helpers ported from public/maddevs-space
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGO_URL = BASE_URL + '/assets/media/logo-main.png';
const MAIL_TOP_URL = BASE_URL + '/assets/media/mail-top.png';

function meetingCredentialsTable(data: any, showMeetingLink = true) {
  const safe = (v: any) => (v ? String(v) : '-');
  return `
    <table style="width:100%; border-collapse:collapse; font-family: sans-serif; font-size:15px; color:#222; margin-top:12px;">
      <tr style="background:#eee; color:#111; font-weight:bold;">
        <td style="padding:6px 8px;">Meeting Details</td>
        <td style="padding:6px 8px;"> </td>
      </tr>
      <tr><td style="padding:4px 8px;">Name</td><td style="padding:4px 8px;">${safe(data.name)}</td></tr>
      <tr><td style="padding:4px 8px;">Email</td><td style="padding:4px 8px;">${safe(data.email)}</td></tr>
      <tr><td style="padding:4px 8px;">Organisation</td><td style="padding:4px 8px;">${safe(data.organisation)}</td></tr>
      <tr><td style="padding:4px 8px;">Title</td><td style="padding:4px 8px;">${safe(data.title)}</td></tr>
      <tr><td style="padding:4px 8px;">Message</td><td style="padding:4px 8px;">${safe(data.message)}</td></tr>
      <tr><td style="padding:4px 8px;">Date</td><td style="padding:4px 8px;">${safe(data.date)}</td></tr>
      <tr><td style="padding:4px 8px;">Time</td><td style="padding:4px 8px;">${safe(data.time)}</td></tr>
      <tr><td style="padding:4px 8px;">Meeting ID</td><td style="padding:4px 8px;">${safe(data.meetingId)}</td></tr>
      ${showMeetingLink ? `<tr><td style="padding:4px 8px;">Meeting Link</td><td style="padding:4px 8px;">${data.meeting_link ? `<a href='${data.meeting_link}' style='color:#0a112f;text-decoration:underline;'>${safe(data.meeting_link)}</a>` : '-'}</td></tr>` : ''}
    </table>
  `;
}

function footer() {
  const domain = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const mailFrom = process.env.MAIL_FROM || `mail@${domain.replace(/^www\./, '')}`;
  const phone = process.env.MAIL_PHONE || '+91 9211918520';
  return `
    <tr>
      <td colspan="2" style="background:#111; color:#fff; padding:18px 12px; text-align:center; font-size:13px; font-family:sans-serif;">
        ${domain} &nbsp;|&nbsp; ${mailFrom} &nbsp;|&nbsp; ${phone}
      </td>
    </tr>
  `;
}

function mailTemplate({ intro, meetingData, extraContent, showMeetingLink = true }: any) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EB; font-family:sans-serif; max-width:600px; margin:auto; border-radius:0; overflow:hidden;">
      <tr>
        <td style="padding:0;">
          <img src="${MAIL_TOP_URL}" alt="Mail Header" style="width:100%; display:block; max-width:600px; height:auto; margin:0; padding:0; border:none;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:none; background:transparent;">
            <tr>
              <td style="padding:32px 24px 16px 24px; vertical-align:top;">
                <p style="margin:0 0 18px 0; color:#222; font-size:16px;">${intro}</p>
                ${meetingCredentialsTable(meetingData, showMeetingLink)}
                ${extraContent ? `<div style='margin-top:18px;'>${extraContent}</div>` : ''}
              </td>
              <td style="padding:24px 24px 0 0; text-align:right; vertical-align:top; width:1px;">
                <img src="${LOGO_URL}" alt="Logo" style="width:64px; height:auto; display:block; margin-left:auto;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${footer()}
    </table>
  `;
}

function getCalendarLinks({ name, email, organisation, title, message, date, time, meetingId }: any) {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  function pad(n: number) {
    return n < 10 ? '0' + n : '' + n;
  }
  function formatCalDate(d: Date) {
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      '00Z'
    );
  }
  const startStr = formatCalDate(start);
  const endStr = formatCalDate(end);
  const details = encodeURIComponent(
    `Organisation: ${organisation}\nTitle: ${title}\nMessage: ${message}\nMeeting ID: ${meetingId}`
  );
  const location = encodeURIComponent('Online');
  const gcal = `https://www.google.com/calendar/render?action=TEMPLATE&text=Onboarding+Meeting+with+${encodeURIComponent(name)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  const ical = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
  VERSION:2.0
  BEGIN:VEVENT
  SUMMARY:Onboarding Meeting with ${encodeURIComponent(name)}
  DESCRIPTION:${encodeURIComponent(details)}
  DTSTART:${startStr}
  DTEND:${endStr}
  LOCATION:${encodeURIComponent(location)}
  END:VEVENT
  END:VCALENDAR`.replace(/\n/g, '%0A');
  return { gcal, ical };
}

export function getOnboardCongratsMailHTML(data: any) {
  return mailTemplate({
    intro: `Dear ${data.name || 'User'},<br><br>Thank you for submitting your onboarding request. We’ve received it successfully and are currently reviewing the details. Once approved, we’ll share your meeting link along with the details below.<br><br>We look forward to working with you.<br>Best regards,<br>maddevs`,
    meetingData: data,
    showMeetingLink: true,
  });
}

export function getMeetingRequestMailHTML(data: any) {
  return mailTemplate({
    intro: `A new onboarding meeting request has been submitted. Please review the details below.<br><br>Please respond at your earliest convenience.`,
    meetingData: data,
    showMeetingLink: false,
  });
}

export function getOnboardConfirmedMailHTML(data: any) {
  const { gcal, ical } = getCalendarLinks(data);
  return mailTemplate({
    intro: `Dear ${data.name || 'User'},<br><br>Your onboarding meeting is confirmed. Please find the details below and add the event to your calendar.<br><br>Looking forward to meeting you.<br>maddevs`,
    meetingData: data,
    extraContent: `<span style='font-size:15px;'>Add to calendar:</span><br>
      <a href="${gcal}" style="color:#0a112f; text-decoration:underline;">Google Calendar</a> &nbsp;|&nbsp;
      <a href="${ical}" download="meeting.ics" style="color:#0a112f; text-decoration:underline;">Apple Calendar (ICS)</a>`,
    showMeetingLink: true,
  });
}

export function getOnboardRejectedMailHTML(data: any) {
  return mailTemplate({
    intro: `Dear ${data.name || 'User'},<br><br>We regret to inform you that your onboarding meeting request was not approved. Please contact us for further information.<br><br>Best regards,<br>maddevs`,
    meetingData: data,
    showMeetingLink: true,
  });
}

export function getOnboardDoneMailHTML(data: any) {
  return mailTemplate({
    intro: `Dear ${data.name || 'User'},<br><br>Your onboarding meeting has been marked as completed. Thank you for your participation.<br><br>Best regards,<br>maddevs`,
    meetingData: data,
    showMeetingLink: true,
  });
}

export function getMeetingStatusMailHTML(data: any, status: string) {
  return mailTemplate({
    intro: `The following meeting has been updated to status: <b>${status}</b>.<br><br>Best regards,<br>maddevs`,
    meetingData: data,
    showMeetingLink: true,
  });
}

export default {
  getOnboardCongratsMailHTML,
  getMeetingRequestMailHTML,
  getOnboardConfirmedMailHTML,
  getOnboardRejectedMailHTML,
  getOnboardDoneMailHTML,
  getMeetingStatusMailHTML,
};
