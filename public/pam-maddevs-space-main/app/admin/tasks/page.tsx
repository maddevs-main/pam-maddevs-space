"use client";
import React from 'react';
import PageShell from '../../../components/PageShell';
import TileCard from '../../../components/TileCard';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import TaskForm from '../../../components/TaskForm';

export default function AdminTasksPage() {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(()=>{ load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) { setTasks([]); setLoading(false); return; }
      const d = await res.json(); setTasks(d.tasks || []);
    } catch (e) { setTasks([]); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 12 }}>Loading...</div>;

  return (
    <PageShell title="Admin Tasks" subtitle="Create and assign tasks to staff.">
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button onClick={() => setCreateOpen(true)} style={{ background: '#065f46', color: '#fff' }}>Create Task</Button>
        </div>

        {tasks.length === 0 ? <p>No tasks</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {tasks.map(t => (
              <TileCard key={t._id || t.id} meeting={{ _id: t._id, title: t.title, date: t.created_at ? new Date(t.created_at).toLocaleDateString() : '', time: '', requestedBy: t.assignedTo?.name || undefined, status: t.status?.text || 'open' }} onClick={() => setSelected(t)} rightAction={<div style={{ display: 'flex', gap: 8 }}><button onClick={(e)=>{ e.stopPropagation(); setSelected(t); setEditOpen(true); }} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.06)', padding: '6px 8px', borderRadius: 6 }}>Edit</button></div>} />
            ))}
          </div>
        )}

        {createOpen ? (
          <Dialog title="Create Task" onClose={() => setCreateOpen(false)} footer={<><Button onClick={() => setCreateOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
            <TaskForm mode="create" onDone={() => { setCreateOpen(false); load(); }} />
          </Dialog>
        ) : null}

        {selected ? (
          <Dialog title={selected.title || 'Task'} onClose={() => setSelected(null)} footer={<><Button onClick={() => setSelected(null)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button></>}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><strong>Assigned to:</strong> {selected.assignedTo?.name || '—'}</div>
              <div><strong>Timeline:</strong> {selected.timeline?.from || '—'} — {selected.timeline?.to || '—'}</div>
              <div>{selected.description}</div>
            </div>
          </Dialog>
        ) : null}

        {editOpen && selected ? (
          <Dialog title={`Edit: ${selected.title || ''}`} onClose={() => setEditOpen(false)} footer={<><Button onClick={() => setEditOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Cancel</Button></>}>
            <TaskForm mode="edit" taskId={String(selected._id)} initial={selected} onDone={() => { setEditOpen(false); load(); }} />
          </Dialog>
        ) : null}

      </div>
    </PageShell>
  );
}

