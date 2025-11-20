"use client";
import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { TextInput, TextArea } from './ui/Input';

export default function TaskForm({ initial, mode = 'create', taskId, onDone }: { initial?: any, mode?: 'create' | 'edit', taskId?: string, onDone?: (result?: any)=>void }) {
  const [title, setTitle] = React.useState(initial?.title || '');
  const [description, setDescription] = React.useState(initial?.description || '');
  const [objectives, setObjectives] = React.useState<string[]>(initial?.objectives || []);
  const [startDate, setStartDate] = React.useState(initial?.timeline?.from || '');
  const [endDate, setEndDate] = React.useState(initial?.timeline?.to || '');
  const [message, setMessage] = React.useState<string | null>(null);
  const [formStages, setFormStages] = React.useState<Array<{name:string,progress:number}>>(initial?.stages || []);
  const [assignee, setAssignee] = React.useState<{id?:string,name?:string}>(initial?.assignedTo || {});
  const [staffList, setStaffList] = React.useState<Array<any>>([]);

  React.useEffect(() => {
    setTitle(initial?.title || '');
    setDescription(initial?.description || '');
    setObjectives(initial?.objectives || []);
    setStartDate(initial?.timeline?.from || '');
    setEndDate(initial?.timeline?.to || '');
    setFormStages(initial?.stages || []);
    setAssignee(initial?.assignedTo || {});
  }, [initial]);

  React.useEffect(() => { // load staff users for assignment
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        // only show staff users
        const staff = (d.users || []).filter((u:any) => u.role === 'staff');
        setStaffList(staff);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!title) return setMessage('Missing title');
    if (!assignee?.id) return setMessage('Pick an assignee (staff)');

    const body: any = {
      title,
      description,
      objectives,
      timeline: { from: startDate || null, to: endDate || null },
      stages: formStages.map(s => ({ name: s.name, progress: Number(s.progress || 0) })),
      assignedTo: { id: assignee.id }
    };

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/tasks/' + taskId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', payload: body }) });
      }
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMessage(JSON.stringify(data));
        return;
      }
      setMessage(mode === 'create' ? 'Task created' : 'Task updated');
      if (onDone) onDone(data);
    } catch (err) {
      setMessage('Error: ' + String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8, display: 'grid', gap: 8 }}>
      <Card classic>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Title</label>
          <TextInput placeholder="Title" value={title} onChange={e => setTitle((e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
          <TextArea placeholder="Description" value={description} onChange={e => setDescription((e.target as HTMLTextAreaElement).value)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Start</label>
            <TextInput type="date" value={startDate} onChange={e => setStartDate((e.target as HTMLInputElement).value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>End</label>
            <TextInput type="date" value={endDate} onChange={e => setEndDate((e.target as HTMLInputElement).value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Assignee (staff)</label>
          <select value={assignee?.id || ''} onChange={e => {
            const id = e.target.value;
            const u = staffList.find(s => s.id === id);
            setAssignee({ id, name: u?.name || u?.email || id });
          }}>
            <option value="">Select staff...</option>
            {staffList.map(s => (<option key={s.id} value={s.id}>{s.name || s.email}</option>))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Stages</label>
            <Button type="button" onClick={() => setFormStages(s => [...s, { name: '', progress: 0 }])}>Add Stage</Button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {formStages.map((st, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Stage name" value={st.name} onChange={e => setFormStages(s => s.map((x,idx) => idx===i ? { ...x, name: e.target.value } : x))} style={{ flex: 1, padding: '8px 10px', borderRadius: 6 }} />
                  <input placeholder="Progress %" type="number" value={st.progress} onChange={e => setFormStages(s => s.map((x,idx) => idx===i ? { ...x, progress: Number((e.target as HTMLInputElement).value) } : x))} style={{ width: 120, padding: '8px 10px', borderRadius: 6 }} />
                  <Button type="button" onClick={() => setFormStages(s => s.filter((_,idx) => idx !== i))} style={{ background: '#7a3030' }}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="submit">{mode === 'create' ? 'Create Task' : 'Save changes'}</Button>
        </div>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
      </Card>
    </form>
  );
}
