"use client";
import React from 'react';
import Button from '../../../components/ui/Button';
import Dialog from '../../../components/ui/Dialog';
import Card from '../../../components/ui/Card';

export default function AdminSettingsPage() {
  const [inviteRole, setInviteRole] = React.useState<'consumer'|'staff'|'admin'>('consumer');
  const [inviteExpiryHours, setInviteExpiryHours] = React.useState<number>(24);
  const [message, setMessage] = React.useState<string | null>(null);
  const [invites, setInvites] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);

  React.useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/invites');
      if (res.ok) {
        const d = await res.json(); setInvites(d.invites || []);
      } else {
        setInvites([]);
      }
    } catch (err) { setInvites([]); }
    setLoading(false);
  }

  async function createInvite() {
    setMessage(null);
    try {
      const res = await fetch('/api/invite/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: inviteRole, expiresInHours: inviteExpiryHours }) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage('Error: ' + JSON.stringify(d)); return; }
      setMessage('Invite created: ' + (d.invite?.code || '')); await load();
    } catch (err) { setMessage('Error creating invite'); }
  }

  async function revokeInvite(code: string) {
    if (!confirm('Revoke invite ' + code + '?')) return;
    try {
      const res = await fetch('/api/invite/' + encodeURIComponent(code), { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(()=>({})); setMessage('Error: ' + JSON.stringify(d)); return; }
      setMessage('Revoked'); await load();
    } catch (err) { setMessage('Error revoking'); }
  }

  return (
    <div>
      <h3>Settings</h3>
      <p>Tenant and system-level settings.</p>
      {/* Compact invite management card with modal dialog */}
      <section style={{ marginTop: 12 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Invite Management</div>
              <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 6 }}>{loading ? 'Loading...' : `${invites.length} active invite(s)`}</div>
            </div>
            <div>
              <Button onClick={() => setShowInviteDialog(true)}>Manage Invites</Button>
            </div>
          </div>
        </Card>
      </section>

      {showInviteDialog ? (
        <Dialog title="Invite Management" onClose={() => setShowInviteDialog(false)} footer={<><Button onClick={() => setShowInviteDialog(false)}>Close</Button></>}>
          <div>
            <h4 style={{ marginTop: 0 }}>Create Invite</h4>
            {message ? <div style={{ marginBottom: 8 }}>{message}</div> : null}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <select value={inviteRole} onChange={e=>setInviteRole(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 6 }}>
                <option value="consumer">Consumer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <select value={String(inviteExpiryHours)} onChange={e=>setInviteExpiryHours(Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: 6 }}>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
              </select>
              <Button onClick={createInvite}>Create Invite</Button>
            </div>

            <h4>Active Invites</h4>
            {loading ? <div>Loading...</div> : invites.length === 0 ? <div>No active invites</div> : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {invites.map(inv => (
                  <div key={inv.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{inv.code}</div>
                      <div style={{ color: 'rgba(180,180,178,0.9)' }}>{inv.role} {inv.expiresAt ? '— expires ' + new Date(inv.expiresAt).toLocaleString() : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button onClick={() => { navigator.clipboard?.writeText(inv.code); setMessage('Copied'); }}>Copy</Button>
                      <Button onClick={() => revokeInvite(inv.code)} style={{ background: '#7a3030' }}>Revoke</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
