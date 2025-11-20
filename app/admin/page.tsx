"use client";
import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import DashboardGreeting from '../../components/DashboardGreeting';
import DashboardStats from '../../components/DashboardStats';

export default function AdminPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [uRes, pRes, mRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/projects'),
          fetch('/api/meetings'),
        ]);

        const [uJson, pJson, mJson] = await Promise.all([uRes.json().catch(()=>({})), pRes.json().catch(()=>({})), mRes.json().catch(()=>({}))]);

        const users = uJson?.users || [];
        const projects = pJson?.projects || [];
        const meetings = mJson?.meetings || [];

        // compute finance totals from project milestones when available
        let total = 0;
        let paid = 0;
        projects.forEach((proj:any) => {
          const milestones = Array.isArray(proj.milestones) ? proj.milestones : [];
          milestones.forEach((m:any) => {
            const amount = Number(m.amount || 0);
            total += amount;
            if (m.paidByAdmin || m.confirmedByUser) paid += amount;
          });
          // fallback to project.total_cost if present
          if ((!proj.milestones || proj.milestones.length === 0) && proj.total_cost) {
            total += Number(proj.total_cost || 0);
          }
        });

        // projects metrics
        const activeProjects = projects.length;
        const activeMilestones = projects.reduce((acc:any, p:any) => acc + ((p.milestones && p.milestones.length) || 0), 0);

        // compute top project avg from stages
        let topAvg = 0;
        let topProjectName = '';
        projects.forEach((pr:any) => {
          const stages = pr.stages || [];
          if (stages.length) {
            const avg = Math.round(stages.reduce((s:any, x:any) => s + (Number(x.progress||0)), 0) / stages.length);
            if (avg > topAvg) { topAvg = avg; topProjectName = pr.title || pr._id; }
          }
        });

        const out = {
          user: { role: 'admin', isAdmin: true, count: users.length },
          finance: { total, paid },
          projects: { active: activeProjects, activeMilestones, topAvg, topProjectName },
          meetings,
        };

        if (mounted) setData(out);
      } catch (err) {
        console.error(err);
      } finally { if (mounted) setLoading(false); }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <PageShell title="Admin Overview" subtitle="Administration console and management tools.">
      <div>
        <DashboardGreeting />
        <DashboardStats data={data || undefined} />
      </div>
    </PageShell>
  );
}
