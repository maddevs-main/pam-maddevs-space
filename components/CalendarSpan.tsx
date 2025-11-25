"use client";
import React from 'react';
import styled from 'styled-components';
import CalendarPicker from './CalendarPicker';

function fullDateLabel(d?: string) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { return d; }
}

const SpanWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const SpanContent = styled.div`
  width: 320px;
  max-width: 100%;
  margin: 0 auto;
  @media (max-width: 640px) {
    width: 100%;
  }
`;

export default function CalendarSpan({ from, to }: { from?: string | null; to?: string | null }) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  // keep calendar expanded by default
  const [open] = React.useState(true);
  const [selFrom, setSelFrom] = React.useState<string | null>(from || null);
  const [selTo, setSelTo] = React.useState<string | null>(to || null);

  React.useEffect(() => { setSelFrom(from || null); setSelTo(to || null); }, [from, to]);

  return (
    <SpanWrapper>
      <SpanContent>
        <div style={{ fontSize: 13, color: 'rgba(180,180,178,0.9)', fontWeight: 700 }}>{fullDateLabel(selFrom || undefined)} — {fullDateLabel(selTo || undefined)}</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ width: '100%', height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.02)', padding: 8, boxSizing: 'border-box', border: '1px solid rgba(180,180,178,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 999, overflow: 'hidden' }} aria-hidden="true">
                {/* show a simple visual: when both dates present, fill more prominently with a slightly lighter tint and glow */}
                <div style={{
                  height: '100%',
                  width: selFrom && selTo ? '100%' : '30%',
                  background: selFrom && selTo ? (selTo && selFrom && new Date(selTo).getTime() - new Date(selFrom).getTime() >= 0 ? 'rgba(var(--color-yes-rgb),0.85)' : 'rgba(var(--color-pending-rgb),0.85)') : 'rgba(255,255,255,0.03)',
                  borderRadius: 999,
                  transition: 'width 300ms ease',
                  boxShadow: selFrom && selTo ? '0 6px 18px rgba(var(--color-yes-rgb),0.12)' : 'none'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(180,180,178,0.7)', fontSize: 11 }}>
                <div>{fromDate ? fromDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</div>
                <div>{toDate ? toDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</div>
              </div>
            </div>
          </div>
              {/* Calendar stays expanded but read-only */}
              <div style={{ marginTop: 8 }}>
                <CalendarPicker from={selFrom} to={selTo} readOnly={true} onChange={(f,t) => { setSelFrom(f||null); setSelTo(t||null); }} />
              </div>
        </div>
      </SpanContent>
    </SpanWrapper>
  );
}
