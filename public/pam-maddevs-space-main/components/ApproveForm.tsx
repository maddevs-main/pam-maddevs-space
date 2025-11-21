"use client";
import React from 'react';
import Button from './ui/Button';
import { TextInput } from './ui/Input';
import TimeSelector from './TimeSelector';

export default function ApproveForm({ meeting, onAction, editable, users, currentUserIsAdmin }: { meeting: any, onAction: (action: string, opts?: any) => Promise<boolean>, editable?: boolean, users?: any[], currentUserIsAdmin?: boolean }) {
  const [date, setDate] = React.useState<string | null>(meeting.scheduledAt ? (new Date(meeting.scheduledAt)).toISOString().slice(0,10) : null);
  const [time, setTime] = React.useState<string | null>(meeting.scheduledAt ? (new Date(meeting.scheduledAt)).toTimeString().slice(0,5) : null);
  const [link, setLink] = React.useState<string | null>(meeting.link || null);
  const [note, setNote] = React.useState<string | null>(meeting.note || null);
  const [title, setTitle] = React.useState<string>(meeting.title || '');
  const [type, setType] = React.useState<string>(meeting.type || 'discovery');
  const [attendees, setAttendees] = React.useState<string[]>(meeting.attendees || meeting.participants || []);
  const [working, setWorking] = React.useState(false);

  function buildScheduledAt() {
    if (!date) return null;
    let t = time || null;
    if (!t) t = '00:00';
    try { return new Date(date + 'T' + t).toISOString(); } catch (e) { return null; }
  }

  async function doAction(action: string) {
    setWorking(true);
    const payload: any = { scheduledAt: buildScheduledAt(), link, note };
    if (editable) {
      payload.title = title;
      payload.type = type;
      if (attendees && Array.isArray(attendees)) payload.attendees = attendees;
    }
    const ok = await onAction(action, payload);
    setWorking(false);
    return ok;
  }

  // Vertical boxed layout when editable or when used as main approval UI
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {editable ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Title</label>
            <TextInput value={title} onChange={e => setTitle((e.target as HTMLInputElement).value)} />
          </div>
          {currentUserIsAdmin ? (
            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Send To (select users)</label>
              <select multiple value={attendees} onChange={e => setAttendees(Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, minHeight: 120 }}>
                {(users || []).map(u => (<option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>))}
              </select>
            </div>
          ) : null}
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Type</label>
            <select value={type} onChange={e => setType((e.target as HTMLSelectElement).value)} style={{ padding: '8px 10px', borderRadius: 6 }}>
              <option value="discovery">discovery</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Date</label>
          <input type="date" value={date || ''} onChange={e => setDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Time</label>
          <TimeSelector name="time" value={time || ''} onChange={(v) => setTime(v)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Link (optional)</label>
          <TextInput placeholder="Link (optional)" value={link || ''} onChange={e => setLink(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Note (optional)</label>
          <TextInput placeholder="Note (optional)" value={note || ''} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={async () => doAction('approve')} disabled={working} style={{ background: 'var(--color-yes)' }}>Approve</Button>
        <Button onClick={async () => doAction('schedule')} disabled={working} style={{ background: 'var(--color-dark)' }}>Schedule</Button>
        <Button onClick={async () => { if (!confirm('Decline this meeting?')) return; await doAction('decline'); }} disabled={working} style={{ background: 'var(--color-no)' }}>Decline</Button>
      </div>
    </div>
  );
}
