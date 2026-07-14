"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SessionState {
  accessToken: string | null
  refreshToken: string | null
  lastActivity: number | null
  setSession: (accessToken: string, refreshToken: string) => void
  updateActivity: () => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      lastActivity: null,
      setSession: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, lastActivity: Date.now() }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, lastActivity: null }),
    }),
    { name: "command-center-session" }
  )
)
