"use client";
import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarProvider } from '../ui/sidebar';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper } from 'lucide-react';

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

  & img {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: contain;
    transition: transform 320ms cubic-bezier(.2,.9,.22,1);
    transform-origin: center;
    transform: ${p => p.$rotated ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 16px; /* minimal padding for mobile */
  background: #051020; /* Dark Gray BG */
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 8px; background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.12); border-radius: 8px; }

  @media (min-width: 768px) { /* md breakpoint and up */
    padding: 32px;
  }
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  padding-left: 8px;
  padding-right: 8px;
  @media (max-width: 640px) {
    padding-left: 0;
    padding-right: 0;
    max-width: 100%;
  }
`;

function NavButton({ item, activeKey, setActivePath, collapsed, isExpander } : any) {
  const isActive = activeKey === item.key;
  return (
    <NavButtonA
      href="#"
      onClick={(e:any) => { e.preventDefault(); setActivePath(item.href); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        fontWeight: 700,
        cursor: 'pointer',
        borderRadius: 6,
        transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease',
        height: ITEM_HEIGHT,
        width: '100%',
        color: isActive ? (isExpander ? '#4b3826' : '#270101') : 'black',
        background: isActive ? (isExpander ? 'rgba(164,151,135,0.7)' : 'rgba(255,255,255,0.9)') : 'transparent',
        padding: collapsed ? 6 : (isExpander ? '0 16px' : '0 12px'),
        justifyContent: collapsed ? 'center' : 'flex-start',
        minWidth: 0,
        gap: 12,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {!isExpander && (
        <item.Icon style={{ width: collapsed ? '100%' : 28, height: collapsed ? '100%' : 28, flexShrink: 0 }} />
      )}

      {!collapsed && !isExpander && (
        <span style={{
          fontSize: 'clamp(15px, 2.2vw, 20px)',
          fontWeight: 'bold',
          marginLeft: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100% - 72px)'
        }}>{item.label}</span>
      )}

      {isExpander && (
        <div style={{
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 'bold',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{item.label}</div>
      )}
    </NavButtonA>
  );
}

export default function DashboardShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { data: session } = useSession();
  const role = (session && (session as any).user && (session as any).user.role) ? (session as any).user.role : null;
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | undefined>(active);

  useEffect(() => {
    if (!activeKey && typeof pathname === 'string') {
      if (pathname === '/admin' || pathname === '/admin/') setActiveKey('overview');
      else if (pathname.startsWith('/admin/users')) setActiveKey('users');
      else if (pathname.startsWith('/admin/staff')) setActiveKey('staff');
      else if (pathname.startsWith('/admin/projects')) setActiveKey('projects-admin');
      else if (pathname.startsWith('/admin/meetings')) setActiveKey('meetings-admin');
      else if (pathname.startsWith('/admin/tasks')) setActiveKey('tasks');
      else if (pathname.startsWith('/admin/finance')) setActiveKey('finance-admin');
      else if (pathname.startsWith('/dashboard/projects')) setActiveKey('projects');
      else if (pathname.startsWith('/dashboard/meetings') || pathname.startsWith('/staff/meetings')) setActiveKey('meetings');
      else if (pathname.startsWith('/dashboard/finance')) setActiveKey('finance');
      else if (pathname.startsWith('/dashboard/settings')) setActiveKey('settings');
      else if (pathname === '/dashboard' || pathname === '/') setActiveKey('overview');
    }
  }, [pathname, activeKey]);

  function navigate(href?: string, key?: string) {
    if (!href) return;
    router.push(href);
    if (key) setActiveKey(key);
  }

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

  const [collapsed, setCollapsed] = useState(true);
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
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
  }

  function toggleCollapse() {
    if (!collapsed) {
      setCollapsed(true);
      setPanelOpen(false);
      try { localStorage.setItem('sidebar_collapsed', '1'); } catch (e) {}
      return;
    }

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
            <img src="/hamburger.svg" alt={collapsed ? 'Open sidebar' : 'Collapse sidebar'} />
          </CollapseToggleStyled>

          <NavStyled>
            {items.map((item:any) => (
              <NavButton key={item.key} item={item} activeKey={activeKey} setActivePath={(href:string) => navigate(href, item.key)} collapsed={collapsed} isExpander={false} />
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
                <NavButton key={`exp-${item.key}`} item={item} activeKey={activeKey} setActivePath={(href:string) => { navigate(href, item.key); setPanelOpen(false); }} collapsed={false} isExpander={true} />
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

        <Main>
          <ContentWrap>{children}</ContentWrap>
        </Main>
      </Shell>
    </SidebarProvider>
  );
}
