"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../../components/PageShell';
import styled from 'styled-components';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Container = styled.div`
  display: grid;
  /* first column is the users list, make it flexible with min/max so it doesn't collapse oddly */
  grid-template-columns: minmax(160px, 260px) 1fr;
  gap: 16px;
  align-items: start;
  background: #2b2b2b; /* application container grey */
  padding: 18px;
  border-radius: 12px;
  /* intermediate breakpoint: shrink left column on medium screens */
  @media (max-width: 1100px) { grid-template-columns: minmax(140px, 200px) 1fr; }
  @media (max-width: 900px) { grid-template-columns: 1fr; padding: 12px; }
`;

const LeftPanel = styled.div`
  background: #191818;
  border-radius: 12px;
  padding: 12px;
  height: 70vh;
  display: flex;
  flex-direction: column;
  @media (max-width: 900px) {
    /* don't force large height on small screens; let list size be dynamic */
    height: auto;
    max-height: 40vh;
    padding-bottom: 8px;
  }
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  overflow: auto;
  /* allow the list to shrink on small screens and grow to fill space */
  flex: 1 1 auto;
  min-height: 0; /* allow flex children to correctly compute overflow */
`;

const ChatWindow = styled.div`
  display: flex;
  flex-direction: column;
  height: 70vh;
  @media (max-width: 900px) { height: auto; min-height: 50vh; }
  background: rgba(2,2,2,0.4);
  border-radius: 12px;
  padding: 12px;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  position: relative;
`;

const InputBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(0,0,0,0.28);
  padding: 6px;
  border-radius: 24px;
  width: 100%;
`;

const InputField = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border-radius: 18px 0 0 18px;
  min-width: 0;
`;

const SendBtn = styled(Button)`
  border-radius: 18px;
  height: 43px;

  padding: 8px 14px;
  flex: 0 0 auto;
`;

const SquarePlus = styled.button`
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 10px;
  /* subtle grey background to sit within the dialog/header */
  background: rgba(12, 0, 65, 1);
  /* lighter border to make the button less prominent */
  border: 1px solid rgba(228, 228, 228, 0.03);
  color: ${(p:any) => p.theme?.colors?.light || '#fff'};
  cursor: pointer;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 14px;
  transition: background 140ms ease, transform 120ms ease;
  &:hover { background: rgba(8, 5, 59, 0.98); transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 3px solid rgba(255,255,255,0.04); outline-offset: 3px; }
`;

const ContactItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  width: 100%;
  background: ${p => p.$active ? 'rgba(255,255,255,0.02)' : 'transparent'};
  border: none;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  .contact-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const ContactMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Messages = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255,255,255,0.02);
`;

const MessageRow = styled.div<{ $me?: boolean }>`
  align-self: ${p => p.$me ? 'flex-end' : 'flex-start'};
  background: ${p => p.$me ? 'linear-gradient(180deg, rgba(6,95,70,0.95), rgba(6,95,70,0.85))' : 'rgba(255,255,255,0.04)'};
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 78%;
  box-shadow: ${p => p.$me ? '0 6px 18px rgba(6,95,70,0.12)' : 'none'};
  line-height: 1.3;
`;

export default function ChatPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [text, setText] = React.useState('');
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [onlineMap, setOnlineMap] = React.useState<Record<string, boolean>>({});
  const wsRef = React.useRef<WebSocket | null>(null);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const res = await fetch('/api/chat/users');
    if (!res.ok) return setUsers([]);
    const d = await res.json(); setUsers(d.users || []);
    // auto-select first user as active chat if none selected
    const first = (d.users || [])[0];
    if (first && !selected) {
      // openConversation will set selected and load messages
      setTimeout(() => openConversation(first), 10);
    }
  }

  // ensure websocket connection
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${window.location.host}/api/chat/ws`);
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === 'message' && data.message) {
            setMessages((m) => [...m, data.message]);
          }
          if (data?.type === 'presence') {
            setOnlineMap((s) => ({ ...s, [String(data.userId)]: !!data.online }));
          }
          if (data?.type === 'read') {
            setMessages((m) => m.map((msg:any) => {
              if (String(msg.fromUserId) === String(data.with) && String(msg.toUserId) === String(data.from)) {
                return { ...msg, readAt: data.readAt };
              }
              return msg;
            }));
          }
        } catch (e) { /* ignore malformed */ }
      };
      wsRef.current = ws;
      return () => { try { ws.close(); } catch(e) {} };
    } catch (e) { console.error('ws failed', e); }
  }, []);

  async function openConversation(u: any) {
    setSelected(u);
    const res = await fetch('/api/chat/messages/' + encodeURIComponent(u.id));
    if (!res.ok) { setMessages([]); } else { const d = await res.json(); setMessages(d.messages || []); }
    // when opening, send read event
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ type: 'read', with: u.id })); } catch (e) {}
    }
  }

  async function sendMessage() {
    if (!selected) return;
    const payload: any = { text };
    // Upload draft File attachments first (we store files locally until send)
    const filesToUpload = attachments.filter(a => a.file);
    let uploadedFiles: any[] = [];
    if (filesToUpload.length) {
      const fd = new FormData();
      filesToUpload.forEach((a, idx) => fd.append('file' + idx, a.file));
      try {
        const up = await fetch('/api/chat/upload', { method: 'POST', body: fd });
        if (!up.ok) {
          try { const err = await up.json(); alert(err.message || 'Upload failed'); } catch (e) { alert('Upload failed'); }
          return;
        }
        const j = await up.json();
        uploadedFiles = j.files || [];
      } catch (e) { console.error(e); alert('Upload failed'); return; }
    }

    // Combine attachments that already have a url with newly uploaded ones
    const persistedAttachments = [
      ...attachments.filter(a => a.url).map(a => ({ url: a.url, name: a.name, size: a.size, type: a.type })),
      ...uploadedFiles.map((f:any) => ({ url: f.url, name: f.name, size: f.size, type: f.type }))
    ];

    if (persistedAttachments.length) payload.attachments = persistedAttachments;

    const res = await fetch('/api/chat/messages/' + encodeURIComponent(selected.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { alert('Failed to send'); return; }
    const d = await res.json(); setMessages((m) => [...m, d.message || {}]); setText('');

    // cleanup previews and clear state
    attachments.forEach(a => { try { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); } catch (e) {} });
    setAttachments([]);
  }

  // upload file(s) to server and add to attachments list
  async function handleFileInput(files: FileList | null) {
    if (!files || files.length === 0) return;
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB client-side guard
    const next: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > MAX_BYTES) {
        alert(`File "${f.name}" is too large. Maximum file size is 10 MB.`);
        return;
      }
      const previewUrl = f.type && f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
      next.push({ file: f, previewUrl, name: f.name, size: f.size, type: f.type });
    }
    // store as draft attachments; upload will happen when user hits send
    setAttachments((s) => [...s, ...next]);
  }

  // scroll to bottom when messages or selected change
  React.useEffect(() => {
    try {
      const el = messagesRef.current;
      if (!el) return;
      // small timeout to allow DOM update
      setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
    } catch (e) {}
  }, [messages, selected]);

  return (
    <PageShell title="Chat" actions={<SquarePlus onClick={() => router.push('/dashboard')} title="Back to dashboard" aria-label="Back to dashboard"><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 24, width: 24 }} aria-hidden>←</span>Back to dashboard</SquarePlus>}>
      <Container>
        <div>
          <LeftPanel>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 20, color: '#fff' }}>Individuals</div>
            <div style={{ height: 10 }} />
            <UsersList>
              {users.map(u => (
                <ContactItem key={u.id} $active={selected?.id === u.id} onClick={() => openConversation(u)} aria-pressed={selected?.id === u.id}>
                  <div style={{ position: 'relative', flex: '0 0 auto' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 999, overflow: 'hidden', flex: '0 0 auto' }}>
                      <img src={u.profilePic} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ position: 'absolute', right: -2, bottom: -2, width: 10, height: 10, borderRadius: 99, background: onlineMap[String(u.id)] ? '#22c55e' : '#6b7280', border: '2px solid #111' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div className="contact-name" style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{u.name || u.email}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: '0 0 auto', marginLeft: 8 }}>{u.lastSeen ? new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}></div>
                  </div>
                  <ContactMeta>
                    {u.unread ? <div style={{ background: 'var(--color-no)', color: '#fff', borderRadius: 16, padding: '4px 8px', fontSize: 12 }}>{u.unread}</div> : null}
                  </ContactMeta>
                </ContactItem>
              ))}
            </UsersList>
          </LeftPanel>
        </div>

        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChatHeader>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selected ? (
                  <>
                    <div style={{ width: 42, height: 42, borderRadius: 999, overflow: 'hidden' }}>
                      <img src={selected.profilePic} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name || selected.email}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}></div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>Chatroom</div>
                )}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>{/* placeholder for right-aligned status */}</div>
            </ChatHeader>
            <ChatWindow>
              <Messages ref={messagesRef as any} role="log" aria-live="polite" aria-relevant="additions">
                {(() => {
                  if (!selected) return null;
                  const conv = messages.filter((m:any) => (String(m.fromUserId) === String(selected.id) || String(m.toUserId) === String(selected.id) || String(m.fromUserId) === String(selected.id) || String(m.toUserId) === String(selected.id)) );
                  conv.sort((a:any,b:any)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  const elems:any[] = [];
                  let lastDate = '';
                  conv.forEach((m:any, i:number) => {
                    const d = new Date(m.createdAt || Date.now());
                    const dateKey = d.toDateString();
                    if (dateKey !== lastDate) { elems.push(<div key={`sep-${i}`} style={{ textAlign: 'center', opacity: 0.8, fontSize: 12 }}>{dateKey}</div>); lastDate = dateKey; }
                    const isMe = String(m.fromUserId) !== String(selected.id);
                    elems.push(
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <MessageRow $me={isMe} role="article" aria-label={isMe ? 'Sent message' : 'Received message'}>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                          {Array.isArray(m.attachments) && m.attachments.length ? (
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {m.attachments.map((att:any, ai:number) => (
                                <div key={ai} style={{ background: 'rgba(0,0,0,0.15)', padding: 6, borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {att.type && att.type.startsWith('image/') ? (
                                    <img src={att.url} alt={att.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                                  ) : (
                                    <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>{att.name?.slice(0,2).toUpperCase()}</div>
                                  )}
                                  <a href={att.url} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontSize: 13 }}>{att.name}</a>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </MessageRow>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'right' }}>
                          <time dateTime={new Date(m.createdAt).toISOString()} style={{ marginRight: 8 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                          {isMe ? (
                            m.readAt ? <span>Read</span> : (m.deliveredAt ? <span>Delivered</span> : <span>Sent</span>)
                          ) : null}
                        </div>
                      </div>
                    );
                  });
                  return elems;
                })()}
              </Messages>
              <InputBar>
                    <InputWrapper>
                      <div style={{ display: 'flex', alignItems: 'center', marginRight: 8, flex: '0 0 auto' }}>
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', padding: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }} title="Attach file">
                            <img src="/file-clip.svg" alt="Attach file" width={28} height={28} style={{ display: 'block' }} />
                          </label>
                        <input id="file-upload" type="file" style={{ display: 'none' }} multiple onChange={e => handleFileInput(e.target.files)} />
                      </div>

                      <InputField>
                        {/* attachments preview inside input */}
                        {attachments.length ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflow: 'auto', maxWidth: '36%', flex: '0 0 auto' }}>
                            {attachments.map((a, idx) => (
                              <div key={idx} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
                                {(a.previewUrl || (a.type && a.type.startsWith('image/'))) ? <img src={a.previewUrl || a.url} style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>{a.name?.slice(0,2).toUpperCase()}</div>}
                                <div style={{ fontSize: 12, color: '#fff', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                                <button onClick={() => { if (a.previewUrl) try { URL.revokeObjectURL(a.previewUrl); } catch(e){}; setAttachments((s) => s.filter((_,i)=>i!==idx)) }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} aria-label="Remove attachment">×</button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <input aria-label="Message input" value={text} onKeyDown={e=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} onChange={e=>setText(e.target.value)} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '6px 8px' }} placeholder={selected ? `Message ${selected.name || selected.email}` : 'Select a contact'} />
                      </InputField>

                      <SendBtn type="button" onClick={sendMessage} aria-label="Send message">Send</SendBtn>
                    </InputWrapper>
              </InputBar>
            </ChatWindow>
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
