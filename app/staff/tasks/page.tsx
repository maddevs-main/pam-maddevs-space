"use client";
import React from 'react';
import PageShell from '../../../components/PageShell';
import TileCard from '../../../components/TileCard';
import Button from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import CalendarAction from '../../../components/CalendarAction';

export default function StaffTasksPage() {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

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

  async function setStatus(task: any, status: string) {
    try {
      const res = await fetch('/api/tasks/' + String(task._id || task.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', status }) });
      if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Error: ' + JSON.stringify(d)); return; }
      load();
    } catch (e) { alert('Error'); }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading tasks...</div>;

  if (tasks.length === 0) return (
    <PageShell title="My Tasks" subtitle="Tasks assigned to you">
      <div style={{ padding: 12 }}>No tasks assigned to you.</div>
    </PageShell>
  );

  const calItems = tasks.map(t => ({ id: String(t._id || t.id), title: t.title || 'Task', from: t.timeline?.from || t.createdAt || null, to: t.timeline?.to || t.timeline?.from || null, color: 'var(--color-yes)', type: 'task' }));

  return (
    <PageShell title="My Tasks" subtitle="Tasks assigned to you">
      <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CalendarAction items={calItems as any} title="Tasks calendar" />
        </div>
        {tasks.map(t => {
          const timelineRange = (t.timeline && t.timeline.from && t.timeline.to) ? `${new Date(t.timeline.from).toLocaleDateString()} — ${new Date(t.timeline.to).toLocaleDateString()}` : (t.timeline && t.timeline.from ? new Date(t.timeline.from).toLocaleDateString() : undefined);
          const statusText = t.status?.text || t.status || 'open';

          // Derive progress: prefer explicit `t.progress`, otherwise average over `stages` or `subtasks`.
          let progressValue = 0;
          let avgProgress: number | undefined = undefined;
          let stagesCount = 0;
          const stages = Array.isArray(t.stages) ? t.stages : (Array.isArray(t.subtasks) ? t.subtasks : []);
          if (typeof t.progress !== 'undefined' && t.progress !== null) {
            progressValue = Number(t.progress) || 0;
          } else if (stages.length > 0) {
            stagesCount = stages.length;
            const sum = stages.reduce((acc: number, s: any) => acc + (Number(s.progress || 0)), 0);
            avgProgress = Math.round(sum / stagesCount);
            progressValue = avgProgress;
          } else {
            progressValue = Number(t.progress || 0);
          }

          return (
            <div key={t._id || t.id}>
              <TileCard
                title={t.title}
                // If we computed an average from stages, prefer `avgProgress` so TileCard shows explanatory text.
                {...(avgProgress !== undefined ? { avgProgress, stagesCount } : { progress: progressValue })}
                timeline={timelineRange}
                panelColor={statusText === 'completed' ? 'var(--color-dark)' : (statusText === 'requested' ? 'var(--color-pending)' : undefined)}
                leftContent={<div>
                  <div style={{ fontWeight: 800 }}>{t.title}</div>
                  <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 6 }}>{t.description ? (String(t.description).slice(0,120) + (String(t.description).length>120 ? '…' : '')) : ''}</div>
                  <div style={{ marginTop: 6, color: 'rgba(180,180,178,0.8)', fontSize: 13 }}>{t.assignedTo?.name || t.assignedTo || 'Unassigned'}</div>
                </div>}
                onClick={() => router.push('/staff/tasks/' + String(t._id || t.id))}
                rightAction={<span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span>}
                stagesCount={stagesCount}
              />
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
