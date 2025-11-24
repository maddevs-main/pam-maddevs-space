import Header from '../../components/Header';
import DashboardShell from '../../components/vendor/DashboardShell';
import { redirect } from 'next/navigation';
import getServerAuth from '../../lib/serverAuth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuth() as { user?: any };
  if (!session || !session.user) redirect('/auth/login');

  // Pass minimal user payload to Header so it doesn't have to fetch immediately on the client
  const initialUser = { id: (session.user as any).id, role: (session.user as any).role, tenantId: (session.user as any).tenantId };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header is a client component; provide initialUser to avoid a client-side fetch and UI flash */}
      <Header title="maddevs" initialUser={initialUser} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  );
}
