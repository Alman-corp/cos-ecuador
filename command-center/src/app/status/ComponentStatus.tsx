"use client"

import { useState, useEffect } from "react"

interface SystemComponent {
  name: string
  status: "operational" | "degraded" | "down" | "maintenance"
  uptime: number
  description: string
}

const components: SystemComponent[] = [
  { name: "API", status: "operational", uptime: 99.97, description: "REST API endpoints" },
  { name: "Dashboard", status: "operational", uptime: 99.95, description: "Web application" },
  { name: "Authentication", status: "operational", uptime: 99.99, description: "SSO & auth providers" },
  { name: "Database", status: "operational", uptime: 99.98, description: "Supabase PostgreSQL" },
  { name: "AI Agents", status: "operational", uptime: 99.9, description: "LLM inference pipeline" },
  { name: "3D Rendering", status: "operational", uptime: 99.8, description: "Three.js WebGL renderer" },
  { name: "PDF Export", status: "operational", uptime: 99.7, description: "Report generation service" },
  { name: "Storage", status: "operational", uptime: 99.99, description: "File & document storage" },
]

const statusColors: Record<string, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  maintenance: "bg-blue-500",
}

const statusLabels: Record<string, string> = {
  operational: "Operational",
  degraded: "Degraded Performance",
  down: "Major Outage",
  maintenance: "Under Maintenance",
}

interface Incident {
  date: string
  title: string
  status: "resolved" | "monitoring" | "investigating"
  description: string
}

export function ComponentStatus() {
  const [checkedEndpoints, setCheckedEndpoints] = useState<Record<string, "pass" | "fail">>({})

  useEffect(() => {
    const checkAll = async () => {
      const results: Record<string, "pass" | "fail"> = {}
      const endpoints = ["/api/health", "/api/live", "/api/ready"]
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep)
          results[ep] = res.ok ? "pass" : "fail"
        } catch {
          results[ep] = "fail"
        }
      }
      setCheckedEndpoints(results)
    }
    checkAll()
  }, [])

  return (
    <div>
      <div className="mb-8 space-y-3">
        {components.map((comp) => (
          <div key={comp.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${statusColors[comp.status]}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{comp.name}</p>
                <p className="text-xs text-gray-500">{comp.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-gray-700">{statusLabels[comp.status]}</span>
              <p className="text-xs text-gray-400">{comp.uptime}% uptime</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Endpoint Checks</h2>
        <div className="flex gap-3">
          {Object.entries(checkedEndpoints).map(([ep, status]) => (
            <div key={ep} className={`rounded-lg px-3 py-2 text-xs font-medium ${
              status === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              <span className="font-mono">{ep}</span>: {status === "pass" ? "✓ Pass" : "✗ Fail"}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Incident History</h2>
        <div className="space-y-3">
          {[
            { date: "2026-07-08", title: "AI Agent Latency Spike", status: "resolved" as const, description: "LLM inference pipeline experienced 2s+ latency due to high concurrency. Scaled up worker pool." },
            { date: "2026-07-05", title: "Dashboard API Degradation", status: "resolved" as const, description: "Increased error rates on /api/health endpoint. Root cause: rate limiter configuration. Fixed." },
            { date: "2026-07-01", title: "Scheduled Maintenance: Database Migration", status: "resolved" as const, description: "Planned 10min downtime for schema migration. All services returned to normal." },
          ].map((incident, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{incident.status}</span>
                  <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                </div>
                <span className="text-xs text-gray-400">{incident.date}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{incident.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
