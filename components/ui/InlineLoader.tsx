"use client";
import React from 'react';

export default function InlineLoader({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g transform="translate(12,12)">
        <g>
          <circle cx="0" cy="0" r="8" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 12" />
          <g>
            <circle cx="0" cy="-8" r="1.6" fill={color} />
          </g>
        </g>
        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0" to="360" dur="0.9s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}
