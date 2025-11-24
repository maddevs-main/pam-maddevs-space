"use client";
import React from 'react';

export type SidebarContextType = {
  collapsed: boolean;
  panelOpen: boolean;
  mobileOpen: boolean;
  toggleCollapse: () => void;
  setCollapsed: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(true);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed');
      setCollapsed(v !== '0');
    } catch (e) {}
  }, []);

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

  return (
    <SidebarContext.Provider value={{ collapsed, panelOpen, mobileOpen, toggleCollapse, setCollapsed, setPanelOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export default SidebarContext;
