"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Activity, AlertCircle, AlertTriangle, BarChart3, Brain, CheckCircle2, ChevronRight,
  Database, FileCheck2, Gauge, Layers, Radio, RefreshCw, ShieldCheck,
  Sparkles, Wifi, WifiOff, XCircle,
} from "lucide-react"

interface ServiceHealth {
  id: string
  name: string
  description: string
  status: "operational" | "degraded" | "down" | "unknown"
  version?: string
  latencyMs: number
  lastChecked: string
  baseUrl: string
  endpoints: number
  modules?: { name: string; status: string; description: string }[]
  metrics?: Record<string, string | number>
  error?: string
}

interface PlatformHealth {
  status: "operational" | "degraded" | "down" | "unknown"
  generatedAt: string
  overallScore: number
  totals: { services: number; operational: number; degraded: number; down: number; unknown: number }
  services: ServiceHealth[]
  capabilities: { id: string; label: string; count: number; unit: string }[]
}

interface LatencyPoint {
  t: number
  latency: number
  service: string
}

const SERVICE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; ring: string; layer: string }> = {
  "command-center": { icon: Layers, color: "text-accent-400", ring: "ring-accent-500/30", layer: "Frontend" },
  bi: { icon: BarChart3, color: "text-emerald-400", ring: "ring-emerald-500/30", layer: "Analytics" },
  security: { icon: ShieldCheck, color: "text-violet-400", ring: "ring-violet-500/30", layer: "Compliance" },
  "ai-orchestrator": { icon: Brain, color: "text-amber-400", ring: "ring-amber-500/30", layer: "AI / ML" },
  "tax-engine": { icon: FileCheck2, color: "text-pink-400", ring: "ring-pink-500/30", layer: "Dominio" },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  operational: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Operativo", dot: "bg-emerald-400" },
  degraded: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Degradado", dot: "bg-amber-400" },
  down: { bg: "bg-red-500/10", text: "text-red-400", label: "Caído", dot: "bg-red-400" },
  unknown: { bg: "bg-surface-700/50", text: "text-surface-400", label: "Sin datos", dot: "bg-surface-500" },
}

function StatusDot({ status, pulse = true }: { status: string; pulse?: boolean }) {
  const meta = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", meta.dot)} />}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1", meta.bg, meta.text, "ring-current/20")}>
      <StatusDot status={status} pulse={status === "operational"} />
      {meta.label}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  )
}

function ServiceTile({ service, latencyHistory }: { service: ServiceHealth; latencyHistory: LatencyPoint[] }) {
  const meta = SERVICE_META[service.id]
  if (!meta) return null
  const Icon = meta.icon as React.ComponentType<{ className?: string }>

  const series = latencyHistory.filter((p) => p.service === service.id).slice(-20)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={cn("group h-full overflow-hidden border-surface-700/60 bg-surface-900/50 transition-all hover:border-surface-600", meta.ring)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-surface-950 ring-1", meta.ring, meta.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <StatusPill status={service.status} />
          </div>
          <div className="mt-2">
            <CardTitle className="text-sm font-semibold text-surface-100">{service.name}</CardTitle>
            <p className="text-[10px] text-surface-500">{meta.layer}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Mini latency chart */}
          <div className="h-12 -mx-2">
            {series.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id={`grad-${service.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={service.status === "operational" ? "#10b981" : "#f59e0b"} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={service.status === "operational" ? "#10b981" : "#f59e0b"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="latency" stroke={service.status === "operational" ? "#10b981" : "#f59e0b"} fill={`url(#grad-${service.id})`} strokeWidth={1.5} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[9px] text-surface-500">Recolectando latencia…</div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
            <div>
              <p className="text-surface-500">Latencia</p>
              <p className={cn("font-mono text-surface-200", service.latencyMs > 500 && "text-amber-400")}>
                {service.latencyMs}ms
              </p>
            </div>
            <div>
              <p className="text-surface-500">Endpoints</p>
              <p className="font-mono text-surface-200">{service.endpoints}</p>
            </div>
            <div>
              <p className="text-surface-500">Versión</p>
              <p className="font-mono text-surface-200">v{service.version ?? "1.0"}</p>
            </div>
          </div>

          {/* Error message */}
          {service.error && (
            <div className="flex items-start gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 p-1.5 text-[9px] text-amber-300/80">
              <AlertCircle className="h-3 w-3 shrink-0 text-amber-400" />
              <span className="line-clamp-2">{service.error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function LiveTicker({ data, history }: { data: PlatformHealth; history: { time: string; score: number }[] }) {
  const points = history.length > 0 ? history : [{ time: "—", score: data.overallScore }]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-surface-700/60 bg-gradient-to-br from-surface-900 to-surface-950 p-5"
    >
      <div className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_top_left,white,transparent_50%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-400">
              <Activity className="mr-1 h-3 w-3" /> Monitor en vivo
            </Badge>
            <span className="text-[10px] text-surface-500">Actualiza cada 15s</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-50">Ecosistema</h1>
          <p className="text-sm text-surface-400">Estado en tiempo real de los {data.totals.services} servicios de la plataforma</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <BigStat label="Score" value={`${data.overallScore.toFixed(1)}%`} color="text-emerald-400" />
          <BigStat label="Operativos" value={data.totals.operational} color="text-emerald-400" />
          <BigStat label="Endpoints" value={data.services.reduce((a, s) => a + s.endpoints, 0)} color="text-accent-400" />
          <BigStat label="Módulos" value={data.services.flatMap((s) => s.modules ?? []).length} color="text-violet-400" />
        </div>
      </div>

      <div className="mt-4 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <defs>
              <linearGradient id="ecoscore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: 6, fontSize: 10 }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(v) => [`${Number(v).toFixed(1)}%`, "Score"]}
            />
            <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#ecoscore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function BigStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-surface-500">{label}</p>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </div>
  )
}

function DataSourcesPanel() {
  const sources = [
    { name: "PostgreSQL · Supabase", status: "operational", sub: "Datos transaccionales", icon: Database, color: "text-accent-400" },
    { name: "BCE · Banco Central Ecuador", status: "operational", sub: "Tasas, PIB, petróleo", icon: Radio, color: "text-emerald-400" },
    { name: "INEC · Estadística", status: "operational", sub: "Inflación, canasta, empleo", icon: BarChart3, color: "text-emerald-400" },
    { name: "SRI · SOAP", status: "operational", sub: "Recepción + autorización", icon: FileCheck2, color: "text-amber-400" },
    { name: "KMS + HSM", status: "operational", sub: "AES-256-GCM, TLS 1.3", icon: ShieldCheck, color: "text-violet-400" },
    { name: "OpenAI · Anthropic", status: "operational", sub: "LLM inference (RAG, agentes)", icon: Brain, color: "text-pink-400" },
  ]
  return (
    <Card className="border-surface-700/50 bg-surface-900/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-surface-200">Fuentes de datos</CardTitle>
        <p className="text-[10px] text-surface-500">Conectores externos que alimentan la plataforma</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sources.map((s) => {
            const Icon = s.icon as React.ComponentType<{ className?: string }>
            return (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-surface-800 bg-surface-950/40 p-2.5">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", s.color)} />
                  <div>
                    <p className="text-xs font-medium text-surface-200">{s.name}</p>
                    <p className="text-[10px] text-surface-500">{s.sub}</p>
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CronPanel() {
  const jobs = [
    { name: "BI · Refresh Materialized Views", schedule: "0 3 * * *", next: "Hoy 03:00", service: "bi", status: "operational" },
    { name: "Security · Weekly ISO 27001 Report", schedule: "0 9 * * 1", next: "Lun 09:00", service: "security", status: "operational" },
    { name: "Tax · SRI Comprobantes Batch", schedule: "0 2 * * *", next: "Hoy 02:00", service: "tax-engine", status: "operational" },
    { name: "AI · MIDAS Re-estimation", schedule: "0 6 1 * *", next: "Mes próximo 06:00", service: "ai-orchestrator", status: "operational" },
    { name: "BI · ETL Pipeline Sync", schedule: "*/15 * * * *", next: "Cada 15 min", service: "bi", status: "operational" },
    { name: "RAG · Embedding Index Refresh", schedule: "0 4 * * *", next: "Hoy 04:00", service: "command-center", status: "operational" },
  ]
  return (
    <Card className="border-surface-700/50 bg-surface-900/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-surface-200">Cron Jobs</CardTitle>
        <p className="text-[10px] text-surface-500">Tareas programadas en producción</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {jobs.map((j) => {
            const meta = SERVICE_META[j.service]
            return (
              <div key={j.name} className="flex items-center justify-between rounded-md border border-surface-800 bg-surface-950/40 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-2 w-2 rounded-full", meta?.color.replace("text-", "bg-"))} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-surface-200">{j.name}</p>
                    <p className="font-mono text-[9px] text-surface-500">{j.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-surface-400">{j.next}</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function EcosystemPage() {
  const [data, setData] = useState<PlatformHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [latencyHistory, setLatencyHistory] = useState<LatencyPoint[]>([])
  const [scoreHistory, setScoreHistory] = useState<{ time: string; score: number }[]>([])
  const [lastFetch, setLastFetch] = useState<number>(0)

  async function fetchHealth() {
    setRefreshing(true)
    const t0 = Date.now()
    try {
      const res = await fetch("/api/platform/health", { cache: "no-store" })
      const json = await res.json()
      setData(json)

      // Update latency history
      const now = Date.now()
      const newPoints: LatencyPoint[] = json.services.map((s: ServiceHealth) => ({
        t: now,
        service: s.id,
        latency: s.latencyMs,
      }))
      setLatencyHistory((prev) => [...prev, ...newPoints].slice(-100))

      // Update score history
      const time = new Date(json.generatedAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      setScoreHistory((prev) => [...prev, { time, score: json.overallScore }].slice(-30))

      setLastFetch(Date.now() - t0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchHealth(), 0)
    const interval = setInterval(fetchHealth, 15_000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [])

  const servicesToShow = useMemo(() => data?.services ?? [], [data])

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-8">
        <WifiOff className="h-10 w-10 text-danger" />
        <p className="text-sm text-surface-300">No se pudo cargar el ecosistema.</p>
      </div>
    )
  }

  const allOperational = data.totals.operational === data.totals.services
  const issueCount = data.totals.degraded + data.totals.down

  return (
    <div className="space-y-6">
      <LiveTicker data={data} history={scoreHistory} />

      {/* Connection status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-700/50 bg-surface-900/50 px-3 py-2">
        <div className="flex items-center gap-2">
          {allOperational ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span className="text-xs text-surface-300">
            {allOperational
              ? "Todos los servicios operativos"
              : `${issueCount} servicio(s) con degradación o caído(s)`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-surface-500">
          <span className="font-mono">fetch: {lastFetch}ms</span>
          <span>{data.services.length} servicios</span>
          <span>{new Date(data.generatedAt).toLocaleString("es-EC")}</span>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-md bg-surface-800 px-2 py-1 text-[10px] font-medium text-surface-200 transition-colors hover:bg-surface-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            {refreshing ? "Refrescando…" : "Refrescar"}
          </button>
        </div>
      </div>

      {/* Service tiles */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold text-surface-50">Servicios en vivo</h2>
            <p className="text-xs text-surface-500">Latencia de los últimos 20 polls</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {servicesToShow.map((s) => (
            <ServiceTile key={s.id} service={s} latencyHistory={latencyHistory} />
          ))}
        </div>
      </div>

      {/* Detailed tabs */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="bg-surface-800">
          <TabsTrigger value="modules" className="data-[active]:bg-surface-700">Módulos</TabsTrigger>
          <TabsTrigger value="endpoints" className="data-[active]:bg-surface-700">Endpoints</TabsTrigger>
          <TabsTrigger value="cron" className="data-[active]:bg-surface-700">Cron Jobs</TabsTrigger>
          <TabsTrigger value="sources" className="data-[active]:bg-surface-700">Fuentes</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {servicesToShow.map((s) => (
              <Card key={s.id} className="border-surface-700/50 bg-surface-900/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-surface-200">{s.name}</CardTitle>
                    <StatusPill status={s.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {s.modules && s.modules.length > 0 ? (
                    <div className="space-y-1">
                      {s.modules.map((m) => (
                        <div key={m.name} className="flex items-center justify-between rounded-md border border-surface-800 bg-surface-950/40 px-2 py-1.5">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-surface-200">{m.name}</p>
                            <p className="truncate text-[9px] text-surface-500">{m.description}</p>
                          </div>
                          {m.status === "operational" || m.status === "warning" ? (
                            <StatusDot status={m.status} pulse={false} />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-500">Sin módulos registrados</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="mt-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {servicesToShow.map((s) => (
              <Card key={s.id} className="border-surface-700/50 bg-surface-900/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-surface-200">{s.name}</CardTitle>
                    <Badge variant="outline" className="border-surface-600 text-[10px] text-surface-400">{s.endpoints} endpoints</Badge>
                  </div>
                  <p className="font-mono text-[10px] text-surface-500">{s.baseUrl}</p>
                </CardHeader>
                <CardContent>
                  <EndpointList serviceId={s.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cron" className="mt-4">
          <CronPanel />
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <DataSourcesPanel />
        </TabsContent>
      </Tabs>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/platform" className="group">
          <Card className="h-full border-surface-700/50 bg-surface-900/50 transition-all hover:border-accent-500/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 ring-1 ring-accent-500/20">
                  <Sparkles className="h-4 w-4 text-accent-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-50">Plataforma</p>
                  <p className="text-xs text-surface-500">Showcase visual</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-surface-500 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/status" className="group">
          <Card className="h-full border-surface-700/50 bg-surface-900/50 transition-all hover:border-emerald-500/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-50">Status Page</p>
                  <p className="text-xs text-surface-500">Pública, sin auth</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-surface-500 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard" className="group">
          <Card className="h-full border-surface-700/50 bg-surface-900/50 transition-all hover:border-pink-500/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10 ring-1 ring-pink-500/20">
                  <Gauge className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-50">Dashboard Financiero</p>
                  <p className="text-xs text-surface-500">KPIs y análisis</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-surface-500 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function EndpointList({ serviceId }: { serviceId: string }) {
  const endpoints: Record<string, { method: string; path: string }[]> = {
    "command-center": [
      { method: "GET", path: "/api/health" },
      { method: "GET", path: "/api/live" },
      { method: "GET", path: "/api/ready" },
      { method: "GET", path: "/api/platform/health" },
      { method: "GET", path: "/api/dd/engagements" },
      { method: "POST", path: "/api/keys" },
      { method: "GET", path: "/api/keys/validate" },
      { method: "POST", path: "/api/gdpr/export" },
      { method: "POST", path: "/api/gdpr/forget" },
      { method: "POST", path: "/api/gdpr/consent" },
      { method: "POST", path: "/api/v1/gdpr/anonymize" },
      { method: "POST", path: "/api/dev-login" },
      { method: "GET", path: "/auth/callback" },
      { method: "GET", path: "/auth/confirm" },
    ],
    bi: [
      { method: "GET", path: "/api/v1/bi/executive" },
      { method: "GET", path: "/api/v1/bi/mrr" },
      { method: "GET", path: "/api/v1/bi/clients" },
      { method: "GET", path: "/api/v1/bi/revenue" },
      { method: "GET", path: "/api/v1/bi/pipeline" },
      { method: "GET", path: "/api/v1/bi/utilization" },
      { method: "POST", path: "/api/v1/bi/refresh" },
    ],
    security: [
      { method: "GET", path: "/api/v1/security/iso27001/controls" },
      { method: "GET", path: "/api/v1/security/iso27001/summary" },
      { method: "POST", path: "/api/v1/security/iso27001/validate" },
      { method: "GET", path: "/api/v1/security/iso27001/report/:tenantId" },
      { method: "POST", path: "/api/v1/security/iso27001/report" },
    ],
    "ai-orchestrator": [
      { method: "POST", path: "/api/v1/macro/bvar/estimate" },
      { method: "POST", path: "/api/v1/macro/bvar/forecast" },
      { method: "POST", path: "/api/v1/macro/bvar/irf" },
      { method: "POST", path: "/api/v1/macro/bvar/conditional" },
      { method: "POST", path: "/api/v1/macro/midas/nowcast" },
      { method: "GET", path: "/api/v1/macro/indicators" },
      { method: "GET", path: "/api/v1/macro/series/:name" },
      { method: "GET", path: "/health" },
    ],
    "tax-engine": [
      { method: "POST", path: "/api/v1/iva/calculate" },
      { method: "POST", path: "/api/v1/iva/generate-xml" },
      { method: "POST", path: "/api/v1/renta/calculate" },
      { method: "POST", path: "/api/v1/renta/generate-104" },
      { method: "POST", path: "/api/v1/retenciones/calculate" },
      { method: "POST", path: "/api/v1/ice/calculate" },
      { method: "POST", path: "/api/v1/ats/generate" },
      { method: "POST", path: "/api/v1/ats/validate-xsd" },
      { method: "POST", path: "/api/v1/sri/recepcion" },
      { method: "POST", path: "/api/v1/sri/autorizacion" },
      { method: "POST", path: "/api/v1/sri/firma" },
      { method: "GET", path: "/health" },
    ],
  }
  const list = endpoints[serviceId] ?? []
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
      {list.map((e) => (
        <div key={e.path} className="flex items-center gap-2 rounded-md border border-surface-800 bg-surface-950/40 px-2 py-1.5">
          <span className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
            e.method === "GET" ? "bg-blue-500/10 text-blue-400" :
            e.method === "POST" ? "bg-emerald-500/10 text-emerald-400" :
            "bg-surface-700 text-surface-300"
          )}>{e.method}</span>
          <code className="truncate font-mono text-[10px] text-surface-300">{e.path}</code>
        </div>
      ))}
    </div>
  )
}
