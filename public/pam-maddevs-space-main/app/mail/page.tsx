"use client";
import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

type Email = {
  id: string | number;
  sender: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
};

export default function MailApp() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => { fetchEmails(); }, []);
  // refetch when page changes
  useEffect(() => { fetchEmails(); }, [page]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const r = await fetch(`/api/mail/incoming?page=${page}&limit=${limit}`);
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        console.error('fetch failed', j);
        setEmails([]);
        setLoading(false);
        return;
      }
      const j = await r.json();
      if (j.ok && Array.isArray(j.emails)) {
        // if page is 0, replace; otherwise append
        setEmails(prev => page === 0 ? j.emails : [...prev, ...j.emails]);
        setTotal(typeof j.total === 'number' ? j.total : null);
      }
    } catch (e) { console.error(e); setEmails([]); }
    setLoading(false);
  }

  async function doSync() {
    if (!confirm('Sync incoming mail from IMAP now?')) return;
    setLoading(true);
    try {
      const r = await fetch('/api/mail/sync', { method: 'POST' });
      const j = await r.json();
      if (j.ok) {
        // refresh from first page
        setPage(0);
        await fetchEmails();
        alert(`Synced ${j.savedCount || 0} new messages`);
      } else {
        alert('Sync failed: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) { console.error(e); alert('Sync failed'); }
    setLoading(false);
  }

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
  };

  const filteredEmails = emails.filter(email => {
    const q = searchTerm.toLowerCase();
    return email.sender.toLowerCase().includes(q) || email.subject.toLowerCase().includes(q) || (email.body || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2>Inbox</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Search mail..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: '#1f1f1f', color: '#fff', border: '1px solid rgba(255,255,255,0.04)' }} />
          <Button onClick={fetchEmails}>Refresh</Button>
        </div>
      </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ background: '#0f0f0f', borderRadius: 10, padding: 8, minHeight: 480 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px 0 8px' }}>
            <div style={{ color: '#bdbdbd', fontSize: 13 }}>{total !== null ? `${emails.length} / ${total} loaded` : `${emails.length} loaded`}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => { setPage(0); setEmails([]); }}>Refresh</Button>
              <Button onClick={doSync}>Sync</Button>
            </div>
          </div>
          {loading ? <div style={{ padding: 12 }}>Loading...</div> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', maxHeight: 640 }}>
              {filteredEmails.length === 0 ? <li style={{ padding: 12, color: '#999' }}>No emails</li> : filteredEmails.map(email => (
                <li key={String(email.id)} onClick={() => handleSelectEmail(email)} style={{ cursor: 'pointer', padding: 12, borderBottom: '1px solid rgba(255,255,255,0.02)', background: selectedEmail?.id === email.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  {!email.read && <div style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: 8, display: 'inline-block', marginRight: 8 }} />}
                  <div style={{ fontWeight: 700 }}>{email.sender}</div>
                  <div style={{ color: '#bdbdbd', fontSize: 13 }}>{email.subject}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{String(email.timestamp)}</div>
                </li>
              ))}
            </ul>
          )}
          {total !== null && emails.length < total ? (
            <div style={{ padding: 12, textAlign: 'center' }}>
              <Button onClick={() => { setPage(p => p + 1); }}>Load more</Button>
            </div>
          ) : null}
        </div>

        <div style={{ background: '#0f0f0f', borderRadius: 10, padding: 12, minHeight: 480 }}>
          {selectedEmail ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedEmail.subject}</div>
                  <div style={{ color: '#bdbdbd', marginTop: 6 }}>From: {selectedEmail.sender} &lt;{selectedEmail.senderEmail}&gt;</div>
                  <div style={{ color: '#bdbdbd', marginTop: 6 }}>To: {selectedEmail.recipientEmail}</div>
                  <div style={{ color: '#777', marginTop: 6, fontSize: 12 }}>Received: {String(selectedEmail.timestamp)}</div>
                </div>
                <div>
                  <Button onClick={() => window.open('mailto:'+selectedEmail.senderEmail)}>Reply</Button>
                </div>
              </div>
              <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.03)', margin: '12px 0' }} />
              <div style={{ color: '#ddd' }} dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
            </div>
          ) : (
            <div style={{ color: '#999', padding: 24 }}>Select an email to view its contents.</div>
          )}
        </div>
      </div>
    </div>
  );
}
