"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

type SidebarContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  isMobile?: boolean;
  toggle?: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export function SidebarProvider({ children, defaultOpen = true, open: openProp, onOpenChange }: any) {
  const [_open, _setOpen] = useState<boolean>(defaultOpen);
  const open = typeof openProp === 'boolean' ? openProp : _open;
  const setOpen = useCallback((v: any) => {
    const next = typeof v === 'function' ? v(open) : Boolean(v);
    if (typeof onOpenChange === 'function') onOpenChange(next);
    else _setOpen(next);
  }, [open, onOpenChange]);

  const toggle = useCallback(() => setOpen((o: boolean) => !o), [setOpen]);

  const value = useMemo(() => ({ open, setOpen, toggle, isMobile: false }), [open, setOpen, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function Sidebar(props: React.ComponentProps<'div'>) {
  return <div {...props} />;
}

export function SidebarContent(props: React.ComponentProps<'div'>) {
  return <div {...props} />;
}

export function SidebarFooter(props: React.ComponentProps<'div'>) {
  return <div {...props} />;
}

export function SidebarTrigger(props: any) {
  const { toggle } = useSidebar();
  return <button {...props} onClick={(e) => { props.onClick?.(e); toggle?.(); }} />;
}

export function SidebarRail(props: any) {
  return <div {...props} />;
}

export default Sidebar;
