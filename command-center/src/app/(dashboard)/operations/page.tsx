"use client"

import { useState, useEffect, useCallback } from "react"
import { getAllSpans, getRecentMetrics, getRecentLogs, startTrace, startSpan, endSpan, addSpanEvent, recordMetric, log, exportOtelJson, type Span, type Metric, type LogEntry } from "@/lib/otel"
import { getWebVitals, trackVital, type WebVitalMetric } from "@/lib/rum"
import { createCheck, listChecks, runCheck, getResults, getAllResults, deleteCheck, type SyntheticCheck, type CheckResult } from "@/lib/synthetics"
import { createSlo, getSloList, recordSloEvent, getErrorBudgetStatus, canShip, type Slo } from "@/lib/slos"
import { calculateFeatureCosts, getTotalMonthlyCost, getCostByCategory, type CostEntry } from "@/lib/cost-monitoring"
import { trackEvent, trackPageView, getEvents, getPageViews, getActiveUsers, getTopPages, type AnalyticsEvent, type PageView } from "@/lib/product-analytics"
import { getAssignment, trackConversion, getAbTests, getConversionRate, createAbTest, type AbTest } from "@/lib/ab-testing"
import { isEnabled, createFlag, listFlags, updateFlag, type FeatureFlag } from "@/lib/feature-flags"
import { createRunbook, listRunbooks, executeRunbook, type Runbook, type RunbookStep } from "@/lib/runbooks"

type Tab = "otel" | "rum" | "synthetics" | "slos" | "cost" | "analytics" | "ab" | "flags" | "runbooks"

export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>("otel")

  const tabs: { id: Tab; label: string }[] = [
    { id: "otel", label: "OpenTelemetry" },
    { id: "rum", label: "RUM (Web Vitals)" },
    { id: "synthetics", label: "Synthetic Monitoring" },
    { id: "slos", label: "SLOs & Error Budgets" },
    { id: "cost", label: "Cost Monitoring" },
    { id: "analytics", label: "Product Analytics" },
    { id: "ab", label: "A/B Testing" },
    { id: "flags", label: "Feature Flags" },
    { id: "runbooks", label: "Runbooks" },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Operaciones</h1>
        <p className="mt-1 text-sm text-surface-400">
          Observabilidad · Monitoreo · Experimentación · Automatización
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === "otel" && <OtelTab />}
      {tab === "rum" && <RumTab />}
      {tab === "synthetics" && <SyntheticsTab />}
      {tab === "slos" && <SloTab />}
      {tab === "cost" && <CostTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "ab" && <AbTab />}
      {tab === "flags" && <FlagsTab />}
      {tab === "runbooks" && <RunbooksTab />}
    </div>
  )
}

function OtelTab() {
  const [spans, setSpans] = useState<Span[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])

  const runDemo = useCallback(() => {
    const traceId = startTrace("demo-transaction")
    startSpan("api-request", { method: "GET", path: "/api/health" })
    recordMetric("http_requests", 1, "count", { method: "GET", status: "200" })
    log("info", "Health check passed", { traceId })
    addSpanEvent("cache-check")
    endSpan("ok")
    startSpan("db-query", { query: "SELECT * FROM financial_reports" })
    recordMetric("db_queries", 1, "count", { table: "financial_reports" })
    log("debug", "Query executed", { rows: "42" })
    addSpanEvent("result-cached")
    endSpan("ok")
    setSpans(getAllSpans())
    setMetrics(getRecentMetrics())
    setLogs(getRecentLogs())
  }, [])

  useEffect(() => {
    setSpans(getAllSpans())
    setMetrics(getRecentMetrics())
    setLogs(getRecentLogs())
  }, [])

  const handleExport = () => {
    const json = exportOtelJson()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "otel-export.json"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={runDemo} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500">
          ▶ Simular transacción
        </button>
        <button onClick={handleExport} className="rounded-lg bg-surface-800 px-4 py-2 text-sm text-surface-400 hover:bg-surface-700">
          Exportar JSON
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs font-medium text-surface-400">Spans</p>
          <p className="text-2xl font-bold text-surface-50">{spans.length}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs font-medium text-surface-400">Metrics</p>
          <p className="text-2xl font-bold text-surface-50">{metrics.length}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs font-medium text-surface-400">Logs</p>
          <p className="text-2xl font-bold text-surface-50">{logs.length}</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-medium text-surface-200">Recent Spans</h3>
        <div className="space-y-2">
          {spans.slice(-5).reverse().map((s) => (
            <div key={s.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-surface-200">{s.operation}</span>
                <span className={`text-xs ${s.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                  {s.duration?.toFixed(1)}ms
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-xs text-surface-500">
                <span>trace: {s.traceId.slice(0, 8)}</span>
                <span>events: {s.events.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-medium text-surface-200">Recent Logs</h3>
        <div className="space-y-1">
          {logs.slice(0, 5).map((l) => (
            <div key={l.id} className="flex gap-2 font-mono text-xs">
              <span className={`${l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : l.level === "info" ? "text-blue-400" : "text-surface-500"}`}>
                [{l.level.toUpperCase()}]
              </span>
              <span className="text-surface-300">{l.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RumTab() {
  const [vitals, setVitals] = useState<WebVitalMetric[]>([])
  const [features, setFeatures] = useState<string[]>([
    "Dashboard", "Sala de Guerra", "Márgenes", "Valuación", "Agentes IA", "Data Hub"
  ])

  useEffect(() => { setVitals(getWebVitals()) }, [])

  const simulateVital = () => {
    trackVital("LCP", Math.floor(Math.random() * 3000 + 500))
    trackVital("FID", Math.floor(Math.random() * 200 + 20))
    trackVital("CLS", Math.random() * 0.3)
    trackVital("TTFB", Math.floor(Math.random() * 1500 + 100))
    setVitals(getWebVitals())
  }

  return (
    <div>
      <button onClick={simulateVital} className="mb-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500">
        ▶ Simular Web Vitals
      </button>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["LCP", "FID", "CLS", "TTFB"].map((name) => {
          const vital = vitals.filter((v) => v.name === name).pop()
          return (
            <div key={name} className={`rounded-xl border p-4 ${
              vital?.rating === "good" ? "border-emerald-600/30 bg-emerald-600/5" :
              vital?.rating === "needs-improvement" ? "border-amber-600/30 bg-amber-600/5" :
              "border-surface-700/50 bg-surface-900"
            }`}>
              <p className="text-xs font-medium text-surface-400">{name}</p>
              <p className="mt-1 text-2xl font-bold text-surface-50">
                {vital ? (name === "CLS" ? vital.value.toFixed(2) : `${Math.round(vital.value)}ms`) : "—"}
              </p>
              <p className={`mt-1 text-xs ${
                vital?.rating === "good" ? "text-emerald-400" :
                vital?.rating === "needs-improvement" ? "text-amber-400" :
                vital?.rating === "poor" ? "text-red-400" : "text-surface-500"
              }`}>
                {vital?.rating === "good" ? "✓ Bueno" : vital?.rating === "needs-improvement" ? "⚠ Mejorable" : vital?.rating === "poor" ? "✗ Pobre" : "Sin datos"}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium text-surface-200">Feature Usage (simulado)</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {features.map((f) => (
            <div key={f} className="rounded-lg border border-surface-700/50 bg-surface-900 p-3">
              <p className="text-xs text-surface-300">{f}</p>
              <div className="mt-1 h-2 rounded-full bg-surface-700">
                <div className="h-full rounded-full bg-accent-600" style={{ width: `${Math.random() * 60 + 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SyntheticsTab() {
  const [checks, setChecks] = useState<SyntheticCheck[]>([])
  const [results, setResults] = useState<CheckResult[]>([])
  const [newName, setNewName] = useState("")
  const [newEndpoint, setNewEndpoint] = useState("")
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => { setChecks(listChecks()); setResults(getAllResults()) }, [])

  const handleCreate = () => {
    createCheck(newName, newEndpoint)
    setNewName(""); setNewEndpoint("")
    setChecks(listChecks())
  }

  const handleRun = async (id: string) => {
    setRunning(id)
    const check = checks.find((c) => c.id === id)
    if (check) await runCheck(check)
    setChecks(listChecks())
    setResults(getAllResults())
    setRunning(null)
  }

  const handleDelete = (id: string) => {
    deleteCheck(id)
    setChecks(listChecks())
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del check" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <input value={newEndpoint} onChange={(e) => setNewEndpoint(e.target.value)} placeholder="/api/health" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <button onClick={handleCreate} disabled={!newName || !newEndpoint} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
            + Crear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-surface-700/50 bg-surface-950 p-3">
            <div>
              <p className="text-sm font-medium text-surface-200">{c.name}</p>
              <p className="font-mono text-xs text-surface-500">{c.endpoint} · cada {c.interval / 60000}min</p>
            </div>
            <div className="flex items-center gap-3">
              {c.lastStatus && (
                <span className={`rounded px-2 py-0.5 text-xs ${
                  c.lastStatus === "pass" ? "bg-emerald-600/10 text-emerald-400" : "bg-red-600/10 text-red-400"
                }`}>{c.lastStatus === "pass" ? "✓" : "✗"} {c.lastDuration?.toFixed(0)}ms</span>
              )}
              <button onClick={() => handleRun(c.id)} disabled={running === c.id} className="rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700 disabled:opacity-50">
                {running === c.id ? "..." : "▶"}
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">✕</button>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-surface-200">Recent Results</h3>
          <div className="space-y-1">
            {results.slice(-10).reverse().map((r, i) => (
              <div key={i} className="flex items-center gap-3 font-mono text-xs text-surface-400">
                <span className={r.status === "pass" ? "text-emerald-400" : "text-red-400"}>
                  {r.status === "pass" ? "✓" : "✗"}
                </span>
                <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                <span>{r.duration.toFixed(0)}ms</span>
                {r.statusCode && <span>HTTP {r.statusCode}</span>}
                {r.error && <span className="text-red-400">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SloTab() {
  const [slos, setSlos] = useState<Slo[]>([])
  const [newName, setNewName] = useState("")
  const [newTarget, setNewTarget] = useState("99.9")
  const status = getErrorBudgetStatus()
  const shipOk = canShip()

  useEffect(() => { setSlos(getSloList()) }, [])

  const handleCreate = () => {
    createSlo(newName, parseFloat(newTarget))
    setNewName("")
    setSlos(getSloList())
  }

  const handleSimulate = (id: string) => {
    recordSloEvent(id, Math.random() > 0.05)
    setSlos(getSloList())
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
          <p className="text-xs text-surface-400">Healthy</p>
          <p className="text-2xl font-bold text-emerald-400">{status.healthy}</p>
        </div>
        <div className="rounded-xl border border-amber-600/30 bg-amber-600/5 p-4">
          <p className="text-xs text-surface-400">Warning</p>
          <p className="text-2xl font-bold text-amber-400">{status.warning}</p>
        </div>
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-4">
          <p className="text-xs text-surface-400">Exhausted</p>
          <p className="text-2xl font-bold text-red-400">{status.exhausted}</p>
        </div>
      </div>

      <div className={`mb-4 rounded-xl border p-4 ${shipOk ? "border-emerald-600/30 bg-emerald-600/5" : "border-red-600/30 bg-red-600/5"}`}>
        <p className={`text-sm font-medium ${shipOk ? "text-emerald-400" : "text-red-400"}`}>
          {shipOk ? "✓ Error budget OK — se puede hacer ship" : "✗ Error budget agotado — no se puede shippear"}
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="SLO name" className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="99.9" className="w-24 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <button onClick={handleCreate} disabled={!newName} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
          + Crear SLO
        </button>
      </div>

      <div className="space-y-2">
        {slos.map((s) => (
          <div key={s.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-200">{s.name}</p>
                <p className="text-xs text-surface-500">Target: {s.target}% · Budget: {(100 - s.budgetBurned).toFixed(1)}% remaining</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-24 rounded-full bg-surface-700`}>
                  <div className={`h-full rounded-full ${
                    s.exhausted ? "bg-red-500" : s.budgetBurned > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`} style={{ width: `${Math.min(100, s.budgetBurned)}%` }} />
                </div>
                <button onClick={() => handleSimulate(s.id)} className="rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700">
                  Simular
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-surface-500">{s.goodEvents}/{s.totalEvents} eventos exitosos</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CostTab() {
  const [costs, setCosts] = useState<CostEntry[]>([])
  const [total, setTotal] = useState(0)
  const [byCategory, setByCategory] = useState<Record<string, number>>({})

  const handleCalculate = () => {
    const c = calculateFeatureCosts()
    setCosts(c)
    setTotal(getTotalMonthlyCost())
    setByCategory(getCostByCategory())
  }

  return (
    <div>
      <button onClick={handleCalculate} className="mb-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500">
        Calcular costos ({costs.length > 0 ? "recalcular" : "calcular"})
      </button>

      {total > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
            <p className="text-xs text-surface-400">Costo mensual total</p>
            <p className="text-2xl font-bold text-surface-50">${total.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
            <p className="text-xs text-surface-400">Por categoría</p>
            <div className="mt-1 space-y-1">
              {Object.entries(byCategory).map(([cat, val]) => (
                <div key={cat} className="flex justify-between text-xs text-surface-300">
                  <span className="capitalize">{cat}</span>
                  <span>${val.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {costs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-surface-700/50">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-900 text-surface-400">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Feature</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Cost/User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {costs.map((c, i) => (
                <tr key={i} className="text-xs text-surface-300">
                  <td className="px-4 py-2 font-medium text-surface-200 capitalize">{c.feature}</td>
                  <td className="px-4 py-2"><span className="rounded bg-surface-700 px-1.5 py-0.5 text-xs">{c.category}</span></td>
                  <td className="px-4 py-2">${c.costPerUser.toFixed(4)}</td>
                  <td className="px-4 py-2">${c.totalCost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AnalyticsTab() {
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [activeUsers, setActiveUsers] = useState(0)
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>([])

  const simulate = () => {
    trackPageView("/dashboard", "Dashboard")
    trackPageView("/margins", "Márgenes")
    trackPageView("/agents", "Agentes IA")
    trackEvent("button_click", { button: "export_pdf", page: "dashboard" })
    trackEvent("search", { query: "EBITDA", results: "3" })
    setPageViews(getPageViews())
    setEvents(getEvents())
    setActiveUsers(getActiveUsers())
    setTopPages(getTopPages())
  }

  useEffect(() => {
    setPageViews(getPageViews())
    setEvents(getEvents())
    setActiveUsers(getActiveUsers())
    setTopPages(getTopPages())
  }, [])

  return (
    <div>
      <button onClick={simulate} className="mb-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500">
        ▶ Simular actividad
      </button>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Usuarios activos (5min)</p>
          <p className="text-2xl font-bold text-surface-50">{activeUsers}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Page views</p>
          <p className="text-2xl font-bold text-surface-50">{pageViews.length}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Eventos</p>
          <p className="text-2xl font-bold text-surface-50">{events.length}</p>
        </div>
      </div>

      {topPages.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-surface-200">Top Pages</h3>
          <div className="space-y-1">
            {topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2 text-xs">
                <span className="text-surface-300">{p.path}</span>
                <span className="text-surface-500">{p.views} visits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-surface-200">Recent Events</h3>
          <div className="space-y-1">
            {events.slice(-5).reverse().map((e) => (
              <div key={e.id} className="rounded-lg bg-surface-950 px-3 py-2 text-xs text-surface-400">
                <span className="text-surface-200">{e.name}</span>
                <span className="ml-2 text-surface-500">
                  {Object.entries(e.properties).map(([k, v]) => `${k}=${v}`).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AbTab() {
  const [tests, setTests] = useState<AbTest[]>([])
  const [newName, setNewName] = useState("")
  const [newVariants, setNewVariants] = useState("control, variant_a")

  useEffect(() => { setTests(getAbTests()) }, [])

  const handleCreate = () => {
    const variants = newVariants.split(",").map((v) => v.trim())
    createAbTest(newName, variants)
    setNewName(""); setTests(getAbTests())
  }

  const handleAssign = (testId: string) => {
    const variant = getAssignment(testId)
    if (variant) alert(`Asignado a: ${variant}`)
    else alert("No asignado (fuera del % de tráfico)")
    setTests(getAbTests())
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del test" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <input value={newVariants} onChange={(e) => setNewVariants(e.target.value)} placeholder="control, variant_a" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <button onClick={handleCreate} disabled={!newName} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
            + Crear
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tests.map((t) => {
          const rates = getConversionRate(t.id)
          return (
            <div key={t.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-surface-200">{t.name}</p>
                <button onClick={() => handleAssign(t.id)} className="rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700">
                  Asignar
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {t.variants.map((v) => (
                  <div key={v} className="rounded-lg bg-surface-900 p-2 text-center">
                    <p className="text-xs font-medium text-surface-300">{v}</p>
                    <p className="text-lg font-bold text-surface-50">{t.results[v]?.impressions || 0}</p>
                    <p className="text-xs text-surface-500">impresiones · {rates[v] || 0}% conv</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FlagsTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])

  useEffect(() => {
    createFlag("new-dashboard", "Nuevo diseño de dashboard (rollout gradual)")
    createFlag("ai-agent-v2", "Versión 2 de agentes IA con RAG")
    createFlag("3d-charts", "Gráficos 3D interactivos")
    createFlag("dark-mode", "Modo oscuro")
    setFlags(listFlags())
  }, [])

  const handleToggle = (key: string) => {
    const flag = flags.find((f) => f.key === key)
    if (!flag) return
    updateFlag(key, { enabled: !flag.enabled })
    setFlags(listFlags())
  }

  const handleRollout = (key: string, pct: number) => {
    updateFlag(key, { rolloutPercentage: pct })
    setFlags(listFlags())
  }

  return (
    <div>
      <div className="space-y-3">
        {flags.map((f) => (
          <div key={f.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-200">{f.key}</p>
                <p className="text-xs text-surface-500">{f.description}</p>
              </div>
              <button
                onClick={() => handleToggle(f.key)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  f.enabled ? "bg-emerald-600/10 text-emerald-400" : "bg-surface-800 text-surface-500"
                }`}
              >
                {f.enabled ? "ON" : "OFF"}
              </button>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>Rollout: {f.rolloutPercentage}%</span>
              </div>
              <input type="range" min="0" max="100" value={f.rolloutPercentage}
                onChange={(e) => handleRollout(f.key, parseInt(e.target.value))}
                className="mt-1 w-full" />
              <div className="mt-1 flex justify-between text-xs text-surface-600">
                <span>isEnabled("{f.key}"): <span className={isEnabled(f.key) ? "text-emerald-400" : "text-red-400"}>{String(isEnabled(f.key))}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunbooksTab() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => {
    // Seed runbooks
    createRunbook("Recuperar Dashboard", "Reiniciar servicios si el dashboard no responde", "synthetic_failure", [
      { action: "restart_service", label: "Reiniciar servicio web", target: "dashboard" },
      { action: "clear_cache", label: "Limpiar caché de API", target: "api-cache" },
      { action: "notify_slack", label: "Notificar a Slack", target: "#incidents" },
    ])
    createRunbook("Scaling Event", "Escalar servicios ante alta demanda", "high_latency", [
      { action: "scale_up", label: "Escalar pods de API", target: "api-deployment" },
      { action: "scale_up", label: "Escalar workers de IA", target: "ai-worker-pool" },
      { action: "notify_slack", label: "Notificar a Slack", target: "#ops" },
    ])
    createRunbook("Rollback", "Revertir deployment problemático", "service_down", [
      { action: "rollback", label: "Rollback a versión anterior", target: "web-deployment" },
      { action: "clear_cache", label: "Limpiar caché CDN", target: "cdn" },
      { action: "webhook", label: "Trigger CI/CD pipeline", target: "pipeline" },
      { action: "notify_slack", label: "Notificar a equipo", target: "#engineering" },
    ])
    setRunbooks(listRunbooks())
  }, [])

  const handleExecute = async (id: string) => {
    setRunning(id)
    await executeRunbook(id)
    setRunbooks(listRunbooks())
    setRunning(null)
  }

  return (
    <div className="space-y-4">
      {runbooks.map((rb) => (
        <div key={rb.id} className="rounded-xl border border-surface-700/50 bg-surface-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-200">{rb.name}</p>
              <p className="text-xs text-surface-500">{rb.description} · trigger: {rb.trigger}</p>
            </div>
            <div className="flex items-center gap-2">
              {rb.lastStatus && (
                <span className={`rounded px-2 py-0.5 text-xs ${
                  rb.lastStatus === "success" ? "bg-emerald-600/10 text-emerald-400" :
                  rb.lastStatus === "failed" ? "bg-red-600/10 text-red-400" :
                  "bg-surface-700 text-surface-400"
                }`}>{rb.lastStatus}</span>
              )}
              <button onClick={() => handleExecute(rb.id)} disabled={running === rb.id}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
                {running === rb.id ? "Ejecutando..." : "▶ Ejecutar"}
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {rb.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 rounded-lg bg-surface-900 px-3 py-2 text-xs">
                <span className={`${
                  step.status === "success" ? "text-emerald-400" :
                  step.status === "failed" ? "text-red-400" :
                  step.status === "running" ? "text-blue-400" : "text-surface-500"
                }`}>
                  {step.status === "success" ? "✓" : step.status === "failed" ? "✗" : step.status === "running" ? "◌" : "○"}
                </span>
                <span className="text-surface-300">{step.label}</span>
                <span className="ml-auto text-surface-500">{step.action}</span>
                {step.duration && <span className="text-surface-500">{step.duration.toFixed(0)}ms</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
