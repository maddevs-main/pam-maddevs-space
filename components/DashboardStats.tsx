"use client";
import React from 'react';
import styled from 'styled-components';
import Card from './ui/Card';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Frame = styled.div`
  background: rgba(36, 36, 36, 0.96);
  border-radius: 15px;
  position: relative;
  overflow: hidden;
  margin-bottom: 18px;
  padding: 20px 28px;
  min-height: 420px;

  @media (min-width: 1280px) {
    min-height: 520px; /* larger frame on wide screens to fill space */
  }

  @media (max-width: 980px) {
    padding: 14px;
    min-height: 480px; /* stacked cards will fit within this */
  }
`;

const CardsWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: ${160}px;
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-auto-rows: ${160}px;
    gap: 12px;
  }
`;

const FrameGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px; /* left: cards, right: meetings */
  gap: 18px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: ${160}px;
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-auto-rows: ${160}px;
    gap: 12px;
  }
`;

const CARD_HEIGHT = 160;

// Radial (donut) geometry constants — compute inner hole so inner element fits exactly
const RADIAL_SIZE = 120;
const RADIAL_STROKE = 14;
const RADIAL_INNER = RADIAL_SIZE - (RADIAL_STROKE * 2); // inner hole diameter
// Central palette color for positive/approved actions
const PROJECT_ACTION_GREEN = '#526452';
const RGB_FINANCE_GREEN = PROJECT_ACTION_GREEN; // hex used for SVG strokes
const RGB_STAGE_BLUE = PROJECT_ACTION_GREEN;
const RGB_STAGE_TOP_GREEN = PROJECT_ACTION_GREEN;

const MeetingsBox = styled.div`
  width: 100%;
  height: 100%;
  min-height: ${CARD_HEIGHT * 2 + 18}px; /* ensure it visually matches two rows of cards */
  background: rgba(44, 44, 44, 1);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  @media (max-width: 980px) {
    min-height: ${CARD_HEIGHT}px;
  }
`;

const SmallCard = styled.div< { bg:string } >`
  position: relative;
  width: 100%;
  height: ${CARD_HEIGHT}px;
  background: ${p => p.bg};
  border-radius: 12px;
  padding: 14px 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center; /* center content vertically for uniform look */
  align-items: flex-start;

  @media (max-width: 980px) {
    height: ${CARD_HEIGHT}px; /* keep fixed height on mobile */
    padding: 10px 12px;
  }
`;

const CardLabel = styled.div`
  color: #ffffff;
  text-align: left;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.6px;
`;

const CardBig = styled.div`
  color: #ffffff;
  font-weight: 800;
  line-height: 1;
  /* larger unified size to fill the frame visually */
  font-size: clamp(26px, 5.8vw, 56px);
  margin-top: 6px;
  position: relative;

  @media (max-width: 980px) {
    font-size: clamp(20px, 6vw, 28px);
  }
`;

const CenterCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const MetricCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px;
  min-height: 120px;
`;

const BigNumber = styled.div`
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
  color: #f8f8f8; /* off-white numbers */
`;

const MetricLabel = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: rgba(248,248,248,0.85); /* off-white labels */
`;

const MetricSub = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(248,248,248,0.7);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RadialWrap = styled.div`
  width: ${RADIAL_SIZE}px;
  height: ${RADIAL_SIZE}px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadialInner = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${RADIAL_INNER}px;
  height: ${RADIAL_INNER}px;
  border-radius: 50%;
  background: ${(p:any) => p.theme.colors.bg || '#fff'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 12px;
`;

const Bar = styled.div`
  height: 14px;
  background: rgba(59, 59, 59, 1);
  border-radius: 999px;
  width: 100%;
  overflow: hidden;
`;

const BarFill = styled.div<{w:number,color?:string}>`
  height: 100%;
  width: ${p => p.w}%;
  background: ${p => p.color || RGB_STAGE_BLUE}; /* default to blue for progress bars */
  border-radius: 999px;
  transition: width 300ms ease;
`;

const Small = styled.div`
  font-size: 13px;
  color: rgba(248,248,248,0.75);
`;

function Donut({ pct=0, size=150, stroke=14, color=RGB_FINANCE_GREEN }:{pct?:number,size?:number,stroke?:number,color?:string}){
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size/2},${size/2})`}>
        {/* background ring */}
        <circle r={radius} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={stroke} />
        {/* foreground ring with flat color, rounded linecap for playful look */}
        <circle r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} transform={`rotate(-90)`} />
      </g>
    </svg>
  );
}

export default function DashboardStats({ data }:{ data?: any }) {
  // client-side projects state: use server-provided list if available, otherwise fetch client-side
  const [projectsListState, setProjectsListState] = React.useState<any[]>(data?.projects?.list || []);
  const [currentUser, setCurrentUser] = React.useState<any | null>(data?.user || null);
  const [financeState, setFinanceState] = React.useState<{total:number,paid:number}>({ total: Number(data?.finance?.total ?? 0), paid: Number(data?.finance?.paid ?? 0) });
  const projectsList: any[] = projectsListState;

  // client-side fetch: load current user first; for staff fetch `/api/tasks`, otherwise fetch `/api/projects`.
  React.useEffect(() => {
    if (projectsListState && projectsListState.length) return; // already have data
    let mounted = true;
    async function load() {
      try {
        const userRes = await fetch('/api/users/me');
        let userData: any = null;
        if (userRes.ok) {
          const ud = await userRes.json(); userData = ud?.user || ud;
          if (mounted) setCurrentUser(userData);
        }

        if (userData && (userData.role === 'staff' || userData.type === 'staff')) {
          const taskRes = await fetch('/api/tasks');
          let tasksData: any[] = [];
          if (taskRes.ok) {
            const td = await taskRes.json(); tasksData = td.tasks || [];
          }
          const filtered = filterTasksForUser(tasksData, userData);
          if (mounted) setProjectsListState(filtered);
          // fetch staff finance entries to populate finance totals for staff dashboards
          try {
            const finRes = await fetch('/api/staff-finance');
            if (finRes.ok) {
              const fd = await finRes.json();
              const items = fd.items || [];
              const aggTotal = items.reduce((s:any,it:any) => {
                const ms = it.milestones || [];
                const itemTotal = Number(it.total_cost ?? ms.reduce((ss:any,m:any)=> ss + (Number(m.amount)||0), 0)) || 0;
                return s + itemTotal;
              }, 0);
              const aggPaid = items.reduce((s:any,it:any) => {
                const ms = it.milestones || [];
                const itemPaid = ms.reduce((ss:any,m:any) => ss + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount)||0) : 0), 0);
                return s + itemPaid;
              }, 0);
              if (mounted) setFinanceState({ total: aggTotal, paid: aggPaid });
            }
          } catch (e) {
            // ignore
          }
          return;
        }

        const projRes = await fetch('/api/projects');
        let projectsData: any[] = [];
        if (projRes.ok) {
          const d = await projRes.json(); projectsData = d.projects || [];
        }
        const filtered = filterTasksForUser(projectsData, userData);
        if (mounted) setProjectsListState(filtered);
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

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
        if (t.assignedTo) return String(t.assignedTo?.id || t.assignedTo) === String(uid);
        return String(t.author?.id || t.author?._id) === String(uid);
      });
    }
    return tasks.filter(t => String(t.author?.id || t.author?._id) === String(uid));
  }
  // compute active projects based on timeline
  const now = new Date();
  const activeProjectsList = projectsList.filter(p => {
    const start = p.timeline?.from ? new Date(p.timeline.from) : null;
    const end = p.timeline?.to ? new Date(p.timeline.to) : null;
    return start && (!end ? now >= start : (now >= start && now <= end));
  });

  // find top project by average stage progress
  const topProjectCalc = projectsList.reduce((best:any, p:any) => {
    const stages = p.stages || [];
    const avg = stages.length ? Math.round(stages.reduce((a:any,b:any)=>a+Number(b.progress||0),0)/stages.length) : 0;
    if (!best || avg > best.avg) return { project: p, avg };
    return best;
  }, null as any);

  const defaultSelectedId = topProjectCalc?.project?._id || (activeProjectsList[0]?._id) || (projectsList[0]?._id) || null;
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(defaultSelectedId);
  React.useEffect(()=>{ if (!selectedProjectId) setSelectedProjectId(defaultSelectedId); }, [defaultSelectedId]);

  const selectedProject = projectsList.find(p => String(p._id) === String(selectedProjectId)) || null;

  // determine role from passed or fetched data (fallback to consumer)
  const role = currentUser?.role || data?.user?.role || data?.user?.type || 'consumer';
  const isAdmin = Boolean(role === 'admin');
  const isStaff = Boolean(role === 'staff');

  // per-project metrics (fall back to aggregated data)
  const projectTotal = selectedProject ? Number(selectedProject.total_cost ?? selectedProject.total ?? (selectedProject.milestones ? selectedProject.milestones.reduce((s:any,m:any)=> s + (Number(m.amount)||0),0) : 0)) : (data?.finance?.total ?? 0);
  const projectPaid = selectedProject ? Number(selectedProject.paid_amount ?? (selectedProject.milestones ? selectedProject.milestones.reduce((s:any,m:any)=> s + ((m.paidByAdmin ? (Number(m.amount)||0) : 0)),0) : 0)) : (data?.finance?.paid ?? 0);
  const projectPending = Math.max(0, projectTotal - projectPaid);
  const projectPct = projectTotal > 0 ? Math.round((projectPaid / projectTotal) * 100) : 0;
  // data is optional; derive finance totals from projects list or selected project when possible
  const aggTotal = projectsList.length ? projectsList.reduce((s:any,p:any)=> s + (Number(p.total_cost ?? p.total ?? (p.milestones ? p.milestones.reduce((ss:any,m:any)=> ss + (Number(m.amount)||0),0) : 0)) || 0), 0) : 0;
  const aggPaid = projectsList.length ? projectsList.reduce((s:any,p:any)=> s + (Number(p.paid_amount ?? (p.milestones ? p.milestones.reduce((ss:any,m:any)=> ss + ((m.paidByAdmin ? (Number(m.amount)||0) : 0)),0) : 0)) || 0), 0) : 0;

  const total = selectedProject ? projectTotal : (isStaff ? financeState.total : (projectsList.length ? aggTotal : (data?.finance?.total ?? 12500)));
  const paid = selectedProject ? projectPaid : (isStaff ? financeState.paid : (projectsList.length ? aggPaid : (data?.finance?.paid ?? 7200)));
  const pending = Math.max(0, total - paid);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const activeProjects = data?.projects?.active ?? activeProjectsList.length;
  const activeMilestones = projectsList.length ? projectsList.reduce((s:any,p:any) => s + ((p.milestones||[]).filter((m:any)=>!m.paidByAdmin).length), 0) : (data?.projects?.activeMilestones ?? 12);
  const topProjectAvg = data?.projects?.topAvg ?? (topProjectCalc?.avg ?? 0); // percent
  const topProjectName = data?.projects?.topProjectName ?? (topProjectCalc?.project?.title ?? (projectsList[0]?.title ?? null));
  const activeProjectName = data?.projects?.activeProjectName ?? (activeProjectsList[0]?.title ?? projectsList[0]?.title ?? null);
  const activeStagesCount = data?.projects?.activeStages ?? 3;
  const activeProjectScore = data?.projects?.activeScore ?? 74;
  // default stages: prefer selected project's stages, else use top project's stages, else fallback sample
  const fallbackStages = [
    { name: 'Discovery', desc: 'Requirements & kickoff', progress: 100 },
    { name: 'Design', desc: 'Wireframes & mockups', progress: 65 },
    { name: 'Build', desc: 'Implementation', progress: 34 },
  ];

  const topStages = topProjectCalc?.project?.stages && topProjectCalc.project.stages.length ? topProjectCalc.project.stages : fallbackStages;
  const displayStages = selectedProject && (selectedProject.stages && selectedProject.stages.length) ? selectedProject.stages : (projectsList.length ? topStages : fallbackStages);

  const meetings = data?.meetings ?? [
    { id: 'm1', title: 'Client kickoff', time: 'Nov 18 • 10:00' },
    { id: 'm2', title: 'Sprint planning', time: 'Nov 20 • 15:00' },
  ];

  const amountReceived = paid; // use paid as amount received
  const amountPending = pending; // amount pending for consumer/admin context

  // card layout positions (matching the supplied sample); values change by role
  const cardLayout = isAdmin ? [
    { key: 'activeProjects', left: 40, top: 42, bg: 'rgba(4,34,90,0.60)', label: 'ACTIVE PROJECTS', value: `${activeProjects}` },
    { key: 'totalPending', left: 323, top: 42, bg: 'rgba(22,86,22,0.30)', label: 'TOTAL PENDING', value: `$${amountPending.toLocaleString()}` },
    { key: 'upcoming', left: 40, top: 161, bg: 'rgba(4,34,90,0.60)', label: 'UPCOMING MEETINGS', value: `${meetings.length}` },
    { key: 'milestones', left: 323, top: 161, bg: 'rgba(255,0,0,0.12)', label: 'ACTIVE MILESTONES', value: `${activeMilestones}` },
    { key: 'placeholder', left: 40, top: 282, bg: 'rgba(0,0,0,0.06)', label: '', value: `` },
  ] : [
    // consumer view
    // replace the top card value with the selected project's avg and name
    { key: 'topAvg', left: 323, top: 42, bg: 'rgba(255,0,0,0.26)', label: selectedProject ? 'SELECTED PROJECT AVG' : 'TOP PROJECT AVG', value: `${selectedProject ? (selectedProject.stages && selectedProject.stages.length ? Math.round(selectedProject.stages.reduce((a:any,b:any)=>a+Number(b.progress||0),0)/selectedProject.stages.length) : 0) : topProjectAvg}%`, sub: selectedProject ? (selectedProject.title || topProjectName) : topProjectName },
    { key: 'liveProjects', left: 40, top: 161, bg: 'rgba(4,34,90,0.60)', label: 'LIVE PROJECTS', value: `${activeProjects}`, sub: activeProjectName },
    { key: 'upcoming', left: 323, top: 161, bg: 'rgba(4,34,90,0.60)', label: 'UPCOMING MEETINGS', value: `${meetings.length}` },
    { key: 'milestones', left: 40, top: 282, bg: 'rgba(22,86,22,0.30)', label: 'ACTIVE MILESTONES', value: `${activeMilestones}`, sub: activeProjectName },
    { key: 'pending', left: 323, top: 282, bg: 'rgba(22,86,22,0.30)', label: 'AMOUNT PENDING', value: `$${amountPending.toLocaleString()}` },
  ];

  return (
    <>
    <Grid>
      {/* Top framed cards (sample layout) */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Frame>
          <FrameGrid>
            <div>
              <CardsGrid>
                {cardLayout.map(c => (
                  <SmallCard key={c.key} bg={c.bg}>
                    <CardLabel>{c.label}</CardLabel>
                    <div style={{ width: '100%' }}>
                      <CardBig>{c.value}</CardBig>
                      {c.sub && <MetricSub style={{ marginTop: 6 }}>{c.sub}</MetricSub>}
                    </div>
                  </SmallCard>
                ))}
              </CardsGrid>
            </div>

            <MeetingsBox>
              <h3 style={{ margin: 0, color: '#f8f8f8' }}>Upcoming Meetings</h3>
              <Small style={{ marginTop: 6 }}>Next scheduled</Small>
              <div style={{ height: 12 }} />
              <div style={{ overflow: 'auto' }}>
                {meetings.map((m:any) => (
                  <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, color: '#f8f8f8' }}>{m.title}</div>
                      <Small>{m.time}</Small>
                    </div>
                  </div>
                ))}
                {meetings.length === 0 && <Small>No upcoming meetings</Small>}
              </div>

              {/* Active projects mini list */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0', color: '#f8f8f8', fontSize: 14 }}>Active Projects</h4>
                {activeProjectsList.length === 0 ? <Small>No active projects</Small> : (
                  <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                    {activeProjectsList.map((p:any) => {
                      const pid = String(p._id || p.id);
                      const isSel = String(selectedProjectId) === pid;
                      const stages = p.stages || [];
                      const avg = stages.length ? Math.round(stages.reduce((a:any,b:any)=>a+Number(b.progress||0),0)/stages.length) : 0;
                      return (
                        <button key={pid} onClick={() => setSelectedProjectId(pid)} style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: isSel ? 'rgba(255,255,255,0.04)' : 'transparent', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, cursor: 'pointer', color: '#f8f8f8' }}>
                          <div style={{ fontWeight: 700 }}>{p.title}</div>
                          <div style={{ color: 'rgba(248,248,248,0.75)', fontSize: 13 }}>{avg}%</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </MeetingsBox>
          </FrameGrid>
        </Frame>
      </div>

      {/* Projects details card spanning three columns on wide screens */}
      <Card style={{ gridColumn: 'span 3', padding: '22px' }}>
        <h3 style={{ margin: 0, color: '#f8f8f8' }}>{isStaff ? 'Tasks' : 'Projects'}</h3>
        <Small style={{ marginTop: 6, fontSize: 14 }}>Stages & progress</Small>
        <div style={{ height: 12 }} />
          <div style={{ marginBottom: 12 }}>
          <Small>{isStaff ? 'Top task avg' : 'Top project avg'}</Small>
          <div style={{ height: 8 }} />
          <Bar style={{ height: 18 }}><BarFill w={topProjectAvg} color={RGB_STAGE_TOP_GREEN} /></Bar>
        </div>

        {displayStages.map((s:any, i:number) => (
          <div key={s.name} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Small>{s.name}</Small>
              <Small>{s.progress}%</Small>
            </div>
            <div style={{ height: 8 }} />
            <Bar><BarFill w={s.progress} color={i === 0 ? RGB_STAGE_TOP_GREEN : RGB_STAGE_BLUE} /></Bar>
            <Small style={{ marginTop: 8 }}>{s.desc}</Small>
          </div>
        ))}
      </Card>

      

      {/* Finance donut card spanning one column */}
      <CenterCard>
        <h3 style={{ margin: 0, color: '#f8f8f8' }}>Finance</h3>
        <Small style={{ marginTop: 6 }}>Overview</Small>
        <div style={{ height: 12 }} />
        <RadialWrap>
            <Donut pct={pct} size={RADIAL_SIZE} stroke={RADIAL_STROKE} color={RGB_FINANCE_GREEN} />
          <RadialInner>
            <div style={{ fontSize: 18, color: '#f8f8f8' }}>{pct}%</div>
            <Small style={{ marginTop: 6, color: '#f8f8f8' }}>${paid.toLocaleString()}</Small>
          </RadialInner>
        </RadialWrap>
      </CenterCard>
      
    </Grid>
    </>
  );
}
