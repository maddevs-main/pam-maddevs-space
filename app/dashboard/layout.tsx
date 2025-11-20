"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (!mounted) return;
        if (!res.ok) { router.push('/auth/login'); return; }
        const d = await res.json();
        if (!mounted) return;
        setRole(d?.user?.role || null);
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
        {/* Keep role-based links and content behavior intact inside the shell's main area */}
        {children}
      </DashboardShell>
    </div>
  );
}
