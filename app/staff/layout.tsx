import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { redirect } from 'next/navigation';
import { getUserFromRequestAsync } from '../../lib/auth';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromRequestAsync({ headers: { authorization: '' } }); // TODO: Pass JWT from SSR context
  if (!user) redirect('/auth/login');
  const initialUser = { id: user.userId, role: user.role, tenantId: user.tenantId };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="maddevs" initialUser={initialUser} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  );
}
