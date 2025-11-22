"use client";
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarProvider } from '../ui/sidebar';
import {
  Home,
  FileText,
  CalendarClock,
  Users as UsersIcon,
  CreditCard,
  Settings,
  Briefcase,
  User,
  ClipboardList,
  LogOut,
  MessageSquare,
  BookOpen,
  Newspaper,
  Menu,
} from 'lucide-react';

// Styling constants
const SIDEBAR_WIDTH_COLLAPSED = '80px';
const SIDEBAR_WIDTH_EXPANDED = '320px';
const EXPANDER_WIDTH = '256px';
const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
const NAV_GAP_SM = '12px';
const ITEM_HEIGHT = '48px';
const TOP_HEIGHT = '120px';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  color: #f1f1f1;
`;

const StyledSidebar = styled.aside<{ $collapsed: boolean }>`
  width: ${p => (p.$collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)};
  min-width: 0;
  background: #786143;
  border-right: 1px solid rgba(0,0,0,0.08);
  padding: ${PADDING};
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  transition: width 240ms ease;

  @media (max-width: 640px) {
    padding: ${PADDING_SM};
    width: ${p => (p.$collapsed ? '60px' : SIDEBAR_WIDTH_EXPANDED)};
  }
`;

const NavStyled = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${NAV_GAP};
  min-width: 0;
  @media (max-width: 640px) { gap: ${NAV_GAP_SM}; }
`;

const NavButtonA = styled.a<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  height: ${ITEM_HEIGHT};
  padding: ${p => (p.$collapsed ? '6px 0' : '6px 12px')};
  text-decoration: none;
  color: ${p => (p.$active ? '#270101' : 'black')};
  background: ${p => (p.$active ? 'rgba(255,255,255,0.9)' : 'transparent')};
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
`;

const ExpanderStyled = styled.aside`
  width: ${EXPANDER_WIDTH};
  min-width: ${EXPANDER_WIDTH};
  max-width: ${EXPANDER_WIDTH};
  background: #d8c0a7;
  border-right: 1px solid rgba(0,0,0,0.06);
  padding: ${PADDING};
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

const CollapseToggleStyled = styled.button<{ $rotated: boolean; $collapsed: boolean }>`
  background: transparent;
  border: none;
  padding: 0;
  height: ${TOP_HEIGHT};
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => (p.$collapsed ? 'center' : 'flex-end')};
  padding-right: ${p => (p.$collapsed ? '0' : '16px')};
  & svg { color: black; }
`;

const Footer = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
`;

const LogoutButtonStyled = styled.button<{ $collapsed: boolean }>`
  background: transparent;
  border: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => (p.$collapsed ? 'center' : 'flex-start')};
  padding: ${p => (p.$collapsed ? '8px 0' : '8px 12px')};
  border-radius: 6px;
  cursor: pointer;
  color: #270101;
`;

const Main = styled.main`
  flex: 1;
  padding: 32px;
  background: #000;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
`;

function buildNav(role?: string) {
  if (role === 'admin') return [
    { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
    { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
    { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
    { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
    { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
    { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
    { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
  ];
  if (role === 'staff') return [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
  ];
  return [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
    { href: '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
  ];
}

export default function DashboardShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role as string | undefined;
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar_collapsed') !== '0'; } catch { return true; }
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | undefined>(active);

  useEffect(() => {
    if (!activeKey && typeof pathname === 'string') {
      if (pathname === '/admin' || pathname === '/admin/') setActiveKey('overview');
      else if (pathname.startsWith('/admin/users')) setActiveKey('users');
      else if (pathname.startsWith('/admin/staff')) setActiveKey('staff');
      else if (pathname.startsWith('/admin/projects')) setActiveKey('projects-admin');
      else if (pathname.startsWith('/dashboard/projects')) setActiveKey('projects');
      else if (pathname.startsWith('/dashboard/meetings')) setActiveKey('meetings');
      else if (pathname.startsWith('/chat')) setActiveKey('chat');
      else setActiveKey('overview');
    }
  }, [pathname, activeKey]);

  useEffect(() => { try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0'); } catch {} }, [collapsed]);

  const items = buildNav(role);

  function navigate(href?: string, key?: string) {
    if (!href) return;
    router.push(href);
    if (key) setActiveKey(key);
  }

  async function handleLogout() {
    try { await signOut({ callbackUrl: '/auth/login' }); }
    catch { if (typeof window !== 'undefined') window.location.href = '/auth/login'; }
  }

  function toggleCollapse() {
    if (!collapsed) { setCollapsed(true); setPanelOpen(false); return; }
    setPanelOpen(prev => !prev);
  }

  return (
    <SidebarProvider open={!collapsed} onOpenChange={(open: boolean) => { setCollapsed(!open); if (!open) setPanelOpen(false); }}>
      <Shell>
        <StyledSidebar $collapsed={collapsed}>
          <CollapseToggleStyled onClick={toggleCollapse} aria-pressed={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} $rotated={panelOpen} $collapsed={collapsed}>
            <Menu />
          </CollapseToggleStyled>

          <NavStyled>
            {items.map((it) => (
              <NavButtonA key={it.key} href={it.href} onClick={(e) => { e.preventDefault(); navigate(it.href, it.key); }} $active={activeKey === it.key} $collapsed={collapsed}>
                <it.Icon style={{ width: 20, height: 20 }} />
                {!collapsed && <span style={{ fontWeight: 700 }}>{it.label}</span>}
              </NavButtonA>
            ))}
          </NavStyled>

          <Footer>
            <LogoutButtonStyled onClick={handleLogout} $collapsed={collapsed} title="Logout">
              <LogOut style={{ width: 20, height: 20 }} />
              {!collapsed && <span style={{ marginLeft: 10, fontWeight: 700 }}>Logout</span>}
            </LogoutButtonStyled>
          </Footer>
        </StyledSidebar>

        {collapsed && panelOpen && (
          <ExpanderStyled>
            <div style={{ height: TOP_HEIGHT }} />
            <NavStyled>
              {items.map((it) => (
                <a key={`exp-${it.key}`} href={it.href} onClick={(e) => { e.preventDefault(); navigate(it.href, it.key); setPanelOpen(false); }} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6 }}>
                    <it.Icon style={{ width: 20, height: 20 }} />
                    <div style={{ fontWeight: 700 }}>{it.label}</div>
                  </div>
                </a>
              ))}
            </NavStyled>
            <div style={{ marginTop: 'auto' }}>
              <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', width: '100%', borderRadius: 6, color: '#b91c1c', cursor: 'pointer', textDecoration: 'none' }}>
                <LogOut />
                <div style={{ fontWeight: 700 }}>Logout</div>
              </a>
            </div>
          </ExpanderStyled>
        )}

        <Main>{children}</Main>
      </Shell>
    </SidebarProvider>
  );
}
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarProvider } from '../ui/sidebar';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper, Menu } from 'lucide-react';

// --- STYLING CONSTANTS ---
const SIDEBAR_WIDTH_COLLAPSED = '80px';
const SIDEBAR_WIDTH_EXPANDED = '320px';
const EXPANDER_WIDTH = '256px';

const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
"use client";
import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarProvider } from '../ui/sidebar';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper, Menu } from 'lucide-react';

// --- STYLING CONSTANTS ---
const SIDEBAR_WIDTH_COLLAPSED = '80px';
const SIDEBAR_WIDTH_EXPANDED = '320px';
const EXPANDER_WIDTH = '256px';

const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
const NAV_GAP_SM = '12px';
const ITEM_HEIGHT = '48px';
const TOP_HEIGHT = '120px';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  color: #f1f1f1;
  min-width: 0;
`;

const NavButtonStyles = css`
    display: flex;
    align-items: center;
    text-decoration: none;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    height: ${ITEM_HEIGHT};
    min-width: 0;
    width: 100%;
    color: black;
`;

const NavButtonA = styled.a`${NavButtonStyles}`;

const StyledSidebar = styled.aside<{ $collapsed: boolean }>`
    width: ${p => p.$collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED};
    min-width: 0;
    background: #786143;
    border-right: 1px solid rgba(0,0,0,0.08);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 300ms ease;

    @media (max-width: 640px) {
        width: ${p => p.$collapsed ? '60px' : SIDEBAR_WIDTH_EXPANDED};
        padding: ${PADDING_SM};
    }
`;

const ExpanderStyled = styled.aside`
    width: ${EXPANDER_WIDTH};
    min-width: ${EXPANDER_WIDTH};
    max-width: ${EXPANDER_WIDTH};
    background: #d8c0a7;
    border-right: 1px solid rgba(0,0,0,0.06);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;

    @media (max-width: 640px) {
        padding: ${PADDING_SM};
        width: 180px; 
        min-width: 180px;
        max-width: 180px;
    }
`;

const ExpanderFooterStyled = styled.div`
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const NavStyled = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${NAV_GAP};
    min-width: 0;

    @media (max-width: 640px) {
        gap: ${NAV_GAP_SM};
    }
`;

const SidebarFooterStyled = styled.div`
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 8px;
`;

const LogoutButtonStyled = styled.button<{ $collapsed: boolean }>`
  background: transparent;
  border: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  padding: ${p => p.$collapsed ? '8px 0' : '8px 12px'};
  border-radius: 6px;
  cursor: pointer;
  color: #270101;
  transition: background 120ms ease;

  & svg { width: 28px; height: 28px; }

  &:hover { background: rgba(0,0,0,0.08); }
`;

const CollapseToggleStyled = styled.button<{ $rotated: boolean, $collapsed: boolean }>`
  background: transparent;
  border: none;
  padding: 0;
  height: ${TOP_HEIGHT};
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-end'};
  padding-right: ${p => p.$collapsed ? '0' : '16px'};

  & svg {
    display: block;
    height: 48px; 
    width: 48px;
    color: black;
    transition: transform 260ms cubic-bezier(.2,.9,.22,1);
    transform: ${p => p.$rotated ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 32px; /* p-8 */
  background: #000; /* black background */
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 8px; background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.12); border-radius: 8px; }
`;

// --- NAV BUTTON COMPONENT ---

function NavButton({ item, activeKey, setActivePath, collapsed, isExpander } : any) {
    const isActive = activeKey === item.key;
    return (
        <Link href={item?.href || '#'}>
          <NavButtonA
              onClick={() => { if (typeof setActivePath === 'function') setActivePath(item.href); }}
              aria-current={isActive ? 'page' : undefined}
              style={{
                  display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 700, cursor: 'pointer', borderRadius: 6,
                  transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease', height: ITEM_HEIGHT, width: '100%', color: isActive ? (isExpander ? '#4b3826' : '#270101') : 'black',
                  background: isActive ? (isExpander ? 'rgba(164,151,135,0.7)' : 'rgba(255,255,255,0.9)') : 'transparent',
                  padding: collapsed ? 6 : (isExpander ? '0 16px' : '0 12px'), justifyContent: collapsed ? 'center' : 'flex-start'
              }}
          >
              {!isExpander && (
                  <item.Icon style={{ width: collapsed ? '100%' : 24, height: collapsed ? '100%' : 24, flexShrink: 0 }} />
              )}

              {!collapsed && !isExpander && (
                  <span style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 12 }}>{item.label}</span>
              )}

              {isExpander && (
                  <div style={{ fontSize: 20, fontWeight: 'bold', height: '100%', display: 'flex', alignItems: 'center' }}>{item.label}</div>
              )}
          </NavButtonA>
        </Link>
    );
}

export default function DashboardShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { data: session } = useSession();
  const role = (session && (session as any).user && (session as any).user.role) ? (session as any).user.role : null;
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // helper to navigate
  const setActivePath = (href?: string) => { if (!href) return; router.push(href); };

  // derive active by pathname if active prop not provided
  if (!active && typeof pathname === 'string') {
    if (pathname === '/admin' || pathname === '/admin/') active = 'overview';
    else if (pathname.startsWith('/admin/users')) active = 'users';
    else if (pathname.startsWith('/admin/staff')) active = 'staff';
    else if (pathname.startsWith('/admin/projects')) active = 'projects-admin';
    else if (pathname.startsWith('/admin/meetings')) active = 'meetings-admin';
    else if (pathname.startsWith('/admin/tasks')) active = 'tasks';
    else if (pathname.startsWith('/admin/finance')) active = 'finance-admin';
    else if (pathname.startsWith('/dashboard/projects')) active = 'projects';
    else if (pathname.startsWith('/dashboard/meetings') || pathname.startsWith('/staff/meetings')) active = 'meetings';
    else if (pathname.startsWith('/dashboard/finance')) active = 'finance';
    else if (pathname.startsWith('/dashboard/settings')) active = 'settings';
    else if (pathname === '/dashboard' || pathname === '/') active = 'overview';
  }

  // sidebar collapse state persisted in localStorage
  const [collapsed, setCollapsed] = useState(true);
  // when collapsed, this controls whether the right-side expander panel is visible
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed');
      setCollapsed(v !== '0');
    } catch (e) {}
  }, []);

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (err) {
      // fallback: redirect
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
  }

  function toggleCollapse() {
    // If currently expanded (full sidebar), collapse to icons
    if (!collapsed) {
      setCollapsed(true);
      setPanelOpen(false);
      try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
      return;
    }

    // If currently collapsed, toggle the panel (two-fold flyer behavior)
    const nextPanel = !panelOpen;
    setPanelOpen(nextPanel);
    try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
  }

  const items = (role === 'admin') ? [
    { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
    { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
    { href: '/admin/mail', key: 'mail', label: 'Mail', Icon: Mail },
    { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
    { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
    { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/admin/onboard', key: 'onboard', label: 'Onboard', Icon: Compass },
    { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
    { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ] : (role === 'staff' ? [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ] : [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
    { href: '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ]);

  return (
    <SidebarProvider open={!collapsed} onOpenChange={(open:boolean) => { setCollapsed(!open); if (!open) setPanelOpen(false); try { localStorage.setItem('sidebar_collapsed', open ? '0' : '1'); } catch (e) {} }}>
      <Shell>
        <StyledSidebar $collapsed={collapsed}>
          <CollapseToggleStyled onClick={toggleCollapse} aria-pressed={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} $rotated={panelOpen} $collapsed={collapsed}>
            <Menu />
          </CollapseToggleStyled>

          <NavStyled>
            {items.map((item:any) => (
              <NavButton key={item.key} item={item} activeKey={active} setActivePath={setActivePath} collapsed={collapsed} isExpander={false} />
            ))}
          </NavStyled>

          <SidebarFooterStyled>
            <LogoutButtonStyled onClick={handleLogout} title="Logout" $collapsed={collapsed}>
              <LogOut />
              {!collapsed && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 600 }}>Logout</span>}
            </LogoutButtonStyled>
          </SidebarFooterStyled>
        </StyledSidebar>

        {collapsed && panelOpen && (
          <ExpanderStyled>
            <div style={{ height: TOP_HEIGHT }} />
            <NavStyled>
              {items.map((item:any) => (
                <NavButton key={`exp-${item.key}`} item={item} activeKey={active} setActivePath={setActivePath} collapsed={false} isExpander={true} />
              ))}
            </NavStyled>
            <ExpanderFooterStyled>
              <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', borderRadius: '6px', textDecoration: 'none', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', cursor: 'pointer' }}>
                <LogOut style={{ width: '20px', height: '20px' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Logout</div>
              </a>
            </ExpanderFooterStyled>
          </ExpanderStyled>
        )}

        <Main>{children}</Main>
      </Shell>
    </SidebarProvider>
  );
}

const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
const NAV_GAP_SM = '12px';
const ITEM_HEIGHT = '48px';
const TOP_HEIGHT = '120px';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  color: #f1f1f1;
  min-width: 0;
`;

const NavButtonStyles = css`
    display: flex;
    align-items: center;
    text-decoration: none;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    height: ${ITEM_HEIGHT};
    min-width: 0;
    width: 100%;
    color: black;
`;

const NavButtonA = styled.a`${NavButtonStyles}`;

const StyledSidebar = styled.aside<{ $collapsed: boolean }>`
    width: ${p => p.$collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED};
    min-width: 0;
    background: #786143;
    border-right: 1px solid rgba(0,0,0,0.08);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 300ms ease;

    @media (max-width: 640px) {
        width: ${p => p.$collapsed ? '60px' : SIDEBAR_WIDTH_EXPANDED};
        padding: ${PADDING_SM};
    }
`;

const ExpanderStyled = styled.aside`
    width: ${EXPANDER_WIDTH};
    min-width: ${EXPANDER_WIDTH};
    max-width: ${EXPANDER_WIDTH};
    background: #d8c0a7;
    border-right: 1px solid rgba(0,0,0,0.06);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;

    @media (max-width: 640px) {
        padding: ${PADDING_SM};
        width: 180px; 
        min-width: 180px;
        max-width: 180px;
    }
`;

const ExpanderFooterStyled = styled.div`
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const NavStyled = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${NAV_GAP};
    min-width: 0;

    @media (max-width: 640px) {
        gap: ${NAV_GAP_SM};
    }
`;

const SidebarFooterStyled = styled.div`
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 8px;
`;

const LogoutButtonStyled = styled.button<{ $collapsed: boolean }>`
  background: transparent;
  border: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  padding: ${p => p.$collapsed ? '8px 0' : '8px 12px'};
  border-radius: 6px;
  cursor: pointer;
  color: #270101;
  transition: background 120ms ease;

  & svg { width: 28px; height: 28px; }

  &:hover { background: rgba(0,0,0,0.08); }
`;

const CollapseToggleStyled = styled.button<{ $rotated: boolean, $collapsed: boolean }>`
  background: transparent;
  border: none;
  padding: 0;
  height: ${TOP_HEIGHT};
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-end'};
  padding-right: ${p => p.$collapsed ? '0' : '16px'};

  & svg {
    display: block;
    height: 48px; 
    width: 48px;
    color: black;
    transition: transform 260ms cubic-bezier(.2,.9,.22,1);
    transform: ${p => p.$rotated ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 32px; /* p-8 */
  background: #1f2937; /* Dark Gray BG */
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 8px; background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.12); border-radius: 8px; }
`;

// --- NAV BUTTON COMPONENT ---

function NavButton({ item, activeKey, setActivePath, collapsed, isExpander } : any) {
    const isActive = activeKey === item.key;
    return (
        <NavButtonA
            href="#"
            onClick={(e:any) => { e.preventDefault(); setActivePath(item.href); }}
            style={{
                display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 700, cursor: 'pointer', borderRadius: 6,
                transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease', height: ITEM_HEIGHT, width: '100%', color: isActive ? (isExpander ? '#4b3826' : '#270101') : 'black',
                background: isActive ? (isExpander ? 'rgba(164,151,135,0.7)' : 'rgba(255,255,255,0.9)') : 'transparent',
                padding: collapsed ? 6 : (isExpander ? '0 16px' : '0 12px'), justifyContent: collapsed ? 'center' : 'flex-start'
            }}
        >
            {!isExpander && (
                <item.Icon style={{ width: collapsed ? '100%' : 24, height: collapsed ? '100%' : 24, flexShrink: 0 }} />
            )}

            {!collapsed && !isExpander && (
                <span style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 12 }}>{item.label}</span>
            )}

            {isExpander && (
                <div style={{ fontSize: 20, fontWeight: 'bold', height: '100%', display: 'flex', alignItems: 'center' }}>{item.label}</div>
            )}
        </NavButtonA>
    );
}

// --- DASHBOARD SHELL COMPONENT ---

export default function DashboardShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { data: session } = useSession();
  const role = (session && (session as any).user && (session as any).user.role) ? (session as any).user.role : null;
  const pathname = usePathname();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // derive active by pathname if active prop not provided
  if (!active && typeof pathname === 'string') {
    if (pathname === '/admin' || pathname === '/admin/') active = 'overview';
    else if (pathname.startsWith('/admin/users')) active = 'users';
    else if (pathname.startsWith('/admin/staff')) active = 'staff';
    else if (pathname.startsWith('/admin/projects')) active = 'projects-admin';
    else if (pathname.startsWith('/admin/meetings')) active = 'meetings-admin';
    else if (pathname.startsWith('/admin/tasks')) active = 'tasks';
    else if (pathname.startsWith('/admin/finance')) active = 'finance-admin';
    else if (pathname.startsWith('/dashboard/projects')) active = 'projects';
    else if (pathname.startsWith('/dashboard/meetings') || pathname.startsWith('/staff/meetings')) active = 'meetings';
    else if (pathname.startsWith('/dashboard/finance')) active = 'finance';
    else if (pathname.startsWith('/dashboard/settings')) active = 'settings';
    else if (pathname === '/dashboard' || pathname === '/') active = 'overview';
  }

  // sidebar collapse state persisted in localStorage
  const [collapsed, setCollapsed] = useState(true);
  // when collapsed, this controls whether the right-side expander panel is visible
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed');
      setCollapsed(v !== '0');
    } catch (e) {}
  }, []);

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (err) {
      // fallback: redirect
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
  }

  function toggleCollapse() {
    // If currently expanded (full sidebar), collapse to icons
    if (!collapsed) {
      setCollapsed(true);
      setPanelOpen(false);
      try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
      return;
    }

    // If currently collapsed, toggle the panel (two-fold flyer behavior)
    const nextPanel = !panelOpen;
    setPanelOpen(nextPanel);
    try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
  }

  const items = (role === 'admin') ? [
    { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
    { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
    { href: '/admin/mail', key: 'mail', label: 'Mail', Icon: Mail },
    { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
    { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
    { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/admin/onboard', key: 'onboard', label: 'Onboard', Icon: Compass },
    { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
    { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ] : (role === 'staff' ? [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
    { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ] : [
    { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
    { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
    { href: '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
    { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
    { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
    { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
  ]);

  return (
    <SidebarProvider open={!collapsed} onOpenChange={(open:boolean) => { setCollapsed(!open); if (!open) setPanelOpen(false); try { localStorage.setItem('sidebar_collapsed', open ? '0' : '1'); } catch (e) {} }}>
      <Shell>
        <StyledSidebar $collapsed={collapsed}>
          <CollapseToggleStyled onClick={toggleCollapse} aria-pressed={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} $rotated={panelOpen} $collapsed={collapsed}>
            <Menu />
          </CollapseToggleStyled>

          <NavStyled>
            {items.map((item:any) => (
              <NavButton key={item.key} item={item} activeKey={undefined} setActivePath={() => {}} collapsed={collapsed} isExpander={false} />
            ))}
          </NavStyled>

          <SidebarFooterStyled>
            <LogoutButtonStyled onClick={handleLogout} title="Logout" $collapsed={collapsed}>
              <LogOut />
              {!collapsed && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 600 }}>Logout</span>}
            </LogoutButtonStyled>
          </SidebarFooterStyled>
        </StyledSidebar>

        {collapsed && panelOpen && (
          <ExpanderStyled>
            <div style={{ height: TOP_HEIGHT }} />
            <NavStyled>
              {items.map((item:any) => (
                <NavButton key={`exp-${item.key}`} item={item} activeKey={undefined} setActivePath={() => {}} collapsed={false} isExpander={true} />
              ))}
            </NavStyled>
            <ExpanderFooterStyled>
              <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', borderRadius: '6px', textDecoration: 'none', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', cursor: 'pointer' }}>
                <LogOut style={{ width: '20px', height: '20px' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Logout</div>
              </a>
            </ExpanderFooterStyled>
          </ExpanderStyled>
        )}

        <Main>{children}</Main>
      </Shell>
    </SidebarProvider>
  );
}
"use client";
import React, { useState, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper, Menu } from 'lucide-react';

// --- STYLING CONSTANTS ---
const SIDEBAR_WIDTH_COLLAPSED = '80px';
const SIDEBAR_WIDTH_EXPANDED = '320px';
const EXPANDER_WIDTH = '256px';

const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
const NAV_GAP_SM = '12px';
const ITEM_HEIGHT = '48px';
const TOP_HEIGHT = '120px';

// --- MOCK API & CONTEXT ---

const useMockSession = (initialRole:any) => {
  const [role, setRole] = useState(initialRole);
  const data = { user: { role } };
  return { data, setRole };
};

const mockSignOut = ({ callbackUrl }:{callbackUrl?:string}) => {
  console.log(`[AUTH] Signing out. Redirecting to: ${callbackUrl}`);
  alert('Logged out (mock action). Check console for details.');
};

const useMockPathname = (activePath:string) => activePath;

const SidebarProvider = ({ children }:{children:React.ReactNode}) => <>{children}</>;

// --- NAVIGATION DATA ---

const NAV_ITEMS:any = {
    admin: [
        { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
        { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
        { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
        { href: '/admin/mail', key: 'mail', label: 'Mail', Icon: Mail },
        { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
        { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
        { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
        { href: '/admin/onboard', key: 'onboard', label: 'Onboard', Icon: Compass },
        { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
        { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
        { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
        { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
        { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
    ],
    staff: [
        { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
        { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
        { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
        { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
        { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
        { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
    ],
    user: [
        { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
        { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
        { href: '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
        { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
        { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
        { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
    ]
};

// --- STYLED COMPONENTS ---

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  color: #f1f1f1;
  min-width: 0;
`;

const NavButtonStyles = css`
    display: flex;
    align-items: center;
    text-decoration: none;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    height: ${ITEM_HEIGHT};
    min-width: 0;
    width: 100%;
    color: black;
`;

const NavButtonA = styled.a`${NavButtonStyles}`;

const StyledSidebar = styled.aside<{ $collapsed: boolean }>`
    width: ${p => p.$collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED};
    min-width: 0;
    background: #786143;
    border-right: 1px solid rgba(0,0,0,0.08);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 300ms ease;

    @media (max-width: 640px) {
        width: ${p => p.$collapsed ? '60px' : SIDEBAR_WIDTH_EXPANDED};
        padding: ${PADDING_SM};
    }
`;

const ExpanderStyled = styled.aside`
    width: ${EXPANDER_WIDTH};
    min-width: ${EXPANDER_WIDTH};
    max-width: ${EXPANDER_WIDTH};
    background: #d8c0a7;
    border-right: 1px solid rgba(0,0,0,0.06);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;

    @media (max-width: 640px) {
        padding: ${PADDING_SM};
        width: 180px; 
        min-width: 180px;
        max-width: 180px;
    }
`;

const ExpanderFooterStyled = styled.div`
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const NavStyled = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${NAV_GAP};
    min-width: 0;

    @media (max-width: 640px) {
        gap: ${NAV_GAP_SM};
    }
`;

const SidebarFooterStyled = styled.div`
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 8px;
`;

const LogoutButtonStyled = styled.button<{ $collapsed: boolean }>`
  background: transparent;
  border: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  padding: ${p => p.$collapsed ? '8px 0' : '8px 12px'};
  border-radius: 6px;
  cursor: pointer;
  color: #270101;
  transition: background 120ms ease;

  & svg { width: 28px; height: 28px; }

  &:hover { background: rgba(0,0,0,0.08); }
`;

const CollapseToggleStyled = styled.button<{ $rotated: boolean, $collapsed: boolean }>`
  background: transparent;
  border: none;
  padding: 0;
  height: ${TOP_HEIGHT};
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-end'};
  padding-right: ${p => p.$collapsed ? '0' : '16px'};

  & svg {
    display: block;
    height: 48px; 
    width: 48px;
    color: black;
    transition: transform 260ms cubic-bezier(.2,.9,.22,1);
    transform: ${p => p.$rotated ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 32px; /* p-8 */
  background: #1f2937; /* Dark Gray BG */
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 8px; background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.12); border-radius: 8px; }
`;

// --- NAV BUTTON COMPONENT ---

function NavButton({ item, activeKey, setActivePath, collapsed, isExpander } : any) {
    const isActive = activeKey === item.key;
    return (
        <NavButtonA
            href="#"
            onClick={(e:any) => { e.preventDefault(); setActivePath(item.href); }}
            style={{
                display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 700, cursor: 'pointer', borderRadius: 6,
                transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease', height: ITEM_HEIGHT, width: '100%', color: isActive ? (isExpander ? '#4b3826' : '#270101') : 'black',
                background: isActive ? (isExpander ? 'rgba(164,151,135,0.7)' : 'rgba(255,255,255,0.9)') : 'transparent',
                padding: collapsed ? 6 : (isExpander ? '0 16px' : '0 12px'), justifyContent: collapsed ? 'center' : 'flex-start'
            }}
        >
            {!isExpander && (
                <item.Icon style={{ width: collapsed ? '100%' : 24, height: collapsed ? '100%' : 24, flexShrink: 0 }} />
            )}

            {!collapsed && !isExpander && (
                <span style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 12 }}>{item.label}</span>
            )}

            {isExpander && (
                <div style={{ fontSize: 20, fontWeight: 'bold', height: '100%', display: 'flex', alignItems: 'center' }}>{item.label}</div>
            )}
        </NavButtonA>
    );
}

// --- DASHBOARD SHELL COMPONENT ---

export default function DashboardShell({ children, active: propActive, activePath, setActivePath, role, handleLogout } : any) {
    const pathname = useMockPathname(activePath || '');

    // Determine active key from path
    const [activeKey, setActiveKey] = useState(propActive || 'overview');

    useMemo(() => {
        let key = 'overview';
        if (pathname === '/admin' || pathname === '/admin/') key = 'overview';
        else if (pathname.startsWith('/admin/users')) key = 'users';
        else if (pathname.startsWith('/admin/staff')) key = 'staff';
        else if (pathname.startsWith('/admin/projects')) key = 'projects-admin';
        else if (pathname.startsWith('/admin/meetings')) key = 'meetings-admin';
        else if (pathname.startsWith('/admin/tasks')) key = 'tasks';
        else if (pathname.startsWith('/admin/finance')) key = 'finance-admin';
        else if (pathname.startsWith('/dashboard/projects')) key = 'projects';
        else if (pathname.startsWith('/dashboard/meetings') || pathname.startsWith('/staff/meetings')) key = 'meetings';
        else if (pathname.startsWith('/dashboard/finance')) key = 'finance';
        else if (pathname.startsWith('/dashboard/settings')) key = 'settings';
        else if (pathname === '/dashboard' || pathname === '/') key = 'overview';
        else if (pathname.startsWith('/staff/tasks')) key = 'tasks';

        setActiveKey(key);
    }, [pathname, propActive]);

    const [collapsed, setCollapsed] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);

    // localStorage persistence
    React.useEffect(() => {
        try {
          const v = localStorage.getItem('sidebar_collapsed');
          setCollapsed(v !== '0');
        } catch (e) {
            setCollapsed(true);
        }
    }, []);

    function toggleCollapse() {
        if (!collapsed) {
            setCollapsed(true);
            setPanelOpen(false);
            try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
        } else {
            const nextPanel = !panelOpen;
            setPanelOpen(nextPanel);
            try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
        }
    }

    const items = NAV_ITEMS[role] || NAV_ITEMS.user;

    return (
        <SidebarProvider open={!collapsed} onOpenChange={(open:boolean) => { setCollapsed(!open); if (!open) setPanelOpen(false); try { localStorage.setItem('sidebar_collapsed', open ? '0' : '1'); } catch (e) {} }}>
            <Shell>
                <StyledSidebar $collapsed={collapsed}>
                    <CollapseToggleStyled onClick={toggleCollapse} aria-pressed={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} $rotated={panelOpen} $collapsed={collapsed}>
                        <Menu />
                    </CollapseToggleStyled>

                    <NavStyled>
                        {items.map((item:any) => (
                            <NavButton key={item.key} item={item} activeKey={activeKey} setActivePath={setActivePath} collapsed={collapsed} isExpander={false} />
                        ))}
                    </NavStyled>

                    <SidebarFooterStyled>
                        <LogoutButtonStyled onClick={handleLogout} title="Logout" $collapsed={collapsed}>
                            <LogOut />
                            {!collapsed && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 600 }}>Logout</span>}
                        </LogoutButtonStyled>
                    </SidebarFooterStyled>
                </StyledSidebar>

                {collapsed && panelOpen && (
                    <ExpanderStyled>
                        <div style={{ height: TOP_HEIGHT }} />
                        <NavStyled>
                            {items.map((item:any) => (
                                <NavButton key={`exp-${item.key}`} item={item} activeKey={activeKey} setActivePath={setActivePath} collapsed={false} isExpander={true} />
                            ))}
                        </NavStyled>
                        <ExpanderFooterStyled>
                            <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', borderRadius: '6px', textDecoration: 'none', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', cursor: 'pointer' }}>
                                <LogOut style={{ width: '20px', height: '20px' }} />
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Logout</div>
                            </a>
                        </ExpanderFooterStyled>
                    </ExpanderStyled>
                )}

                <Main>{children}</Main>
            </Shell>
        </SidebarProvider>
    );
}
"use client";
import React, { useState, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper, Menu } from 'lucide-react';

// --- STYLING CONSTANTS ---
const SIDEBAR_WIDTH_COLLAPSED = '80px';
const SIDEBAR_WIDTH_EXPANDED = '320px';
const EXPANDER_WIDTH = '256px';

const PADDING = '16px';
const PADDING_SM = '10px';
const NAV_GAP = '16px';
const NAV_GAP_SM = '12px';
const ITEM_HEIGHT = '48px';
const TOP_HEIGHT = '120px';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  color: #f1f1f1;
  min-width: 0;
`;

const NavButtonStyles = css`{
    display: flex;
    align-items: center;
    text-decoration: none;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    height: ${ITEM_HEIGHT};
    min-width: 0;
    width: 100%;
    color: black;
}
`;

const NavButtonA = styled.a`${NavButtonStyles}`;

const StyledSidebar = styled.aside<{ $collapsed: boolean }>`
    width: ${p => p.$collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED};
    min-width: 0;
    background: #786143;
    border-right: 1px solid rgba(0,0,0,0.08);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 300ms ease;

    @media (max-width: 640px) {
        width: ${p => p.$collapsed ? '60px' : SIDEBAR_WIDTH_EXPANDED};
        padding: ${PADDING_SM};
    }
`;

const Expander = styled.aside`
    width: ${EXPANDER_WIDTH};
    min-width: ${EXPANDER_WIDTH};
    max-width: ${EXPANDER_WIDTH};
    background: #d8c0a7;
    border-right: 1px solid rgba(0,0,0,0.06);
    padding: ${PADDING};
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;

    @media (max-width: 640px) {
        padding: ${PADDING_SM};
        width: 180px; 
        min-width: 180px;
        max-width: 180px;
    }
`;

const ExpanderFooter = styled.div`
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

/* Brand removed per user request; toggle will use SVG icons from public/ */

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 26px;
  min-width: 0;
  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
`;

const NavButton = styled.div<{ collapsed?: boolean; $active?: boolean; $hovered?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  color: black;
  background: ${(p:any) => (p.$active || p.$hovered) ? 'rgba(242, 0, 0, 0.06)' : 'transparent'};
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
  border-radius: 6px;
  transition: background 120ms ease, color 120ms ease;
  width: 100%;
  justify-content: flex-start;
  height: var(--nav-item-size);
  box-shadow: ${(p:any) => (p.$active ? '0 6px 18px rgba(0,0,0,0.08)' : 'none')};
  min-width: 0;
  overflow: hidden;
  svg {
    color: black;
    stroke: currentColor;
    width: var(--nav-item-size);
    height: var(--nav-item-size);
    transition: transform 120ms ease;
    flex-shrink: 0;
    min-width: 0;
    max-width: 100%;
  }
  &:hover {
    background: rgba(0,0,0,0.06);
    color: black;
  }
  ${(p:any) => (p.$active || p.$hovered) ? `svg { transform: scale(1.03); }` : ''}
  @media (max-width: 600px) {
    gap: 6px;
    padding: 0 4px;
    height: 40px;
    font-size: 13px;
    svg { width: 28px; height: 28px; }
  }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #270101ff;
  transition: background 120ms ease;

  svg { width: 28px; height: 28px; }

  &:hover { background: rgba(0,0,0,0.04); }
`;

const CollapseToggle = styled.button<{ $rotated?: boolean }>`
  background: transparent;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.mid) || '#B4B4B2'};
  border: none;
  padding: 0;
  height: var(--sidebar-top-height);
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center; /* center the hamburger in closed state */

  .svgIcon {
    display: block;
    height: 144px; /* increased 50% (from 96px) to make hamburger more prominent */
    width: auto;
    max-width: 100%; /* ensure it fits the collapsed width */
    object-fit: contain;
    margin: 0 auto;
    transition: transform 260ms cubic-bezier(.2,.9,.22,1);
    transform-origin: center;
    transform: ${(p:any) => (p.$rotated ? 'rotate(90deg)' : 'rotate(0deg)')};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 28px;
  background: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.bg) || '#000000'};
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  /* Hide scrollbars on Mac for a cleaner look, but keep them usable */
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 8px; background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.12); border-radius: 8px; }
`;

export default function DashboardShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { data: session } = useSession();
  const role = (session && (session as any).user && (session as any).user.role) ? (session as any).user.role : null;
  const pathname = usePathname();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // derive active by pathname if active prop not provided
  if (!active && typeof pathname === 'string') {
    if (pathname === '/admin' || pathname === '/admin/') active = 'overview';
    else if (pathname.startsWith('/admin/users')) active = 'users';
    else if (pathname.startsWith('/admin/staff')) active = 'staff';
    else if (pathname.startsWith('/admin/projects')) active = 'projects-admin';
    else if (pathname.startsWith('/admin/meetings')) active = 'meetings-admin';
    else if (pathname.startsWith('/admin/tasks')) active = 'tasks';
    else if (pathname.startsWith('/admin/finance')) active = 'finance-admin';
    else if (pathname.startsWith('/dashboard/projects')) active = 'projects';
    else if (pathname.startsWith('/dashboard/meetings') || pathname.startsWith('/staff/meetings')) active = 'meetings';
    else if (pathname.startsWith('/dashboard/finance')) active = 'finance';
    else if (pathname.startsWith('/dashboard/settings')) active = 'settings';
    else if (pathname === '/dashboard' || pathname === '/') active = 'overview';
  }

  // sidebar collapse state persisted in localStorage
  const [collapsed, setCollapsed] = React.useState(true);
  // when collapsed, this controls whether the right-side expander panel is visible
  const [panelOpen, setPanelOpen] = React.useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed');
      setCollapsed(v !== '0');
    } catch (e) {}
  }, []);

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (err) {
      // fallback: redirect
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
  }

  function toggleCollapse() {
    // If currently expanded (full sidebar), collapse to icons
    if (!collapsed) {
      setCollapsed(true);
      setPanelOpen(false);
      try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
      return;
    }

    // If currently collapsed, toggle the panel (two-fold flyer behavior)
    const nextPanel = !panelOpen;
    setPanelOpen(nextPanel);
    try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
  }

  // role is derived from NextAuth session via `useSession`

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => {
        // provider open === expanded, so collapsed = !open
        setCollapsed(!open);
        if (!open) setPanelOpen(false);
        try {
          localStorage.setItem('sidebar_collapsed', open ? '0' : '1');
        } catch (e) {}
      }}
    >
      <Shell>
        <StyledSidebar collapsed={collapsed}>
        <CollapseToggle onClick={toggleCollapse} aria-pressed={collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} $rotated={!!panelOpen}>
          {collapsed ? (
            <img src="/hamburger.svg" alt="Open sidebar" className="svgIcon" />
          ) : (
            /* intentionally show no SVG when expanded per request */
            <div style={{ width: '100%', height: 'var(--sidebar-top-height)' }} />
          )}
        </CollapseToggle>
        <Nav>
          {/* Consolidated nav list used for both the thin sidebar icons and the expander panel */}
          {(() => {
            const items = (role === 'admin') ? [
              { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
              { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
              { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
              { href: '/admin/mail', key: 'mail', label: 'Mail', Icon: Mail },
              { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
              { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
              { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
              { href: '/admin/onboard', key: 'onboard', label: 'Onboard', Icon: Compass },
              { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
              { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
              { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
              { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
              { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ] : (
              role === 'staff' ? [
                { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
                { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
                { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
                { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
                { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
                { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ] : [
                { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
                { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
                { href: role === 'staff' ? '/staff/meetings' : '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
                { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
                { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
                { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ]
            );

            return items.map((it) => (
              <Link href={it.href} key={it.key}>
                <NavButton
                  collapsed={collapsed}
                  aria-current={active === it.key ? 'page' : undefined}
                  $active={active === it.key}
                  $hovered={hoveredKey === it.key}
                  onMouseEnter={() => setHoveredKey(it.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <it.Icon />
                </NavButton>
              </Link>
            ));
          })()}
        </Nav>
        <SidebarFooter>
          {/* logout lives at bottom of sidebar; keep same icon styling but slightly distinct */}
          <LogoutButton onClick={handleLogout} title="Logout">
            <LogOut />
          </LogoutButton>
        </SidebarFooter>
        </StyledSidebar>

      {/* Expander panel appears to the right of the thin sidebar when open */}
      {collapsed && typeof panelOpen !== 'undefined' && panelOpen ? (
        <Expander aria-hidden={!panelOpen} role="menu">
          {/* top spacer to align first label with the collapsed sidebar toggle/button */}
          <div style={{ height: 'var(--sidebar-top-height)' }} />
          {(() => {
            const items = (role === 'admin') ? [
              { href: '/admin', key: 'overview', label: 'Overview', Icon: Home },
              { href: '/admin/users', key: 'users', label: 'Users', Icon: UsersIcon },
              { href: '/admin/staff', key: 'staff', label: 'Staff', Icon: User },
              { href: '/admin/mail', key: 'mail', label: 'Mail', Icon: Mail },
              { href: '/admin/projects', key: 'projects-admin', label: 'Projects', Icon: Briefcase },
              { href: '/admin/meetings', key: 'meetings-admin', label: 'Meetings', Icon: CalendarClock },
              { href: '/admin/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
              { href: '/admin/onboard', key: 'onboard', label: 'Onboard', Icon: Compass },
              { href: '/admin/blogs', key: 'blogs', label: 'Blogs', Icon: BookOpen },
              { href: '/admin/news', key: 'news', label: 'News', Icon: Newspaper },
              { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
              { href: '/admin/finance', key: 'finance-admin', label: 'Finance', Icon: CreditCard },
              { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ] : (
              role === 'staff' ? [
                { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
                { href: '/staff/tasks', key: 'tasks', label: 'Tasks', Icon: ClipboardList },
                { href: '/staff/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
                { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
                { href: '/staff/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
                { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ] : [
                { href: '/dashboard', key: 'overview', label: 'Overview', Icon: Home },
                { href: '/dashboard/projects', key: 'projects', label: 'Projects', Icon: FileText },
                { href: role === 'staff' ? '/staff/meetings' : '/dashboard/meetings', key: 'meetings', label: 'Meetings', Icon: CalendarClock },
                { href: '/chat', key: 'chat', label: 'Chat', Icon: MessageSquare },
                { href: '/dashboard/finance', key: 'finance', label: 'Finance', Icon: CreditCard },
                { href: '/dashboard/settings', key: 'settings', label: 'Settings', Icon: Settings },
              ]
            );

            return items.map((it) => {
                const isActive = active === it.key;
                const isHovered = hoveredKey === it.key;
                const color = isActive ? '#4b3826ff' : (isHovered ? '#4b3826ff' : '#111');

                return (
                <Link href={it.href} key={`exp-${it.key}`}>
                  <NavButton
                    collapsed={false}
                    aria-current={isActive ? 'page' : undefined}
                    $active={isActive}
                    $hovered={isHovered}
                    onMouseEnter={() => setHoveredKey(it.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{ background: (isActive || isHovered) ? 'rgba(164, 151, 135, 0.7)' : undefined, color }}
                  >
         
                    <div style={{ marginLeft: 0, fontSize: 16, fontWeight: 700, lineHeight: 1, textAlign: 'left' }}>{it.label}</div>
                  </NavButton>
                </Link>
              );
            });
          })()}
              {/* footer logout button aligned to bottom */}
              <ExpanderFooter>
                <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', width: '100%', borderRadius: 6, textDecoration: 'none', color: '#b91c1c', background: 'rgba(185,28,28,0.04)', cursor: 'pointer' }}>
                  <LogOut />
                  <div style={{ fontSize: 20, fontWeight: 700 }}>Logout</div>
                </a>
              </ExpanderFooter>
        </Expander>
      ) : null}

      <Main>{children}</Main>
      </Shell>
    </SidebarProvider>
  );
}
