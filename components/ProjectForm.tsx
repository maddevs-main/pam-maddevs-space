"use client";
import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import styled from 'styled-components';
import { TextInput } from './ui/Input';
import RichTextEditor from './ui/RichTextEditor';

export default function ProjectForm({ initial, mode = 'create', projectId, onDone, adminControls = false }: { initial?: any, mode?: 'create' | 'edit', projectId?: string, onDone?: (result?: any)=>void, adminControls?: boolean }) {
  const [title, setTitle] = React.useState(initial?.title || '');
  const [descriptionHtml, setDescriptionHtml] = React.useState(initial?.description || '');
  const [objectivesHtml, setObjectivesHtml] = React.useState<string>(() => {
    if (!initial) return '';
    if (Array.isArray(initial.objectives)) {
      return `<ul>${initial.objectives.map((o:any)=>`<li>${String(o)}</li>`).join('')}</ul>`;
    }
    return initial.objectives || '';
  });
  const [startDate, setStartDate] = React.useState(initial?.timeline?.from || '');
  const [endDate, setEndDate] = React.useState(initial?.timeline?.to || '');
  const [message, setMessage] = React.useState<string | null>(null);
  const [projType, setProjType] = React.useState<string>(initial?.type || '');
  const [approved, setApproved] = React.useState<number | boolean>(initial?.approved ? 1 : 0);
  const [statusInternal, setStatusInternal] = React.useState<string>(initial?.status_internal || '');
  const [statusText, setStatusText] = React.useState<string>(initial?.status?.text || '');
  const [statusStage, setStatusStage] = React.useState<number>(initial?.status?.stage || 0);
  const [peopleAllocatedStr, setPeopleAllocatedStr] = React.useState<string>((initial?.people_allocated || []).join(','));
  const [staffStr, setStaffStr] = React.useState<string>((initial?.staff || []).join(','));
  const [formMilestones, setFormMilestones] = React.useState<Array<{title:string,amount:string,paymentLink?:string}>>(initial?.milestones || []);
  const [formStages, setFormStages] = React.useState<Array<{name:string,progress:number}>>(initial?.stages || []);
  const [filebaseLinksStr, setFilebaseLinksStr] = React.useState<string>((initial?.filebase_links || []).join(','));
  const [credentialLinksStr, setCredentialLinksStr] = React.useState<string>((initial?.credential_links || []).join(','));
  const [otherLinksStr, setOtherLinksStr] = React.useState<string>((initial?.other_links || []).join(','));

  React.useEffect(() => {
    // keep local state in sync if initial changes
    setTitle(initial?.title || '');
    setDescriptionHtml(initial?.description || '');
    if (initial?.objectives) {
      if (Array.isArray(initial.objectives)) setObjectivesHtml(`<ul>${initial.objectives.map((o:any)=>`<li>${String(o)}</li>`).join('')}</ul>`);
      else setObjectivesHtml(initial.objectives || '');
    } else setObjectivesHtml('');
    setStartDate(initial?.timeline?.from || '');
    setEndDate(initial?.timeline?.to || '');
    setFormMilestones(initial?.milestones || []);
    setFormStages(initial?.stages || []);
    setFilebaseLinksStr((initial?.filebase_links || []).join(','));
    setCredentialLinksStr((initial?.credential_links || []).join(','));
    setOtherLinksStr((initial?.other_links || []).join(','));
    setProjType(initial?.type || '');
    setApproved(initial?.approved ? 1 : 0);
    setStatusInternal(initial?.status_internal || '');
    setStatusText(initial?.status?.text || '');
    setStatusStage(initial?.status?.stage || 0);
    setPeopleAllocatedStr((initial?.people_allocated || []).join(','));
    setStaffStr((initial?.staff || []).join(','));
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    function parseObjectives(html:string): string[] {
      try {
        const doc = new DOMParser().parseFromString(html || '', 'text/html');
        const ul = doc.querySelector('ul');
        const ol = doc.querySelector('ol');
        if (ul || ol) {
          const list = (ul || ol)!;
          return Array.from(list.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
        }
        const text = doc.body.textContent || '';
        return text.split(/\n+/).map(s => s.trim()).filter(Boolean);
      } catch (e) { return []; }
    }

    const body: any = {
      title,
      description: descriptionHtml,
      objectives: parseObjectives(objectivesHtml),
      timeline: { from: startDate || null, to: endDate || null },
      milestones: formMilestones.map(m => ({ title: m.title, amount: typeof m.amount !== 'undefined' ? Number(String(m.amount).replace(/[^0-9.-]+/g, '')) : 0, paymentLink: m.paymentLink || '', confirmedByUser: (m as any).confirmedByUser || 0, paidByAdmin: (m as any).paidByAdmin || 0 })),
      stages: formStages.map(s => ({ name: s.name, progress: Number(s.progress || 0) }))
    };

    // compute total cost from milestones
    const totalCost = (formMilestones || []).reduce((sum, m) => {
      const amt = Number(String(m.amount || '').replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    // include link arrays
    body.total_cost = totalCost;
    body.filebase_links = String(filebaseLinksStr || '').split(',').map(s => s.trim()).filter(Boolean);
    body.credential_links = String(credentialLinksStr || '').split(',').map(s => s.trim()).filter(Boolean);
    body.other_links = String(otherLinksStr || '').split(',').map(s => s.trim()).filter(Boolean);

    // include admin-only fields when requested
    if (adminControls) {
      body.approved = approved ? 1 : 0;
      body.status_internal = statusInternal;
      body.status = { text: statusText, stage: Number(statusStage || 0) };
      body.type = projType || undefined;
      body.people_allocated = String(peopleAllocatedStr || '').split(',').map(s => s.trim()).filter(Boolean);
      body.staff = String(staffStr || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        // use PUT for full update so admin updates are applied atomically
        res = await fetch('/api/projects/' + projectId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMessage(JSON.stringify(data));
        return;
      }
      setMessage(mode === 'create' ? 'Project requested' : 'Project updated');
      if (onDone) onDone(data);
    } catch (err) {
      setMessage('Error: ' + String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8, display: 'grid', gap: 8 }}>
      <Card classic>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Links (comma-separated)</label>
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Filebase links</label>
              <TextInput placeholder="https://... , https://..." value={filebaseLinksStr} onChange={e => setFilebaseLinksStr((e.target as HTMLInputElement).value)} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Credential links</label>
              <TextInput placeholder="https://... , https://..." value={credentialLinksStr} onChange={e => setCredentialLinksStr((e.target as HTMLInputElement).value)} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Other links</label>
              <TextInput placeholder="https://... , https://..." value={otherLinksStr} onChange={e => setOtherLinksStr((e.target as HTMLInputElement).value)} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Project type (displayed on detail page)</label>
              <TextInput value={projType} onChange={e => setProjType((e.target as HTMLInputElement).value)} placeholder="e.g. Website, Integration, Design" />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Title</label>
          <TextInput placeholder="Title" value={title} onChange={e => setTitle((e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
          <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} placeholder="Description" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Objectives (enter one per line or use list)</label>
          <RichTextEditor value={objectivesHtml} onChange={setObjectivesHtml} placeholder={"Objectives (one per line)"} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Start</label>
            <TextInput type="date" value={startDate} onChange={e => setStartDate((e.target as HTMLInputElement).value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>End</label>
            <TextInput type="date" value={endDate} onChange={e => setEndDate((e.target as HTMLInputElement).value)} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Milestones</label>
            <Button type="button" onClick={() => setFormMilestones(s => [...s, { title: '', amount: '', paymentLink: '' }])}>Add Milestone</Button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <div style={{ color: 'rgba(180,180,178,0.95)', fontSize: 14 }}>Total cost:</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>&#x20B9; { (formMilestones || []).reduce((sum, m) => { const amt = Number(String(m.amount||'').replace(/[^0-9.-]+/g,'')); return sum + (isNaN(amt) ? 0 : amt); }, 0) }</div>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {formMilestones.map((m, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Title" value={m.title} onChange={e => setFormMilestones(s => s.map((x,idx) => idx===i ? { ...x, title: e.target.value } : x))} style={{ flex: 1, padding: '8px 10px', borderRadius: 6 }} />
                  <input placeholder="Amount" value={m.amount} onChange={e => setFormMilestones(s => s.map((x,idx) => idx===i ? { ...x, amount: e.target.value } : x))} style={{ width: 120, padding: '8px 10px', borderRadius: 6 }} />
                  <input placeholder="Payment link (optional)" value={m.paymentLink || ''} onChange={e => setFormMilestones(s => s.map((x,idx) => idx===i ? { ...x, paymentLink: e.target.value } : x))} style={{ width: 260, padding: '8px 10px', borderRadius: 6 }} />
                  <Button type="button" onClick={() => setFormMilestones(s => s.filter((_,idx) => idx !== i))} style={{ background: '#7a3030' }}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Stages</label>
            <Button type="button" onClick={() => setFormStages(s => [...s, { name: '', progress: 0 }])}>Add Stage</Button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {formStages.map((st, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Stage name" value={st.name} onChange={e => setFormStages(s => s.map((x,idx) => idx===i ? { ...x, name: e.target.value } : x))} style={{ flex: 1, padding: '8px 10px', borderRadius: 6 }} />
                  <input placeholder="Progress %" type="number" value={st.progress} onChange={e => setFormStages(s => s.map((x,idx) => idx===i ? { ...x, progress: Number((e.target as HTMLInputElement).value) } : x))} style={{ width: 120, padding: '8px 10px', borderRadius: 6 }} />
                  <Button type="button" onClick={() => setFormStages(s => s.filter((_,idx) => idx !== i))} style={{ background: '#7a3030' }}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {adminControls ? (
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Admin Controls</label>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={Boolean(approved)} onChange={e => setApproved((e.target as HTMLInputElement).checked ? 1 : 0)} />
                  <span>Approved</span>
                </label>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <label style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, color: 'rgba(180,180,178,0.9)' }}>Status (text)</span>
                    <input value={statusText} onChange={e => setStatusText((e.target as HTMLInputElement).value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', width: 120 }}>
                    <span style={{ fontSize: 12, color: 'rgba(180,180,178,0.9)' }}>Stage</span>
                    <input type="number" value={statusStage} onChange={e => setStatusStage(Number((e.target as HTMLInputElement).value || 0))} style={{ padding: '8px 10px', borderRadius: 6 }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Internal status</label>
                <input value={statusInternal} onChange={e => setStatusInternal((e.target as HTMLInputElement).value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6 }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>People allocated (comma-separated IDs)</label>
                <input value={peopleAllocatedStr} onChange={e => setPeopleAllocatedStr((e.target as HTMLInputElement).value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6 }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Staff (comma-separated IDs)</label>
                <input value={staffStr} onChange={e => setStaffStr((e.target as HTMLInputElement).value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {/* responsive submit: hide label on very small screens to avoid overflow */}
                {/** Styled wrapper so we can hide the label text on narrow viewports */}
                {(() => {
                  const ResponsiveSubmit = styled(Button)`
                    & .btn-text { display: inline-block; }
                    @media (max-width: 420px) { & .btn-text { display: none; } }
                  `;
                  return (
                    <ResponsiveSubmit type="submit">
                      <span className="btn-text">{mode === 'create' ? 'Request Project' : 'Save changes'}</span>
                    </ResponsiveSubmit>
                  );
                })()}
        </div>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
      </Card>
    </form>
  );
}
