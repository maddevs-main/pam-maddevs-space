"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

const HeaderWrap = styled.header`
  padding: 20px 24px;
  background: #191818;
  border-bottom: 1px solid rgba(180,180,178,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled.div`
  font-weight: 800;
  font-size: 24px;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserText = styled.div`
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.mid) || '#B4B4B2'};
`;

const FlatButton = styled.button`
  background: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.primary) || '#75725F'};
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  padding: 8px 12px;
  border-radius: 0;
  border: none;
  cursor: pointer;
`;

const LogoImg = styled.img`
  height:48px;
  width: auto;
  display: inline-block;
`;

export default function Header({ title, initialUser }: { title?: string; initialUser?: any }) {
  const [user, setUser] = useState<any | null>(initialUser || null);
  const router = useRouter();
  useEffect(() => {
    if (initialUser) return;
    // Try to get user from JWT in localStorage
    const token = window.localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.userId, role: payload.role, tenantId: payload.tenantId, name: payload.name, email: payload.email });
      } catch {}
    }
  }, [initialUser]);

  async function handleLogout() {
    window.localStorage.removeItem('jwt');
    setUser(null);
    router.push('/auth/login');
  }

  return (
    <HeaderWrap>
      <a href="https://maddevs.space" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <Brand>
          <LogoImg src="/trans-black.svg" alt="logo" />
          <span>{title || 'maddevs'}</span>
        </Brand>
      </a>
      <Nav>
        <div />
      </Nav>
    </HeaderWrap>
  );
}
