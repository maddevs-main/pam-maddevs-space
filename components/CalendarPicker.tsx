"use client";
import React from 'react';

function startOfMonth(d: Date) { const r = new Date(d); r.setDate(1); r.setHours(0,0,0,0); return r; }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }

export default function CalendarPicker({
  from,
  to,
  onChange,
  readOnly,
}: {
  from?: string | null;
  to?: string | null;
  onChange?: (from?: string | null, to?: string | null) => void;
  readOnly?: boolean;
}) {
  const init = from ? new Date(from) : new Date();
  const [month, setMonth] = React.useState<Date>(startOfMonth(init));
  const [selFrom, setSelFrom] = React.useState<Date | null>(from ? new Date(from) : null);
  const [selTo, setSelTo] = React.useState<Date | null>(to ? new Date(to) : null);

  React.useEffect(() => {
    setSelFrom(from ? new Date(from) : null);
    setSelTo(to ? new Date(to) : null);
    setMonth(startOfMonth(from ? new Date(from) : new Date()));
  }, [from, to]);

  function handlePrev() { setMonth(m => addMonths(m, -1)); }
  function handleNext() { setMonth(m => addMonths(m, 1)); }

  function isSameDay(a?: Date|null, b?: Date|null) {
    if (!a || !b) return false;
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function onPick(day: number) {
    if (readOnly) return;
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    if (!selFrom || (selFrom && selTo)) {
      setSelFrom(d); setSelTo(null);
      if (onChange) onChange(d.toISOString(), null);
      return;
    }
    // selFrom exists and selTo is null => set selTo
    if (d.getTime() < selFrom.getTime()) {
      // swap
      const old = selFrom; setSelFrom(d); setSelTo(old);
      if (onChange) onChange(d.toISOString(), old.toISOString());
    } else {
      setSelTo(d);
      if (onChange) onChange(selFrom.toISOString(), d.toISOString());
    }
  }

  // generate month grid (start on Sun)
  const firstWeekday = startOfMonth(month).getDay();
  const totalDays = daysInMonth(month);
  const cells: Array<Date | null> = [];
  for (let i=0;i<firstWeekday;i++) cells.push(null);
  for (let d=1; d<=totalDays; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  function inRange(d: Date) {
    if (!selFrom) return false;
    const start = selFrom.getTime();
    const end = selTo ? selTo.getTime() : selFrom.getTime();
    const t = d.getTime();
    return t >= Math.min(start,end) && t <= Math.max(start,end);
  }

  return (
    <div style={{ width: 320, maxWidth: '100%', background: 'rgba(15,15,17,0.96)', border: '1px solid rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, color: '#f1f1f1', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={handlePrev} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} aria-label="Previous month">‹</button>
        <div style={{ fontWeight: 800 }}>{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button onClick={handleNext} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} aria-label="Next month">›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> (<div key={d} style={{ textAlign: 'center' }}>{d}</div>))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((c, idx) => {
          const isNull = !c;
          let style: React.CSSProperties = { height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isNull ? 'default' : 'pointer' };
          if (isNull) style.color = 'transparent';
          if (c) {
            if (isSameDay(c, selFrom)) { style.background = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))'; style.color = '#ffffff'; style.fontWeight = 800; }
            else if (isSameDay(c, selTo)) { style.background = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))'; style.color = '#ffffff'; style.fontWeight = 800; }
            else if (selFrom && selTo && inRange(c)) { style.background = 'rgba(var(--color-yes-rgb),0.12)'; style.color = '#ffffff'; }
            else { style.background = 'transparent'; style.color = 'rgba(255,255,255,0.9)'; }
          }

          return (
            <div key={idx} style={style} onClick={() => { if (c && !readOnly) onPick(c.getDate()); }}>
              {c ? c.getDate() : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
