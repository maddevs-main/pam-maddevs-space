"use client";
import React from 'react';
import styled from 'styled-components';
import Dialog from './ui/Dialog';
import CalendarSpan from './CalendarSpan';

type Item = { id: string; title: string; from?: string | null; to?: string | null; color?: string; type?: string };

const IconButton = styled.button`
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.04);
  color: ${(p:any) => p.theme?.colors?.light || '#fff'};
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
  gap: 10px;
  &:hover { background: rgba(255,255,255,0.02); transform: translateY(-1px); }
`;

const SyncPrimary = styled(IconButton)`
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(0,0,0,0.06);
`;

const SyncDark = styled(IconButton)`
  background: #0f172a;
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.06);
`;

function CalendarPoints({ marks }: { marks: Array<{ date: string; color?: string }> }) {
  // filter out empty/invalid dates to avoid `new Date('')` -> Invalid Date
  const validMarks = React.useMemo(() => (marks || []).filter(m => {
    if (!m || !m.date) return false;
    const d = new Date(m.date);
    return !isNaN(d.getTime());
  }), [marks]);

  const init = React.useMemo(() => (validMarks.length ? new Date(validMarks[0].date) : new Date()), [validMarks]);
  const [month, setMonth] = React.useState<Date>(new Date(init.getFullYear(), init.getMonth(), 1));

  function startOfMonth(d: Date) { const r = new Date(d); r.setDate(1); r.setHours(0,0,0,0); return r; }
  function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
  function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }

  React.useEffect(() => { setMonth(startOfMonth(init)); }, [init]);

  const firstWeekday = startOfMonth(month).getDay();
  const totalDays = daysInMonth(month);
  const cells: Array<number | null> = [];
  for (let i=0;i<firstWeekday;i++) cells.push(null);
  for (let d=1; d<=totalDays; d++) cells.push(d);

  const markMap = new Map<string, string>();
  validMarks.forEach(m => {
    const d = new Date(m.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    // Default marks should use the green variant when no color provided
    markMap.set(key, m.color || 'var(--color-yes)');
  });

  return (
    <div style={{ width: '100%', background: 'rgba(15,15,17,0.96)', border: '1px solid rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, color: '#f1f1f1', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => setMonth(m => addMonths(m, -1))} style={{ background: 'transparent', border: 'none', color: 'inherit' }}>‹</button>
        <div style={{ fontWeight: 800 }}>{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ background: 'transparent', border: 'none', color: 'inherit' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> (<div key={d} style={{ textAlign: 'center' }}>{d}</div>))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((c, idx) => {
          const isNull = c === null;
          const baseStyle: React.CSSProperties = { aspectRatio: '1 / 1', minHeight: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxSizing: 'border-box' };
          if (isNull) baseStyle.color = 'transparent';
          const dateKey = c ? `${month.getFullYear()}-${month.getMonth()}-${c}` : '';
          const markColor = c ? markMap.get(dateKey) : undefined;

          // helper to convert hex to rgba
                  function hexToRgb(hex?: string) {
                    if (!hex) return null;
                    const s = String(hex).trim();
                    // If it's already an rgb(...) string, extract inner values
                    if (/^rgb\(/i.test(s)) {
                      return s.replace(/^rgb\(|\)$/gi, '');
                    }
                    // If it's a CSS var like var(--color-pending), resolve it from :root
                    if (/^var\(/i.test(s) && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                      try {
                        const name = s.replace(/^var\(/i, '').replace(/\)$/, '').trim();
                        const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
                        if (resolved) {
                          // resolved might be a hex (#rrggbb) or rgb(...) — recurse
                          return hexToRgb(resolved);
                        }
                      } catch (e) { /* ignore and fallthrough */ }
                    }
                    const h = s.replace('#', '');
                    if (h.length === 3) {
                      const r = parseInt(h[0] + h[0], 16);
                      const g = parseInt(h[1] + h[1], 16);
                      const b = parseInt(h[2] + h[2], 16);
                      return `${r},${g},${b}`;
                    }
                    if (h.length === 6) {
                      const r = parseInt(h.substring(0,2), 16);
                      const g = parseInt(h.substring(2,4), 16);
                      const b = parseInt(h.substring(4,6), 16);
                      return `${r},${g},${b}`;
                    }
                    return null;
                  }

          const rgb = hexToRgb(markColor);
          const halo = rgb ? `0 0 10px rgba(${rgb}, 0.22)` : undefined;
          const cellBg = rgb ? `rgba(${rgb}, 0.06)` : 'transparent';

          return (
            <div key={idx} style={{ ...baseStyle, background: markColor ? cellBg : 'transparent' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c ? (
                  markColor ? (
                    <div aria-hidden style={{ width: '72%', height: '72%', borderRadius: 8, background: markColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, border: '2px solid rgba(255,255,255,0.12)', boxShadow: halo ? `0 10px 28px rgba(${hexToRgb(markColor)},0.30)` : undefined }}>
                      {String(c)}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{c}</div>
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarAction({ items = [], title = 'Calendar', inline = false }: { items?: Item[]; title?: string; inline?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [selectedFrom, setSelectedFrom] = React.useState<string | null>(items?.[0]?.from || null);
  const [selectedTo, setSelectedTo] = React.useState<string | null>(items?.[0]?.to || null);

  React.useEffect(() => {
    if (items && items.length) {
      setSelectedFrom(items[0].from || null);
      setSelectedTo(items[0].to || items[0].from || null);
    }
  }, [items]);

  function onSelectItem(it: Item) {
    setSelectedFrom(it.from || null);
    setSelectedTo(it.to || it.from || null);
  }

  function fmtRange(it: Item) {
    if (!it.from && !it.to) return '—';
    try {
      const f = it.from ? new Date(it.from) : null;
      const t = it.to ? new Date(it.to) : null;
      if (f && t) return `${f.toLocaleDateString()} — ${t.toLocaleDateString()}`;
      if (f) return f.toLocaleDateString();
      return '—';
    } catch (e) { return '—'; }
  }

  // Helpers for calendar integration
  function toGoogleDateFormat(dateStr?: string | null) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // If incoming string had no time information (midnight UTC from date-only), detect by checking for T in original
    // We'll treat dates with time by using UTC timestamp, otherwise use YYYYMMDD for all-day events.
    if (/T/.test(String(dateStr))) {
      return d.toISOString().replace(/-|:|\.\d{3}/g, ''); // 20251119T123000Z
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  function formatICSDatetime(dateStr?: string | null) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (/T/.test(String(dateStr))) {
      return d.toISOString().replace(/-|:|\.\d{3}/g, '');
    }
    // all-day: format as YYYYMMDD
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  function buildICS(itemsList: Item[]) {
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pam-v1//EN');
    for (const it of itemsList) {
      const uid = `${it.id || Math.random().toString(36).slice(2)}@pam.local`;
      const summary = (it.title || 'Event').replace(/\n/g, '\\n');
      const dtstart = formatICSDatetime(it.from || null);
      let dtend = formatICSDatetime(it.to || it.from || null);
      // For all-day events, ICS DTEND should be the day after (exclusive)
      if (dtstart && dtstart.length === 8 && (!it.to || (formatICSDatetime(it.to || '').length === 8))) {
        // parse date and add 1 day to dtend
        const d = new Date(it.to || it.from || '');
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dtend = `${y}${m}${day}`;
        }
      }
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      if (dtstart) lines.push(`DTSTART:${dtstart}`);
      if (dtend) lines.push(`DTEND:${dtend}`);
      lines.push(`SUMMARY:${summary}`);
      if (it.type) lines.push(`CATEGORIES:${it.type}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadICS(itemsList: Item[]) {
    try {
      const ics = buildICS(itemsList);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pam-events.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to create .ics file');
    }
  }

  function openGoogleEvents(itemsList: Item[]) {
    for (const it of itemsList) {
      const title = encodeURIComponent(it.title || 'Event');
      const details = encodeURIComponent('Added from PAM');
      const start = toGoogleDateFormat(it.from || null);
      let end = toGoogleDateFormat(it.to || it.from || null);
      // If start is a full datetime and end is just a date, add one hour
      if (start && start.length === 8 && end && end.length === 8) {
        // all-day event: google expects dates like 20251119/20251120
      }
      const dates = start && end ? `${start}/${end}` : '';
      const params = new URLSearchParams({ action: 'TEMPLATE', text: title, details, dates });
      const url = `https://www.google.com/calendar/render?${params.toString()}`;
      window.open(url, '_blank');
    }
  }

  // detect if viewing meetings-only: items are meetings (type === 'meeting')
  const meetingsOnly = items && items.length > 0 && items.every(it => it.type === 'meeting');

  // Build the inner content (used for dialog and inline rendering)
  const innerContent = (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        {meetingsOnly ? (
          <CalendarPoints marks={items.filter(Boolean).map(it => ({ date: it.from || it.to || '', color: it.color }))} />
        ) : (
          <CalendarSpan from={selectedFrom || undefined} to={selectedTo || undefined} />
        )}
      </div>

      <div style={{ minWidth: 260, flex: '1 1 220px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#f8f8f8' }}>Items</h4>
        <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflow: 'auto' }}>
          {items.length === 0 ? <div style={{ color: 'rgba(180,180,178,0.9)' }}>No items</div> : items.map(it => (
            <button key={it.id} onClick={() => onSelectItem(it)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', color: '#f8f8f8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: it.color || '#999' }} />
                <div style={{ fontWeight: 700 }}>{it.title}</div>
              </div>
              <div style={{ color: 'rgba(180,180,178,0.85)', fontSize: 13 }}>{fmtRange(it)}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8, color: 'rgba(180,180,178,0.9)' }}>Sync</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SyncPrimary onClick={() => openGoogleEvents(items)} title="Add to Google Calendar" aria-label="Add to Google Calendar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="3" width="20" height="18" rx="2" fill="#ffffff" stroke="#e6e6e6" />
                <rect x="2" y="3" width="20" height="4" rx="2" fill="#4285F4" />
                <g>
                  <rect x="4" y="9" width="6" height="4" rx="1" fill="#4285F4" />
                  <rect x="14" y="9" width="6" height="4" rx="1" fill="#DB4437" />
                  <rect x="4" y="14" width="6" height="4" rx="1" fill="#F4B400" />
                  <rect x="14" y="14" width="6" height="4" rx="1" fill="#0F9D58" />
                </g>
              </svg>
              <span style={{ marginLeft: 6 }}>Google Calendar</span>
            </SyncPrimary>
            <SyncDark onClick={() => downloadICS(items)} title="Download .ics for Apple/Other" aria-label="Download .ics for Apple Calendar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="3" width="20" height="18" rx="2" fill="#0f172a" />
                <path d="M16.5 7.5h-9v-1.5a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5V7.5z" fill="#fff" opacity="0.9" />
                <path d="M12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#fff" />
              </svg>
              <span style={{ marginLeft: 6 }}>Add to Apple Calendar</span>
            </SyncDark>
          </div>
        </div>
      </div>
    </div>
  );

  // If inline is requested, render the inner content directly (no dialog, no icon)
  if (inline) {
    return (
      <div role="region" aria-label={title} style={{ width: '100%' }}>
        {innerContent}
      </div>
    );
  }

  return (
    <>
      <IconButton aria-label="Open calendar" title="Calendar" onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </IconButton>

      {open ? (
        <Dialog title={title} onClose={() => setOpen(false)} borderColor={'rgba(44,44,44,0.85)'}>
          {innerContent}
        </Dialog>
      ) : null}
    </>
  );
}
