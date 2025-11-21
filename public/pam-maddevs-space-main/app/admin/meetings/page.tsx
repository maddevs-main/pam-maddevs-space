"use client";
import React from 'react';
import PageShell from '../../../components/PageShell';
import TileCard from '../../../components/TileCard';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import MeetingForm from '../../../components/MeetingForm';
import CalendarAction from '../../../components/CalendarAction';
import MeetingDialogContent from '../../../components/MeetingDialogContent';
import { TextInput } from '../../../components/ui/Input';
import TimeSelector from '../../../components/TimeSelector';
import styled from 'styled-components';

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [openCreate, setOpenCreate] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);
  const [users, setUsers] = React.useState<any[]>([]);

  React.useEffect(()=>{ load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const me = await fetch('/api/auth/me');
      if (me.ok) { const ud = await me.json(); setCurrentUser(ud.user || ud); }
      const res = await fetch('/api/meetings');
      if (!res.ok) { setMeetings([]); setLoading(false); return; }
      const d = await res.json(); setMeetings(d.meetings || []);
      try {
        const ures = await fetch('/api/users');
        if (ures.ok) { const ud = await ures.json(); setUsers(ud.users || ud || []); }
      } catch (e) { /* ignore */ }
    } catch (e) { setMeetings([]); }
    setLoading(false);
  }

  async function patchMeetingAction(meetingId: string, action: string, opts: { scheduledAt?: string | null; link?: string | null; note?: string | null } = {}) {
    try {
      const body: any = { action };
      if (opts.scheduledAt) body.scheduledAt = opts.scheduledAt;
      if (opts.link) body.link = opts.link;
      if (opts.note) body.note = opts.note;
      const res = await fetch('/api/meetings/' + meetingId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Action failed: ' + (d.error || res.statusText)); return false; }
      await load();
      return true;
    } catch (e) { alert('Error'); return false; }
  }

  function ApproveForm({ meeting, onAction }: { meeting: any; onAction: (action: string, opts?: any) => Promise<void> }) {
    const [date, setDate] = React.useState<string | null>(meeting.scheduledAt ? (new Date(meeting.scheduledAt)).toISOString().slice(0,10) : null);
    const [time, setTime] = React.useState<string | null>(meeting.scheduledAt ? (new Date(meeting.scheduledAt)).toTimeString().slice(0,5) : null);
    const [link, setLink] = React.useState<string | null>(meeting.link || null);
    const [note, setNote] = React.useState<string | null>(meeting.note || null);
    const [working, setWorking] = React.useState(false);

    function buildScheduledAt() {
      if (!date) return null;
      let t = time || null;
      if (!t) t = '00:00';
      try { return new Date(date + 'T' + t).toISOString(); } catch (e) { return null; }
    }

    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={date || ''} onChange={e => setDate(e.target.value)} />
          <TimeSelector name="time" value={time || ''} onChange={(v) => setTime(v)} />
        </div>
        <input placeholder="Link (optional)" value={link || ''} onChange={e => setLink(e.target.value)} style={{ width: 220 }} />
        <input placeholder="Note (optional)" value={note || ''} onChange={e => setNote(e.target.value)} style={{ width: 220 }} />
        <Button onClick={async () => { setWorking(true); await onAction('approve', { scheduledAt: buildScheduledAt(), link, note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-yes)' }}>Approve</Button>
        <Button onClick={async () => { setWorking(true); await onAction('schedule', { scheduledAt: buildScheduledAt(), link, note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-dark)' }}>Schedule</Button>
        <Button onClick={async () => { if (!confirm('Decline this meeting?')) return; setWorking(true); await onAction('decline', { note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-no)' }}>Decline</Button>
      </div>
    );
  }

  // styled inputs and buttons (match consumer meetings dialog)
  const Select = styled.select`
    background: transparent;
    color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
    border: 1px solid rgba(180,180,178,0.08);
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 16px;
    height: 44px;
    display: block;
    width: 100%;
    box-sizing: border-box;
    &:focus-visible { outline: 2px solid rgba(241,241,241,0.08); }
  `;

  const DateInput = styled(TextInput)`
    appearance: none;
    -webkit-appearance: none;
    padding-right: 40px;
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-image: url("data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23000'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Crect%20x='3'%20y='4'%20width='18'%20height='18'%20rx='2'/%3E%3Cpath%20d='M16%202v4M8%202v4M3%2010h18'/%3E%3C/svg%3E");
  `;

  const TimeInput = styled(TextInput)`
    appearance: none;
    -webkit-appearance: none;
  `;

  const SquarePlus = styled.button`
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 10px;
    background: var(--color-yes);
    border: 1px solid rgba(0,0,0,0.08);
    color: ${(p:any) => p.theme?.colors?.light || '#fff'};
    cursor: pointer;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 14px;
    transition: background 140ms ease, transform 120ms ease;
    &:hover { background: rgba(var(--color-yes-rgb),0.90); transform: translateY(-2px); }
    &:active { transform: translateY(0); }
    &:focus-visible { outline: 3px solid rgba(255,255,255,0.06); outline-offset: 3px; }
  `;

  const FooterNeutral = styled(SquarePlus)`
    background: transparent;
    border: 1px solid rgba(63, 63, 60, 0.08);
    color: ${(p:any) => p.theme?.colors?.light || '#fff'};
    padding: 8px 12px;
    height: 44px;
    font-weight: 700;
    font-size: 14px;
    gap: 8px;
    &:hover { background: rgba(255,255,255,0.02); transform: translateY(-1px); }
    &:active { transform: translateY(0); }
  `;

  const FooterPrimary = styled(SquarePlus)`
    background: rgba(255,255,255,0.06);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.08);
    padding: 8px 14px;
    height: 44px;
    font-weight: 700;
    font-size: 14px;
    gap: 10px;
    &:hover { background: rgba(255,255,255,0.09); transform: translateY(-1px); }
  `;

  if (loading) return <div style={{ padding: 12 }}>Loading...</div>;

  // compute calendar items (single-date meeting markers)
  const calItems = meetings.map((m:any) => ({ id: String(m._id || m.id), title: m.title || 'Meeting', from: m.scheduledAt || null, to: m.scheduledAt || null, color: (m.status === 'requested' ? 'var(--color-pending)' : (m.status === 'declined' ? '#865555' : '#526452')), type: 'meeting', status: m.status }));

  return (
    <PageShell title="Admin Meetings" subtitle="Review and manage meetings.">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Meetings</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <CalendarAction items={calItems} title="Meetings calendar" />
            <Button onClick={() => setOpenCreate(true)}>Request meeting</Button>
          </div>
        </div>

        {meetings.length === 0 ? <p>No meetings</p> : (
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {meetings.map(m=> (
              <TileCard key={m._id || m.id} meeting={{ _id: m._id, id: m.id, title: m.title, date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : (m.date || ''), time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString() : (m.time || ''), requestedBy: (m.requestedBy && (m.requestedBy.name || m.requestedBy.id)) || m.requestedBy || undefined, status: m.status || '—' }} onClick={() => setSelected(m)} rightAction={<div style={{ display: 'flex', gap: 8 }}><button onClick={(e)=>{ e.stopPropagation(); setSelected(m); setEditOpen(true); }} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.06)', padding: '6px 8px', borderRadius: 6 }}>Edit</button></div>} />
            ))}
          </div>
        )}

        {openCreate ? (
          <Dialog title="Request a meeting" onClose={() => setOpenCreate(false)} borderColor={'rgba(44, 44, 44, 0.85)'} footer={<><FooterNeutral onClick={() => setOpenCreate(false)} aria-label="Cancel">Cancel</FooterNeutral><FooterPrimary type="submit" form="create-meeting-form" aria-label="Request meeting">Request</FooterPrimary></>}>
            <form id="create-meeting-form" onSubmit={async (e) => { e.preventDefault();
                const f = (e.target as HTMLFormElement);
                const title = (f.querySelector('[name="title"]') as HTMLInputElement).value || 'Meeting';
                const type = (f.querySelector('[name="type"]') as HTMLSelectElement).value || 'discovery';
                const link = (f.querySelector('[name="link"]') as HTMLInputElement).value || null;
                const dateVal = (f.querySelector('[name="date"]') as HTMLInputElement)?.value || null;
                const timeVal = (f.querySelector('[name="time"]') as HTMLInputElement)?.value || null;
                let scheduledAt: string | null = null;
                if (dateVal) {
                  let t = timeVal || null;
                  if (!t) t = '00:00';
                  try { scheduledAt = new Date(dateVal + 'T' + t).toISOString(); } catch (err) { scheduledAt = null; }
                }
                const body: any = { title, type, link };
                if (scheduledAt) body.scheduledAt = scheduledAt;
                // collect attendees (admin can select)
                const attendeesEl = f.querySelector('[name="attendees"]') as HTMLSelectElement | null;
                if (attendeesEl) {
                  const vals = Array.from(attendeesEl.selectedOptions).map(o => o.value).filter(Boolean);
                  if (vals.length) body.attendees = vals;
                }
                try {
                  const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                  if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Error: '+JSON.stringify(d)); return; }
                  alert('Requested'); setOpenCreate(false); load();
                } catch (err) { alert('Error: '+String(err)); }
            }} style={{ display: 'grid', gap: 12, marginTop: 8, padding: 14, borderRadius: 10 }}>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Title</label>
                <TextInput name="title" placeholder="Title" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Type</label>
                <Select name="type">
                  <option value="discovery">discovery</option>
                  <option value="other">other</option>
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Link (optional)</label>
                <TextInput name="link" placeholder="link (optional)" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Date</label>
                <DateInput name="date" type="date" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Time</label>
                <TimeSelector name="time" />
              </div>
              {users && users.length ? (
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'rgba(180,180,178,0.9)' }}>Send To (select users)</label>
                  <select name="attendees" multiple style={{ width: '100%', padding: '8px 10px', borderRadius: 6, minHeight: 120 }}>
                    {users.map(u => (<option key={u.id || u._id} value={u.id || u._id}>{u.name || u.email || u.id || u._id}</option>))}
                  </select>
                  <div style={{ marginTop: 8 }}><small style={{ color: 'rgba(180,180,178,0.8)' }}>Hold Ctrl/Cmd (or use shift) to select multiple recipients.</small></div>
                </div>
              ) : null}
              <div>
                <small style={{ color: 'rgba(180,180,178,0.75)' }}>We'll prefill fields where possible based on your account and previous requests.</small>
              </div>
            </form>
          </Dialog>
        ) : null}

        {selected ? (
          <Dialog title={selected.title || 'Meeting'} onClose={() => setSelected(null)} footer={<><Button onClick={() => setSelected(null)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button></>}>
            <div style={{ padding: 8 }}>
              <MeetingDialogContent meeting={selected} currentUser={currentUser} onAction={async (action:string, opts?:any) => { const ok = await patchMeetingAction(String(selected._id || selected.id), action, opts); if (ok) setSelected(null); return ok; }} onDelete={async (m:any) => { if (!m._id && !m.id) return; const id = m._id || m.id; await fetch('/api/meetings/' + id, { method: 'DELETE' }); setSelected(null); load(); }} />
            </div>
          </Dialog>
        ) : null}

        {editOpen && selected ? (
          <Dialog title={`Edit: ${selected.title || ''}`} onClose={() => setEditOpen(false)} footer={<><Button onClick={() => setEditOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
            <MeetingForm initial={selected} mode="edit" meetingId={selected._id || selected.id} onDone={() => { setEditOpen(false); load(); }} />
          </Dialog>
        ) : null}
      </div>
    </PageShell>
  );
}

