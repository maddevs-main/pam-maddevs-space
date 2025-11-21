"use client";
import React from 'react';
import PageShell from '../../../components/PageShell';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import TileCard from '../../../components/TileCard';

export default function AdminStaffPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [roleView, setRoleView] = React.useState<'staff'|'admin'>('staff');

  // map of userId -> hasActiveStaffFinance
  const [financeMap, setFinanceMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) { setUsers([]); setLoading(false); setMessage('Failed to load'); return; }
      const d = await res.json();
      const all = d.users || [];
      // compute staff/admin list based on roleView
      const list = all.filter((u:any) => (u.role || '').toString() === roleView);
      setUsers(list);
      // fetch staff-finance entries to compute active flags
      try {
        const sf = await fetch('/api/staff-finance');
        const sfd = sf.ok ? await sf.json() : null;
        const items = sfd ? (sfd.items || []) : [];
        const now = new Date();
        const map: Record<string, boolean> = {};
        items.forEach((it:any) => {
          const start = it.start ? new Date(it.start) : null;
          const end = it.end ? new Date(it.end) : null;
          const active = !!(start && (!end ? now >= start : (now >= start && now <= end)));
          map[String(it.userId)] = (map[String(it.userId)] || active);
        });
        setFinanceMap(map);
      } catch (err) {
        setFinanceMap({});
      }
    } catch (e) { setUsers([]); setMessage('Error'); }
    setLoading(false);
  }

  async function promoteToAdmin(id: string) {
    const res = await fetch('/api/users/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
    const d = await res.json().catch(()=>({}));
    if (!res.ok) { setMessage('Error: ' + JSON.stringify(d)); return; }
    setMessage('Promoted'); fetchStaff();
  }

  if (loading) return <div style={{ padding: 12 }}>Loading staff...</div>;

  return (
    <PageShell title="Staff" subtitle="Team members and contractors">
      <div>
        {message ? <div style={{ marginBottom: 12 }}>{message}</div> : null}

        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <Button onClick={() => { setRoleView('staff'); fetchStaff(); }} style={{ background: roleView === 'staff' ? undefined : 'transparent' }}>Staff</Button>
          <Button onClick={() => { setRoleView('admin'); fetchStaff(); }} style={{ background: roleView === 'admin' ? undefined : 'transparent' }}>Admins</Button>
        </div>

        {users.length === 0 ? <p>No members found</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {users.map(u => {
                const active = !!financeMap[String(u.id || u._id)];
                const panelColor = active ? '#10b981' : '#9ca3af';
                return (
                  <TileCard
                    key={u.id}
                    meeting={{ _id: u.id, title: u.name || u.email, date: '', time: '', status: u.role || 'staff' }}
                    panelColor={panelColor}
                      hideMeta={true}
                    onClick={() => setSelectedUser(u)}
                    leftContent={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 999, overflow: 'hidden', flex: '0 0 36px', background: 'rgba(255,255,255,0.03)' }}>
                        <img src={u.profilePic || ''} alt={u.name || u.email} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || '—'}</div>
                        <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 6, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        <div style={{ color: 'rgba(180,180,178,0.85)', marginTop: 6, fontSize: 13 }}>Role: {u.role}</div>
                      </div>
                    </div>}
                    rightAction={<div style={{ fontWeight: 700 }}>Open</div>}
                  />
                );
              })}
            </div>
          </div>
        )}

        {selectedUser ? (
          <Dialog title={`User — ${selectedUser.name || selectedUser.email}`} onClose={() => setSelectedUser(null)} footer={<><Button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button></>}>
            <div style={{ marginTop: 12 }}>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Name:</strong> {selectedUser.name || '—'}</div>
              <div style={{ marginTop: 8 }}><strong>Role:</strong> {selectedUser.role}</div>
            </div>
          </Dialog>
        ) : null}
      </div>
    </PageShell>
  );
}
