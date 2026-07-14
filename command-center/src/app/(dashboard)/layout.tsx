"use client"

import { usePathname } from "next/navigation"
import { useRUM } from "@/lib/rum"
import { trackPageView } from "@/lib/product-analytics"
import { useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stress-simulator": "Sala de Guerra",
  "/margins": "Márgenes",
  "/data-hub": "Data Hub",
  "/agents": "Agentes IA",
  "/valuation": "Valuación M&A",
  "/security": "Seguridad",
  "/operations": "Operaciones",
  "/rag": "RAG Playground",
  "/knowledge-graph": "Knowledge Graph",
  "/economic-hub": "Economic Hub",
  "/platform": "Plataforma",
  "/ecosystem": "Ecosistema",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageName = PAGE_NAMES[pathname] || pathname
  const tracked = useRef<string | null>(null)

  useRUM(pageName)

  useEffect(() => {
    if (tracked.current !== pathname) {
      trackPageView(pathname, pageName)
      tracked.current = pathname
    }
  }, [pathname, pageName])

  return (
    <div className="flex h-screen">
      <div data-sidebar>
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col">
        <div data-header>
          <Header />
        </div>
        <main
          data-main
          className="flex-1 overflow-y-auto bg-surface-900 p-6"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
