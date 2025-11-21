import PageShell from '../../components/PageShell';
import DashboardStats from '../../components/DashboardStats';
import CalendarAction from '../../components/CalendarAction';
import DashboardGreeting from '../../components/DashboardGreeting';
import { redirect } from 'next/navigation';

async function fetchJson(path: string) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

export default async function DashboardPage() {
  // Fetch user-specific data server-side where possible
  const [userRes, projectsRes, meetingsRes] = await Promise.all([
    fetchJson('/api/users/me'),
    fetchJson('/api/projects'),
    fetchJson('/api/meetings')
  ]);

  const user = userRes?.user || null;
  if (!user) {
    // Server-side redirect for unauthenticated visitors to avoid UI flash
    redirect('/auth/login');
  }
  // projects API returns { projects: [...] }
  const projects = projectsRes?.projects || [];
  const meetings = meetingsRes?.meetings || [];

  // Aggregate finance and project stats for DashboardStats
  const total = projects.reduce((s:any,p:any)=> s + (Number(p.total_cost ?? p.total ?? 0) || 0), 0);
  const paid = projects.reduce((s:any,p:any)=> s + (Number(p.paid_amount ?? 0) || 0), 0);
  const activeProjects = projects.filter((p:any) => {
    const now = new Date();
    const start = p.timeline?.from ? new Date(p.timeline.from) : null;
    const end = p.timeline?.to ? new Date(p.timeline.to) : null;
    return start && (!end ? now >= start : (now >= start && now <= end));
  }).length;
  const activeMilestones = projects.reduce((s:any,p:any) => s + ((p.milestones||[]).filter((m:any)=>!m.paidByAdmin).length), 0);
  const stages = projects.flatMap((p:any) => p.stages || []);
  const topProject = projects.reduce((best:any,p:any) => {
    const avg = (p.stages||[]).length ? Math.round((p.stages||[]).reduce((a:any,b:any)=>a+Number(b.progress||0),0)/ (p.stages||[]).length) : 0;
    if (!best || avg > best.avg) return { project: p, avg };
    return best;
  }, null as any);

  const data = {
    user,
    finance: { total, paid },
    projects: {
      active: activeProjects,
      activeMilestones,
      topAvg: topProject?.avg ?? 0,
      topProjectName: topProject?.project?.title ?? null,
      list: projects,
      activeProjectName: projects.find(p=>p.approved)?.title || (projects[0]?.title || null),
      activeStages: stages.length,
      activeScore: topProject?.avg ?? 0,
      stages: stages.slice(0,3)
    },
    meetings
  };
  // calendar items: projects (blue) and meetings (orange)
  const calItems = [
    ...(projects.map((p:any) => ({ id: String(p._id), title: p.title || 'Untitled', from: p.dueDate || p.timeline?.from || null, to: p.timeline?.to || null, color: 'rgb(59,130,246)', type: 'task' }))),
    ...(meetings.map((m:any) => ({ id: String(m._id || m.id), title: m.title || 'Meeting', from: m.scheduledAt || null, to: m.scheduledAt || null, color: 'rgb(249,115,22)', type: 'meeting' })))
  ];

  return (
    <PageShell title="Dashboard" fullWidth actions={<CalendarAction items={calItems} title="Dashboard calendar" />}>
      <DashboardGreeting />

      <DashboardStats data={data} />
    </PageShell>
  );
}
