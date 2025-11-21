"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../../../components/PageShell';
import TileCard from '../../../components/TileCard';
import CalendarAction from '../../../components/CalendarAction';

export default function StaffProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any | null>(null);

  React.useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([fetch('/api/projects', { credentials: 'same-origin' }), fetch('/api/auth/me', { credentials: 'same-origin' })]);
      let projectsData: any[] = [];
      let userData: any = null;
      if (projRes.ok) {
        const d = await projRes.json(); projectsData = d.projects || [];
      }
      if (userRes.ok) {
        const ud = await userRes.json(); userData = ud?.user || ud;
      }
      setUser(userData);
      const filtered = filterProjectsForUser(projectsData, userData);
      setProjects(filtered);
    } catch (e) { setProjects([]); }
    setLoading(false);
  }

  function filterProjectsForUser(projects:any[], user:any) {
    if (!user) return projects;
    const uid = user.id || user._id || user.userId || user?.sub;
    const role = user.role || user?.type || 'consumer';
    if (role === 'admin') return projects;

    if (role === 'staff') {
      return projects.filter(p => {
        const people = p.people_allocated || p.peopleAllocated || p.staff || [];
        if (Array.isArray(people) && people.length > 0) {
          return people.some((pp:any) => {
            if (!pp) return false;
            if (typeof pp === 'string') return String(pp) === String(uid);
            return String(pp?.id || pp?._id) === String(uid);
          });
        }
        return String(p.author?.id || p.author?._id) === String(uid);
      });
    }

    return projects.filter(p => String(p.author?.id || p.author?._id) === String(uid));
  }

  if (loading) return <div style={{ padding: 16 }}>Loading projects...</div>;
  if (projects.length === 0) return <PageShell title="Projects" subtitle="Projects assigned to you"><p style={{ padding: 16 }}>No projects</p></PageShell>;

  const calItems = projects.map(p => ({ id: String(p._id || p.id), title: p.title || 'Project', from: p.timeline?.from || p.createdAt || null, to: p.timeline?.to || p.timeline?.from || null, color: 'var(--color-yes)', type: 'project' }));

  return (
    <PageShell title="Projects" subtitle="Projects assigned to you">
      <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CalendarAction items={calItems as any} title="Projects calendar" />
        </div>
        {projects.map(p => {
          const stages = p.stages || [];
          const avgStage = stages.length ? Math.round(stages.reduce((s:any, n:any) => s + (Number(n.progress) || 0), 0) / stages.length) : null;
          return (
            <div key={p._id}>
              <TileCard
                meeting={{
                  _id: p._id,
                  title: p.title,
                  date: p.timeline?.from ? new Date(p.timeline.from).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
                  time: p.timeline?.from ? new Date(p.timeline.from).toLocaleTimeString() : '',
                  timelineRange: (p.timeline && p.timeline.from && p.timeline.to) ? `${new Date(p.timeline.from).toLocaleDateString()} — ${new Date(p.timeline.to).toLocaleDateString()}` : (p.timeline && p.timeline.from ? new Date(p.timeline.from).toLocaleDateString() : undefined),
                  requestedBy: undefined,
                  status: p.approved ? 'approved' : (p.status_internal || p.status?.text || 'unknown')
                }}
                onClick={() => router.push(`/dashboard/projects/${p._id}`)}
                active={p.approved ? 'approved' : undefined}
                rightAction={<span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span>}
                avgProgress={avgStage ?? undefined}
                stagesCount={stages.length}
              />
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
