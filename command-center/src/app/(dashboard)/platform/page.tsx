"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Activity, BarChart3, Brain, Database, FileCheck2, Gauge, Layers,
  Lock, Network, Radio, ShieldCheck, Sparkles, Zap,
  CheckCircle2, AlertTriangle, XCircle, ChevronRight, Server, Code2, Cpu,
} from "lucide-react"

interface ServiceModule {
  name: string
  status: "operational" | "degraded" | "down" | "warning" | "unknown"
  description: string
}

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
  modules?: ServiceModule[]
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; ring: string; dot: string }> = {
  operational: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "Operativo",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-400",
  },
  degraded: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Degradado", ring: "ring-amber-500/30", dot: "bg-amber-400" },
  down: { bg: "bg-red-500/10", text: "text-red-400", label: "Caído", ring: "ring-red-500/30", dot: "bg-red-400" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Advertencia", ring: "ring-amber-500/30", dot: "bg-amber-400" },
  unknown: { bg: "bg-surface-700/50", text: "text-surface-400", label: "Sin datos", ring: "ring-surface-600/30", dot: "bg-surface-500" },
}

const SERVICE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; gradient: string; layer: string }> = {
  "command-center": {
    icon: Layers, color: "text-accent-400", gradient: "from-accent-600/30 via-accent-500/10 to-transparent",
    layer: "Frontend",
  },
  bi: { icon: BarChart3, color: "text-emerald-400", gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent", layer: "Analytics" },
  security: { icon: ShieldCheck, color: "text-violet-400", gradient: "from-violet-600/30 via-violet-500/10 to-transparent", layer: "Compliance" },
  "ai-orchestrator": {
    icon: Brain, color: "text-amber-400", gradient: "from-amber-600/30 via-amber-500/10 to-transparent",
    layer: "AI / ML",
  },
  "tax-engine": {
    icon: FileCheck2, color: "text-pink-400", gradient: "from-pink-600/30 via-pink-500/10 to-transparent",
    layer: "Dominio",
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function StatusDot({ status }: { status: string }) {
  const meta = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", meta.dot)} />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1", meta.bg, meta.text, meta.ring)}>
      <StatusDot status={status} />
      {meta.label}
    </span>
  )
}

function ServiceIcon({ id, className }: { id: string; className?: string }) {
  const meta = SERVICE_META[id]
  if (!meta) return null
  const Icon = meta.icon as React.ComponentType<{ className?: string }>
  return <Icon className={cn("h-5 w-5", meta.color, className)} />
}function HeroGauge({ score }: { score: number }) {
  const data = [
    { name: "Score", value: score, fill: score >= 90 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444" },
  ]
  return (
    <div className="relative h-44 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" startAngle={210} endAngle={-30} innerRadius="78%" outerRadius="100%" stroke="none" />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-surface-50">{score.toFixed(1)}%</span>
        <span className="text-[10px] uppercase tracking-wider text-surface-500">Salud</span>
      </div>
    </div>
  )
}

function CapabilityBars({ capabilities }: { capabilities: PlatformHealth["capabilities"] }) {
  const max = Math.max(...capabilities.map((c) => c.count), 1)
  return (
    <div className="space-y-3">
      {capabilities.map((c) => {
        const pct = (c.count / max) * 100
        return (
          <div key={c.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-surface-300">{c.label}</span>
              <span className="font-mono text-surface-100">{c.count}{c.unit}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-400"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ArchitectureDiagram({ services }: { services: ServiceHealth[] }) {
  // Layers: Frontend → Analytics/AI/Compliance/Domain → Data
  const front = services.filter((s) => s.id === "command-center")
  const middle = services.filter((s) => ["bi", "ai-orchestrator"].includes(s.id))
  const right = services.filter((s) => ["security", "tax-engine"].includes(s.id))

  return (
    <div className="relative rounded-2xl border border-surface-700/50 bg-gradient-to-br from-surface-900 to-surface-950 p-6">
      <div className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(96,165,250,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200">Arquitectura de Plataforma</h3>
        <Badge variant="outline" className="border-surface-600 text-[10px] text-surface-400">5 servicios · 4 lenguajes · 1 PostgreSQL</Badge>
      </div>

      {/* Top: Users / Frontend */}
      <div className="mb-3 flex justify-center">
        <ArchitectureNode service={front[0]} highlight />
      </div>

      {/* Connector */}
      <div className="mx-auto mb-3 h-8 w-px bg-gradient-to-b from-accent-500/60 to-surface-700" />

      {/* Middle: Services row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-surface-700/40 bg-surface-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Analytics & AI</p>
          {middle.map((s) => <ArchitectureNode key={s.id} service={s} compact />)}
        </div>
        <div className="space-y-3 rounded-xl border border-surface-700/40 bg-surface-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Compliance & Dominio</p>
          {right.map((s) => <ArchitectureNode key={s.id} service={s} compact />)}
        </div>
      </div>

      {/* Connector */}
      <div className="mx-auto my-3 h-8 w-px bg-gradient-to-b from-surface-700 to-amber-500/60" />

      {/* Bottom: Data + SRI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DataChip icon={Database} label="PostgreSQL" sub="Supabase" color="text-accent-400" />
        <DataChip icon={Radio} label="SRI SOAP" sub="Ecuador" color="text-amber-400" />
        <DataChip icon={Network} label="BCE / INEC" sub="Macroeconomía" color="text-emerald-400" />
        <DataChip icon={Lock} label="KMS + HSM" sub="AES-256-GCM" color="text-violet-400" />
      </div>
    </div>
  )
}

function ArchitectureNode({ service, compact, highlight }: { service: ServiceHealth; compact?: boolean; highlight?: boolean }) {
  const meta = SERVICE_META[service.id]
  if (!meta) return null
  const Icon = meta.icon as React.ComponentType<{ className?: string }>
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-surface-700/60 bg-gradient-to-br p-3 transition-all hover:border-surface-600",
        meta.gradient,
        highlight && "ring-1 ring-accent-500/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-surface-900/80 ring-1 ring-surface-700", meta.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-surface-50">{service.name}</p>
            <StatusDot status={service.status} />
          </div>
          <p className="truncate text-[10px] text-surface-400">{service.description}</p>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center justify-between text-[10px] text-surface-500">
          <span>{meta.layer}</span>
          <span className="font-mono">{service.endpoints} endpoints</span>
        </div>
      )}
    </motion.div>
  )
}

function DataChip({ icon: Icon, label, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-700/50 bg-surface-900/60 p-2.5">
      <Icon className={cn("h-4 w-4", color)} />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-surface-200">{label}</p>
        <p className="truncate text-[9px] text-surface-500">{sub}</p>
      </div>
    </div>
  )
}

function ServiceCard({ service, index }: { service: ServiceHealth; index: number }) {
  const meta = SERVICE_META[service.id]
  if (!meta) return null
  const Icon = meta.icon
  // Icon is a Lucide-style component, safe to use className prop
  const TypedIcon = Icon as React.ComponentType<{ className?: string }>

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group relative h-full overflow-hidden border-surface-700/60 bg-surface-900/50 transition-all hover:border-surface-600 hover:shadow-2xl">
        <div className={cn("absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-40", meta.gradient)} />
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-surface-900/80 ring-1 ring-surface-700", meta.color)}>
              <TypedIcon className="h-5 w-5" />
            </div>
            <StatusPill status={service.status} />
          </div>
          <div className="mt-3">
            <CardTitle className="text-base font-semibold text-surface-50">{service.name}</CardTitle>
            <p className="mt-1 text-xs text-surface-400">{service.description}</p>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-3">
          {/* Mini metrics */}
          {service.metrics && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(service.metrics).slice(0, 4).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-surface-700/40 bg-surface-950/50 p-2">
                  <p className="text-[9px] uppercase tracking-wider text-surface-500">{k}</p>
                  <p className="truncate font-mono text-xs text-surface-200">{String(v)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Modules list */}
          {service.modules && service.modules.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">Módulos ({service.modules.length})</p>
              <div className="space-y-1">
                {service.modules.slice(0, 4).map((m) => (
                  <div key={m.name} className="flex items-center justify-between rounded-md border border-surface-800 bg-surface-950/40 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-surface-200">{m.name}</p>
                      <p className="truncate text-[9px] text-surface-500">{m.description}</p>
                    </div>
                    {m.status === "operational" ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                    ) : m.status === "warning" ? (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0 text-red-400" />
                    )}
                  </div>
                ))}
                {service.modules.length > 4 && (
                  <p className="text-center text-[9px] text-surface-500">+{service.modules.length - 4} más</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-surface-700/50 pt-2 text-[10px] text-surface-500">
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3" />
              {service.endpoints} endpoints
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Zap className="h-3 w-3" />
              {service.latencyMs}ms
            </span>
            <span>v{service.version ?? "1.0.0"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MacroForecastChart() {
  // Simulación visual del nowcasting GDP Ecuador (MIDAS)
  const data = [
    { q: "Q1 23", gdp: 18.5, forecast: null, lower: null, upper: null },
    { q: "Q2 23", gdp: 18.8, forecast: null, lower: null, upper: null },
    { q: "Q3 23", gdp: 19.1, forecast: null, lower: null, upper: null },
    { q: "Q4 23", gdp: 19.0, forecast: null, lower: null, upper: null },
    { q: "Q1 24", gdp: 19.3, forecast: null, lower: null, upper: null },
    { q: "Q2 24", gdp: 19.6, forecast: null, lower: null, upper: null },
    { q: "Q3 24", gdp: 19.4, forecast: null, lower: null, upper: null },
    { q: "Q4 24", gdp: 19.8, forecast: null, lower: null, upper: null },
    { q: "Q1 25", gdp: 20.1, forecast: null, lower: null, upper: null },
    { q: "Q2 25", gdp: 20.4, forecast: 20.4, lower: 20.1, upper: 20.7 },
    { q: "Q3 25", gdp: null, forecast: 20.6, lower: 20.1, upper: 21.1 },
    { q: "Q4 25", gdp: null, forecast: 20.9, lower: 20.2, upper: 21.6 },
    { q: "Q1 26", gdp: null, forecast: 21.2, lower: 20.3, upper: 22.1 },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="q" stroke="#64748b" fontSize={10} />
        <YAxis stroke="#64748b" fontSize={10} unit="B" />
        <Tooltip
          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Area type="monotone" dataKey="upper" stroke="transparent" fill="#f59e0b" fillOpacity={0.1} />
        <Area type="monotone" dataKey="lower" stroke="transparent" fill="#0f172a" fillOpacity={1} />
        <Area type="monotone" dataKey="gdp" stroke="#3b82f6" fill="transparent" strokeWidth={2} name="GDP Real" />
        <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="4 4" name="Forecast MIDAS" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TaxBreakdownChart() {
  const data = [
    { name: "IVA 15%", value: 48200, color: "#ec4899" },
    { name: "IVA 12%", value: 23100, color: "#f472b6" },
    { name: "Ret. 1%", value: 8200, color: "#a855f7" },
    { name: "Ret. 8%", value: 12400, color: "#8b5cf6" },
    { name: "Renta 28%", value: 35600, color: "#6366f1" },
    { name: "ICE", value: 4900, color: "#3b82f6" },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ISOComplianceRadar() {
  const data = [
    { domain: "A.5 Políticas", score: 95 },
    { domain: "A.9 Acceso", score: 81 },
    { domain: "A.10 Cripto", score: 93 },
    { domain: "A.12 Operaciones", score: 79 },
    { domain: "A.16 Incidentes", score: 88 },
    { domain: "A.17 Continuidad", score: 90 },
    { domain: "A.18 Cumplimiento", score: 71 },
  ]
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="domain" tick={{ fontSize: 9, fill: "#94a3b8" }} />
        <Radar dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

function BISnapshot() {
  const data = [
    { name: "MRR", value: 284, color: "#10b981" },
    { name: "ARR", value: 3408, color: "#3b82f6" },
    { name: "Clientes", value: 48, color: "#f59e0b" },
    { name: "LTV", value: 42800, color: "#a855f7" },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
        <Tooltip
          formatter={(v, n) => {
            const value = Number(v)
            const name = String(n)
            return [name === "Clientes" ? `${value} cuentas` : `$${value.toLocaleString()}`, ""]
          }}
          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function PlatformPage() {
  const [data, setData] = useState<PlatformHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchHealth() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/platform/health", { cache: "no-store" })
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchHealth(), 0)
    const interval = setInterval(fetchHealth, 30_000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [])

  const lastUpdate = useMemo(() => {
    if (!data) return "—"
    const d = new Date(data.generatedAt)
    return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }, [data])

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-8">
        <XCircle className="h-10 w-10 text-danger" />
        <p className="text-sm text-surface-300">No se pudo cargar el estado de la plataforma.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-surface-700/60 bg-gradient-to-br from-surface-900 via-surface-900 to-surface-950 p-6 md:p-8"
      >
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,white,transparent_60%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(96,165,250,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="border-accent-500/30 text-[10px] text-accent-400">
                <Sparkles className="mr-1 h-3 w-3" /> Infinity Platform
              </Badge>
              <span className="text-[10px] text-surface-500">Última actualización: {lastUpdate}</span>
              <button
                onClick={fetchHealth}
                disabled={refreshing}
                className="text-[10px] text-surface-500 transition-colors hover:text-surface-200 disabled:opacity-50"
              >
                {refreshing ? "↻ Actualizando…" : "↻ Refrescar"}
              </button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-surface-50 md:text-4xl">
              Plataforma <span className="bg-gradient-to-r from-accent-400 to-emerald-400 bg-clip-text text-transparent">Infinity</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-surface-400">
              Ecosistema integrado de 5 servicios que cubren analítica, IA, compliance y dominio tributario
              ecuatoriano. Construido sobre Next.js 16, NestJS y FastAPI.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/ecosystem" className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-500">
                Monitor en vivo <ChevronRight className="h-3 w-3" />
              </Link>
              <Link href="/status" className="inline-flex items-center gap-1.5 rounded-lg border border-surface-700 px-3 py-1.5 text-xs font-medium text-surface-200 transition-colors hover:bg-surface-800">
                <Activity className="h-3 w-3" /> Status Page
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-surface-700 px-3 py-1.5 text-xs font-medium text-surface-200 transition-colors hover:bg-surface-800">
                <Gauge className="h-3 w-3" /> Dashboard Financiero
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <HeroGauge score={data.overallScore} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-400">{data.totals.operational}</p>
                <p className="text-[9px] uppercase text-surface-500">Operativos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">{data.totals.degraded}</p>
                <p className="text-[9px] uppercase text-surface-500">Degradados</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{data.totals.down}</p>
                <p className="text-[9px] uppercase text-surface-500">Caídos</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPIStat icon={Server} label="Servicios" value={data.totals.services} color="text-accent-400" />
        <KPIStat icon={Code2} label="Endpoints" value={data.services.reduce((a, s) => a + s.endpoints, 0)} color="text-emerald-400" />
        <KPIStat icon={Cpu} label="Motores" value="2" sub="BVAR + MIDAS" color="text-amber-400" />
        <KPIStat icon={FileCheck2} label="Formularios SRI" value="6" sub="IVA, Renta, ICE…" color="text-pink-400" />
      </div>

      {/* Architecture + Capabilities */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ArchitectureDiagram services={data.services} />
        </div>
        <Card className="border-surface-700/50 bg-surface-900/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-surface-200">Capacidades</CardTitle>
            <p className="text-[10px] text-surface-500">Cobertura agregada de la plataforma</p>
          </CardHeader>
          <CardContent>
            <CapabilityBars capabilities={data.capabilities} />
          </CardContent>
        </Card>
      </div>

      {/* Service Cards */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-50">Servicios</h2>
            <p className="text-xs text-surface-500">5 microservicios · 4 lenguajes · 1 ecosistema</p>
          </div>
          <Link href="/ecosystem" className="text-xs text-accent-400 hover:underline">
            Ver monitor →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>
      </div>

      {/* Live Visualizations */}
      <Tabs defaultValue="bi" className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-50">Visualizaciones en vivo</h2>
          <TabsList className="bg-surface-800">
            <TabsTrigger value="bi" className="data-[active]:bg-surface-700"><BarChart3 className="mr-1 h-3 w-3" />BI</TabsTrigger>
            <TabsTrigger value="ai" className="data-[active]:bg-surface-700"><Brain className="mr-1 h-3 w-3" />AI</TabsTrigger>
            <TabsTrigger value="tax" className="data-[active]:bg-surface-700"><FileCheck2 className="mr-1 h-3 w-3" />Tax</TabsTrigger>
            <TabsTrigger value="security" className="data-[active]:bg-surface-700"><ShieldCheck className="mr-1 h-3 w-3" />ISO</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bi">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-surface-700/50 bg-surface-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Métricas de Negocio (última consulta)</CardTitle>
                <p className="text-[10px] text-surface-500">BI Service · /api/v1/bi/executive</p>
              </CardHeader>
              <CardContent>
                <BISnapshot />
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-900/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Endpoints BI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {["GET /executive", "GET /mrr", "GET /clients", "GET /revenue", "GET /pipeline", "GET /utilization", "POST /refresh"].map((ep) => (
                  <div key={ep} className="flex items-center justify-between rounded-md border border-surface-800 bg-surface-950/40 px-2 py-1.5">
                    <code className="font-mono text-[10px] text-surface-300">{ep}</code>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">OK</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-surface-700/50 bg-surface-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Nowcasting GDP Ecuador · MIDAS Engine</CardTitle>
                <p className="text-[10px] text-surface-500">Predictores: oil_price, tax_revenue, remittances, interest_rate, cpi</p>
              </CardHeader>
              <CardContent>
                <MacroForecastChart />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded-md border border-surface-800 bg-surface-950/40 p-2">
                    <p className="text-surface-500">RMSE</p>
                    <p className="font-mono text-surface-200">0.18B</p>
                  </div>
                  <div className="rounded-md border border-surface-800 bg-surface-950/40 p-2">
                    <p className="text-surface-500">MAPE</p>
                    <p className="font-mono text-surface-200">1.2%</p>
                  </div>
                  <div className="rounded-md border border-surface-800 bg-surface-950/40 p-2">
                    <p className="text-surface-500">R²</p>
                    <p className="font-mono text-surface-200">0.94</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-900/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Motores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <EngineBadge name="BVAR" desc="Bayesian VAR · Minnesota prior" sub="896 líneas" />
                <EngineBadge name="MIDAS" desc="Mixed-data Sampling" sub="424 líneas" />
                <EngineBadge name="Data" desc="Ecuador macro data" sub="18.7K líneas" />
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                  <p className="text-[10px] font-semibold text-amber-400">Variables</p>
                  <p className="font-mono text-[10px] text-amber-300/80">gdp · oil_price · tax_revenue · remittances · interest_rate · cpi</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-surface-700/50 bg-surface-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Distribución Tributaria · Mes actual (demo)</CardTitle>
                <p className="text-[10px] text-surface-500">Tax Engine · engines/iva · engines/renta · engines/ice · engines/retenciones</p>
              </CardHeader>
              <CardContent>
                <TaxBreakdownChart />
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-900/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Módulos Tributarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  { name: "IVA", desc: "Form. 104 · 0/12/15%", color: "text-pink-400" },
                  { name: "Renta", desc: "28% sociedades", color: "text-indigo-400" },
                  { name: "Retenciones", desc: "1/2/8/10/25%", color: "text-violet-400" },
                  { name: "ICE", desc: "Consumos Especiales", color: "text-blue-400" },
                  { name: "ATS v2.7", desc: "XSD validation", color: "text-cyan-400" },
                  { name: "SRI SOAP", desc: "FirmaEc + Recepción", color: "text-amber-400" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center justify-between rounded-md border border-surface-800 bg-surface-950/40 px-2 py-1.5">
                    <div>
                      <p className={cn("text-[11px] font-medium", m.color)}>{m.name}</p>
                      <p className="text-[9px] text-surface-500">{m.desc}</p>
                    </div>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-surface-700/50 bg-surface-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Cumplimiento ISO 27001</CardTitle>
                <p className="text-[10px] text-surface-500">7 dominios · 33 controles · Reporte semanal automático</p>
              </CardHeader>
              <CardContent>
                <ISOComplianceRadar />
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-900/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Score General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-5xl font-bold text-violet-400">87%</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-400">Needs improvement</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { k: "Pasados", v: 24, c: "text-emerald-400" },
                    { k: "Advertencias", v: 6, c: "text-amber-400" },
                    { k: "Fallidos", v: 3, c: "text-red-400" },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center justify-between text-xs">
                      <span className="text-surface-400">{r.k}</span>
                      <span className={cn("font-mono", r.c)}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2 text-[10px] text-violet-300/80">
                  <p className="font-semibold text-violet-300">LOPDP Ecuador</p>
                  <p>Alineado con GDPR · Notificación 72h · DPO nombrado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KPIStat({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card size="sm" className="border-surface-700/50 bg-surface-900/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-surface-50">{value}</p>
        {sub && <p className="text-[10px] text-surface-500">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function EngineBadge({ name, desc, sub }: { name: string; desc: string; sub: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
      <div>
        <p className="font-mono text-[11px] font-semibold text-amber-300">{name}</p>
        <p className="text-[9px] text-amber-300/70">{desc}</p>
      </div>
      <span className="text-[9px] text-amber-400/60">{sub}</span>
    </div>
  )
}
