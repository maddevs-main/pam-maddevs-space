"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { useRouter } from 'next/navigation';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (!mounted) return;
        if (!res.ok) { router.push('/auth/login'); return; }
        // no role gating here — staff pages will render inside the same shell
        await res.json().catch(()=>({}));
      } catch (e) { router.push('/auth/login'); }
      finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  if (loading) return <div style={{ padding: 16 }}>Checking authentication...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="maddevs" />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  );
}
