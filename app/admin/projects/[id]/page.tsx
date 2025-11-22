"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import TileCard from '../../../../components/TileCard';
import CalendarAction from '../../../../components/CalendarAction';
import Button from '../../../../components/ui/Button';
import { TextInput } from '../../../../components/ui/Input';
import styled from 'styled-components';
import Dialog from '../../../../components/ui/Dialog';
import PageShell from '../../../../components/PageShell';
import ProjectForm from '../../../../components/ProjectForm';

const RightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PlusButton = styled.button`
  width: 88px;
  height: 88px;
  border-radius: 999px;
  background: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(37,99,235,0.18);
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  padding: 0;
  svg { display: block; }
  &:hover { transform: translateY(-4px) scale(1.02); }
  &:active { transform: translateY(-1px) scale(0.99); }
  &:focus-visible { outline: 3px solid rgba(96,165,250,0.3); outline-offset: 4px; }
`;

export default function AdminProjectDetail({ params }: { params: any }) {
  const resolvedParams = (React as any).use ? (React as any).use(params) : params;
  const { id } = resolvedParams || {};
  return <AdminProject id={id} />;
}

function AdminProject({ id }: { id: string }) {
  const projectId = id;
  const [showMeetingModal, setShowMeetingModal] = React.useState(false);
  const [project, setProject] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);

  React.useEffect(()=>{ fetchProject(); }, [projectId]);

  async function fetchProject() {
    setLoading(true);
    const res = await fetch('/api/projects/' + projectId);
    if (!res.ok) { setProject(null); setLoading(false); return; }
    const data = await res.json();
    setProject(data.project);
    // fetch meetings for this tenant and filter by projectId
    try {
      const mres = await fetch('/api/meetings');
      if (mres.ok) {
        const md = await mres.json();
        setMeetings((md.meetings || []).filter((mm:any)=>String(mm.projectId) === String(projectId)));
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found</p>;
  // Prefer explicit `project.stages` when present (even if empty). Only fall back to the
  // example stage list when the property is completely missing (legacy data).
  const rawStages = Object.prototype.hasOwnProperty.call(project, 'stages')
    ? (Array.isArray(project.stages) ? project.stages : [])
    : [
      { name: 'Discovery', progress: project.stage?.name === 'Discovery' ? (project.stage?.percentage ?? 0) : 100 },
      { name: 'Planning', progress: project.stage?.name === 'Planning' ? (project.stage?.percentage ?? 0) : 50 },
      { name: 'Design', progress: project.stage?.name === 'Design' ? (project.stage?.percentage ?? 0) : 10 },
      { name: 'Development', progress: project.stage?.name === 'Development' ? (project.stage?.percentage ?? 0) : 0 },
      { name: 'Testing', progress: project.stage?.name === 'Testing' ? (project.stage?.percentage ?? 0) : 0 },
      { name: 'Deployment', progress: project.stage?.name === 'Deployment' ? (project.stage?.percentage ?? 0) : 0 },
    ];

  // Normalize stage objects to ensure `name` and numeric `progress` are present.
  const stages = rawStages.map((s:any) => ({ name: s?.name || 'Untitled', progress: Number(s?.progress || 0) }));

  // compute mean value (average) for stages
  const meanValue = stages.length
    ? stages.reduce((acc: number, s: any) => acc + Number(s.progress || 0), 0) / stages.length
    : 0;

  // clamp and derive styles for the mean progress bar (mirror consumer page)
  const clampedMean = Math.max(0, Math.min(100, Number(meanValue) || 0));
  let meanFill: string = 'var(--color-yes)';
  if (clampedMean <= 0) meanFill = 'var(--color-pending)';
  else if (clampedMean >= 100) meanFill = 'var(--color-dark)';
  else if (clampedMean > 50) meanFill = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))';
  const meanTrack = 'rgba(228, 0, 0, 0.03)';

  const router = useRouter();

  // Compose calendar items (timeline + milestones) without using hooks
  const calItems = (() => {
    const out: any[] = [];
    if (project?.timeline?.from || project?.timeline?.to) {
      out.push({ id: String(project._id) + '-timeline', title: project.title || 'Project', from: project.timeline?.from || null, to: project.timeline?.to || null, color: 'var(--color-yes)', type: 'project' });
    }
    const ms = project?.milestones || [];
    for (const m of ms) {
      const date = m?.date || m?.due || m?.when || m?.scheduledAt || null;
      out.push({ id: String(m._id || m.id || Math.random()), title: m?.title || 'Milestone', from: date, to: date, color: 'var(--color-pending)', type: 'milestone' });
    }
    return out;
  })();

  const BackButton = styled.button`
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(180,180,178,0.06);
    color: rgba(255,255,255,0.95);
    cursor: pointer;
    padding: 8px 12px;
    font-weight: 700;
    border-radius: 10px;
    /* half the size of the main heading (responsive) */
    font-size: 24px;
    line-height: 1;
    &:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
    &:focus-visible { outline: 3px solid rgba(255,255,255,0.06); outline-offset: 3px; }
    @media (max-width: 1024px) { font-size: 20px; }
    @media (max-width: 640px) { font-size: 16px; padding: 6px 10px; }
  `;

  const StatusPill = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 14px;
    color: ${p => (p && (p as any).theme && (p as any).theme.colors && (p as any).theme.colors.dark ? (p as any).theme.colors.dark : '#0b1220')};
    background: ${p => (p && (p as any).panelColor) || 'rgba(255,255,255,0.06)'};
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 6px 18px rgba(2,6,23,0.35);
    white-space: nowrap;

    @media (max-width: 768px) {
      /* On small screens move under the title and align left */
      position: static;
      margin-top: 8px;
      transform: none;
      width: auto;
    }
  ` as any;

  // determine a color for the status pill
  const statusText = project.status?.text || (project.approved ? 'approved' : 'draft');
  let statusColor = '#94a3b8';
  if (statusText === 'requested' || statusText === 'pending') statusColor = 'var(--color-pending)';
  else if (statusText === 'approved' || statusText === 'active' || statusText === 'completed') statusColor = 'var(--color-yes)';
  else if (statusText === 'draft') statusColor = '#64748b';

  return (
    <PageShell
      title={project.title}
      preTitle={<BackButton onClick={() => router.push('/admin/projects')}>← Back</BackButton>}
      actions={<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <CalendarAction items={[{ id: String(project._id), title: project.title, from: project.timeline?.from || null, to: project.timeline?.to || null, color: 'rgb(59,130,246)', type: 'project' }, ...(meetings.map(m=>({ id: String(m._id||m.id), title: m.title, from: m.scheduledAt||null, to: m.scheduledAt||null, color: 'rgb(249,115,22)', type: 'meeting' })))]} title="Project calendar" />
        <StatusPill panelColor={statusColor}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#06201a', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)' }} aria-hidden="true" />{statusText.toUpperCase()}</StatusPill>
        <Button onClick={() => fetchProject()} style={{ padding: '8px 12px' }}>Refresh</Button>
        <Button onClick={() => setEditOpen(true)} style={{ padding: '8px 12px' }}>Edit</Button>
      </div>}
    >
      <div style={{ minHeight: '80vh', padding: 24, background: 'transparent' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <RightGrid>
          <div style={{ display: 'grid', gap: 24 }}>
            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Project Overview</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Description</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{project.description}</div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Objectives</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{(project.objectives || []).length ? (project.objectives || []).join(', ') : '—'}</div>
                </div>
              </div>
            </Card>

            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)', width: 150 }}>Average per stage</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: 8, background: meanTrack, borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: 8, borderRadius: 999, background: meanFill, width: `${clampedMean}%`, transition: 'width 280ms ease' }} />
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{clampedMean.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)' }}>Type:</span>
                  <span style={{ fontWeight: 700 }}>{project.type || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)' }}>Status:</span>
                  <span style={{ fontWeight: 700, color: project.status?.text === 'requested' ? 'rgba(255,200,80,1)' : 'rgba(200,200,198,1)' }}>{project.status?.text || '—'} {project.status?.stage ? `— ${project.status.stage}%` : ''}</span>
                </div>

                <div>
                  <h3 style={{ margin: '8px 0', color: 'rgba(200,200,198,0.9)' }}>Stage</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {stages.map((s:any) => {
                        const pct = Number(s.progress || 0);
                        const active = pct > 0 && pct < 100;
                        // Map progress -> panel color per spec: 0 -> pending (yellow), 1-99 -> ongoing (green), 100 -> completed (grey/dark)
                        let panelColor = 'var(--color-pending)';
                        if (pct >= 100) panelColor = 'var(--color-dark)';
                        else if (pct > 0) panelColor = 'var(--color-yes)';
                        const stageStatus = (pct >= 100) ? 'Completed' : (pct > 0 ? 'Ongoing' : 'Upcoming');
                        const rightTextColor = panelColor === 'var(--color-pending)' ? '#000' : '#fff';

                        return (
                          <div key={s.name} style={{ position: 'relative', borderRadius: 8, background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                            {active ? (
                              <span aria-hidden="true" style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderRadius: 999, background: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.18)', border: '2px solid rgba(255,255,255,0.03)', zIndex: 10 }} />
                            ) : null}
                            <TileCard
                              title={s.name}
                              status={`${s.progress}%`}
                              panelColor={panelColor}
                              progress={Number(s.progress || 0)}
                              rightAction={(
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: rightTextColor }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{s.progress}%</div>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700 }}>{stageStatus}</div>
                                </div>
                              )}
                              hideMeta={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                </div>

                {/* Timeline moved to the right column (separate box) to avoid repeating dates */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)' }}>Approved:</span>
                  <span style={{ fontWeight: 700, color: project.approved ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)' }}>{project.approved ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </Card>

            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Links</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Filebase</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.filebase_links || []).length ? (project.filebase_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>—</div>}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Credential</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.credential_links || []).length ? (project.credential_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>—</div>}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Other</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.other_links || []).length ? (project.other_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>—</div>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card classic style={{ marginBottom: 12 }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Timeline</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CalendarAction inline items={calItems} title="Timeline" />
              </div>
            </Card>

            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Timeline & Milestones</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'rgba(200,200,198,0.9)' }}>Total cost</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{project.total_cost || '0'}</div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'rgba(200,200,198,0.9)' }}>Milestones</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{(project.milestones || []).length ? `${(project.milestones || []).length} milestone(s)` : 'No milestones yet'}</div>
                </div>
              </div>
            </Card>

            <Card classic style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Meetings</h2>
                </div>

                {(meetings || []).length === 0 ? <div style={{ color: 'rgba(180,180,178,0.9)' }}>No meetings</div> : (
                  <div style={{ marginTop: 8, display: 'grid', gap: 8, background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                    {meetings.map((m:any,i:number)=>(
                      <div key={i}>
                        <h4 style={{ margin: 0, color: 'rgba(200,200,198,0.9)' }}>{m.title} — {m.type} — Status: {m.status}</h4>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(180,180,178,0.9)', fontSize: 14 }}><strong>Scheduled:</strong> {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : 'Not scheduled'}</p>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(180,180,178,0.9)', fontSize: 14 }}><strong>Link:</strong> {m.link ? (<a href={m.link} target="_blank" rel="noreferrer">{m.link}</a>) : '—'}</p>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(180,180,178,0.9)', fontSize: 14 }}><strong>Requested by:</strong> {m.requestedBy?.name || m.requestedBy?.id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            {/* Admin: edit dialog */}
            {editOpen ? (
              <Dialog title="Edit project" onClose={() => setEditOpen(false)} footer={<><Button onClick={() => setEditOpen(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
                <ProjectForm initial={project} mode="edit" projectId={String(project._id)} adminControls={true} onDone={() => { setEditOpen(false); fetchProject(); }} />
              </Dialog>
            ) : null}
          </div>
        </RightGrid>
      </div>
    </div>
    </PageShell>
  );
}


