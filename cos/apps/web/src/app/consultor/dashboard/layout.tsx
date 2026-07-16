import type { ReactNode } from "react"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-surface-900 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
