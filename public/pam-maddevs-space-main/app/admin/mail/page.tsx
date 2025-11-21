"use client";
import React, { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import Dialog from '../../../components/ui/Dialog';
import Input, { TextArea } from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';

export default function AdminMailPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [logsLimit, setLogsLimit] = useState(20);
  const [logsTotal, setLogsTotal] = useState<number | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [useRich, setUseRich] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [showSend, setShowSend] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<string | null>(null);
  const [sendToAll, setSendToAll] = useState(true);
  const [sendEmails, setSendEmails] = useState('');
  // incoming mail (DB-backed)
  const [incoming, setIncoming] = useState<any[]>([]);
  const [incomingPage, setIncomingPage] = useState(0);
  const [incomingLimit, setIncomingLimit] = useState(20);
  const [incomingTotal, setIncomingTotal] = useState<number | null>(null);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [selectedIncoming, setSelectedIncoming] = useState<any | null>(null);
  const [showIncomingDialog, setShowIncomingDialog] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => { fetchTemplates(); fetchLogs(0); fetchIncoming(0); }, []);

  // Auto-sync on mount (silent) and background polling
  useEffect(() => {
    let mounted = true;
    // silent sync on first load (no confirmation, no alerts)
    (async () => {
      try {
        await fetch('/api/mail/sync', { method: 'POST' });
        if (mounted) { setIncomingPage(0); fetchIncoming(0); }
      } catch (e) { /* silent */ }
    })();

    // background polling: sync every 5 minutes, and refresh list every 1 minute
    const syncInterval = setInterval(async () => {
      try {
        await fetch('/api/mail/sync', { method: 'POST' });
        if (mounted) { setIncomingPage(0); fetchIncoming(0); }
      } catch (e) { /* silent */ }
    }, Number(process.env.NEXT_PUBLIC_MAIL_SYNC_INTERVAL_MS || 5 * 60 * 1000));

    const refreshInterval = setInterval(() => { if (mounted) fetchIncoming(0); }, Number(process.env.NEXT_PUBLIC_MAIL_REFRESH_INTERVAL_MS || 60 * 1000));

    return () => { mounted = false; clearInterval(syncInterval); clearInterval(refreshInterval); };
  }, []);

  // fetch incoming when page or limit changes
  useEffect(() => { fetchIncoming(incomingPage); }, [incomingPage, incomingLimit]);

  async function fetchTemplates() {
    setLoading(true);
    const r = await fetch('/api/admin-mail/templates');
    const j = await r.json();
    if (j.ok) setTemplates(j.templates || []);
    setLoading(false);
  }

  async function fetchLogs(page = 0) {
    setLogsLoading(true);
    try {
      const r = await fetch(`/api/admin-mail/logs?page=${page}&limit=${logsLimit}`);
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        console.error('fetch logs failed', j);
        setLogs([]);
        setLogsTotal(null);
        setLogsLoading(false);
        return;
      }
      const j = await r.json();
      if (j.ok && Array.isArray(j.logs)) {
        setLogs(j.logs || []);
        setLogsTotal(typeof j.total === 'number' ? j.total : null);
        setLogsPage(typeof j.page === 'number' ? j.page : page);
      }
    } catch (e) { console.error(e); setLogs([]); setLogsTotal(null); }
    setLogsLoading(false);
  }

  async function fetchIncoming(page = 0) {
    setIncomingLoading(true);
    try {
      const r = await fetch(`/api/mail/incoming?page=${page}&limit=${incomingLimit}`);
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        console.error('fetch incoming failed', j);
        setIncoming([]);
        setIncomingLoading(false);
        return;
      }
      const j = await r.json();
      if (j.ok && Array.isArray(j.emails)) {
        // replace list for the requested page
        setIncoming(j.emails);
        setIncomingTotal(typeof j.total === 'number' ? j.total : null);
      }
    } catch (e) { console.error(e); setIncoming([]); }
    setIncomingLoading(false);
  }

  async function doSyncIncoming() {
    if (!confirm('Sync incoming mail from IMAP now?')) return;
    setIncomingLoading(true);
    try {
      const r = await fetch('/api/mail/sync', { method: 'POST' });
      const j = await r.json();
      if (j.ok) {
        setIncomingPage(0);
        await fetchIncoming(0);
        alert(`Synced ${j.savedCount || 0} new messages`);
      } else {
        alert('Sync failed: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) { console.error(e); alert('Sync failed'); }
    setIncomingLoading(false);
  }

  async function createTemplate() {
    if (!newName || !newSubject || !newHtml) return alert('Missing fields');
    const r = await fetch('/api/admin-mail/templates', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newName, subject: newSubject, html: newHtml }) });
    const j = await r.json();
    if (j.ok) {
      setShowNew(false);
      setNewName(''); setNewSubject(''); setNewHtml('');
      fetchTemplates();
    } else alert('Failed to create template');
  }

  async function doSend() {
    if (!sendTemplateId) return alert('Select a template');
    const body: any = { templateId: sendTemplateId };
    if (sendToAll) body.recipients = 'all';
    else body.recipientsList = String(sendEmails || '').split(',').map(s=>s.trim()).filter(Boolean);
    const r = await fetch('/api/admin-mail/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.ok) {
      setShowSend(false);
      fetchLogs(logsPage);
      alert('Send completed (check logs for per-recipient status)');
    } else {
      alert('Send failed: ' + (j.error || JSON.stringify(j)));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Mail</h2>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setShowPreview(false) /* noop to ensure Button style */ } style={{ marginRight: 8, display: 'none' }} />
          <Button onClick={() => setShowManager(true)}>Templates & Send</Button>
        </div>
      </div>

      {showManager && (
        <Dialog title="Templates & Sending" onClose={() => setShowManager(false)} footer={<Button onClick={() => setShowManager(false)}>Close</Button>}>
          <div style={{ display: 'grid', gap: 12, maxHeight: '60vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Templates</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={() => setShowNew(true)}>Create Template</Button>
                <Button onClick={() => { setShowSend(true); setSendTemplateId(templates[0]?.id || null); }}>Send Mail</Button>
              </div>
            </div>

            {loading ? <div>Loading...</div> : (
              <div style={{ display: 'grid', gap: 12 }}>
                {templates.map(t => (
                  <Card key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ color: '#bdbdbd' }}>{t.subject}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button onClick={() => { setSendTemplateId(t.id); setShowSend(true); }}>Send</Button>
                      <Button onClick={() => { setNewHtml(t.html || ''); setNewSubject(t.subject || ''); setNewName(t.name || ''); setUseRich(false); setShowNew(true); }}>Edit</Button>
                      <Button onClick={() => { setShowPreview(true); setNewHtml(t.html || ''); }}>Preview</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div>
              <h3>Past Sends</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {logs.map(l => (
                  <Card key={l.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{l.subject}</div>
                        <div style={{ color: '#bdbdbd' }}>{new Date(l.createdAt).toLocaleString()}</div>
                        <div style={{ marginTop: 8 }}>
                          {l.recipient ? (
                            <div style={{ color: '#bdbdbd' }}>{l.recipient} — {l.result && l.result.ok ? 'sent' : 'failed'}</div>
                          ) : (
                            <div style={{ color: '#bdbdbd' }}>{(l.recipients || []).slice(0,3).join(', ')}{(l.recipients || []).length > 3 ? '...' : ''}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ color: '#bdbdbd' }}>{l.recipient ? '1 recipient' : ((l.recipients || []).length + ' recipients')}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      <section style={{ marginTop: 18 }}>
        <h3>Incoming Mail</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 12, marginTop: 8, alignItems: 'stretch', height: 520 }}>
          <div style={{ background: '#0f0f0f', borderRadius: 10, padding: 8, height: '100%', overflowY: 'auto' }}>
              <div style={{ position: 'sticky', top: 8, zIndex: 50, paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0f0f0f', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.45)' }}>
                  <input placeholder="Search inbox..." value={(window as any).__admin_inbox_search || ''} onChange={(e)=>{ (window as any).__admin_inbox_search = e.target.value; fetchIncoming(0); }} style={{ padding: '6px 8px', borderRadius: 6, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.03)', flex: 1 }} />
                  <select value={incomingLimit} onChange={e => { setIncomingLimit(Number(e.target.value)); setIncomingPage(0); }} style={{ background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 8 }}>
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={15}>15 / page</option>
                    <option value={20}>20 / page</option>
                  </select>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 48, minWidth: 72 }}>
                    <Button onClick={doSyncIncoming} style={{ borderRadius: 8, padding: '6px 6px', flex: 1 }}>Sync</Button>
                    <Button onClick={() => { setIncomingPage(0); fetchIncoming(0); }} style={{ borderRadius: 8, padding: '6px 6px', flex: 1 }}>Refresh</Button>
                  </div>
                </div>
              </div>

            <div style={{ color: '#bdbdbd', fontSize: 13, marginBottom: 8 }}>{incomingTotal !== null ? `${incoming.length} / ${incomingTotal} loaded` : `${incoming.length} loaded`}</div>

            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {incomingLoading ? <div style={{ padding: 8, fontSize: 13 }}>Loading...</div> : (
                incoming.length === 0 ? <div style={{ padding: 8, color: '#999', fontSize: 13 }}>No messages</div> : (
                  incoming.map((m:any) => (
                    <div key={m.id} style={{ marginBottom: 6 }}>
                      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: 13 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{m.sender} <span style={{ color: '#bdbdbd', fontWeight: 500, fontSize: 12 }}>&lt;{m.senderEmail}&gt;</span></div>
                          <div style={{ color: '#bdbdbd', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button onClick={() => { setSelectedIncoming(m); }}>View</Button>
                          <Button onClick={() => { window.open('mailto:' + (m.senderEmail || ''), '_self'); }}>Reply</Button>
                        </div>
                      </Card>
                    </div>
                  ))
                )
              )}
            </div>

            <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
              <Button onClick={() => setIncomingPage(p => Math.max(0, p - 1))} disabled={incomingPage <= 0}>Prev</Button>
              <div style={{ color: '#bdbdbd' }}>Page {incomingPage + 1}{incomingTotal !== null ? ` of ${Math.max(1, Math.ceil(incomingTotal / incomingLimit))}` : ''}</div>
              <Button onClick={() => setIncomingPage(p => p + 1)} disabled={incomingTotal !== null ? ((incomingPage + 1) * incomingLimit >= (incomingTotal || 0)) : false}>Next</Button>
            </div>
          </div>

          <div style={{ background: '#0f0f0f', borderRadius: 10, padding: 12, height: '100%', overflowY: 'auto' }}>
            {selectedIncoming ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, whiteSpace: 'normal' }}>{selectedIncoming.subject}</div>
                    <div style={{ color: '#bdbdbd', marginTop: 6 }}>From: {selectedIncoming.sender} &lt;{selectedIncoming.senderEmail}&gt;</div>
                    <div style={{ color: '#bdbdbd', marginTop: 6 }}>To: {selectedIncoming.recipientEmail}</div>
                    <div style={{ color: '#777', marginTop: 6, fontSize: 12 }}>Received: {String(selectedIncoming.timestamp)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={() => window.open('mailto:'+selectedIncoming.senderEmail)}>Reply</Button>
                    <Button onClick={async () => {
                      try {
                        const r = await fetch('/api/mail/mark', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selectedIncoming.id, mark: 'unread' }) });
                        if (r.ok) { setSelectedIncoming((s:any) => ({ ...s, read: false })); fetchIncoming(0); }
                        else { const j = await r.json().catch(()=>({})); console.error('mark unread failed', j); }
                      } catch (e) { console.error(e); }
                    }}>Mark unread</Button>
                    <Button onClick={async () => {
                      try {
                        const r = await fetch('/api/mail/mark', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selectedIncoming.id, mark: 'read' }) });
                        if (r.ok) { setSelectedIncoming((s:any) => ({ ...s, read: true })); fetchIncoming(0); }
                      } catch (e) { console.error(e); }
                    }}>Mark read</Button>
                  </div>
                </div>
                <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.03)', margin: '12px 0' }} />
                <div style={{ color: '#ddd' }} dangerouslySetInnerHTML={{ __html: (function(){
                  const raw = selectedIncoming.body || '';
                  const styleBlock = `
                    <style>
                      .pam-mail-body img{max-width:100% !important; height:auto !important; display:block !important; margin:8px 0 !important; object-fit:contain !important}
                      .pam-mail-body table{max-width:100% !important; width:100% !important; overflow:auto}
                      .pam-mail-body iframe, .pam-mail-body video{max-width:100% !important}
                      .pam-mail-body p, .pam-mail-body div{word-break:break-word}
                      .pam-mail-body a{word-break:break-all}
                    </style>
                  `;
                  return styleBlock + `<div class="pam-mail-body">${raw}</div>`;
                })() }} />
              </div>
            ) : (
              <div style={{ color: '#999', padding: 24 }}>Select a message to preview its contents.</div>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Past Sends</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ color: '#bdbdbd' }}>{logsTotal !== null ? `${logs.length} / ${logsTotal} loaded` : `${logs.length} loaded`}</div>
            <select value={logsLimit} onChange={e => { setLogsLimit(Number(e.target.value)); setLogsPage(0); fetchLogs(0); }} style={{ background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 8 }}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={() => { setLogsPage(p => { const np = Math.max(0, p - 1); fetchLogs(np); return np; }); }} disabled={logsPage <= 0}>Prev</Button>
            <div style={{ color: '#bdbdbd' }}>Page {logsPage + 1}{logsTotal !== null ? ` of ${Math.max(1, Math.ceil((logsTotal || 0) / logsLimit))}` : ''}</div>
            <Button onClick={() => { setLogsPage(p => { const np = p + 1; fetchLogs(np); return np; }); }} disabled={logsTotal !== null ? ((logsPage + 1) * logsLimit >= (logsTotal || 0)) : false}>Next</Button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {logs.map(l => (
            <Card key={l.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{l.subject}</div>
                  <div style={{ color: '#bdbdbd' }}>{new Date(l.createdAt).toLocaleString()}</div>
                  <div style={{ marginTop: 8 }}>
                    {/* show a sample of recipients or single recipient if recorded */}
                    {l.recipient ? (
                      <div style={{ color: '#bdbdbd' }}>{l.recipient} — {l.result && l.result.ok ? 'sent' : 'failed'}</div>
                    ) : (
                      <div style={{ color: '#bdbdbd' }}>{(l.recipients || []).slice(0,3).join(', ')}{(l.recipients || []).length > 3 ? '...' : ''}</div>
                    )}
                  </div>
                </div>
                <div style={{ color: '#bdbdbd' }}>{l.recipient ? '1 recipient' : ((l.recipients || []).length + ' recipients')}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {showNew && (
        <Dialog title="Create Mail Template" onClose={() => setShowNew(false)} footer={<>
          <Button onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={createTemplate}>Save</Button>
        </>}>
          <label>Name</label>
          <Input value={newName} onChange={e => setNewName((e.target as HTMLInputElement).value)} />
          <label style={{ marginTop: 10 }}>Subject</label>
          <Input value={newSubject} onChange={e => setNewSubject((e.target as HTMLInputElement).value)} />
          <label style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>HTML</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <label style={{ color: '#bdbdbd' }}><input type="checkbox" checked={useRich} onChange={e => setUseRich(e.target.checked)} /> Rich editor</label>
              <Button onClick={() => setShowPreview(true)}>Preview</Button>
            </span>
          </label>
          {useRich ? (
            <div contentEditable={true} onInput={e => setNewHtml((e.target as HTMLDivElement).innerHTML)} style={{ background: '#2f2f2f', padding: 12, borderRadius: 8, minHeight: 160, color: '#fff' }} dangerouslySetInnerHTML={{ __html: newHtml }} />
          ) : (
            <TextArea value={newHtml} onChange={e => setNewHtml((e.target as HTMLTextAreaElement).value)} />
          )}
        </Dialog>
      )}

      {showPreview && (
        <Dialog title="Preview HTML" onClose={() => setShowPreview(false)} footer={<Button onClick={() => setShowPreview(false)}>Close</Button>}>
          <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'auto' }}>
            <div style={{ padding: 16 }} dangerouslySetInnerHTML={{ __html: newHtml }} />
          </div>
        </Dialog>
      )}

      {showIncomingDialog && selectedIncoming && (
        <Dialog title={`From: ${selectedIncoming.sender}`} onClose={() => { setShowIncomingDialog(false); setSelectedIncoming(null); }} footer={<Button onClick={() => { setShowIncomingDialog(false); setSelectedIncoming(null); }}>Close</Button>}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{selectedIncoming.subject}</div>
            <div style={{ color: '#bdbdbd' }}>From: {selectedIncoming.sender} &lt;{selectedIncoming.senderEmail}&gt;</div>
            <div style={{ color: '#bdbdbd' }}>To: {selectedIncoming.recipientEmail}</div>
            <div style={{ color: '#777', fontSize: 12 }}>{String(selectedIncoming.timestamp)}</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }} dangerouslySetInnerHTML={{ __html: selectedIncoming.body }} />
        </Dialog>
      )}

      {showSend && (
        <Dialog title="Send Mail" onClose={() => setShowSend(false)} footer={<> 
          <Button onClick={() => setShowSend(false)}>Cancel</Button>
          <Button onClick={doSend}>Send</Button>
        </>}>
          <label>Template</label>
          <select value={sendTemplateId || ''} onChange={e => setSendTemplateId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, background: '#2f2f2f', color: '#fff', marginBottom: 8 }}>
            <option value="">-- select --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
          </select>
          <label style={{ marginTop: 8 }}>
            <input type="checkbox" checked={sendToAll} onChange={e => setSendToAll(e.target.checked)} /> Send to all users
          </label>
          {!sendToAll && <>
            <label style={{ marginTop: 8 }}>Comma separated emails</label>
            <Input value={sendEmails} onChange={e => setSendEmails((e.target as HTMLInputElement).value)} />
          </>}
          <div style={{ marginTop: 10 }}>
            <Button onClick={async () => {
              // quick preview of selected template
              if (!sendTemplateId) return alert('Select a template to preview');
              const t = templates.find(x => x.id === sendTemplateId);
              if (!t) return alert('Template not found');
              setNewHtml(t.html || ''); setShowPreview(true);
            }}>Preview Template</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
