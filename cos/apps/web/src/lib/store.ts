"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AppUser {
  id: string
  email: string
  name: string
  role: "consultor" | "director" | "cliente"
  avatar?: string
}

export interface AppState {
  // Session
  user: AppUser | null
  tenantId: string
  setUser: (user: AppUser | null) => void
  setTenantId: (id: string) => void

  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void

  // Theme
  theme: "dark" | "light"
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      tenantId: "default",
      setUser: (user) => set({ user }),
      setTenantId: (tenantId) => set({ tenantId }),

      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      theme: "dark",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "cos-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        tenantId: state.tenantId,
      }),
    },
  ),
)
