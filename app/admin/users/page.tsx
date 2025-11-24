"use client";
import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import TileCard from '../../../components/TileCard';
import { TextInput } from '../../../components/ui/Input';
import Dialog from '../../../components/ui/Dialog';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userProjects, setUserProjects] = useState<any[] | null>(null);
  const [userStaffFin, setUserStaffFin] = useState<any[] | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedUser(null);
        setSelectedProject(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/users');
    if (!res.ok) {
      setMessage('Failed to load users');
      setLoading(false);
      return;
    }
    const data = await res.json();
    const usersList = data.users || [];
    // also fetch projects to compute whether a user has an active project
    try {
      const p = await fetch('/api/projects');
      const pd = p.ok ? await p.json() : null;
      const projects = pd ? (pd.projects || []) : [];
      const now = new Date();
      const activeMap: Record<string, boolean> = {};
      projects.forEach((pr: any) => {
        const start = pr.timeline?.from ? new Date(pr.timeline.from) : null;
        const end = pr.timeline?.to ? new Date(pr.timeline.to) : null;
        const active = !!(start && (!end ? now >= start : (now >= start && now <= end)));
        const authorId = pr.author?.id || pr.author?._id;
        if (authorId) activeMap[String(authorId)] = (activeMap[String(authorId)] || active);
        // also mark allocated staff/users
        (pr.people_allocated || []).forEach((pid: any) => { activeMap[String(pid)] = (activeMap[String(pid)] || active); });
      });
      // attach active flag to users
      usersList.forEach((u:any) => { u._hasActiveProject = !!activeMap[String(u.id || u._id)]; });
    } catch (err) {
      // ignore project fetch errors
    }
    setUsers(usersList);
    setLoading(false);
  }

  

  async function promoteUser(id: string, role: string) {
    setMessage(null);
    const res = await fetch('/api/users/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data));
    else { setMessage('Updated'); fetchUsers(); }
  }

  async function deactivateUser(id: string) {
    setMessage(null);
    const res = await fetch('/api/users/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }) });
    const data = await res.json();
    if (!res.ok) setMessage(JSON.stringify(data));
    else { setMessage('User deactivated'); fetchUsers(); }
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setMessage(null);
    try {
      const res = await fetch('/api/users/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setMessage(JSON.stringify(data)); return; }
      setMessage('User deleted');
      setSelectedUser(null);
      fetchUsers();
    } catch (e) { setMessage('Error deleting user'); }
  }

  async function deleteUserProjects(userId: string) {
    if (!confirm("Delete all projects for this user? This cannot be undone.")) return;
    setMessage(null);
    try {
      const res = await fetch('/api/admin/delete-user-projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (!res.ok) { setMessage(JSON.stringify(data)); return; }
      setMessage(`Deleted ${data.deletedCount || 0} projects`);
      setUserProjects(null);
      fetchUsers();
    } catch (e) { setMessage('Error deleting projects'); }
  }

  async function deleteUserAndProjects(userId: string) {
    if (!confirm('Delete user and all their projects? This action is irreversible.')) return;
    setMessage(null);
    try {
      const res = await fetch('/api/admin/delete-user-and-projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (!res.ok) { setMessage(JSON.stringify(data)); return; }
      setMessage(`User deleted (${data.userDeleted || 0}) and ${data.projectsDeleted || 0} projects removed`);
      setSelectedUser(null);
      setUserProjects(null);
      fetchUsers();
    } catch (e) { setMessage('Error deleting user and projects'); }
  }

  async function deleteProject(projectId: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setMessage(null);
    try {
      const res = await fetch('/api/projects/' + projectId, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setMessage(JSON.stringify(data)); return; }
      setMessage('Project deleted');
      setSelectedProject(null);
      // refresh user projects if loaded
      setUserProjects(null);
      fetchUsers();
    } catch (e) { setMessage('Error deleting project'); }
  }

  return (
    <div>
      <h3>Users</h3>
      {message && <p>{message}</p>}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Users</h3>
      </div>

      {loading ? <p>Loading users...</p> : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {users.map(u => (
              <TileCard
                key={u.id}
                meeting={{ _id: u.id, title: u.name || u.email, date: '', time: '', status: u.role || 'user' }}
                panelColor={u._hasActiveProject ? '#10b981' : '#9ca3af'}
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
            ))}
          </div>
        </div>
      )}
      
        {/* User details modal */}
        {selectedUser ? (
          <Dialog title={`User — ${selectedUser.name || selectedUser.email}`} onClose={() => { setSelectedUser(null); setUserProjects(null); setUserStaffFin(null); }} footer={<><Button onClick={() => { setSelectedUser(null); setUserProjects(null); setUserStaffFin(null); }}>Close</Button></>}>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Name:</strong> {selectedUser.name || '—'}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
              </Card>
              <Card>
                <div><strong>Tenant:</strong> {selectedUser.tenantId || '—'}</div>
                <div style={{ marginTop: 8 }}>
                  <strong>Actions</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button onClick={() => promoteUser(selectedUser.id, 'staff')}>Make Staff</Button>
                    <Button onClick={() => promoteUser(selectedUser.id, 'admin')}>Make Admin</Button>
                    <Button onClick={() => deactivateUser(selectedUser.id)} style={{ background: '#7a3030' }}>Deactivate</Button>
                    <Button onClick={() => deleteUserProjects(selectedUser.id)} style={{ background: '#7a3030' }}>Delete User Projects</Button>
                    <Button onClick={() => deleteUser(selectedUser.id)} style={{ background: '#7a3030' }}>Delete User</Button>
                    <Button onClick={() => deleteUserAndProjects(selectedUser.id)} style={{ background: '#7a3030' }}>Delete User & Projects</Button>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: 12 }}>
              <h5 style={{ margin: '6px 0' }}>Projects</h5>
              {userProjects === null ? (
                <Button onClick={async () => {
                  setUserProjects([]);
                  try {
                    const res = await fetch('/api/projects');
                    if (!res.ok) { setUserProjects([]); return; }
                    const d = await res.json();
                    const all = d.projects || [];
                    const mine = all.filter((p:any) => String(p.author?.id) === String(selectedUser.id) || (p.people_allocated || []).includes(selectedUser.id) || (p.staff || []).includes(selectedUser.id));
                    setUserProjects(mine);
                  } catch (e) { setUserProjects([]); }
                }}>Load Projects</Button>
              ) : userProjects.length === 0 ? (
                <div style={{ color: 'rgba(180,180,178,0.9)' }}>No projects found for this user.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {userProjects.map((p:any)=> (
                    <Card key={p._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.title}</strong>
                          <div style={{ color: 'rgba(180,180,178,0.9)' }}>{p.description}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button onClick={() => setSelectedProject(p)}>View Project</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <h5 style={{ margin: '6px 0' }}>Staff Finance</h5>
              {userStaffFin === null ? (
                <Button onClick={async () => {
                  setUserStaffFin([]);
                  try {
                    const res = await fetch('/api/staff-finance');
                    if (!res.ok) { setUserStaffFin([]); return; }
                    const d = await res.json();
                    const items = d.items || [];
                    const mine = items.filter((it:any) => String(it.userId) === String(selectedUser.id));
                    setUserStaffFin(mine);
                  } catch (e) { setUserStaffFin([]); }
                }}>Load Staff Finance</Button>
              ) : userStaffFin.length === 0 ? (
                <div style={{ color: 'rgba(180,180,178,0.9)' }}>No staff finance entries for this user.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {userStaffFin.map((it:any)=>(
                    <Card key={it._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{it.type}</div>
                          <div style={{ color: 'rgba(180,180,178,0.9)' }}>Total: {it.total_cost}</div>
                        </div>
                        <div>
                          <Button onClick={() => { /* could navigate to admin finance page with filter */ window.location.href = `/admin/finance?user=${selectedUser.id}` }}>Open</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Dialog>
        ) : null}
        {selectedProject ? (
          <Dialog title={selectedProject.title} onClose={() => setSelectedProject(null)} footer={<><Button onClick={() => setSelectedProject(null)}>Close</Button><Button style={{ background: '#7a3030', marginLeft: 8 }} onClick={() => deleteProject(selectedProject._id || selectedProject.id)}>Delete Project</Button></>}>
            <div style={{ marginTop: 12 }}>
              <div><strong>Total:</strong> {selectedProject.total_cost}</div>
              <div style={{ marginTop: 8 }}><strong>Objectives:</strong> {(selectedProject.objectives || []).join(', ') || '—'}</div>
              {selectedProject.milestones && (
                <div style={{ marginTop: 12 }}>
                  <strong>Milestones</strong>
                  <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                    {selectedProject.milestones.map((m:any,i:number)=> (
                      <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.title}</div>
                            <div style={{ color: 'rgba(180,180,178,0.9)', fontSize: 13 }}>{m.amount}</div>
                            {m.paymentLink ? (<div style={{ marginTop: 6 }}><a href={m.paymentLink} target="_blank" rel="noreferrer">Pay</a></div>) : null}
                            <div style={{ marginTop: 6 }}>
                              {m.confirmedByUser ? (<span style={{ fontSize: 11, background: '#064e3b', color: '#10b981', padding: '2px 8px', borderRadius: 999 }}>Confirmed (waiting)</span>) : (<span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', color: 'rgba(180,180,178,0.9)', padding: '2px 8px', borderRadius: 999 }}>Unconfirmed</span>)}
                              {' '}
                              {m.paidByAdmin ? (<span style={{ fontSize: 11, background: '#0b1220', color: '#9ae6b4', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>Paid</span>) : null}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        ) : null}
    </div>
  );
}
