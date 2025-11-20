import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/jwt';
import { redirect } from 'next/navigation';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('pam_token')?.value || null;
  if (!token) redirect('/auth/login');
  const payload = verifyToken(token as string);
  if (!payload) redirect('/auth/login');

  const initialUser = { id: payload.userId, role: payload.role, tenantId: payload.tenantId };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* @ts-expect-error Server -> Client prop (serializable) */}
      <Header title="maddevs" initialUser={initialUser} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  );
}
