"use client";
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import Link from 'next/link';
import { Home, FileText, CalendarClock, Users as UsersIcon, CreditCard, Settings, Briefcase, User, ClipboardList, LogOut, MessageSquare, Mail, Compass, BookOpen, Newspaper } from 'lucide-react';

const Shell = styled.div`
  display: flex;
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  --sidebar-top-height: 120px;
  --nav-item-size: 60px; /* controls icon size, label size and row height so they match */
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  min-width: 0;
  overflow: hidden;
`;

const Sidebar = styled.aside<{ collapsed?: boolean }>`
  --sidebar-collapsed: ${(p:any) => (p.collapsed ? 1 : 0)};
  flex-shrink: 0;
  width: 88px;
  background: #786143ff;
  border-right: 1px solid rgba(0,0,0,0.08);
  padding: 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Expander = styled.aside`
  flex-shrink: 0;
  width: clamp(240px, 30vw, 320px);
  background: #d8c0a7ff;
  border-right: 1px solid rgba(0,0,0,0.06);
  padding: 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
`;

const ExpanderFooter = styled.div`
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const ExpanderLabel = styled.div`
  margin-left: 0;
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 900;
  line-height: 1;
  text-align: left;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* Brand removed per user request; toggle will use SVG icons from public/ */

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 26px;
  min-width: 0;

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
  // Get role from JWT in localStorage
  let role: string | null = null;
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = payload.role || null;
      } catch {}
    }
  }
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
    window.localStorage.removeItem('jwt');
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
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

  // role is derived from JWT in localStorage

  return (
    <Shell>
      <Sidebar collapsed={collapsed}>
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
      </Sidebar>

      {/* Expander panel appears to the right of the thin sidebar when open */}
      {collapsed && typeof panelOpen !== 'undefined' && panelOpen ? (
        <Expander aria-hidden={!panelOpen} role="menu">
          {/* top spacer to align first label with the collapsed sidebar toggle/button */}
          <div style={{ height: 'var(--sidebar-top-height)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
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
                  const background = isActive || isHovered ? 'rgba(164, 151, 135, 0.7)' : 'transparent';

                  return (
                  <Link href={it.href} key={`exp-${it.key}`}>
                    <div
                      onMouseEnter={() => setHoveredKey(it.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', padding: '0 12px', borderRadius: 6, textDecoration: 'none', color, background, height: 'var(--nav-item-size)' }}
                    >
                      {/* left-align label flush with the expander panel's left edge */}
                      <ExpanderLabel>{it.label}</ExpanderLabel>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
              {/* footer logout button aligned to bottom */}
              <ExpanderFooter>
                <a onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', width: '100%', borderRadius: 6, textDecoration: 'none', color: '#b91c1c', background: 'rgba(185,28,28,0.04)', cursor: 'pointer' }}>
                  <LogOut />
                  <div style={{ fontSize: 20, fontWeight: 700 }}>Logout</div>
                </a>
              </ExpanderFooter>
        </Expander>
      ) : null}

      <Main><div className="page-container">{children}</div></Main>
    </Shell>
  );
}
