"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/auth/me');
        if (!mounted) return;
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        if (data?.user?.role !== 'admin') {
          // not an admin, redirect to normal dashboard
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [router]);

  if (loading) return <div style={{ padding: 16 }}>Checking permissions...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="PAM — Admin" />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  );
}
