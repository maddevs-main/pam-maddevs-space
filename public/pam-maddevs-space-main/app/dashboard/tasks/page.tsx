"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '../../../components/ui/Card';
import TileCard from '../../../components/TileCard';
import Button from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/Input';
import RichTextEditor from '../../../components/ui/RichTextEditor';
import PageShell from '../../../components/PageShell';
import CalendarAction from '../../../components/CalendarAction';
import styled from 'styled-components';
import Dialog from '../../../components/ui/Dialog';

export default function TasksPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  function onCreated() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <PageShell title="Tasks" subtitle="Manage and create tasks here." actions={<HeaderActions onCreated={onCreated} />}>
      <div>
        <TaskList refreshKey={refreshKey} />
      </div>
    </PageShell>
  );
}

function CreateTaskButton({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);

  const SquarePlus = styled.button`
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 10px;
    background: rgba(var(--color-yes-rgb),0.90);
    border: 1px solid rgba(0,0,0,0.08);
    color: ${(p:any) => p.theme?.colors?.light || '#fff'};
    cursor: pointer;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 14px;
    transition: background 140ms ease, transform 120ms ease;
      svg, img { display: block; width: 70px; height: 70px; }
      &:hover { background: var(--color-yes); transform: translateY(-2px); }
    &:active { transform: translateY(0); }
    &:focus-visible { outline: 3px solid rgba(255,255,255,0.06); outline-offset: 3px; }
  `;

  return (
    <>
      <SquarePlus aria-label="Create task request" title="Create task request" onClick={() => setOpen(true)}>
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 34, width: 34 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ pointerEvents: 'none' }}>Create a task request</span>
      </SquarePlus>
      {open ? (
        <Dialog title="Create a task request" onClose={() => setOpen(false)} borderColor={'rgba(44, 44, 44, 0.85)'}>
          <CreateTaskForm onDone={() => { setOpen(false); onCreated && onCreated(); }} />
        </Dialog>
      ) : null}
    </>
  );
}

function HeaderActions({ onCreated }: { onCreated?: () => void }) {
  const [tasks, setTasks] = React.useState<any[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/tasks');
        if (!r.ok) return;
        const d = await r.json();
        if (!mounted) return;
        setTasks(d.tasks || []);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const calItems = tasks.map(t => ({ id: String(t._id || t.id), title: t.title || 'Task', from: t.dueDate || t.createdAt || null, to: t.dueDate || t.createdAt || null, color: 'rgb(59,130,246)', type: 'task' }));

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <CalendarAction items={calItems as any} title="Tasks calendar" />
      <div style={{ display: 'flex', alignItems: 'center' }}><CreateTaskButton onCreated={onCreated} /></div>
    </div>
  );
}

function CreateTaskForm({ onDone }: { onDone?: () => void }) {
  const [title, setTitle] = React.useState('');
  const [descriptionHtml, setDescriptionHtml] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const body: any = {
      title,
      description: descriptionHtml,
      timeline: { from: startDate || null, to: endDate || null }
    };
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data));
    else {
      setMessage('Task requested');
      setShowSuccess(true);
      setTitle(''); setDescriptionHtml(''); setStartDate(''); setEndDate('');
    }
  }

  return (
    <form onSubmit={handleCreate} style={{ marginTop: 8, display: 'grid', gap: 8 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Title</label>
        <TextInput placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
        <div style={{ border: '1px solid rgba(44,44,44,0.85)', borderRadius: 8, padding: 8 }}>
          <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} placeholder="Description" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Start</label>
          <TextInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>End</label>
          <TextInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
        <Button onClick={() => { setMessage(null); if (onDone) onDone(); }} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
        <button type="submit" aria-label="Request Task" style={{ height: 44, borderRadius: 10, background: 'rgba(var(--color-yes-rgb),0.90)', border: 'none', color: '#fff', padding: '0 14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="4" width="14" height="14" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
            <path d="M7 8h8M7 12h8M7 16h4" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Request Task
        </button>
      </div>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
      {showSuccess ? (
        <Dialog title="Task requested" onClose={() => { setShowSuccess(false); if (onDone) onDone(); }} footer={<><Button onClick={() => { setShowSuccess(false); if (onDone) onDone(); }}>OK</Button></>}>
          <div style={{ paddingTop: 8 }}>
            <p>The task has been requested.</p>
            <p>You will be notified when it is scheduled and assigned.</p>
          </div>
        </Dialog>
      ) : null}
    </form>
  );
}

function TaskList({ refreshKey }: { refreshKey?: number }) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { fetchList(); }, [refreshKey]);

  async function fetchList() {
    setLoading(true);
    try {
      const [taskRes, userRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/users/me')]);
      let tasksData: any[] = [];
      let userData: any = null;
      if (taskRes.ok) {
        const d = await taskRes.json();
        tasksData = d.tasks || [];
      }
      if (userRes.ok) {
        const ud = await userRes.json();
        userData = ud?.user || ud;
      }
      const filtered = filterTasksForUser(tasksData, userData);
      setTasks(filtered);
    } catch (e) {
      setTasks([]);
    }
    setLoading(false);
  }

  function filterTasksForUser(tasks:any[], user:any) {
    if (!user) return tasks;
    const uid = user.id || user._id || user.userId || user?.sub;
    const role = user.role || user?.type || 'consumer';
    if (role === 'admin') return tasks;

    if (role === 'staff') {
      return tasks.filter(t => {
        const people = t.people_allocated || t.peopleAllocated || t.staff || [];
        if (Array.isArray(people) && people.length > 0) {
          return people.some((pp:any) => {
            if (!pp) return false;
            if (typeof pp === 'string') return String(pp) === String(uid);
            return String(pp?.id || pp?._id) === String(uid);
          });
        }
        return String(t.author?.id || t.author?._id) === String(uid);
      });
    }

    return tasks.filter(t => String(t.author?.id || t.author?._id) === String(uid));
  }

  if (loading) return <p>Loading tasks...</p>;
  if (tasks.length === 0) return <p>No tasks</p>;
  return (
    <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          {tasks.map(t => {
        const stages = t.stages || [];
        const avgStage = stages.length ? Math.round(stages.reduce((s:any, n:any) => s + (Number(n.progress) || 0), 0) / stages.length) : null;
        const currentIndex = stages.findIndex((s:any) => (Number(s.progress) || 0) < 100);
        const currentStageIndex = currentIndex === -1 ? (stages.length ? stages.length - 1 : -1) : currentIndex;
        const currentStageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 0;
        const currentStageProgress = currentStageIndex >= 0 ? Number(stages[currentStageIndex].progress || 0) : 0;
            return (
          <div key={t._id}>
            <TileCard
              meeting={{
                _id: t._id,
                title: t.title,
                date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''),
                time: t.dueDate ? new Date(t.dueDate).toLocaleTimeString() : '',
                timelineRange: (t.timeline && t.timeline.from && t.timeline.to) ? `${new Date(t.timeline.from).toLocaleDateString()} — ${new Date(t.timeline.to).toLocaleDateString()}` : (t.timeline && t.timeline.from ? new Date(t.timeline.from).toLocaleDateString() : undefined),
                requestedBy: undefined,
                status: t.completed ? 'completed' : (t.status_internal || t.status?.text || 'unknown')
              }}
              onClick={() => router.push(`/dashboard/tasks/${t._id}`)}
              active={t.completed ? 'completed' : undefined}
              rightAction={<Link href={`/dashboard/tasks/${t._id}`} style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span></Link>}
              avgProgress={avgStage ?? undefined}
              stagesCount={stages.length}
            />
          </div>
        );
      })}
    </div>
  );
}
