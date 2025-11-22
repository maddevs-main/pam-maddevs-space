"use client";
import React from 'react';
import styled from 'styled-components';
import PageShell from '../../../components/PageShell';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Dialog from '../../../components/ui/Dialog';
import { TextInput, TextArea } from '../../../components/ui/Input';

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AvatarBox = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const AvatarActions = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: center;
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
const PasswordGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export default function SettingsPage() {
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadedPreview, setUploadedPreview] = React.useState(false);
  const [removedProfilePic, setRemovedProfilePic] = React.useState(false);
  // Invite management (admin-only in dashboard settings)
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);
  const [invites, setInvites] = React.useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteRole, setInviteRole] = React.useState<'consumer'|'staff'|'admin'>('consumer');
  const [inviteExpiryHours, setInviteExpiryHours] = React.useState<number>(24);
  const [inviteMessage, setInviteMessage] = React.useState<string | null>(null);

  React.useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) { setUser(null); setLoading(false); return; }
      const d = await res.json(); setUser(d.user || null);
      // prefer server-provided profilePic; if missing, compute deterministic initials avatar
      const serverPic = d?.user?.profilePic || null;
      if (serverPic) {
        setPreview(serverPic);
        setUploadedPreview(false);
        setRemovedProfilePic(false);
      } else {
        const seed = (d?.user?.name && String(d.user.name).trim()) || d?.user?.email || d?.user?.id || '';
        const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
        setPreview(defaultAvatar);
        setUploadedPreview(false);
        setRemovedProfilePic(false);
      }
    } catch (e) { setUser(null); }
    setLoading(false);
  }

  async function loadInvites() {
    setInviteLoading(true);
    try {
      const res = await fetch('/api/invites');
      if (res.ok) {
        const d = await res.json(); setInvites(d.invites || []);
      } else setInvites([]);
    } catch (e) { setInvites([]); }
    setInviteLoading(false);
  }

  async function createInvite() {
    setInviteMessage(null);
    try {
      const res = await fetch('/api/invite/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: inviteRole, expiresInHours: inviteExpiryHours }) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) { setInviteMessage('Error: ' + JSON.stringify(d)); return; }
      setInviteMessage('Invite created: ' + (d.invite?.code || ''));
      await loadInvites();
    } catch (err) { setInviteMessage('Error creating invite'); }
  }

  async function revokeInvite(code: string) {
    if (!confirm('Revoke invite ' + code + '?')) return;
    try {
      const res = await fetch('/api/invite/' + encodeURIComponent(code), { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(()=>({})); setInviteMessage('Error: ' + JSON.stringify(d)); return; }
      setInviteMessage('Revoked'); await loadInvites();
    } catch (err) { setInviteMessage('Error revoking'); }
  }

  function handlePicChange(f: File | null) {
    if (!f) {
      // when clearing the profile pic, show the deterministic server-style fallback
      const seed = (user && user.name && String(user.name).trim()) || (user && user.email) || (user && user.id) || '';
      const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
      setPreview(defaultAvatar);
      setUser((u:any)=>u?{...u, profilePic: null}:u);
      setUploadedPreview(false);
      setRemovedProfilePic(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPreview(String(reader.result || null)); };
    reader.readAsDataURL(f);
    setUser((u:any)=>({ ...u, profilePic: 'PENDING' }));
    setUploadedPreview(true);
    setRemovedProfilePic(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile();
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = { name: user.name || '', organisation: user.organisation || '', bio: user.bio || '' };
      // Only send profilePic when user uploaded a new image or explicitly removed it
      if (uploadedPreview) {
        payload.profilePic = preview;
      } else if (removedProfilePic) {
        payload.profilePic = null;
      }

      // Use component state for password fields (avoid DOM lookups)
      if (newPassword) {
        payload.currentPassword = currentPassword || '';
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) {
        const msg = d?.error || JSON.stringify(d);
        alert('Error saving: ' + msg);
        setSaving(false);
        return;
      }
      setUser(d.user);
      if (d.user && d.user.profilePic) setPreview(d.user.profilePic);
      // clear password fields on success
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      alert('Profile saved');
    } catch (err) { alert('Error: ' + String(err)); }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 12 }}>Loading...</div>;

  return (
    <PageShell title="Settings" subtitle="Profile and account settings" actions={
      <div>
        <Button type="button" onClick={() => saveProfile()} disabled={saving} style={{ background: '#0ea5ff', color: '#021024', fontWeight: 800, padding: '10px 14px' }}>{saving ? 'Saving...' : 'Save profile'}</Button>
      </div>
    }>
      <form onSubmit={handleSave} className="dialog-panel" style={{ maxWidth: 980, margin: '8px auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}>
        <div className="dialog-stack" style={{ display: 'flex', justifyContent: 'center' }}>
        <SettingsGrid style={{ width: '100%', alignSelf: 'center' }}>
          <div>
            <Card classic  style={{  padding: 18, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <AvatarBox>
                  {preview ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: 'rgba(180,180,178,0.9)' }}>No picture</div>}
                </AvatarBox>
                <AvatarActions>
                  <input ref={fileInputRef} id="profilePicInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e)=>handlePicChange(e.target.files ? e.target.files[0] : null)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                    <Button type="button" style={{ background: 'transparent', border: '1px solid rgba(180,180,178,0.08)' }} onClick={() => { handlePicChange(null); }}>Remove</Button>
                  </div>
                </AvatarActions>
                <div style={{ color: 'rgba(180,180,178,0.8)', fontSize: 13, textAlign: 'center' }}>Profile picture is stored on your account. Max ~1MB recommended.</div>
              </div>
            </Card>

            {/* admin-only invite summary removed from inside the form; invite UI lives below the form */}
          </div>

          <div>
            <Card classic style={{ padding: 18, background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>Profile</h3>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                  <TextInput value={user?.name || ''} onChange={e => setUser((u:any)=>({...u, name: (e.target as HTMLInputElement).value}))} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Email (read-only)</label>
                  <div style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(180,180,178,0.08)', background: 'transparent', color: 'rgba(241,241,241,0.9)' }}>{user?.email || ''}</div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Organisation</label>
                  <TextInput value={user?.organisation || ''} onChange={e => setUser((u:any)=>({...u, organisation: (e.target as HTMLInputElement).value}))} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Bio</label>
                  <TextArea value={user?.bio || ''} onChange={e => setUser((u:any)=>({...u, bio: (e.target as HTMLTextAreaElement).value}))} />
                </div>
              </div>
            </Card>

            <Card classic style={{ marginTop: 12, padding: 18, background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>Change password</h3>
              <PasswordGrid>
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Current password</label>
                  <TextInput value={currentPassword} onChange={e=>setCurrentPassword((e.target as HTMLInputElement).value)} type="password" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>New password</label>
                  <TextInput value={newPassword} onChange={e=>setNewPassword((e.target as HTMLInputElement).value)} type="password" />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Confirm new password</label>
                    <TextInput value={confirmPassword} onChange={e=>setConfirmPassword((e.target as HTMLInputElement).value)} type="password" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button type="button" onClick={async () => {
                      // change password inline
                      if (!currentPassword) { alert('Enter current password'); return; }
                      if (!newPassword) { alert('Enter new password'); return; }
                      if (newPassword !== confirmPassword) { alert('New passwords do not match'); return; }
                      try {
                        const res = await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
                        const d = await res.json().catch(()=>({}));
                        if (!res.ok) { alert('Error: ' + JSON.stringify(d)); return; }
                        alert('Password changed');
                        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                      } catch (err) { alert('Error: ' + String(err)); }
                    }} style={{ background: '#065f46', color: '#fff' }}>Change password</Button>
                  </div>
                </div>
              </PasswordGrid>
              
            </Card>
          </div>
        </SettingsGrid>
        </div>
      </form>

      {/* Invite management card moved outside the profile form so it doesn't affect profile saves */}
      {user?.role === 'admin' ? (
        <div style={{ maxWidth: 980, margin: '16px auto' }}>
          <Card classic style={{ padding: 18, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Invite Management</div>
                <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 6 }}>{inviteLoading ? 'Loading...' : `${invites.length} active invite(s)`}</div>
              </div>
              <div>
                <Button type="button" onClick={async () => { await loadInvites(); setShowInviteDialog(true); }}>Manage Invites</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
      {showInviteDialog ? (
        <Dialog title="Invite Management" onClose={() => setShowInviteDialog(false)} footer={<><Button onClick={() => setShowInviteDialog(false)}>Close</Button></>}>
          <div>
            <h4 style={{ marginTop: 0 }}>Create Invite</h4>
            {inviteMessage ? <div style={{ marginBottom: 8 }}>{inviteMessage}</div> : null}
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
              <Button type="button" onClick={createInvite}>Create Invite</Button>
            </div>

            <h4>Active Invites</h4>
            {inviteLoading ? <div>Loading...</div> : invites.length === 0 ? <div>No active invites</div> : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {invites.map(inv => (
                  <div key={inv.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{inv.code}</div>
                      <div style={{ color: 'rgba(180,180,178,0.9)' }}>{inv.role} {inv.expiresAt ? '— expires ' + new Date(inv.expiresAt).toLocaleString() : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="button" onClick={() => { navigator.clipboard?.writeText(inv.code); setInviteMessage('Copied'); }}>Copy</Button>
                      <Button type="button" onClick={() => revokeInvite(inv.code)} style={{ background: '#7a3030' }}>Revoke</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog>
      ) : null}
      {/* Subtle footer specific to Settings page - pinned bottom center */}
      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9000, pointerEvents: 'auto' }}>
        <div style={{ padding: '8px 12px', color: 'rgba(180,180,178,0.55)', fontSize: 13, textAlign: 'center', background: 'transparent' }}>
          <div>
            We updated our <a href="https://maddevs.space/directory/documentation#termsUse" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(158,203,255,0.85)', textDecoration: 'underline' }}>Terms of Use</a> on Feb. 19, 2025.
          </div>
          <div style={{ marginTop: 6 }}>pam ©2025 maddevs All rights reserved.</div>
        </div>
      </div>
    </PageShell>
  );
}
