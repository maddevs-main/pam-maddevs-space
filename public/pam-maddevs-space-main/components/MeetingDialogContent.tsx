"use client";
import React from 'react';
import MeetingCard from './MeetingCard';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import ApproveForm from './ApproveForm';

export default function MeetingDialogContent({ meeting, currentUser, onAction, onDelete }: { meeting: any, currentUser: any, onAction: (action: string, opts?: any) => Promise<boolean>, onDelete?: (m:any)=>Promise<void> }) {
  // determine roles/relations
  const userId = currentUser?.id || currentUser?._id || currentUser?.userId;
  const role = currentUser?.role || currentUser?.type || 'consumer';
  const isAdmin = role === 'admin';
  const isRequester = meeting.requestedBy && String(meeting.requestedBy.id) === String(userId);
  const isAttendee = meeting.attendees && Array.isArray(meeting.attendees) && userId && meeting.attendees.includes(userId);

  const status = (meeting.status || '').toString().toLowerCase();

  // Respond view: requested and user is admin or attendee
  if (status === 'requested' && (isAdmin || isAttendee)) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div><strong>Respond to meeting request</strong></div>
        <div style={{ padding: 8, borderRadius: 8, background: 'rgba(30,30,30,0.28)' }}>
          <ApproveForm meeting={meeting} onAction={onAction} editable={isAdmin} currentUserIsAdmin={isAdmin} />
        </div>
      </div>
    );
  }

  // View-only: show meeting details and actions for requester (edit/delete) or admin
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ color: 'rgba(110,118,129,0.95)' }}>Use this meeting link at the scheduled time for the meeting.</div>
      <div>
        {meeting.link ? (
          <a href={meeting.link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-dark)', fontWeight: 700, textDecoration: 'underline' }}>{meeting.link}</a>
        ) : (<div style={{ color: 'rgba(180,180,178,0.9)' }}>No meeting link provided.</div>)}
      </div>
      <div style={{ color: 'rgba(180,180,178,0.95)' }}>
        <strong style={{ color: 'rgba(255,255,255,0.95)', marginRight: 8 }}>Meeting ID:</strong>
        {(meeting._id || meeting.id) ? (meeting._id || meeting.id) : '—'}
      </div>

      <MeetingCard meeting={{ _id: meeting._id, id: meeting.id, title: meeting.title, date: meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString() : (meeting.date || ''), time: meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleTimeString() : (meeting.time || ''), participants: meeting.participants || meeting.attendees || [], link: meeting.link, requestedBy: meeting.requestedBy, status: meeting.status || '—' }} />

      <InlineActions />
    </div>
  );

  function InlineActions() {
    const [editing, setEditing] = React.useState(false);
    const scheduledAt = meeting?.scheduledAt ? new Date(meeting.scheduledAt).getTime() : null;
    const now = Date.now();
    const hideDelete = scheduledAt ? (scheduledAt - now <= 30 * 60 * 1000) : false;

    if (editing) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(30,30,30,0.12)' }}>
            <ApproveForm meeting={meeting} onAction={async (action, opts) => {
              // if action is 'approve' or 'schedule' or 'decline' just pass through
              const ok = await onAction(action, opts);
              if (ok) setEditing(false);
              return ok;
            }} editable={true} currentUserIsAdmin={isAdmin} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setEditing(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        { isAdmin ? (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        ) : null }
        { (isRequester || isAdmin) && !hideDelete ? (
          <Button onClick={async () => { if (!confirm('Delete this meeting?')) return; if (onDelete) await onDelete(meeting); }}>Delete</Button>
        ) : null }
      </div>
    );
  }
}
