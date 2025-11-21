"use client";
import React from 'react';

export default function TimeSelector({ name = 'time', value, onChange }: { name?: string, value?: string | null, onChange?: (v: string | null) => void }) {
  const [time, setTime] = React.useState<string>(value || '');

  React.useEffect(() => {
    setTime(value || '');
  }, [value]);

  function handleTimeChange(v: string) {
    setTime(v || '');
    if (onChange) onChange(v || null);
  }

  return (
    <div>
      <input name={name} type="time" value={time} onChange={e => handleTimeChange(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6 }} />
    </div>
  );
}
