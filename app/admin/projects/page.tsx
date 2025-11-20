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
import ProjectForm from '../../../components/ProjectForm';

export default function AdminProjectsPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<any | null>(null);

  function onCreated() { setRefreshKey(k => k + 1); }

  return (
    <PageShell title="Projects" subtitle="Manage projects and admin controls." actions={<HeaderActions onCreated={onCreated} />}>
      <div>
        <AdminProjectList refreshKey={refreshKey} onEdit={(p:any)=>{ setEditProject(p); setEditOpen(true); }} />
      </div>
      {editOpen && editProject ? (
        <Dialog title={`Edit: ${editProject.title || ''}`} onClose={() => setEditOpen(false)} footer={<><Button onClick={() => setEditOpen(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
          <ProjectForm adminControls={true} mode="edit" projectId={String(editProject._id)} initial={editProject} onDone={() => { setEditOpen(false); setRefreshKey(k=>k+1); }} />
        </Dialog>
      ) : null}
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
    background: rgba(var(--color-yes-rgb),0.90);
    border: 1px solid rgba(0,0,0,0.08);
    color: ${(p:any) => p.theme?.colors?.light || '#fff'};
    cursor: pointer;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 14px;
    transition: background 140ms ease, transform 120ms ease;
    &:hover { filter: brightness(0.95); transform: translateY(-2px); }
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

  const calItems = projects.map(p => ({ id: String(p._id || p.id), title: p.title || 'Project', from: p.timeline?.from || p.createdAt || null, to: p.timeline?.to || p.timeline?.from || null, color: p.approved ? 'var(--color-yes)' : 'var(--color-pending)', type: 'project' }));

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

function AdminProjectList({ refreshKey, onEdit }: { refreshKey?: number; onEdit?: (p:any)=>void }) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { fetchList(); }, [refreshKey]);

  async function fetchList() {
    setLoading(true);
    try {
      const projRes = await fetch('/api/projects');
      let projectsData: any[] = [];
      if (projRes.ok) {
        const d = await projRes.json();
        projectsData = d.projects || [];
      }
      setProjects(projectsData);
    } catch (e) { setProjects([]); }
    setLoading(false);
  }

  if (loading) return <p>Loading projects...</p>;
  if (projects.length === 0) return <p>No projects</p>;
  const calItems = projects.map(p => ({ id: String(p._id || p.id), title: p.title || 'Project', from: p.timeline?.from || p.createdAt || null, to: p.timeline?.to || p.timeline?.from || null, color: p.approved ? 'var(--color-yes)' : 'var(--color-pending)', type: 'project' }));

  return (
    <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CalendarAction items={calItems as any} title="Projects calendar" />
      </div>
      {projects.map(p => {
        const stages = p.stages || [];
        const avgStage = stages.length ? Math.round(stages.reduce((s:any, n:any) => s + (Number(n.progress) || 0), 0) / stages.length) : null;
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
              onClick={() => router.push(`/admin/projects/${p._id}`)}
              active={p.approved ? 'approved' : undefined}
              rightAction={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link href={`/admin/projects/${p._id}`} style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>Open</span></Link>
                <button onClick={async () => { try { const r = await fetch('/api/projects/' + p._id); if (!r.ok) { alert('Unable to load project'); return; } const d = await r.json(); onEdit && onEdit(d.project); } catch (e) { alert('Error loading'); } }} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.06)', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
              </div>}
            >
              <div style={{ marginTop: 8 }}>
                {avgStage !== null ? (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${avgStage}%`, height: '100%', background: 'var(--color-yes)' }} />
                    </div>
                    <div style={{ marginTop: 6, color: 'rgba(180,180,178,0.9)', fontSize: 13 }}>{avgStage}% average across {stages.length} stages</div>
                  </div>
                ) : null}
              </div>
            </TileCard>
          </div>
        );
      })}
    </div>
  );
}
