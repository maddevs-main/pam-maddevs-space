"use client";
import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { TextInput } from './ui/Input';
import TimeSelector from './TimeSelector';

export default function MeetingForm({ initial, mode = 'create', meetingId, onDone, users, adminMode }: { initial?: any, mode?: 'create'|'edit', meetingId?: string|number, onDone?: (result?: any)=>void, users?: any[], adminMode?: boolean }) {
  const [title, setTitle] = React.useState(initial?.title || '');
  const [type, setType] = React.useState(initial?.type || 'discovery');
  const [link, setLink] = React.useState(initial?.link || '');
  const [date, setDate] = React.useState<string | null>(initial?.scheduledAt ? (new Date(initial.scheduledAt)).toISOString().slice(0,10) : null);
  const [time, setTime] = React.useState<string | null>(initial?.scheduledAt ? (new Date(initial.scheduledAt)).toTimeString().slice(0,5) : null);
  const [message, setMessage] = React.useState<string|null>(null);
  const [attendees, setAttendees] = React.useState<string[]>(initial?.attendees || []);

  React.useEffect(()=>{
    setTitle(initial?.title || ''); setType(initial?.type || 'discovery'); setLink(initial?.link || '');
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setMessage(null);
    function buildScheduledAt() {
      if (!date) return null;
      let t = time || null;
      if (!t) t = '00:00';
      try { return new Date(date + 'T' + t).toISOString(); } catch (e) { return null; }
    }

    const scheduledAt = buildScheduledAt();
    const body: any = { title, type, link };
    if (attendees && Array.isArray(attendees) && attendees.length) body.attendees = attendees;
    if (scheduledAt) body.scheduledAt = scheduledAt;
    try {
      let res: Response;
      if (mode === 'create') res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      else {
        // If editing and a scheduledAt was provided, call PATCH with `schedule` action to set meeting time/link
        if (body.scheduledAt) {
          res = await fetch('/api/meetings/' + meetingId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'schedule', scheduledAt: body.scheduledAt, link: body.link }) });
        } else {
          // fallback to generic update (server may or may not handle this action)
          res = await fetch('/api/meetings/' + meetingId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', payload: body }) });
        }
      }
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage(JSON.stringify(data)); return; }
      setMessage(mode === 'create' ? 'Requested' : 'Saved');
      if (onDone) onDone(data);
    } catch (err) { setMessage('Error: '+String(err)); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
      <Card classic>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Title</label>
          <TextInput value={title} onChange={e=>setTitle((e.target as HTMLInputElement).value)} />
        </div>
        {adminMode ? (
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Send To (select users)</label>
            <select multiple value={attendees} onChange={e => setAttendees(Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, minHeight: 120 }}>
              {(users || []).map(u => (<option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>))}
            </select>
            <div style={{ marginTop: 8 }}><small style={{ color: 'rgba(180,180,178,0.8)' }}>Hold Ctrl/Cmd (or use shift) to select multiple recipients.</small></div>
          </div>
        ) : null}
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Date</label>
          <input type="date" value={date || ''} onChange={e=>setDate((e.target as HTMLInputElement).value)} style={{ padding: '8px 10px', borderRadius: 6, width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Time</label>
          <TimeSelector name="time" value={time || ''} onChange={(v) => setTime(v)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Type</label>
          <select value={type} onChange={e=>setType((e.target as HTMLSelectElement).value)} style={{ padding: '8px 10px', borderRadius: 6 }}>
            <option value="discovery">discovery</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Link (optional)</label>
          <TextInput value={link} onChange={e=>setLink((e.target as HTMLInputElement).value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="submit">{mode === 'create' ? 'Request' : 'Save'}</Button>
        </div>
        {message ? <div style={{ marginTop: 8 }}>{message}</div> : null}
      </Card>
    </form>
  );
}
