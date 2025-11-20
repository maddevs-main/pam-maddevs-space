"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../../../../components/PageShell';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { TextInput, TextArea } from '../../../../components/ui/Input';

export default function AdminProjectEditor({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(()=>{ fetchProject(); }, [projectId]);

  async function fetchProject() {
    setLoading(true);
    const res = await fetch('/api/projects/' + projectId);
    if (!res.ok) { setProject(null); setLoading(false); return; }
    const data = await res.json();
    setProject(data.project);
    setLoading(false);
  }

  async function save(changes: any) {
    setMessage(null);
    const body = { ...changes };
    const res = await fetch('/api/projects/' + projectId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data)); else { setMessage('Saved'); fetchProject(); }
  }

  async function approve() {
    if (!confirm('Approve this project? This will mark it approved.')) return;
    await save({ approved: 1, status_internal: 'approved', status: { stage: 100, text: 'approved' } });
  }

  async function decline() {
    if (!confirm('Decline this project? This action can be reverted by editing.')) return;
    await save({ approved: 0, status_internal: 'declined', status: { stage: 0, text: 'declined' } });
  }

  async function createMeeting(type='project') {
    setMessage(null);
    const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, type, title: `${type} meeting for ${project?.title}` }) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data)); else setMessage('Meeting created');
  }

  if (loading) return <div>Loading project...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <PageShell title={`Manage: ${project.title || 'Project'}`} subtitle="Edit project details, stages and milestones" fullWidth={false}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>{project.title || 'Untitled project'}</h2>
            <TextInput value={project.title || ''} onChange={e=>setProject({...project, title: e.target.value})} placeholder="Project title" style={{ width: '100%' }} />
            <div style={{ marginTop: 8 }}>
              <TextArea value={project.description || ''} onChange={e=>setProject({...project, description: e.target.value})} placeholder="Short description" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => save(project)}>Save</Button>
              <Button onClick={approve} style={{ background: '#2d8f2d', color: '#fff' }}>Approve</Button>
              <Button onClick={decline} style={{ background: '#c0392b', color: '#fff' }}>Decline</Button>
            </div>
            <div style={{ textAlign: 'right' }}>{message ? <span style={{ color: '#f59e0b' }}>{message}</span> : null}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 18 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Card>
              <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>Objectives</h3>
                  <TextArea value={(project.objectives || []).join('\n')} onChange={e=>setProject({...project, objectives: e.target.value.split('\n').map((s:any)=>s.trim()).filter(Boolean) })} placeholder="One objective per line" style={{ width: '100%' }} />
                </div>

                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>Links</h3>
                  <TextInput value={(project.filebase_links||[]).join(',')} onChange={e=>setProject({...project, filebase_links: e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean)})} placeholder="filebase links" style={{ width: '100%', marginBottom: 8 }} />
                  <TextInput value={(project.credential_links||[]).join(',')} onChange={e=>setProject({...project, credential_links: e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean)})} placeholder="credential links" style={{ width: '100%', marginBottom: 8 }} />
                  <TextInput value={(project.other_links||[]).join(',')} onChange={e=>setProject({...project, other_links: e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean)})} placeholder="other links" style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>Timeline</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <TextInput type="date" value={(project.timeline && project.timeline.from) ? project.timeline.from : ''} onChange={e=>setProject({...project, timeline: {...project.timeline, from: e.target.value}})} style={{ flex: 1 }} />
                      <TextInput type="date" value={(project.timeline && project.timeline.to) ? project.timeline.to : ''} onChange={e=>setProject({...project, timeline: {...project.timeline, to: e.target.value}})} style={{ width: 160 }} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>Milestones</h3>
                  <div style={{ width: 160 }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Total cost</strong>
                    <TextInput value={project.total_cost || 0} onChange={e=>setProject({...project, total_cost: Number(e.target.value)})} style={{ width: '100%' }} />
                  </div>
                </div>

                {(project.milestones || []).map((m:any,i:number)=>(
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr 96px', gap: 8, alignItems: 'center' }}>
                    <TextInput value={m.title || ''} onChange={e=>{ const copy = {...project}; copy.milestones[i].title = e.target.value; setProject(copy); }} placeholder="Milestone title" style={{ width: '100%' }} />
                    <TextInput type="number" value={m.amount || 0} onChange={e=>{ const copy = {...project}; copy.milestones[i].amount = Number(e.target.value); setProject(copy); }} placeholder="Amount" style={{ width: '100%' }} />
                    <TextInput value={m.paymentLink || ''} placeholder="Payment link (optional)" onChange={e=>{ const copy = {...project}; copy.milestones[i].paymentLink = e.target.value; setProject(copy); }} style={{ width: '100%' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="button" onClick={()=>{ const copy = {...project}; copy.milestones = (copy.milestones||[]).filter((_,idx)=>idx!==i); setProject(copy); }}>Remove</Button>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'left' }}><Button type="button" onClick={()=>{ const copy = {...project}; copy.milestones = (copy.milestones||[]).concat([{ title: '', amount: 0, paymentLink: '' }]); setProject(copy); }}>Add milestone</Button></div>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <Card>
              <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0 }}>Status</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <TextInput type="number" value={project.status?.stage || 0} onChange={e=>setProject({...project, status: {...project.status, stage: Number(e.target.value)}})} style={{ width: 120 }} />
                  <TextInput value={project.status?.text || ''} onChange={e=>setProject({...project, status: {...project.status, text: e.target.value}})} placeholder="Status text (e.g. active, paused)" style={{ flex: 1 }} />
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0 }}>Admin Controls</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={Boolean(project.approved)} onChange={e=>setProject({...project, approved: e.target.checked ? 1 : 0})} />
                      <span style={{ marginLeft: 6 }}>Approved</span>
                    </label>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <Button onClick={() => approve() } style={{ background: '#2d8f2d', color: '#fff' }}>Approve</Button>
                      <Button onClick={() => decline() } style={{ background: '#c0392b', color: '#fff' }}>Decline</Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextInput value={project.status_internal || ''} onChange={e=>setProject({...project, status_internal: e.target.value})} placeholder="Internal status" style={{ flex: 1 }} />
                    <select value={project.status?.text || ''} onChange={e=>setProject({...project, status: {...project.status, text: e.target.value}})} style={{ width: 220 }}>
                      <option value="">Select status...</option>
                      <option value="requested">requested</option>
                      <option value="approved">approved</option>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="declined">declined</option>
                      <option value="paused">paused</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Project type (displayed on detail page)</label>
                    <TextInput value={project.type || ''} onChange={e=>setProject({...project, type: e.target.value})} placeholder="e.g. Website, Integration, Design" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>People allocated (comma-separated user ids)</label>
                    <TextInput value={(project.people_allocated || []).join(',')} onChange={e=>setProject({...project, people_allocated: String(e.target.value).split(',').map((s:any)=>s.trim()).filter(Boolean)})} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Staff (comma-separated user ids)</label>
                    <TextInput value={(project.staff || []).join(',')} onChange={e=>setProject({...project, staff: String(e.target.value).split(',').map((s:any)=>s.trim()).filter(Boolean)})} />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0 }}>Stages</h3>
                {(project.stages || []).map((st:any,i:number)=> (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <TextInput value={st.name || ''} onChange={e=>{ const copy = {...project}; copy.stages[i].name = e.target.value; setProject(copy); }} placeholder="Stage name" style={{ flex: 1 }} />
                    <TextInput type="number" value={st.progress || 0} onChange={e=>{ const copy = {...project}; copy.stages[i].progress = Number(e.target.value); setProject(copy); }} style={{ width: 100 }} />
                    <Button type="button" onClick={()=>{ const copy = {...project}; copy.stages = (copy.stages||[]).filter((_,idx)=>idx!==i); setProject(copy); }}>Remove</Button>
                  </div>
                ))}
                <div><Button onClick={()=>{ const copy = {...project}; copy.stages = (copy.stages||[]).concat([{ name: '', progress: 0 }]); setProject(copy); }}>Add Stage</Button></div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button onClick={()=>createMeeting('project')}>Create meeting</Button>
                <div style={{ marginLeft: 'auto' }}>
                  <Button onClick={()=>save(project)}>Save changes</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
