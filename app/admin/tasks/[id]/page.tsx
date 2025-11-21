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
import TaskForm from '../../../../components/TaskForm';

const RightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BackButton = styled.button`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(180,180,178,0.06);
  color: rgba(255,255,255,0.95);
  cursor: pointer;
  padding: 8px 12px;
  font-weight: 700;
  border-radius: 10px;
  font-size: 16px;
  &:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
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
` as any;

export default function AdminTaskDetails({ params }: { params: any }) {
  const resolvedParams = (React as any).use ? (React as any).use(params) : params;
  const { id } = resolvedParams || {};
  const [task, setTask] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(()=>{ fetchTask(); fetchMeetings(); }, [id]);

  async function fetchTask() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/' + id);
      if (!res.ok) { setTask(null); setLoading(false); return; }
      const d = await res.json(); setTask(d.task || d);
    } catch (e) { setTask(null); }
    setLoading(false);
  }

  async function fetchMeetings() {
    try {
      const mres = await fetch('/api/meetings');
      if (mres.ok) {
        const md = await mres.json(); setMeetings(md.meetings || []);
      }
    } catch (e) { /* ignore */ }
  }

  if (loading) return <p>Loading...</p>;
  if (!task) return <p>Task not found</p>;

  const rawStages = Object.prototype.hasOwnProperty.call(task, 'stages') ? (Array.isArray(task.stages) ? task.stages : []) : [];
  const stages = rawStages.map((s:any) => ({ name: s?.name || 'Untitled', progress: Number(s?.progress || 0) }));
  const meanValue = stages.length ? stages.reduce((acc: number, s: any) => acc + Number(s.progress || 0), 0) / stages.length : (Number(task.progress || 0) || 0);
  const clampedMean = Math.max(0, Math.min(100, Number(meanValue) || 0));
  let meanFill: string = 'var(--color-yes)';
  if (clampedMean <= 0) meanFill = 'var(--color-pending)';
  else if (clampedMean >= 100) meanFill = 'var(--color-dark)';
  else if (clampedMean > 50) meanFill = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))';
  const meanTrack = 'rgba(255,255,255,0.03)';

  const calItems = (() => {
    const out: any[] = [];
    if (task?.timeline?.from || task?.timeline?.to) {
      out.push({ id: String(task._id) + '-timeline', title: task.title || 'Task', from: task.timeline?.from || null, to: task.timeline?.to || null, color: 'var(--color-yes)', type: 'task' });
    }
    const ms = task?.milestones || [];
    for (const m of ms) {
      const date = m?.date || m?.due || m?.when || null;
      out.push({ id: String(m._id || m.id || Math.random()), title: m?.title || 'Milestone', from: date, to: date, color: 'var(--color-pending)', type: 'milestone' });
    }
    return out;
  })();

  const statusText = task.status?.text || task.status || '—';
  let statusColor = '#94a3b8';
  if (statusText === 'requested' || statusText === 'pending') statusColor = 'var(--color-pending)';
  else if (statusText === 'completed' || statusText === 'done') statusColor = 'var(--color-dark)';
  else if (statusText === 'in-progress' || statusText === 'ongoing') statusColor = 'var(--color-yes)';

  return (
    <PageShell
      title={task.title}
      preTitle={<BackButton onClick={() => router.push('/admin/tasks')}>← Back</BackButton>}
      actions={<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><StatusPill panelColor={statusColor} aria-hidden>{(statusText||'—').toUpperCase()}</StatusPill><Button onClick={() => fetchTask()} style={{ padding: '8px 12px' }}>Refresh</Button><Button onClick={() => setEditOpen(true)} style={{ padding: '8px 12px' }}>Edit</Button></div>}
    >
      <div style={{ minHeight: '80vh', padding: 24, background: 'transparent' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <RightGrid>
            <div style={{ display: 'grid', gap: 24 }}>
              <Card classic>
                <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Task Overview</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Description</h3>
                    <div style={{ color: 'rgba(180,180,178,0.9)' }}>{task.description}</div>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'rgba(200,200,198,0.9)' }}>Objectives</h3>
                    <div style={{ color: 'rgba(180,180,178,0.9)' }}>{(task.objectives || []).length ? (task.objectives || []).join(', ') : '—'}</div>
                  </div>
                </div>
              </Card>

              <Card classic>
                <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'rgba(180,180,178,0.9)', width: 150 }}>Progress</span>
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
                    <span style={{ fontWeight: 700 }}>{task.type || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(180,180,178,0.9)' }}>Status:</span>
                    <span style={{ fontWeight: 700, color: task.status?.text === 'requested' ? 'rgba(255,200,80,1)' : 'rgba(200,200,198,1)' }}>{task.status?.text || '—'} {task.status?.stage ? `— ${task.status.stage}%` : ''}</span>
                  </div>

                  <div>
                    <h3 style={{ margin: '8px 0', color: 'rgba(200,200,198,0.9)' }}>Stage</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {stages.map((s:any, idx:number) => {
                        const pct = Number(s.progress || 0);
                        let panelColor = 'var(--color-pending)';
                        if (pct >= 100) panelColor = 'var(--color-dark)';
                        else if (pct > 0) panelColor = 'var(--color-yes)';
                        const stageStatus = (pct >= 100) ? 'Completed' : (pct > 0 ? 'Ongoing' : 'Upcoming');
                        const rightTextColor = panelColor === 'var(--color-pending)' ? '#000' : '#fff';
                        return (
                          <div key={s.name + '-' + idx} style={{ position: 'relative', borderRadius: 8, background: 'rgba(255,255,255,0.02)', overflow: 'hidden', padding: 8 }}>
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
                </div>
              </Card>

              <Card classic>
                <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Links</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['links','filebase_links','credential_links','other_links'].map((f) => (
                    <div key={f}>
                      <h3 style={{ margin: '6px 0', color: 'rgba(200,200,198,0.9)' }}>{f.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                      <div style={{ color: 'rgba(180,180,178,0.9)' }}>
                        {(Array.isArray(task[f]) ? task[f] : []).length ? (
                          <ul>
                            {(Array.isArray(task[f]) ? task[f] : []).map((l:any, idx:number) => (
                              <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <a href={l} target="_blank" rel="noreferrer" style={{ color: '#9ecbff' }}>{l}</a>
                                <Button onClick={async () => {
                                  try {
                                    const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove_link', field: f, index: idx }) });
                                    if (!res.ok) throw new Error('remove failed');
                                    await fetchTask();
                                  } catch (e) { console.error(e); }
                                }}>Remove</Button>
                              </li>
                            ))}
                          </ul>
                        ) : '—'}
                      </div>
                    </div>
                  ))}
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

              <Card classic style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Meetings</h2>
                </div>
                {(meetings || []).length === 0 ? <div style={{ color: 'rgba(180,180,178,0.9)' }}>No meetings</div> : (
                  <div style={{ marginTop: 8, display: 'grid', gap: 8, background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                    {meetings.filter(m => String(m.taskId) === String(task._id) || String(m.taskId) === String(task.id)).map((m:any,i:number)=>(
                      <div key={i}>
                        <h4 style={{ margin: 0, color: 'rgba(200,200,198,0.9)' }}>{m.title} — {m.type} — Status: {m.status}</h4>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(180,180,178,0.9)', fontSize: 14 }}><strong>Scheduled:</strong> {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : 'Not scheduled'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </RightGrid>
        </div>
      </div>

      {editOpen ? (
        <Dialog title={`Edit: ${task.title || ''}`} onClose={() => setEditOpen(false)} footer={<><Button onClick={() => setEditOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
          <TaskForm mode="edit" taskId={String(task._id)} initial={task} onDone={() => { setEditOpen(false); fetchTask(); }} />
        </Dialog>
      ) : null}

    </PageShell>
  );
}
