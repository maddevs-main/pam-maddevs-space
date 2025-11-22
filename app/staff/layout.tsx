import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/nextAuth';
import Providers from '../../components/Providers';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions as any) as { user?: any };
  if (!session || !session.user) redirect('/auth/login');
  const initialUser = { id: (session.user as any).id, role: (session.user as any).role, tenantId: (session.user as any).tenantId };

  return (
    <Providers>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header title="maddevs" initialUser={initialUser} />
        <DashboardShell>
          {children}
        </DashboardShell>
      </div>
    </Providers>
  );
}
