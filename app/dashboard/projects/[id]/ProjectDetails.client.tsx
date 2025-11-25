"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import TileCard from '../../../../components/TileCard';
import Button from '../../../../components/ui/Button';
import { TextInput } from '../../../../components/ui/Input';
import styled from 'styled-components';
import Dialog from '../../../../components/ui/Dialog';
import PageShell from '../../../../components/PageShell';
import CalendarAction from '../../../../components/CalendarAction';

const ObjectivesList = styled.ul`
  margin: 12px 0 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
`;

const ObjectiveItem = styled.li`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(180,180,178,0.04);
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 700;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
`;

const RightGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 24px;
  align-items: start;
  width: 100%;
  min-width: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 600px) {
    gap: 16px;
  }
`;

const VisualPanel = styled.div`
  height: 340px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06));
  border: 1px solid rgba(180,180,178,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(200,200,198,0.9);
  font-weight: 700;
  font-size: 14px;
`;

const DetailBody = styled.div`
  min-height: 80vh;
  padding: 24px;
  background: transparent;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 16px 10px 24px;
  }
`;

export default function ProjectDetailsClient({ projectId, initialProject }: { projectId: string, initialProject?: any }) {
  const [showMeetingModal, setShowMeetingModal] = React.useState(false);
  const [project, setProject] = React.useState<any | null>(initialProject || null);
  const [showAddFilebase, setShowAddFilebase] = React.useState(false);
  const [showAddCredential, setShowAddCredential] = React.useState(false);
  const [showAddOther, setShowAddOther] = React.useState(false);
  const [loading, setLoading] = React.useState(!initialProject);
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [addingLinkValue, setAddingLinkValue] = React.useState('');
  const [addingMessage, setAddingMessage] = React.useState<string | null>(null);

  React.useEffect(()=>{ if (!initialProject) fetchProject(); else fetchMeetings(); }, [projectId]);

  async function fetchProject() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/' + projectId);
      if (!res.ok) { setProject(null); setLoading(false); return; }
      const data = await res.json();
      setProject(data.project);
    } catch (e) { setProject(null); }
    setLoading(false);
    fetchMeetings();
  }

  async function fetchMeetings() {
    try {
      const mres = await fetch('/api/meetings');
      if (mres.ok) {
        const md = await mres.json();
        setMeetings((md.meetings || []).filter((mm:any)=>String(mm.projectId) === String(projectId)));
      }
    } catch (e) { /* ignore */ }
  }

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found</p>;

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

  const stages = rawStages.map((s:any) => ({ name: s?.name || 'Untitled', progress: Number(s?.progress || 0) }));
  const meanValue = stages.length
    ? stages.reduce((acc: number, s: any) => acc + Number(s.progress || 0), 0) / stages.length
    : 0;
  const clampedMean = Math.max(0, Math.min(100, Number(meanValue) || 0));
  let meanFill: string = 'var(--color-yes)';
  if (clampedMean <= 0) meanFill = 'var(--color-pending)';
  else if (clampedMean >= 100) meanFill = 'var(--color-dark)';
  else if (clampedMean > 50) meanFill = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))';
  const meanTrack = 'rgba(255,255,255,0.03)';

  const router = useRouter();

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
      position: static;
      margin-top: 8px;
      transform: none;
      width: auto;
    }
  ` as any;

  const statusText = project.status?.text || (project.approved ? 'approved' : 'draft');
  let statusColor = '#94a3b8';
  if (statusText === 'requested' || statusText === 'pending') statusColor = 'var(--color-pending)';
  else if (statusText === 'approved' || statusText === 'active' || statusText === 'completed') statusColor = '#526452';
  else if (statusText === 'draft') statusColor = '#64748b';

  return (
      <PageShell
      title={project.title}
      preTitle={<BackButton onClick={() => router.push('/dashboard/projects')}>← Back</BackButton>}
      actions={<div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}><StatusPill panelColor={statusColor}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#06201a', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)' }} aria-hidden="true" />{statusText.toUpperCase()}</StatusPill><Button onClick={() => fetchProject()} style={{ padding: '8px 12px' }}>Refresh</Button></div>}
    >
      <DetailBody>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, minWidth: 0 }}>
        <RightGrid>
          <div style={{ display: 'grid', gap: 24, minWidth: 0 }}>
            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Project Overview</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)', width: 150, flex: '0 1 150px', minWidth: 0 }}>Progress</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                        const active = (s.progress || 0) > 0 && (s.progress || 0) < 100;
                          const pct = Number(s.progress || 0);
                          let panelColor = 'var(--color-pending)';
                          if (pct >= 100) panelColor = 'var(--color-dark)';
                          else if (pct > 0) panelColor = 'var(--color-yes)';
                          const stageStatus = (pct >= 100) ? 'Completed' : (pct > 0 ? 'Ongoing' : 'Upcoming');
                          const rightTextColor = panelColor === 'var(--color-pending)' ? '#000' : '#fff';

                        return (
                          <div key={s.name} style={{ position: 'relative', borderRadius: 8, background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                              {active ? (
                              <span aria-hidden="true" style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderRadius: 999, background: 'var(--color-yes)', boxShadow: '0 4px 10px rgba(var(--color-yes-rgb),0.18)', border: '2px solid rgba(255,255,255,0.03)', zIndex: 10 }} />
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

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(180,180,178,0.9)' }}></span>
                  <span style={{ fontWeight: 700, color: project.approved ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)' }}></span>
                </div>
              </div>
            </Card>

            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Links</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Filebase</h3>
                    <Button onClick={() => { setAddingLinkValue(''); setAddingMessage(null); setShowAddFilebase(true); }} style={{ padding: '6px 10px' }}>Add</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.filebase_links || []).length ? (project.filebase_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>No file links</div>}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Credential</h3>
                    <Button onClick={() => { setAddingLinkValue(''); setAddingMessage(null); setShowAddCredential(true); }} style={{ padding: '6px 10px' }}>Add</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.credential_links || []).length ? (project.credential_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>No credentials</div>}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Other</h3>
                    <Button onClick={() => { setAddingLinkValue(''); setAddingMessage(null); setShowAddOther(true); }} style={{ padding: '6px 10px' }}>Add</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(project.other_links || []).length ? (project.other_links || []).map((l:string,i:number)=>(<a key={i} href={l} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'rgba(200,200,198,0.9)', textDecoration: 'none' }}>{l}</a>)) : <div style={{ color: 'rgba(180,180,178,0.9)' }}>No links</div>}
                  </div>
                </div>
              </div>
            </Card>

            {showAddFilebase ? (
              <Dialog title="Add Filebase link" onClose={() => setShowAddFilebase(false)} footer={<><Button onClick={() => setShowAddFilebase(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label>URL</label>
                  <TextInput placeholder="https://..." value={addingLinkValue} onChange={e => setAddingLinkValue(e.target.value)} />
                  {addingMessage && <div style={{ color: 'rgba(255,100,80,0.9)' }}>{addingMessage}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => setShowAddFilebase(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
                    <Button onClick={async () => {
                      setAddingMessage(null);
                      const v = (addingLinkValue || '').toString().trim();
                      if (!v) { setAddingMessage('Please enter a link'); return; }
                      try {
                        const resp = await fetch('/api/projects/' + projectId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_link', field: 'filebase_links', link: v }) });
                        const d = await resp.json().catch(()=>({}));
                        if (!resp.ok) { setAddingMessage('Error: ' + (d.error || JSON.stringify(d))); return; }
                        setShowAddFilebase(false); setAddingLinkValue(''); fetchProject();
                      } catch (e:any) { setAddingMessage('Network error'); }
                    }}>Add</Button>
                  </div>
                </div>
              </Dialog>
            ) : null}

            {showAddCredential ? (
              <Dialog title="Add Credential link" onClose={() => setShowAddCredential(false)} footer={<><Button onClick={() => setShowAddCredential(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label>URL</label>
                  <TextInput placeholder="https://..." value={addingLinkValue} onChange={e => setAddingLinkValue(e.target.value)} />
                  {addingMessage && <div style={{ color: 'rgba(255,100,80,0.9)' }}>{addingMessage}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => setShowAddCredential(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
                    <Button onClick={async () => {
                      setAddingMessage(null);
                      const v = (addingLinkValue || '').toString().trim();
                      if (!v) { setAddingMessage('Please enter a link'); return; }
                      try {
                        const resp = await fetch('/api/projects/' + projectId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_link', field: 'credential_links', link: v }) });
                        const d = await resp.json().catch(()=>({}));
                        if (!resp.ok) { setAddingMessage('Error: ' + (d.error || JSON.stringify(d))); return; }
                        setShowAddCredential(false); setAddingLinkValue(''); fetchProject();
                      } catch (e:any) { setAddingMessage('Network error'); }
                    }}>Add</Button>
                  </div>
                </div>
              </Dialog>
            ) : null}

            {showAddOther ? (
              <Dialog title="Add link" onClose={() => setShowAddOther(false)} footer={<><Button onClick={() => setShowAddOther(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <label>URL</label>
                  <TextInput placeholder="https://..." value={addingLinkValue} onChange={e => setAddingLinkValue(e.target.value)} />
                  {addingMessage && <div style={{ color: 'rgba(255,100,80,0.9)' }}>{addingMessage}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => setShowAddOther(false)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button>
                    <Button onClick={async () => {
                      setAddingMessage(null);
                      const v = (addingLinkValue || '').toString().trim();
                      if (!v) { setAddingMessage('Please enter a link'); return; }
                      try {
                        const resp = await fetch('/api/projects/' + projectId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_link', field: 'other_links', link: v }) });
                        const d = await resp.json().catch(()=>({}));
                        if (!resp.ok) { setAddingMessage('Error: ' + (d.error || JSON.stringify(d))); return; }
                        setShowAddOther(false); setAddingLinkValue(''); fetchProject();
                      } catch (e:any) { setAddingMessage('Network error'); }
                    }}>Add</Button>
                  </div>
                </div>
              </Dialog>
            ) : null}
          </div>

          <div style={{ minWidth: 0 }}>
            <Card classic style={{ marginBottom: 12 }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Timeline</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <CalendarAction inline items={calItems} title="Timeline" />
              </div>
            </Card>

            <Card classic>
              <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Finance</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'rgba(200,200,198,0.9)' }}>Total cost</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{project.total_cost || '0'}</div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'rgba(200,200,198,0.9)' }}>Milestones</h3>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}>{(project.milestones || []).length ? `${(project.milestones || []).length} ` : 'No milestones yet'}</div>
                </div>
              </div>
            </Card>

          </div>
        </RightGrid>
        </div>
      </DetailBody>
    </PageShell>
  );
}

function RequestMeetingForm({ projectId, onCreated }: { projectId: string, onCreated?: ()=>void }) {
  const [title, setTitle] = React.useState('Discovery: request');
  const [type, setType] = React.useState('discovery');
  const [link, setLink] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const body: any = { projectId, type, title, link };
    const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); setMessage('Error: '+JSON.stringify(d)); return; }
    setMessage('Meeting requested');
    setTitle('Discovery: request'); setLink(''); if (onCreated) onCreated();
  }

  return (
      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <Card classic>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput value={title} onChange={e=>setTitle(e.target.value)} style={{ flex: 1 }} />
          <TextInput placeholder="link (optional)" value={link} onChange={e=>setLink(e.target.value)} />
          <Button type="submit">Request Meeting</Button>
        </div>
        {message && <div style={{ marginTop: 6 }}>{message}</div>}
      </Card>
    </form>
  );
}
