"use client";
import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TileCard from '../../../components/TileCard';
import PageShell from '../../../components/PageShell';
import Dialog from '../../../components/ui/Dialog';
import CalendarAction from '../../../components/CalendarAction';

export default function DashboardFinancePage() {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedProject, setSelectedProject] = React.useState<any | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);
  const [viewMode, setViewMode] = React.useState<'all'|'active'|'completed'|'inactive'>('all');
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  React.useEffect(()=>{ load(); }, []);

  async function load() {
    setLoading(true);
    try {
      async function fetchWithRetry(url: string, opts?: any, retries = 1, delay = 300) {
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

      const [projRes, userRes] = await Promise.all([fetchWithRetry('/api/projects'), fetchWithRetry('/api/users/me')]);
      let tasksData: any[] = [];
      let userData: any = null;

      // If either API returns 401/403 (after a retry), redirect to login
      if (projRes.status === 401 || projRes.status === 403 || userRes.status === 401 || userRes.status === 403) {
        window.location.href = '/auth/login';
        return;
      }

      if (projRes.ok) {
        const d = await projRes.json();
        tasksData = d.projects || [];
      }

      if (userRes.ok) {
        const ud = await userRes.json();
        userData = ud?.user || ud;
        setCurrentUser(userData);
      }

      const filtered = filterTasksForUser(tasksData, userData);
      setTasks(filtered);
    } catch (e) { setTasks([]); }
    setLoading(false);
  }

  function filterTasksForUser(tasks:any[], user:any) {
    if (!user) return tasks;
    const uid = user.id || user._id || user.userId || user?.sub;
    const role = user.role || user?.type || 'consumer';
    if (role === 'admin') return tasks;

    if (role === 'staff') {
      return tasks.filter(t => {
        const people = t.people_allocated || t.peopleAllocated || t.assignedTo || t.staff || [];
        if (Array.isArray(people) && people.length > 0) {
          return people.some((pp:any) => {
            if (!pp) return false;
            if (typeof pp === 'string') return String(pp) === String(uid);
            return String(pp?.id || pp?._id || pp?.assignedTo?.id) === String(uid);
          });
        }
        // fallback to assignedTo or author match
        if (t.assignedTo) return String(t.assignedTo?.id || t.assignedTo) === String(uid);
        return String(t.author?.id || t.author?._id) === String(uid);
      });
    }

    // consumer: show only tasks authored by the user
    return tasks.filter(t => String(t.author?.id || t.author?._id) === String(uid));
  }

  // For projects we may support milestone confirmation.
  // This stub attempts to PATCH /api/projects/:id with action 'confirm_milestone' if present
  async function confirmTaskMilestone(taskId: string, index:number) {
    try {
      const res = await fetch('/api/projects/' + taskId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm_milestone', milestoneIndex: index }) });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        return alert('Error: ' + (d.error || res.statusText));
      }
      await load();
      if (selectedProject && String(selectedProject._id) === String(taskId)) {
        const p = await fetch('/api/projects/' + taskId);
        if (p.ok) {
          const dd = await p.json(); setSelectedProject(dd.task || dd);
        }
      }
    } catch (e) { alert('Error'); }
  }

  async function openTask(taskId: string) {
    try {
      const res = await fetch('/api/projects/' + taskId);
      if (!res.ok) return alert('Cannot load project');
      const d = await res.json(); setSelectedProject(d.project || d);
    } catch (e) { alert('Error'); }
  }

  if (loading) return <div style={{ padding: 12 }}>Loading...</div>;

    // prepare calendar items: show projects as single-date markers (meeting-style)
    const calItems = tasks.map(t => ({
      id: String(t._id),
      title: t.title || 'Untitled',
      from: t.dueDate || t.timeline?.from || t.createdAt || null,
      to: null,
      color: 'rgb(16,185,129)',
      type: 'meeting',
    }));

    // Precompute aggregated totals for staff view to avoid complex inline IIFEs in JSX
    let totalsJSX: any = null;
    if (currentUser && (currentUser.role === 'staff' || currentUser.type === 'staff')) {
      const totals = tasks.reduce((acc:any, t:any) => {
        const total = Number(t.total_cost ?? t.total ?? (t.milestones ? t.milestones.reduce((s:any,m:any)=> s + (Number(m.amount)||0),0) : 0));
        const paid = Number(t.paid_amount ?? (t.milestones ? t.milestones.reduce((s:any,m:any)=> s + ((m.paidByAdmin ? (Number(m.amount)||0) : 0)),0) : 0));
        acc.total += total; acc.paid += paid; acc.pending += Math.max(0, total - paid); return acc;
      }, { total: 0, paid: 0, pending: 0 });

      totalsJSX = (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Card>
            <div style={{ fontSize: 12, color: 'rgba(180,180,178,0.9)' }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{`$${totals.total.toLocaleString()}`}</div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: 'rgba(180,180,178,0.9)' }}>Paid</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{`$${totals.paid.toLocaleString()}`}</div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, color: 'rgba(180,180,178,0.9)' }}>Pending</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{`$${totals.pending.toLocaleString()}`}</div>
          </Card>
        </div>
      );
    }

    return (
      <PageShell title="Finance" subtitle="Project financials." actions={<CalendarAction items={calItems} title="Finance calendar" />}> 
        <div>
          {/* View/sort buttons */}
          <div style={{ margin: '12px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={() => { setViewMode('all'); setPage(1); }} style={{ background: viewMode==='all' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>All</Button>
            <Button onClick={() => { setViewMode('active'); setPage(1); }} style={{ background: viewMode==='active' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Active</Button>
            <Button onClick={() => { setViewMode('completed'); setPage(1); }} style={{ background: viewMode==='completed' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Completed</Button>
            <Button onClick={() => { setViewMode('inactive'); setPage(1); }} style={{ background: viewMode==='inactive' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Inactive</Button>
          </div>

          {tasks.length === 0 && <p>No tasks</p>}
          {tasks.length > 0 && (
            <div>
              {/* If current user is staff, show aggregated finance summary */}
              {totalsJSX}

              {/* Filtering and pagination */}
              {(() => {
                const now = new Date();
                const lower = (s?: any) => (s || '').toString().toLowerCase();
                let filtered = tasks.slice();
                if (viewMode === 'active') {
                  filtered = tasks.filter(p => {
                    const start = p.timeline?.from ? new Date(p.timeline.from) : null;
                    const end = p.timeline?.to ? new Date(p.timeline.to) : null;
                    return start && (!end ? now >= start : (now >= start && now <= end));
                  });
                } else if (viewMode === 'completed') {
                  filtered = tasks.filter(p => lower(p.status) === 'completed' || lower(p.status) === 'done' || lower(p.status) === 'finished');
                } else if (viewMode === 'inactive') {
                  filtered = tasks.filter(p => {
                    const start = p.timeline?.from ? new Date(p.timeline.from) : null;
                    const end = p.timeline?.to ? new Date(p.timeline.to) : null;
                    return (start && end && now > end) || lower(p.status) === 'inactive';
                  });
                }
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
                const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
                return <>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {paged.map(p => {
                      const start = p.timeline?.from ? new Date(p.timeline.from) : null;
                      const end = p.timeline?.to ? new Date(p.timeline.to) : null;
                      const active = start && (!end ? now >= start : (now >= start && now <= end));
                      const waitingConfirmation = Array.isArray(p.milestones) && p.milestones.some((m:any) => m.confirmedByUser && !m.paidByAdmin);
                      const total = Number(p.total_cost ?? p.total ?? (p.milestones ? p.milestones.reduce((s:any,m:any)=> s + (Number(m.amount)||0),0) : 0));
                      const paid = Number(p.paid_amount ?? (p.milestones ? p.milestones.reduce((s:any,m:any)=> s + ((m.paidByAdmin ? (Number(m.amount)||0) : 0)),0) : 0));
                      const pending = Math.max(0, total - paid);
                      return (
                        <TileCard
                          key={p._id}
                          meeting={{
                            _id: p._id,
                            title: p.title,
                            date: undefined,
                            time: undefined,
                            requestedBy: undefined,
                            status: active ? 'approved' : 'finished'
                          }}
                          active={active ? 'approved' : 'finished'}
                          onClick={() => openTask(p._id)}
                          ariaLabel={`Open project ${p.title}`}
                          // align internal left content to top so amounts/notifier sit under the title
                          alignTop={true}
                          rightAction={<a onClick={(e:any)=>{ e.stopPropagation(); openTask(p._id); }} style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span></a>}
                        >
                          <div style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {waitingConfirmation ? (
                              <div style={{ marginRight: 6, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(245,158,11,0.9)', display: 'inline-block', marginRight: 6 }} />
                                <div style={{ color: 'rgba(245,158,11,0.95)', fontSize: 'clamp(11px,2.2vw,12px)', fontWeight: 700, lineHeight: 1 }}>{'Confirmation pending'}</div>
                              </div>
                            ) : <div style={{ minWidth: 0 }} />}

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 800, fontSize: 'clamp(14px,3.2vw,18px)', lineHeight: 1 }}>{`$${total.toLocaleString()}`}</div>
                              <div style={{ marginTop: 2, display: 'flex', gap: 8, justifyContent: 'flex-end', fontSize: 'clamp(11px,2vw,13px)' }}>
                                <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{`Paid: $${paid.toLocaleString()}`}</div>
                                <div style={{ color: 'rgba(180,180,178,0.9)', fontWeight: 700 }}>{`Pending: $${pending.toLocaleString()}`}</div>
                              </div>
                            </div>
                          </div>
                        </TileCard>
                      );
                    })}
                  </div>
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0' }}>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button key={i+1} onClick={() => setPage(i+1)} style={{ background: page === (i+1) ? 'rgba(255,255,255,0.10)' : 'transparent', minWidth: 32 }}>{i+1}</Button>
                      ))}
                    </div>
                  )}
                </>;
              })()}
            </div>
          )}
          {selectedProject ? (
            <Dialog title={selectedProject.title} borderColor={'rgba(44, 44, 44, 0.85)'} onClose={() => setSelectedProject(null)} footer={<><Button onClick={() => setSelectedProject(null)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button></>}> 
              <div style={{ marginTop: 6 }}>
            <div><strong>Total:</strong> {selectedProject.total_cost ?? selectedProject.total ?? (selectedProject.milestones ? selectedProject.milestones.reduce((s:any,m:any)=> s + (Number(m.amount)||0),0) : 0)}</div>
            <div style={{ marginTop: 8 }}><strong>Objectives:</strong> {(selectedProject.objectives || []).join(', ') || '—'}</div>
            {selectedProject.milestones && (
              <div style={{ marginTop: 12 }}>
                <strong>Milestones</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {selectedProject.milestones.map((m:any,i:number)=> (
                    <Card key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{m.title}</div>
                          <div style={{ color: 'rgba(180,180,178,0.9)', fontSize: 13, marginBottom: 8 }}>{/* optional meta */}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {m.confirmedByUser ? (
                              <span style={{ fontSize: 12, background: '#064e3b', color: '#10b981', padding: '4px 10px', borderRadius: 999 }}>Confirmed (waiting)</span>
                            ) : (
                              <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', color: 'rgba(180,180,178,0.9)', padding: '4px 10px', borderRadius: 999 }}>Unconfirmed</span>
                            )}
                            {m.paidByAdmin ? (<span style={{ fontSize: 12, background: '#0b1220', color: '#9ae6b4', padding: '4px 10px', borderRadius: 999 }}>Paid</span>) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
                          <div style={{ fontWeight: 800, fontSize: 20, color: '#ffffff' }}>{typeof m.amount === 'number' ? `$${m.amount}` : m.amount}</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {m.paymentLink ? (
                              <a href={m.paymentLink} target="_blank" rel="noreferrer"><Button style={{ padding: '10px 16px', fontSize: 15 }}>Pay</Button></a>
                            ) : (
                              <Button style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)', color: 'rgba(180,180,178,0.9)', padding: '8px 12px' }} disabled>Pay</Button>
                            )}

                            {m.confirmedByUser ? (
                              <span style={{ fontSize: 13, color: 'rgba(180,180,178,0.9)', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>Confirmed</span>
                            ) : (
                              // allow confirm for admins or the project owner (consumer)
                              (currentUser && (currentUser.role === 'admin' || currentUser.type === 'admin' || String(selectedProject?.author?.id) === String(currentUser?.id))) ? (
                                <button onClick={()=>confirmTaskMilestone(selectedProject._id, i)} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(180,180,178,0.06)', color: 'rgba(180,180,178,0.95)' }}>Confirm</button>
                              ) : (
                                <button disabled style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(180,180,178,0.04)', color: 'rgba(180,180,178,0.5)' }}>Confirm</button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      ) : null}
      </div>
    </PageShell>
  );
}
