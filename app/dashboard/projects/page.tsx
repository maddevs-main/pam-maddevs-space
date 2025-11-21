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

export default function ProjectsPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  function onCreated() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <PageShell title="Projects" subtitle="Manage and create projects here." actions={<HeaderActions onCreated={onCreated} />}>
      <div>
        <ProjectList refreshKey={refreshKey} />
      </div>
    </PageShell>
  );
}

function CreateProjectButton({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);

  const SquarePlus = styled.button`
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 10px;
    background: rgba(var(--color-yes-rgb),0.90); /* swapped: use hover color as default */
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
      <SquarePlus aria-label="Create project request" title="Create project request" onClick={() => setOpen(true)}>
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 34, width: 34 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ pointerEvents: 'none' }}>Create a project request</span>
      </SquarePlus>
      {open ? (
        <Dialog title="Create a project request" onClose={() => setOpen(false)} borderColor={'rgba(44, 44, 44, 0.85)'}>
          <CreateProjectForm onDone={() => { setOpen(false); onCreated && onCreated(); }} />
        </Dialog>
      ) : null}
    </>
  );
}

function HeaderActions({ onCreated }: { onCreated?: () => void }) {
  const [projects, setProjects] = React.useState<any[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/projects');
        if (!r.ok) return;
        const d = await r.json();
        if (!mounted) return;
        setProjects(d.projects || []);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const calItems = projects.map(p => ({ id: String(p._id || p.id), title: p.title || 'Project', from: p.timeline?.from || p.createdAt || null, to: p.timeline?.to || p.timeline?.from || null, color: 'rgb(59,130,246)', type: 'project' }));

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <CalendarAction items={calItems as any} title="Projects calendar" />
      <div style={{ display: 'flex', alignItems: 'center' }}><CreateProjectButton onCreated={onCreated} /></div>
    </div>
  );
}

function CreateProjectForm({ onDone }: { onDone?: () => void }) {
  const [title, setTitle] = React.useState('');
  const [descriptionHtml, setDescriptionHtml] = React.useState('');
  const [objectivesHtml, setObjectivesHtml] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [formMilestones, setFormMilestones] = React.useState<Array<{title:string,amount:string,paymentLink?:string}>>([]);
  const [formStages, setFormStages] = React.useState<Array<{name:string,progress:number}>>([]);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdProject, setCreatedProject] = React.useState<any>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    function parseObjectives(html:string){
      try{
        const doc = new DOMParser().parseFromString(html||'', 'text/html');
        const ul = doc.querySelector('ul');
        const ol = doc.querySelector('ol');
        if (ul || ol) return Array.from((ul||ol)!.querySelectorAll('li')).map(li=>li.textContent?.trim()||'');
        const text = doc.body.textContent||'';
        return text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      } catch(e){ return []; }
    }

    const body: any = {
      title,
      description: descriptionHtml,
      objectives: parseObjectives(objectivesHtml),
      timeline: { from: startDate || null, to: endDate || null },
      milestones: formMilestones.map(m => ({ title: m.title, amount: Number(m.amount || 0), paymentLink: m.paymentLink || '', confirmedByUser: 0, paidByAdmin: 0 })),
      stages: formStages.map(s => ({ name: s.name, progress: Number(s.progress || 0) }))
    };
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data));
    else {
      // For consumer dashboard flow we show a confirmation dialog that the project has been requested
      // and that a discovery meeting will be scheduled. The parent dialog will be closed when
      // the user dismisses this confirmation.
      setMessage('Project requested');
      setCreatedProject(data?.project || data);
      setShowSuccess(true);
      setTitle(''); setDescriptionHtml(''); setObjectivesHtml(''); setStartDate(''); setEndDate('');
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
      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Objectives (enter one per line or use list)</label>
        <div style={{ border: '1px solid rgba(44,44,44,0.85)', borderRadius: 8, padding: 8 }}>
          <RichTextEditor value={objectivesHtml} onChange={setObjectivesHtml} placeholder={"Objectives (one per line)"} />
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
      {/* Milestones and Stages inputs are intentionally hidden for consumer project requests in the dashboard flow. */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
        <Button onClick={() => { setMessage(null); if (onDone) onDone(); }} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
        <button type="submit" aria-label="Request Project" onMouseEnter={(e)=>{ (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-yes)'; }} onMouseLeave={(e)=>{ (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--color-yes-rgb),0.90)'; }} style={{ height: 44, borderRadius: 10, background: 'rgba(var(--color-yes-rgb),0.90)', border: 'none', color: '#fff', padding: '0 14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="4" width="14" height="14" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
            <path d="M7 8h8M7 12h8M7 16h4" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Request Project
        </button>
      </div>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
      {showSuccess ? (
        <Dialog title="Project requested" onClose={() => { setShowSuccess(false); if (onDone) onDone(); }} footer={<><Button onClick={() => { setShowSuccess(false); if (onDone) onDone(); }}>OK</Button></>}>
          <div style={{ paddingTop: 8 }}>
            <p>The project has been requested along with a discovery meeting.</p>
            <p>The process will move forward after the meeting is confirmed.</p>
            <p>Find the scheduled meeting in the <strong>Meetings</strong> section for the meeting link, and use the chatroom for coordination.</p>
            <div style={{ marginTop: 12 }}>
              <small style={{ color: 'rgba(180,180,178,0.9)' }}>You will be notified when the meeting is confirmed.</small>
            </div>
          </div>
        </Dialog>
      ) : null}
    </form>
  );
}

function ProjectList({ refreshKey }: { refreshKey?: number }) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'all'|'active'|'completed'|'inactive'>('all');
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  React.useEffect(() => { fetchList(); }, [refreshKey]);

  async function fetchList() {
    setLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([fetch('/api/projects'), fetch('/api/users/me')]);
      let projectsData: any[] = [];
      let userData: any = null;

      // If either API returns 401/403, redirect to login
      if (projRes.status === 401 || projRes.status === 403 || userRes.status === 401 || userRes.status === 403) {
        window.location.href = '/auth/login';
        return;
      }

      if (projRes.ok) {
        const d = await projRes.json();
        projectsData = d.projects || [];
      }
      if (userRes.ok) {
        const ud = await userRes.json();
        userData = ud?.user || ud;
      }
      const filtered = filterProjectsForUser(projectsData, userData);
      setProjects(filtered);
    } catch (e) {
      setProjects([]);
    }
    setLoading(false);
  }

  function filterProjectsForUser(projects:any[], user:any) {
    if (!user) return projects;
    const uid = user.id || user._id || user.userId || user?.sub;
    const role = user.role || user?.type || 'consumer';
    if (role === 'admin') return projects;

    if (role === 'staff') {
      return projects.filter(p => {
        const people = p.people_allocated || p.peopleAllocated || p.staff || [];
        if (Array.isArray(people) && people.length > 0) {
          return people.some((pp:any) => {
            if (!pp) return false;
            if (typeof pp === 'string') return String(pp) === String(uid);
            return String(pp?.id || pp?._id) === String(uid);
          });
        }
        return String(p.author?.id || p.author?._id) === String(uid);
      });
    }

    return projects.filter(p => String(p.author?.id || p.author?._id) === String(uid));
  }

  if (loading) return <p>Loading projects...</p>;
  if (projects.length === 0) return <p>No projects</p>;

  // Filtering and pagination
  const now = new Date();
  const lower = (s?: any) => (s || '').toString().toLowerCase();
  let filtered = projects.slice();
  if (viewMode === 'active') {
    filtered = projects.filter(p => {
      const start = p.timeline?.from ? new Date(p.timeline.from) : null;
      const end = p.timeline?.to ? new Date(p.timeline.to) : null;
      return start && (!end ? now >= start : (now >= start && now <= end));
    });
  } else if (viewMode === 'completed') {
    filtered = projects.filter(p => lower(p.status) === 'completed' || lower(p.status) === 'done' || lower(p.status) === 'finished');
  } else if (viewMode === 'inactive') {
    filtered = projects.filter(p => {
      const start = p.timeline?.from ? new Date(p.timeline.from) : null;
      const end = p.timeline?.to ? new Date(p.timeline.to) : null;
      return (start && end && now > end) || lower(p.status) === 'inactive';
    });
  }
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div style={{ marginTop: 12 }}>
      {/* View/sort buttons, responsive */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <Button onClick={() => { setViewMode('all'); setPage(1); }} style={{ background: viewMode==='all' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>All</Button>
        <Button onClick={() => { setViewMode('active'); setPage(1); }} style={{ background: viewMode==='active' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Active</Button>
        <Button onClick={() => { setViewMode('completed'); setPage(1); }} style={{ background: viewMode==='completed' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Completed</Button>
        <Button onClick={() => { setViewMode('inactive'); setPage(1); }} style={{ background: viewMode==='inactive' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Inactive</Button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {paged.map(p => {
          const stages = p.stages || [];
          const avgStage = stages.length ? Math.round(stages.reduce((s:any, n:any) => s + (Number(n.progress) || 0), 0) / stages.length) : null;
          // current stage: first stage with progress < 100, otherwise last stage
          const currentIndex = stages.findIndex((s:any) => (Number(s.progress) || 0) < 100);
          const currentStageIndex = currentIndex === -1 ? (stages.length ? stages.length - 1 : -1) : currentIndex;
          const currentStageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 0;
          const currentStageProgress = currentStageIndex >= 0 ? Number(stages[currentStageIndex].progress || 0) : 0;
          return (
            <div key={p._id}>
              <TileCard
                meeting={{
                  _id: p._id,
                  title: p.title,
                  date: p.timeline?.from ? new Date(p.timeline.from).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
                  time: p.timeline?.from ? new Date(p.timeline.from).toLocaleTimeString() : '',
                  timelineRange: (p.timeline && p.timeline.from && p.timeline.to) ? `${new Date(p.timeline.from).toLocaleDateString()} — ${new Date(p.timeline.to).toLocaleDateString()}` : (p.timeline && p.timeline.from ? new Date(p.timeline.from).toLocaleDateString() : undefined),
                  requestedBy: undefined,
                  status: p.approved ? 'approved' : (p.status_internal || p.status?.text || 'unknown')
                }}
                onClick={() => router.push(`/dashboard/projects/${p._id}`)}
                active={p.approved ? 'approved' : undefined}
                rightAction={<Link href={`/dashboard/projects/${p._id}`} style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span></Link>}
                avgProgress={avgStage ?? undefined}
                stagesCount={stages.length}
              />
            </div>
          );
        })}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0', flexWrap: 'wrap' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button key={i+1} onClick={() => setPage(i+1)} style={{ background: page === (i+1) ? 'rgba(255,255,255,0.10)' : 'transparent', minWidth: 32 }}>{i+1}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
