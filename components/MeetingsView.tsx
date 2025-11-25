"use client";
import React from 'react';
import Card from './ui/Card';
import MeetingCard from './MeetingCard';
import PageShell from './PageShell';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import CalendarAction from './CalendarAction';
import styled from 'styled-components';
import { TextInput } from './ui/Input';
import MeetingDialogContent from './MeetingDialogContent';
import TimeSelector from './TimeSelector';

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
  background: #066011ff;
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
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: wrap;
  white-space: normal;
  text-align: left;
  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
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

const ActionsWrap = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  width: 100%;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const ActionSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;

  @media (max-width: 640px) {
    width: 100%;
    align-items: stretch;
    justify-content: flex-start;
    > * {
      width: 100%;
      min-width: 0;
    }
  }
`;

const ActionButtonText = styled.span`
  flex: 1;
  min-width: 0;
  text-align: inherit;

  @media (max-width: 640px) {
    display: none;
  }
`;

export default function MeetingsView() {
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);
  const [open, setOpen] = React.useState(false);
  const [selectedMeeting, setSelectedMeeting] = React.useState<any | null>(null);
  const [viewMode, setViewMode] = React.useState<'all'|'upcoming'|'requested'|'completed'>('all');

  React.useEffect(()=>{ init(); }, []);

  async function init() {
    setLoading(true);
    try {
      async function fetchWithRetry(url:string, opts?: any, retries = 1, delay = 300) {
        try {
          const res = await fetch(url, opts);
          if ((res.status === 401 || res.status === 403) && retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, opts, retries - 1, delay);
          }
          return res;
        } catch (e) {
          if (retries > 0) { await new Promise(r => setTimeout(r, delay)); return fetchWithRetry(url, opts, retries - 1, delay); }
          throw e;
        }
      }

      const me = await fetchWithRetry('/api/auth/me', { credentials: 'same-origin' });
      if (!me.ok) { window.location.href = '/auth/login'; return; }
      const userData = await me.json();
      setCurrentUser(userData.user || userData);

      const md = await fetchWithRetry('/api/meetings', { credentials: 'same-origin' });
      if (!md.ok) { setMeetings([]); setLoading(false); return; }
      const d = await md.json(); setMeetings(d.meetings || []);
    } catch (e) { setMeetings([]); }
    setLoading(false);
  }

  async function createMeeting(e: React.FormEvent) {
    e.preventDefault();
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
      scheduledAt = new Date(dateVal + 'T' + t).toISOString();
    }
    const body: any = { title, type, link };
    if (scheduledAt) body.scheduledAt = scheduledAt;
    const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
    if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Error: '+JSON.stringify(d)); return; }
    alert('Requested'); init();
  }

  async function deleteMeeting(meeting: any) {
    const id = meeting._id || meeting.id;
    if (!id) {
      alert('Cannot delete: missing meeting id');
      return;
    }
    if (!confirm('Delete this meeting?')) return;
    try {
      const res = await fetch('/api/meetings/' + id, { method: 'DELETE', credentials: 'same-origin' });
      if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Delete failed: ' + (d.error || res.statusText)); return; }
      setSelectedMeeting(null);
      init();
    } catch (e) { alert('Error deleting'); }
  }

  async function patchMeetingAction(meetingId: string, action: string, opts: { scheduledAt?: string | null; link?: string | null; note?: string | null } = {}) {
    try {
      const body: any = { action };
      if (opts.scheduledAt) body.scheduledAt = opts.scheduledAt;
      if (opts.link) body.link = opts.link;
      if (opts.note) body.note = opts.note;
      const res = await fetch('/api/meetings/' + meetingId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
      if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Action failed: ' + (d.error || res.statusText)); return false; }
      await init();
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
          <DateInput value={date || ''} onChange={e => setDate(e.target.value)} />
          <TimeSelector name="time" value={time || ''} onChange={(v) => setTime(v)} />
        </div>
        <TextInput placeholder="Link (optional)" value={link || ''} onChange={e => setLink(e.target.value)} />
        <TextInput placeholder="Note (optional)" value={note || ''} onChange={e => setNote(e.target.value)} />
        <Button onClick={async () => { setWorking(true); await onAction('approve', { scheduledAt: buildScheduledAt(), link, note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-yes)' }}>Approve</Button>
        <Button onClick={async () => { setWorking(true); await onAction('schedule', { scheduledAt: buildScheduledAt(), link, note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-dark)' }}>Schedule</Button>
        <Button onClick={async () => { if (!confirm('Decline this meeting?')) return; setWorking(true); await onAction('decline', { note }); setWorking(false); }} disabled={working} style={{ background: 'var(--color-no)' }}>Decline</Button>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

    // calendar items: meetings — map statuses to central palette
    const calItems = meetings.map((m:any) => {
      const status = (m.status || '').toString().toLowerCase();
      let color = '#3D404C';
      if (status === 'requested' || status === 'pending') color = 'var(--color-pending)';
      else if (status === 'upcoming' || status === 'approved' || status === 'ongoing') color = '#526452';
      else if (status === 'completed' || status === 'done') color = '#6b7280';
      else if (status === 'declined' || status === 'rejected') color = '#865555';
      return { id: String(m._id || m.id), title: m.title || 'Meeting', from: m.scheduledAt || null, to: m.scheduledAt || null, color, type: 'meeting', status };
    });

    return (
      <PageShell title="Meetings" subtitle="Request and review meetings." actions={<ActionsWrap>
        <ActionSlot>
          <CalendarAction items={calItems} title="Meetings calendar" />
        </ActionSlot>
        <ActionSlot>
          <SquarePlus onClick={() => setOpen(true)} title="Request a meeting" aria-label="Request a meeting">
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 34, width: 34, flex: '0 0 auto' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="5" x2="12" y2="19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <ActionButtonText>Request a meeting</ActionButtonText>
          </SquarePlus>
        </ActionSlot>
      </ActionsWrap>}>
        <div>

      {open ? (
        <Dialog title="Request a meeting" onClose={() => setOpen(false)} borderColor={'rgba(44, 44, 44, 0.85)'} footer={<><FooterNeutral onClick={() => setOpen(false)} aria-label="Cancel">Cancel</FooterNeutral><FooterPrimary type="submit" form="create-meeting-form" aria-label="Request meeting">Request</FooterPrimary></>}>
          {/** Vertical, uniform form matching site inputs */}
          <form id="create-meeting-form" onSubmit={createMeeting} style={{ display: 'grid', gap: 12, marginTop: 8, padding: 14, borderRadius: 10 }}>
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
            <div>
              <small style={{ color: 'rgba(180,180,178,0.75)' }}>We'll prefill fields where possible based on your account and previous requests.</small>
            </div>
          </form>
        </Dialog>
      ) : null}

      <div style={{ marginTop: 12, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button onClick={() => setViewMode('all')} style={{ background: viewMode==='all' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>All</Button>
        <Button onClick={() => setViewMode('upcoming')} style={{ background: viewMode==='upcoming' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Upcoming</Button>
        <Button onClick={() => setViewMode('requested')} style={{ background: viewMode==='requested' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Requested</Button>
        <Button onClick={() => setViewMode('completed')} style={{ background: viewMode==='completed' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Completed</Button>
      </div>

      {meetings.length === 0 ? <p>No meetings</p> : (
        (() => {
          const now = Date.now();
          const lower = (s?: any) => (s || '').toString().toLowerCase();
          let filtered = meetings.slice();
          if (viewMode === 'requested') {
            filtered = meetings.filter((m:any) => ['requested','pending'].includes(lower(m.status)));
          } else if (viewMode === 'completed') {
            filtered = meetings.filter((m:any) => ['completed','done','closed'].includes(lower(m.status)));
          } else if (viewMode === 'upcoming') {
            filtered = meetings.filter((m:any) => {
              const ms = m.scheduledAt ? new Date(m.scheduledAt).getTime() : null;
              return ms && ms > now && !['completed','done','declined','closed'].includes(lower(m.status));
            }).sort((a:any,b:any) => (new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime()));
          }

          // Render the same simple TileCard list but always as a single column (1*n)
          return (
            <div style={{ display: 'grid', gap: 20, paddingTop: 18, gridTemplateColumns: '1fr' }}>
              {filtered.map(m=> (
                <div key={m._id || m.id} style={{ width: '100%' }}>
                  <MeetingCard meeting={{
                    _id: m._id,
                    id: m.id,
                    title: m.title,
                    date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : (m.date || ''),
                    time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString() : (m.time || ''),
                    participants: m.participants || [],
                    link: m.link,
                    requestedBy: (m.requestedBy && (m.requestedBy.name || m.requestedBy.id)) || m.requestedBy || undefined,
                    status: m.status || '—'
                  }} onClick={() => setSelectedMeeting(m)} />
                </div>
              ))}
            </div>
          );
        })()
      )}

      {selectedMeeting ? (
            <Dialog title={selectedMeeting.title || 'Meeting'} onClose={() => setSelectedMeeting(null)} borderColor={'rgba(44, 44, 44, 0.85)'} footer={<> <Button onClick={() => setSelectedMeeting(null)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button> </>}>
              <div style={{ padding: 8 }}>
                <MeetingDialogContent meeting={selectedMeeting} currentUser={currentUser} onAction={async (action:string, opts?:any) => { const ok = await patchMeetingAction(String(selectedMeeting._id || selectedMeeting.id), action, opts); if (ok) setSelectedMeeting(null); return ok; }} onDelete={async (m:any) => { if (!m._id && !m.id) return; const id = m._id || m.id; await fetch('/api/meetings/' + id, { method: 'DELETE' }); setSelectedMeeting(null); init(); }} />
              </div>
            </Dialog>
      ) : null}
      </div>
    </PageShell>
    );
}
