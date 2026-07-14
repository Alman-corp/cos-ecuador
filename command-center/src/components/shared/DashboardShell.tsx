"use client"

import { Suspense } from "react"
import { DashboardProvider } from "@/lib/dashboard-context"
import { FilterBar } from "@/components/shared/FilterBar"
import type { ReactNode } from "react"

function FilterBarWrapper() {
  return (
    <Suspense fallback={null}>
      <FilterBar />
    </Suspense>
  )
}

function DashboardShellInner({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardProvider>
        <div className="space-y-4">
          <FilterBarWrapper />
          {children}
        </div>
      </DashboardProvider>
    </Suspense>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return <DashboardShellInner>{children}</DashboardShellInner>
}
