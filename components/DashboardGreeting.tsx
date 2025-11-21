"use client";
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const GreetingWrap = styled.div`
  margin-bottom: 8px;
`;

const GreetingText = styled.h1`
  margin: 0;
  font-size: 48px;
  line-height: 1.05;
  font-weight: 900;
  color: ${(p:any) => p.theme.colors.dark || '#b6a98bff'};
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
  max-width: 100%;
  @media (max-width: 900px) {
    font-size: 32px;
  }
  @media (max-width: 600px) {
    font-size: 22px;
  }
`;

// subtitle removed per UX request (keep greeting only)

export default function DashboardGreeting() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!mounted) return;
        if (!res.ok) { setUser(null); return; }
        const data = await res.json();
        setUser(data.user || null);
      } catch (err) {
        setUser(null);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const name = user?.name || user?.email || 'there';

  return (
    <GreetingWrap>
      <GreetingText>Hi, {name}</GreetingText>
    </GreetingWrap>
  );
}
