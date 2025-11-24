import PageShell from '../../components/PageShell';
import DashboardStats from '../../components/DashboardStats';
import CalendarAction from '../../components/CalendarAction';
import DashboardGreeting from '../../components/DashboardGreeting';
import { redirect } from 'next/navigation';
import getServerAuth from '../../lib/serverAuth';
import connectToDatabase from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { sanitizeList, sanitizeDoc } from '../../lib/sanitize';


export default async function DashboardPage() {
  // Fetch user-specific data server-side where possible

  // Use NextAuth server session directly (avoids internal API fetches that don't forward cookies)
  const session: any = await getServerAuth();
  if (!session || !session.user || !(session.user as any).id) {
    redirect('/auth/login');
  }

  const auth = { userId: (session.user as any).id as string, role: (session.user as any).role as string, tenantId: (session.user as any).tenantId as string };

  const { db } = await connectToDatabase();

  // Load user
  const userDoc = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) }, { projection: { passwordHash: 0 } });
  if (!userDoc) redirect('/auth/login');
  const user = { id: userDoc._id.toString(), email: userDoc.email, name: userDoc.name, role: userDoc.role, tenantId: userDoc.tenantId };

  // Load projects based on role
  let projectQuery: any = { tenantId: auth.tenantId };
  if (auth.role === 'admin') {
    projectQuery = { tenantId: auth.tenantId };
  } else if (auth.role === 'consumer') {
    projectQuery = { tenantId: auth.tenantId, 'author.id': auth.userId };
  } else if (auth.role === 'staff') {
    projectQuery = { tenantId: auth.tenantId, $or: [{ people_allocated: { $in: [auth.userId] } }, { staff: { $in: [auth.userId] } }] };
  }
  const projects = await db.collection('projects').find(projectQuery).toArray();

  // Load meetings based on role
  let meetingsQuery: any = { tenantId: auth.tenantId };
  if (auth.role === 'admin') {
    meetingsQuery = { tenantId: auth.tenantId };
  } else {
    meetingsQuery = { tenantId: auth.tenantId, $or: [{ 'requestedBy.id': auth.userId }, { attendees: { $in: [auth.userId] } }] };
  }
  const meetings = await db.collection('meetings').find(meetingsQuery).toArray();

  // Aggregate finance and project stats for DashboardStats
  let total = 0;
  let paid = 0;
  if (auth.role === 'staff') {
    // For staff, compute finance totals from staff_finance entries belonging to this user
    const financeEntries = await db.collection('staff_finance').find({ tenantId: auth.tenantId, userId: auth.userId }).toArray();
    total = financeEntries.reduce((s:any, it:any) => {
      const ms = it.milestones || [];
      const itemTotal = Number(it.total_cost ?? ms.reduce((acc:any,m:any)=> acc + (Number(m.amount)||0), 0)) || 0;
      return s + itemTotal;
    }, 0);
    paid = financeEntries.reduce((s:any, it:any) => {
      const ms = it.milestones || [];
      const itemPaid = ms.reduce((acc:any,m:any)=> acc + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount)||0) : 0), 0);
      return s + itemPaid;
    }, 0);
  } else {
    total = projects.reduce((s:any,p:any)=> s + (Number(p.total_cost ?? p.total ?? 0) || 0), 0);
    paid = projects.reduce((s:any,p:any)=> s + (Number(p.paid_amount ?? 0) || 0), 0);
  }
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

  // sanitize server-side mongo documents before passing to client components
  const sanitizedProjects = sanitizeList(projects);
  const sanitizedMeetings = sanitizeList(meetings);

  const data = {
    user,
    finance: { total, paid },
    projects: {
      active: activeProjects,
      activeMilestones,
      topAvg: topProject?.avg ?? 0,
      topProjectName: topProject?.project?.title ?? null,
      list: sanitizedProjects,
      activeProjectName: sanitizedProjects.find((p:any)=>p.approved)?.title || (sanitizedProjects[0]?.title || null),
      activeStages: stages.length,
      activeScore: topProject?.avg ?? 0,
      stages: stages.slice(0,3)
    },
    meetings: sanitizedMeetings
  };
  // calendar items: projects (blue) and meetings (orange)
  const calItems = [
    ...(sanitizedProjects.map((p:any) => ({ id: String(p.id || p._id || p.id), title: p.title || 'Untitled', from: p.dueDate || p.timeline?.from || null, to: p.timeline?.to || null, color: 'rgb(59,130,246)', type: 'task' }))),
    ...(sanitizedMeetings.map((m:any) => ({ id: String(m.id || m._id || m.id), title: m.title || 'Meeting', from: m.scheduledAt || null, to: m.scheduledAt || null, color: 'rgb(249,115,22)', type: 'meeting' })))
  ];

  return (
    <PageShell title="Dashboard" fullWidth actions={<CalendarAction items={calItems} title="Dashboard calendar" />}>
      <DashboardGreeting />

      <DashboardStats data={data} />
    </PageShell>
  );
}
