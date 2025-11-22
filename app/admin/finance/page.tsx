
"use client";
import React from 'react';
import Card from '../../../components/ui/Card';
import TileCard from '../../../components/TileCard';
import PageShell from '../../../components/PageShell';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import ProjectForm from '../../../components/ProjectForm';
import { TextInput } from '../../../components/ui/Input';
import CalendarAction from '../../../components/CalendarAction';

export default function AdminFinancePage() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [staffFin, setStaffFin] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = React.useState<any | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  // Pagination and view/sort state for projects and staff finance
  const [projectViewMode, setProjectViewMode] = React.useState<'all'|'active'|'completed'|'inactive'>('all');
  const [projectPage, setProjectPage] = React.useState(1);
  const [staffViewMode, setStaffViewMode] = React.useState<'all'|'active'|'completed'|'inactive'>('all');
  const [staffPage, setStaffPage] = React.useState(1);
  const PAGE_SIZE = 10;
  React.useEffect(()=>{ load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const p = await fetch('/api/projects');
      const pp = p.ok ? (await p.json()).projects || [] : [];
      setProjects(pp);
      const sf = await fetch('/api/staff-finance');
      const sfd = sf.ok ? (await sf.json()).items || [] : [];
      setStaffFin(sfd);
      const u = await fetch('/api/users');
      const ud = u.ok ? (await u.json()).users || [] : [];
      setUsers(ud);
    } catch (e) {
      setProjects([]); setStaffFin([]); setUsers([]);
    } finally { setLoading(false); }
  }

  // create staff finance
  const [creating, setCreating] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [formUserId, setFormUserId] = React.useState('');
  const [formType, setFormType] = React.useState<'contract'|'hire'>('contract');
  const [formTotal, setFormTotal] = React.useState('');
  const [formStart, setFormStart] = React.useState('');
  const [formEnd, setFormEnd] = React.useState('');
  const [formTenure, setFormTenure] = React.useState('');
  const [formMilestones, setFormMilestones] = React.useState<Array<{title:string,amount:string,paymentLink?:string}>>([]);

  function addMilestone() {
    setFormMilestones(s => [...s, { title: '', amount: '', paymentLink: '' }]);
  }
  function updateMilestone(index:number, key:'title'|'amount'|'paymentLink', value:string) {
    setFormMilestones(s => s.map((m,i)=> i===index ? { ...m, [key]: value } : m));
  }
  function removeMilestone(index:number) {
    setFormMilestones(s => s.filter((_,i)=>i!==index));
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!formUserId) return alert('Select a user');
    setCreating(true);
    try {
      const payload: any = { userId: formUserId, type: formType };
      if (formType === 'contract') {
        const normalizedMilestones = formMilestones.map(m => ({ title: m.title, amount: Number(m.amount || 0), done: 0, paymentLink: m.paymentLink || '', confirmedByUser: 0, paidByAdmin: 0 }));
        const computedTotal = normalizedMilestones.reduce((acc:any, m:any) => acc + (Number(m.amount) || 0), 0);
        payload.total_cost = Number(formTotal || computedTotal || 0);
        payload.start = formStart || null;
        payload.end = formEnd || null;
        payload.milestones = normalizedMilestones;
      } else {
        payload.start = formStart || null;
        payload.end = formEnd || null;
        payload.tenure = formTenure || null;
      }

      const res = await fetch('/api/staff-finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        alert('Error: ' + (d.error || res.statusText));
        setCreating(false);
        return;
      }
      setShowCreateModal(false);
      // reset form
      setFormUserId(''); setFormType('contract'); setFormTotal(''); setFormStart(''); setFormEnd(''); setFormTenure(''); setFormMilestones([]);
      load();
    } catch (err) {
      alert('Error creating');
    } finally { setCreating(false); }
  }

  async function markStaffMilestonePaid(entryId: string, idx: number, unmark = false) {
    try {
      const res = await fetch('/api/staff-finance/' + entryId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: unmark ? 'unmark_paid' : 'mark_paid', milestoneIndex: idx }) });
      if (!res.ok) return alert('Error updating milestone');
      load();
    } catch (e) { alert('Error'); }
  }

  async function markProjectMilestonePaid(projectId: string, idx: number, unmark = false) {
    try {
      const res = await fetch('/api/projects/' + projectId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: unmark ? 'unmark_paid' : 'mark_paid', milestoneIndex: idx }) });
      if (!res.ok) return alert('Error updating project milestone');
      load();
    } catch (e) { alert('Error'); }
  }

  if (loading) return <div style={{ padding: 12 }}>Loading finance...</div>;
  const calItems = [
    ...projects.map(p => ({ id: String(p._id), title: p.title || 'Untitled', from: p.timeline?.from ? String(p.timeline.from) : (p.createdAt ? String(p.createdAt) : null), to: p.timeline?.to ? String(p.timeline.to) : null, color: 'rgb(16,185,129)', type: 'meeting' })),
    ...staffFin.map((s:any) => ({ id: String(s._id), title: s.type || 'Staff Finance', from: s.start ? String(s.start) : null, to: s.end ? String(s.end) : null, color: 'var(--color-yes)', type: 'meeting' })),
  ];

  return (
    <PageShell title="Finance" subtitle="Manage consumer and staff finances.">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Finance</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <CalendarAction items={calItems as any} title="Finance calendar" />
          </div>
        </div>

      <section style={{ marginTop: 12, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Projects (consumer finances)</h4>
        {/* View/sort buttons for projects */}
        <div style={{ margin: '12px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button onClick={() => { setProjectViewMode('all'); setProjectPage(1); }} style={{ background: projectViewMode==='all' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>All</Button>
          <Button onClick={() => { setProjectViewMode('active'); setProjectPage(1); }} style={{ background: projectViewMode==='active' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Active</Button>
          <Button onClick={() => { setProjectViewMode('completed'); setProjectPage(1); }} style={{ background: projectViewMode==='completed' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Completed</Button>
          <Button onClick={() => { setProjectViewMode('inactive'); setProjectPage(1); }} style={{ background: projectViewMode==='inactive' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Inactive</Button>
        </div>
        {projects.length === 0 ? <div>No projects</div> : (() => {
          const now = new Date();
          const lower = (s?: any) => (s || '').toString().toLowerCase();
          let filtered = projects.slice();
          if (projectViewMode === 'active') {
            filtered = projects.filter(p => {
              const start = p.timeline?.from ? new Date(p.timeline.from) : null;
              const end = p.timeline?.to ? new Date(p.timeline.to) : null;
              return start && (!end ? now >= start : (now >= start && now <= end));
            });
          } else if (projectViewMode === 'completed') {
            filtered = projects.filter(p => lower(p.status) === 'completed' || lower(p.status) === 'done' || lower(p.status) === 'finished');
          } else if (projectViewMode === 'inactive') {
            filtered = projects.filter(p => {
              const start = p.timeline?.from ? new Date(p.timeline.from) : null;
              const end = p.timeline?.to ? new Date(p.timeline.to) : null;
              return (start && end && now > end) || lower(p.status) === 'inactive';
            });
          }
          const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
          const paged = filtered.slice((projectPage-1)*PAGE_SIZE, projectPage*PAGE_SIZE);
          return <>
            <div style={{ display: 'grid', gap: 8 }}>
              {paged.map(p => {
                const start = p.timeline?.from ? new Date(p.timeline.from) : null;
                const end = p.timeline?.to ? new Date(p.timeline.to) : null;
                const active = start && (!end ? now >= start : (now >= start && now <= end));
                return (
                  <TileCard
                    key={p._id}
                    meeting={{
                      _id: p._id,
                      title: p.title,
                      date: p.timeline?.from ? new Date(p.timeline.from).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
                      time: p.timeline?.from ? new Date(p.timeline.from).toLocaleTimeString() : '',
                      requestedBy: p.author?.name || p.author?.id || undefined,
                      status: active ? 'approved' : 'finished'
                    }}
                    active={active ? 'approved' : 'finished'}
                    onClick={() => setSelectedProject(p)}
                    rightAction={<Button onClick={() => setSelectedProject(p)}>Open</Button>}
                  />
                );
              })}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0' }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button key={i+1} onClick={() => setProjectPage(i+1)} style={{ background: projectPage === (i+1) ? 'rgba(255,255,255,0.10)' : 'transparent', minWidth: 32 }}>{i+1}</Button>
                ))}
              </div>
            )}
          </>;
        })()}
      </section>
      {/* Selected Entry Modal */}
      {selectedEntry ? (
        (() => {
          const sm = selectedEntry.milestones || [];
          const sTotal = sm.reduce((acc:any, m:any) => acc + (Number(m?.amount) || 0), 0);
          const sPaid = sm.reduce((acc:any, m:any) => acc + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount) || 0) : 0), 0);
          const sPending = Math.max(0, sTotal - sPaid);
          return (
            <Dialog title={`Staff Finance — ${selectedEntry.type}`} onClose={() => setSelectedEntry(null)} footer={<><Button onClick={() => setSelectedEntry(null)}>Close</Button></>}>
              <div style={{ marginTop: 12 }}>
                <div><strong>User:</strong> {(() => { const u = users.find(x=>String(x.id||x._id) === String(selectedEntry.userId)); return u ? (u.name || u.email) : selectedEntry.userId; })()}</div>
                <div style={{ marginTop: 8 }}><strong>Total:</strong> ${sTotal.toLocaleString()}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                  <div><strong>Paid:</strong> ${sPaid.toLocaleString()}</div>
                  <div style={{ color: 'rgba(180,180,178,0.9)' }}><strong>Pending:</strong> ${sPending.toLocaleString()}</div>
                </div>
                <div style={{ marginTop: 8 }}><strong>Start:</strong> {selectedEntry.start ? new Date(selectedEntry.start).toLocaleDateString() : '—'}</div>
                <div style={{ marginTop: 8 }}><strong>End:</strong> {selectedEntry.end ? new Date(selectedEntry.end).toLocaleDateString() : '—'}</div>
                {selectedEntry.type === 'contract' && selectedEntry.milestones && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Milestones</strong>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      {selectedEntry.milestones.map((m:any,i:number)=> (
                        <Card key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{m.title}</div>
                                  <div style={{ color: 'rgba(180,180,178,0.9)', fontSize: 13, marginBottom: 8 }}>{/* description or meta could go here */}</div>
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
                                    ) : null}
                                    {m.paidByAdmin ? (
                                      <Button onClick={()=>markStaffMilestonePaid(String(selectedEntry._id), i, true)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Unmark Paid</Button>
                                    ) : (
                                      <Button onClick={()=>markStaffMilestonePaid(String(selectedEntry._id), i)} style={{ padding: '10px 14px' }}>Mark Paid</Button>
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
          );
        })()
      ) : null}

      {/* Request meeting UI removed from finance page; use Meetings page for meeting requests */}

      {/* Selected Project Modal */}
      {selectedProject ? (
        <Dialog title={selectedProject.title} onClose={() => setSelectedProject(null)} footer={<><Button onClick={()=>setSelectedProject(null)}>Close</Button></>}>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <div><strong>Total:</strong> {selectedProject.total_cost}</div>
            <div><strong>Created by:</strong> {selectedProject.author?.name || selectedProject.author?.id}</div>
            <div><strong>Timeline:</strong> {selectedProject.timeline?.from || '—'} → {selectedProject.timeline?.to || '—'}</div>
            <div><strong>Objectives:</strong> {(selectedProject.objectives || []).join(', ') || '—'}</div>
            {selectedProject.milestones && (
              <div>
                <strong>Milestones</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {selectedProject.milestones.map((m:any,i:number) => (
                    <Card key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          <div style={{ color: 'rgba(180,180,178,0.9)', fontSize: 13 }}>{m.amount}</div>
                          {m.paymentLink ? (<div style={{ marginTop: 6 }}><a href={m.paymentLink} target="_blank" rel="noreferrer">Pay</a></div>) : null}
                          <div style={{ marginTop: 6 }}>
                            {m.confirmedByUser ? (<span style={{ fontSize: 11, background: '#064e3b', color: '#10b981', padding: '2px 8px', borderRadius: 999 }}>Confirmed (waiting)</span>) : (<span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', color: 'rgba(180,180,178,0.9)', padding: '2px 8px', borderRadius: 999 }}>Unconfirmed</span>)}
                            {' '}
                            {m.paidByAdmin ? (<span style={{ fontSize: 11, background: '#0b1220', color: '#9ae6b4', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>Paid</span>) : null}
                          </div>
                        </div>
                        <div>
                          {m.paidByAdmin ? (
                            <Button onClick={()=>markProjectMilestonePaid(selectedProject._id, i, true)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Unmark Paid</Button>
                          ) : (
                            <Button onClick={()=>markProjectMilestonePaid(selectedProject._id, i)}>Mark Paid</Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <a href={`/admin/projects/${selectedProject._id}`}><Button>Open full project</Button></a>
            </div>
          </div>
        </Dialog>
      ) : null}

      <section style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Staff Finance Entries</h4>
          <div>
            <Button onClick={() => setShowCreateModal(true)}>Create Entry</Button>
          </div>
        </div>

        {/* View/sort buttons for staff finance */}
        <div style={{ margin: '12px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button onClick={() => { setStaffViewMode('all'); setStaffPage(1); }} style={{ background: staffViewMode==='all' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>All</Button>
          <Button onClick={() => { setStaffViewMode('active'); setStaffPage(1); }} style={{ background: staffViewMode==='active' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Active</Button>
          <Button onClick={() => { setStaffViewMode('completed'); setStaffPage(1); }} style={{ background: staffViewMode==='completed' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Completed</Button>
          <Button onClick={() => { setStaffViewMode('inactive'); setStaffPage(1); }} style={{ background: staffViewMode==='inactive' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>Inactive</Button>
        </div>
        {staffFin.length === 0 ? <div>No staff finance entries</div> : (() => {
          const now = new Date();
          const lower = (s?: any) => (s || '').toString().toLowerCase();
          let filtered = staffFin.slice();
          if (staffViewMode === 'active') {
            filtered = staffFin.filter(s => {
              const start = s.start ? new Date(s.start) : null;
              const end = s.end ? new Date(s.end) : null;
              return start && (!end ? now >= start : (now >= start && now <= end));
            });
          } else if (staffViewMode === 'completed') {
            filtered = staffFin.filter(s => lower(s.status) === 'completed' || lower(s.status) === 'done' || lower(s.status) === 'finished');
          } else if (staffViewMode === 'inactive') {
            filtered = staffFin.filter(s => {
              const start = s.start ? new Date(s.start) : null;
              const end = s.end ? new Date(s.end) : null;
              return (start && end && now > end) || lower(s.status) === 'inactive';
            });
          }
          const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
          const paged = filtered.slice((staffPage-1)*PAGE_SIZE, staffPage*PAGE_SIZE);
          return <>
            <div style={{ display: 'grid', gap: 8 }}>
              {paged.map(s => {
                const start = s.start ? new Date(s.start) : null;
                const end = s.end ? new Date(s.end) : null;
                const active = start && (!end ? now >= start : (now >= start && now <= end));
                const userDisplay = (() => { const u = users.find(x=>String(x.id||x._id) === String(s.userId)); return u ? (u.name || u.email) : s.userId; })();
                const ms = s.milestones || [];
                const total = ms.reduce((acc:any, m:any) => acc + (Number(m?.amount) || 0), 0);
                const paid = ms.reduce((acc:any, m:any) => acc + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount) || 0) : 0), 0);
                const pending = Math.max(0, total - paid);
                return (
                  <TileCard
                    key={s._id}
                    meeting={{
                      _id: s._id,
                      title: s.type || 'Staff Finance',
                      date: start ? start.toLocaleDateString() : '',
                      time: '',
                      requestedBy: userDisplay,
                      status: active ? 'approved' : 'finished'
                    }}
                    active={active ? 'approved' : 'finished'}
                    leftContent={<div>
                      <div style={{ fontWeight: 700 }}>{s.type}</div>
                      <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 6 }}>User: {userDisplay}</div>
                      <div style={{ color: 'rgba(180,180,178,0.85)', marginTop: 6 }}>Total: ${total.toLocaleString()}</div>
                      <div style={{ color: 'rgba(180,180,178,0.75)', marginTop: 6, fontSize: 13 }}>Start: {start ? start.toLocaleDateString() : '—'} — End: {end ? end.toLocaleDateString() : '—'}</div>
                    </div>}
                    children={<div style={{ marginTop: 6, textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }}>${total.toLocaleString()}</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>Paid: ${paid.toLocaleString()}</div>
                        <div style={{ color: 'rgba(180,180,178,0.9)', fontWeight: 700 }}>Pending: ${pending.toLocaleString()}</div>
                      </div>
                    </div>}
                    rightAction={<Button onClick={() => setSelectedEntry({ ...s, _id: String(s._id), start: s.start ? String(s.start) : null, end: s.end ? String(s.end) : null })}>Open</Button>}
                  />
                );
              })}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0' }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button key={i+1} onClick={() => setStaffPage(i+1)} style={{ background: staffPage === (i+1) ? 'rgba(255,255,255,0.10)' : 'transparent', minWidth: 32 }}>{i+1}</Button>
                ))}
              </div>
            )}
          </>;
        })()}
      </section>
      {/* Create Entry Modal */}
      {showCreateModal ? (
        <Dialog title="Create Staff Finance Entry" onClose={() => setShowCreateModal(false)} footer={<><Button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button><Button type="submit" form="create-staff-finance-form" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
          <form id="create-staff-finance-form" onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={formUserId} onChange={e=>setFormUserId(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 6 }}>
                <option value="">Select staff</option>
                {users.map(u => (<option key={u.id || u._id} value={u.id || u._id}>{u.name || u.email}</option>))}
              </select>
              <select value={formType} onChange={e=>setFormType(e.target.value as any)} style={{ width: 160, padding: '8px 10px', borderRadius: 6 }}>
                <option value="contract">contract</option>
                <option value="hire">hire</option>
              </select>
            </div>

            {formType === 'contract' ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <TextInput placeholder="Total amount" value={formTotal} onChange={e=>setFormTotal(e.target.value)} style={{ flex: 1 }} />
                  <input type="date" value={formStart} onChange={e=>setFormStart(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
                  <input type="date" value={formEnd} onChange={e=>setFormEnd(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ margin: 0 }}>Milestones</strong>
                    <Button onClick={addMilestone} type="button">Add Milestone</Button>
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                    {formMilestones.map((m,i)=> (
                      <Card key={i}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input placeholder="Title" value={m.title} onChange={e=>updateMilestone(i,'title',e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 6 }} />
                          <input placeholder="Amount" value={m.amount} onChange={e=>updateMilestone(i,'amount',e.target.value)} style={{ width: 120, padding: '8px 10px', borderRadius: 6 }} />
                          <input placeholder="Payment link (optional)" value={m.paymentLink || ''} onChange={e=>updateMilestone(i,'paymentLink',e.target.value)} style={{ width: 220, padding: '8px 10px', borderRadius: 6 }} />
                          <Button type="button" onClick={()=>removeMilestone(i)} style={{ background: '#7a3030' }}>Remove</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" value={formStart} onChange={e=>setFormStart(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
                <input type="date" value={formEnd} onChange={e=>setFormEnd(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
                <TextInput placeholder="Tenure (months)" value={formTenure} onChange={e=>setFormTenure(e.target.value)} style={{ width: 160 }} />
              </div>
            )}
          </form>
        </Dialog>
      ) : null}
      </div>
    </PageShell>
  );
}
