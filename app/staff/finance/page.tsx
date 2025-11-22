"use client";
import React from 'react';
import PageShell from '../../../components/PageShell';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TileCard from '../../../components/TileCard';
import Dialog from '../../../components/ui/Dialog';
import CalendarAction from '../../../components/CalendarAction';

export default function StaffFinancePage() {
  const [entries, setEntries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedEntry, setSelectedEntry] = React.useState<any | null>(null);

  React.useEffect(()=>{ load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff-finance');
      if (!res.ok) { setEntries([]); setLoading(false); return; }
      const d = await res.json(); setEntries(d.items || []);
    } catch (e) { setEntries([]); }
    setLoading(false);
  }

  async function markDone(id:string, idx:number) {
    const idStr = String(id);
    const res = await fetch('/api/staff-finance/' + idStr, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_done', milestoneIndex: idx }) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); alert('Error: '+JSON.stringify(d)); return; }
    load();
  }

  async function openEntry(id:string) {
    // API does not expose a GET for single entry; use the already-loaded entries array.
    try {
      const found = entries.find((x:any) => String(x._id) === String(id) || String(x.id) === String(id));
      if (!found) return alert('Cannot load entry');
      // normalize _id to string for reliable subsequent requests
      setSelectedEntry({ ...found, _id: String(found._id), start: found.start ? String(found.start) : null, end: found.end ? String(found.end) : null });
    } catch (e) { alert('Error'); }
  }

  if (loading) return <div style={{ padding: 12 }}>Loading...</div>;

  // calendar items: pass ISO/date strings for consistency
  const calItems = entries.map((e:any) => ({ id: String(e._id), title: e.type || e.title || 'Finance', from: e.start ? String(e.start) : null, to: e.end ? String(e.end) : null, color: 'var(--color-yes)', type: 'meeting' }));

  return (
    <PageShell title="Finance" subtitle="Staff finance entries" actions={<div style={{ maxWidth: 220 }}><CalendarAction items={calItems} title="Finance calendar" /></div>}>
      <div>
        {entries.length === 0 ? <div style={{ padding: 12 }}>No entries</div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {entries.map(e => {
              const now = new Date();
              const start = e.start ? new Date(e.start) : null;
              const end = e.end ? new Date(e.end) : null;
              const active = start && (!end ? now >= start : (now >= start && now <= end));
              const ms = e.milestones || [];
              const total = ms.reduce((s:any, m:any) => s + (Number(m?.amount) || 0), 0);
              const paid = ms.reduce((s:any, m:any) => s + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount) || 0) : 0), 0);
              const pending = Math.max(0, total - paid);

              return (
                  <TileCard
                    key={e._id}
                    meeting={{ _id: e._id, title: e.type || e.title || 'Finance', date: start ? start.toLocaleDateString() : '', time: '', requestedBy: e.userId || e.user || undefined, status: active ? 'approved' : 'finished' }}
                  active={active ? 'approved' : 'finished'}
                  onClick={() => openEntry(e._id)}
                  rightAction={<a onClick={(ev:any)=>{ ev.stopPropagation(); openEntry(e._id); }} style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, cursor: 'pointer' }}>View</span></a>}
                >
                  <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'rgba(180,180,178,0.9)', marginTop: 2 }}>{e.userId || e.user || '—'}</div>
                      <div style={{ color: 'rgba(180,180,178,0.75)', marginTop: 8, fontSize: 13 }}>Start: {start ? start.toLocaleDateString() : '—'} — End: {end ? end.toLocaleDateString() : '—'}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 800, fontSize: 16 }}>${total.toLocaleString()}</div>
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>Paid: ${paid.toLocaleString()}</div>
                        <div style={{ color: 'rgba(180,180,178,0.9)', fontWeight: 700 }}>Pending: ${pending.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </TileCard>
              );
            })}
          </div>
        )}

        {selectedEntry ? (
          (() => {
            // compute totals for the selected entry
            const sm = selectedEntry.milestones || [];
            const sTotal = sm.reduce((s:any, m:any) => s + (Number(m?.amount) || 0), 0);
            const sPaid = sm.reduce((s:any, m:any) => s + ((m && (m.paidByAdmin || m.done)) ? (Number(m.amount) || 0) : 0), 0);
            const sPending = Math.max(0, sTotal - sPaid);
            return (
              <Dialog title={`${selectedEntry.type || selectedEntry.title || 'Finance'}`} onClose={() => setSelectedEntry(null)} footer={<><Button onClick={() => setSelectedEntry(null)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(180,180,178,0.08)' }}>Close</Button></>}>
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div><strong>User:</strong> {selectedEntry.userId || selectedEntry.user || '—'}</div>
                      <div style={{ marginTop: 8 }}><strong>Start:</strong> {selectedEntry.start ? new Date(selectedEntry.start).toLocaleDateString() : '—'}</div>
                      <div style={{ marginTop: 8 }}><strong>End:</strong> {selectedEntry.end ? new Date(selectedEntry.end).toLocaleDateString() : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 800, fontSize: 18 }}>${sTotal.toLocaleString()}</div>
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>Paid: ${sPaid.toLocaleString()}</div>
                        <div style={{ color: 'rgba(180,180,178,0.9)', fontWeight: 700 }}>Pending: ${sPending.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {selectedEntry.milestones && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Milestones</strong>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {selectedEntry.milestones.map((m:any,i:number)=> (
                          <Card key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{m.title || m.amount}</div>
                                <div style={{ color: 'rgba(180,180,178,0.9)', fontSize: 13, marginBottom: 8 }}>{m.note || ''}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {m.confirmedByUser ? (
                                    <span style={{ fontSize: 12, background: '#064e3b', color: '#10b981', padding: '4px 10px', borderRadius: 999 }}>Confirmed (waiting)</span>
                                  ) : (
                                    <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', color: 'rgba(180,180,178,0.9)', padding: '4px 10px', borderRadius: 999 }}>Unconfirmed</span>
                                  )}
                                  {m.paidByAdmin ? (<span style={{ fontSize: 12, background: '#0b1220', color: '#9ae6b4', padding: '4px 10px', borderRadius: 999 }}>Paid</span>) : null}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
                                <div style={{ fontWeight: 800, fontSize: 20, color: '#ffffff' }}>{typeof m.amount === 'number' ? `$${m.amount}` : m.amount}</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  {m.paymentLink ? (
                                    <a href={m.paymentLink} target="_blank" rel="noreferrer"><Button style={{ padding: '10px 16px', fontSize: 15 }}>Pay</Button></a>
                                  ) : null}
                                  {!m.done ? (
                                    <Button onClick={()=>markDone(selectedEntry._id, i)} style={{ padding: '10px 14px' }}>Mark Done</Button>
                                  ) : (
                                    <span style={{ color: 'rgba(180,180,178,0.9)', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>Done</span>
                                  )}
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
            );
          })()
        ) : null}
      </div>
    </PageShell>
  );
}
