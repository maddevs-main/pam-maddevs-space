"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import styled from 'styled-components';

const HeaderWrap = styled.header`
  padding: 20px 24px;
  background: #000;
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
  const { data: session } = useSession();
  const [user, setUser] = useState<any | null>(initialUser || (session ? (session.user as any) : null));
  const router = useRouter();
  useEffect(() => {
    // If initialUser provided, keep it. Otherwise derive from NextAuth session when available.
    if (initialUser) return;
    setUser(session ? (session.user as any) : null);
    // keep effect tied to session changes
  }, [initialUser, session]);

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (err) {
      // fallback
      setUser(null);
      router.push('/auth/login');
    }
  }

  return (
    <HeaderWrap>
          <Brand>
            <LogoImg src="/trans-black.svg" alt="logo" />
            <span>{title || 'maddevs'}</span>
          </Brand>
      <Nav>
        <div />
      </Nav>
    </HeaderWrap>
  );
}
