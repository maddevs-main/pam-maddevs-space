"use client";
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import TileCard from '../../../../components/TileCard';
import PageShell from '../../../../components/PageShell';
import Button from '../../../../components/ui/Button';
import Dialog from '../../../../components/ui/Dialog';
import Input, { TextInput } from '../../../../components/ui/Input';

export default function TaskDetailPage() {
  const params: any = useParams();
  const id = params?.id;
  const [loading, setLoading] = React.useState(true);
  const [task, setTask] = React.useState<any>(null);
  const [user, setUser] = React.useState<any>(null);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [addField, setAddField] = React.useState('links');
  const [addLink, setAddLink] = React.useState('');
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/tasks/' + id);
        if (!r.ok) return;
        const d = await r.json();
        if (!mounted) return;
        setTask(d.task || d);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
    // fetch current user info for permissions
    (async () => {
      try {
        const r2 = await fetch('/api/auth/me');
        if (!r2.ok) return;
        const jd = await r2.json();
        if (!mounted) return;
        setUser(jd.user || jd);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <PageShell title="Task"><p>Loading...</p></PageShell>;
  if (!task) return <PageShell title="Task"><p>Task not found</p></PageShell>;

  return (
    <PageShell title={task.title || 'Task'} subtitle={task.description || ''}>
      <div style={{ display: 'grid', gap: 12 }}>
        <TileCard
          meeting={{
            _id: task._id,
            title: task.title,
            date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''),
            time: task.dueDate ? new Date(task.dueDate).toLocaleTimeString() : '',
            timelineRange: (task.timeline && task.timeline.from && task.timeline.to) ? `${new Date(task.timeline.from).toLocaleDateString()} — ${new Date(task.timeline.to).toLocaleDateString()}` : undefined,
            status: task.completed ? 'completed' : (task.status_internal || task.status?.text || 'unknown')
          }}
        />
        <div>
          <h3>Details</h3>
          <p><strong>Assigned to:</strong> {Array.isArray(task.people_allocated) ? task.people_allocated.join(', ') : (task.people_allocated || '—')}</p>
          <p><strong>Progress:</strong> {task.progress ?? task.stages?.reduce((s:any,n:any)=>s+(Number(n.progress)||0),0)/Math.max(1,(task.stages||[]).length) || 0}%</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button onClick={() => router.back()}>Back</Button>
            {/* Show Add Link button if user is admin, the task author (consumer), or assigned staff */}
            {user && (user.role === 'admin' || (task.author && String(task.author.id) === String(user.id)) || (user.role === 'staff' && String(task.assignedTo?.id) === String(user.id))) ? (
              <Button onClick={() => setShowAddDialog(true)}>Add link</Button>
            ) : null}
          </div>

          {/* Links listing */}
          <div style={{ marginTop: 12 }}>
            <h4>Links</h4>
            {['links','filebase_links','credential_links','other_links'].map((f) => (
              <div key={f} style={{ marginBottom: 8 }}>
                <strong style={{ textTransform: 'capitalize' }}>{f.replace('_', ' ')}</strong>
                <ul>
                  {(Array.isArray(task[f]) ? task[f] : []).map((l:any, idx:number) => (
                    <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <a href={l} target="_blank" rel="noreferrer" style={{ color: '#9ecbff' }}>{l}</a>
                      {user && user.role === 'admin' ? (
                        <Button onClick={async () => {
                          try {
                            const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove_link', field: f, index: idx }) });
                            if (!res.ok) throw new Error('remove failed');
                            // refetch
                            const r = await fetch('/api/tasks/' + id);
                            const d = await r.json();
                            setTask(d.task || d);
                          } catch (e) { console.error(e); }
                        }}>Remove</Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Stages and progress controls */}
          {Array.isArray(task.stages) && task.stages.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <h4>Stages</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {task.stages.map((s:any, idx:number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.name || `Stage ${idx+1}`}</div>
                      <div style={{ color: '#b3b3b3' }}>{s.description || ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 56, textAlign: 'center' }}>{Number(s.progress) || 0}%</div>
                      {(user && (user.role === 'admin' || (user.role === 'staff' && String(task.assignedTo?.id) === String(user.id)))) ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button onClick={async () => {
                            const newVal = Math.max(0, Math.min(100, (Number(s.progress)||0) - 5));
                            try {
                              const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_stage_progress', stageIndex: idx, progress: newVal }) });
                              if (!res.ok) throw new Error('failed');
                              const r = await fetch('/api/tasks/' + id);
                              const d = await r.json();
                              setTask(d.task || d);
                            } catch (e) { console.error(e); }
                          }}>-</Button>
                          <Button onClick={async () => {
                            const newVal = Math.max(0, Math.min(100, (Number(s.progress)||0) + 5));
                            try {
                              const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_stage_progress', stageIndex: idx, progress: newVal }) });
                              if (!res.ok) throw new Error('failed');
                              const r = await fetch('/api/tasks/' + id);
                              const d = await r.json();
                              setTask(d.task || d);
                            } catch (e) { console.error(e); }
                          }}>+</Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* Mark complete button (only enabled when all stages >=100) */}
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    const stages = Array.isArray(task.stages) ? task.stages : [];
                    const allDone = stages.length === 0 ? true : stages.every((s:any) => Number(s.progress) >= 100);
                    const canAct = user && (user.role === 'admin' || (user.role === 'staff' && String(task.assignedTo?.id) === String(user.id)) || (user.role === 'consumer' && String(task.author?.id) === String(user.id)));
                    return (
                      <Button disabled={!allDone || !canAct} onClick={async () => {
                        try {
                          const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', status: 'completed' }) });
                          if (!res.ok) {
                            const txt = await res.text();
                            throw new Error(txt || 'failed');
                          }
                          const r = await fetch('/api/tasks/' + id);
                          const d = await r.json();
                          setTask(d.task || d);
                        } catch (e) { console.error(e); alert('Failed to mark complete'); }
                      }}>{allDone ? 'Mark Complete' : 'Complete (wait for stages)'}</Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showAddDialog ? (
        <Dialog title="Add link" onClose={() => setShowAddDialog(false)} footer={
          <>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!addLink || !addField) return;
              try {
                const res = await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_link', field: addField, link: addLink }) });
                if (!res.ok) {
                  const txt = await res.text();
                  throw new Error(txt || 'failed');
                }
                // refresh
                const r = await fetch('/api/tasks/' + id);
                const d = await r.json();
                setTask(d.task || d);
                setAddLink('');
                setAddField('filebase_links');
                setShowAddDialog(false);
              } catch (e) { console.error(e); alert('Failed to add link'); }
            }}>Add</Button>
          </>
        }>
          <div style={{ display: 'grid', gap: 10 }}>
            <label>Type</label>
            <select value={addField} onChange={(e) => setAddField(e.target.value)}>
              <option value="filebase_links">Filebase link</option>
              <option value="credential_links">Credential link</option>
              <option value="other_links">Other link</option>
            </select>
            <label>URL</label>
            <TextInput value={addLink} onChange={(e:any) => setAddLink(e.target.value)} placeholder="https://example.com/..." />
          </div>
        </Dialog>
      ) : null}
    </PageShell>
  );
}
