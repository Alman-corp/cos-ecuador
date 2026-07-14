"use client"

import { create } from "zustand"

interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: false,
  mobileOpen: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  collapse: () => set({ collapsed: true }),
  expand: () => set({ collapsed: false }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}))
