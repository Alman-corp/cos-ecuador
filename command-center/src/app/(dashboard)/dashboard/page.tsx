"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { KPICard } from "@/components/shared/KPICard"
import { FinancialNarrative } from "@/components/shared/FinancialNarrative"
import { HeatmapGrid } from "@/components/shared/HeatmapGrid"
import { CommandPalette } from "@/components/shared/CommandPalette"
import { TimeMachine, type PeriodData } from "@/components/shared/TimeMachine"
import { PresentationMode } from "@/components/shared/PresentationMode"
import { AreaTrendChart } from "@/components/shared/Charts"
import { DraggableGrid, type GridWidget } from "@/components/shared/DraggableGrid"
import { PDFExport } from "@/components/shared/PDFExport"
import { registerJobHandler, enqueue } from "@/lib/job-queue"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query"
import type { DashboardData, Alert, ActivityItem } from "@/lib/shared-types"

// Lazy-loaded heavy components
const WaterfallChart = dynamic(() => import("@/components/shared/WaterfallChart").then((m) => ({ default: m.WaterfallChart })), {
  ssr: false,
  loading: () => <div className="flex h-[300px] items-center justify-center text-xs text-surface-500">Cargando gráfico…</div>,
})
const Chart3D = dynamic(() => import("@/components/shared/Chart3D").then((m) => ({ default: m.Chart3D })), {
  ssr: false,
  loading: () => <div className="flex h-[350px] items-center justify-center text-xs text-surface-500">Cargando visualización 3D…</div>,
})

function pct(current: number, prev: number) {
  if (prev === 0) return "—"
  const change = ((current - prev) / prev) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
}

function trend(current: number, prev: number): "up" | "down" {
  return current >= prev ? "up" : "down"
}

function alertLevel(current: number, prev: number, metric: string): "critical" | "warning" | "normal" {
  const chg = ((current - prev) / Math.abs(prev)) * 100
  if (metric === "revenue" && chg < -2) return "warning"
  if (metric === "netIncome" && chg < -20) return "critical"
  if (metric === "opex" && chg > 15) return "critical"
  if (metric === "opex" && chg > 8) return "warning"
  if (metric === "ebitda" && chg < -8) return "warning"
  if (metric === "fcf" && chg < -30) return "critical"
  if (chg < -10) return "warning"
  return "normal"
}

function buildQuarterly(kpis: DashboardData["kpis"]): PeriodData[] {
  return [{
    label: "Período Actual",
    data: {
      revenue: kpis.revenue,
      grossProfit: kpis.revenue - kpis.opex,
      ebitda: kpis.ebitda,
      netIncome: kpis.netIncome,
      fcf: kpis.freeCashFlow,
      cash: kpis.cashAndInvestments,
    },
  }]
}

// Register background job handlers
if (typeof window !== "undefined") {
  registerJobHandler("generate-report", async (job) => {
    await new Promise((r) => setTimeout(r, 2000))
  })
  registerJobHandler("sync-data", async (job) => {
    await new Promise((r) => setTimeout(r, 1500))
  })
}

export default function DashboardPage() {
  const { data: queryResult, isLoading, isError, error } = useDashboardQuery()

  const [presentation, setPresentation] = useState(false)
  const [whatIf, setWhatIf] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState("Período Actual")

  const kpis = queryResult?.data?.kpis
  const alerts = queryResult?.data?.alerts ?? []
  const recentActivity = queryResult?.data?.recentActivity ?? []

  const QUARTERLY_DATA: PeriodData[] = useMemo(() => {
    if (!kpis) return []
    return buildQuarterly(kpis)
  }, [kpis])

  const periodData = useMemo(() => {
    if (QUARTERLY_DATA.length === 0) return null
    const p = QUARTERLY_DATA.find((q) => q.label === currentPeriod)
    return p ?? QUARTERLY_DATA[0]
  }, [QUARTERLY_DATA, currentPeriod])

  const waterfallData = useMemo(() => {
    if (!kpis) return []
    return [
      { label: "Ingresos", value: kpis.revenue, type: "total" as const },
      { label: "COGS", value: -(kpis.revenue - (kpis.revenue - kpis.opex)), type: "negative" as const },
      { label: "Utilidad Bruta", value: kpis.revenue - kpis.opex, type: "total" as const },
      { label: "OPEX", value: -kpis.opex, type: "negative" as const },
      { label: "EBITDA", value: kpis.ebitda, type: "total" as const },
      { label: "D&A", value: -(kpis.ebitda - (kpis.revenue - kpis.opex - kpis.opex)), type: "negative" as const },
      { label: "EBIT", value: kpis.revenue - kpis.opex - kpis.opex, type: "total" as const },
      { label: "Utilidad Neta", value: kpis.netIncome, type: "total" as const },
    ]
  }, [kpis])

  const narrativeMetrics = useMemo(() => {
    if (!kpis) return []
    return [
      { label: "Revenue", current: kpis.revenue, previous: kpis.revenuePrev, higherIsBetter: true, history: [kpis.revenue, kpis.revenuePrev] },
      { label: "EBITDA", current: kpis.ebitda, previous: kpis.ebitdaPrev, higherIsBetter: true, history: [kpis.ebitda, kpis.ebitdaPrev] },
      { label: "Net Income", current: kpis.netIncome, previous: kpis.netIncomePrev, higherIsBetter: true, history: [kpis.netIncome, kpis.netIncomePrev] },
      { label: "Gross Margin", current: kpis.grossMargin, previous: kpis.grossMarginPrev, higherIsBetter: true },
      { label: "Free Cash Flow", current: kpis.freeCashFlow, previous: kpis.fcfPrev, higherIsBetter: true, history: [kpis.freeCashFlow, kpis.fcfPrev] },
      { label: "Cash", current: kpis.cashAndInvestments, previous: kpis.cashPrev, higherIsBetter: true },
      { label: "OPEX", current: kpis.opex, previous: kpis.opexPrev, higherIsBetter: false },
    ]
  }, [kpis])

  const healthCells = useMemo(() => {
    if (!kpis) return []
    return [
      { label: "Liquidez", value: `${(kpis.cashAndInvestments / 1e9).toFixed(1)}B`, score: 0.95, detail: "Evaluando liquidez" },
      { label: "Revenue Growth", value: `${kpis.revenueGrowth.toFixed(1)}%`, score: 0.5, detail: `vs período anterior` },
      { label: "Margen Bruto", value: `${kpis.grossMargin.toFixed(1)}%`, score: Math.min(kpis.grossMargin / 40, 1), detail: `Margen actual` },
      { label: "Margen EBITDA", value: `${kpis.ebitdaMargin.toFixed(1)}%`, score: Math.min(kpis.ebitdaMargin / 30, 1), detail: `Margen actual` },
      { label: "Margen Neto", value: `${kpis.netMargin.toFixed(1)}%`, score: Math.min(kpis.netMargin / 20, 1), detail: `vs ${kpis.netMarginPrev.toFixed(1)}% anterior` },
      { label: "FCF Generation", value: `${(kpis.freeCashFlow / 1e9).toFixed(1)}B`, score: 0.5, detail: `vs ${(kpis.fcfPrev / 1e9).toFixed(1)}B anterior` },
      { label: "OpEx Control", value: `${((kpis.opex / kpis.revenue) * 100).toFixed(1)}%`, score: Math.max(0, 1 - (kpis.opex / kpis.revenue) / 0.3), detail: `vs ${((kpis.opexPrev / kpis.revenuePrev) * 100).toFixed(1)}% anterior` },
      { label: "Solvencia", value: `${kpis.totalEquity > 0 ? ((kpis.totalAssets / kpis.totalEquity) * 100).toFixed(1) : "—"}%`, score: 0.5, detail: "Ratio de solvencia" },
    ]
  }, [kpis])

  const revenueSparkline = useMemo(() => kpis ? [kpis.revenue / 1e9, kpis.revenuePrev / 1e9] : [], [kpis])
  const ebitdaSparkline = useMemo(() => kpis ? [kpis.ebitda / 1e9, kpis.ebitdaPrev / 1e9] : [], [kpis])
  const fcfSparkline = useMemo(() => kpis ? [kpis.freeCashFlow / 1e9, kpis.fcfPrev / 1e9] : [], [kpis])
  const cashSparkline = useMemo(() => kpis ? [kpis.cashAndInvestments / 1e9, kpis.cashPrev / 1e9] : [], [kpis])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !kpis) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg className="h-7 w-7 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-surface-50">Error al cargar el Dashboard</h2>
        <p className="text-sm text-surface-400 max-w-md text-center">
          {error?.message ?? queryResult?.error ?? "No se pudieron obtener los datos financieros."}
        </p>
        <p className="text-xs text-surface-500">Verifica la conexión a la base de datos e intenta nuevamente.</p>
      </div>
    )
  }

  const pd = periodData?.data ?? { revenue: 0, grossProfit: 0, ebitda: 0, netIncome: 0, fcf: 0, cash: 0 }

  return (
    <div className={`space-y-6 transition-all duration-300 ${presentation ? "scale-105 origin-top" : ""}`}>
      <CommandPalette
        onWhatIf={() => setWhatIf(!whatIf)}
        onPresentation={() => setPresentation(!presentation)}
      />
      <PresentationMode active={presentation} onToggle={() => setPresentation(false)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">
            Dashboard Financiero
          </h1>
          <p className="text-sm text-surface-400">
            Datos desde financial_statements · Cifras en USD
          </p>
        </div>
          <div className="flex items-center gap-2">
          <PDFExport
            title="Dashboard Financiero"
            subtitle="COS Platform · Análisis Ejecutivo"
            sections={[
              { title: "Resumen de KPIs", content: `Revenue: $${(kpis.revenue / 1e9).toFixed(1)}B (${kpis.revenueGrowth >= 0 ? "+" : ""}${kpis.revenueGrowth.toFixed(1)}% vs anterior)\nEBITDA: $${(kpis.ebitda / 1e9).toFixed(1)}B (margen ${kpis.ebitdaMargin.toFixed(1)}%)\nFree Cash Flow: $${(kpis.freeCashFlow / 1e9).toFixed(1)}B\nCash: $${(kpis.cashAndInvestments / 1e9).toFixed(1)}B` },
              { title: "Estado de Resultados", content: `Ingresos: $${(kpis.revenue / 1e9).toFixed(1)}B\nEBITDA: $${(kpis.ebitda / 1e9).toFixed(1)}B\nNet Income: $${(kpis.netIncome / 1e9).toFixed(1)}B` },
              { title: "Márgenes", content: `Margen Bruto: ${kpis.grossMargin.toFixed(1)}%\nMargen EBITDA: ${kpis.ebitdaMargin.toFixed(1)}%\nMargen Neto: ${kpis.netMargin.toFixed(1)}%` },
            ]}
          />
          <button
            onClick={() => setWhatIf(!whatIf)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              whatIf ? "bg-warning/20 text-warning ring-1 ring-warning/30" : "bg-surface-800 text-surface-400 hover:text-surface-200"
            }`}
          >
            {whatIf ? "✏️ What-If Activo" : "What-If"}
          </button>
          <button
            onClick={() => setPresentation(!presentation)}
            className="rounded-lg bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 transition-colors"
          >
            🎬 Presentación
          </button>
        </div>
      </div>

      <TimeMachine
        periods={QUARTERLY_DATA}
        currentPeriod={currentPeriod}
        onPeriodChange={setCurrentPeriod}
        metricKeys={["revenue", "ebitda", "netIncome", "fcf", "cash"]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Revenue (TTM)"
          value={`$${(pd.revenue / 1e9).toFixed(1)}B`}
          change={`${kpis.revenueGrowth >= 0 ? "+" : ""}${kpis.revenueGrowth.toFixed(1)}% vs anterior`}
          trend={trend(kpis.revenue, kpis.revenuePrev)}
          alertLevel={alertLevel(kpis.revenue, kpis.revenuePrev, "revenue")}
          alertMessage={kpis.revenue < kpis.revenuePrev ? "Revenue en contracción interanual — monitorear tendencia" : undefined}
          sparklineData={revenueSparkline}
        />
        <KPICard
          label="EBITDA"
          value={`$${(kpis.ebitda / 1e9).toFixed(1)}B`}
          change={`${kpis.ebitdaMargin.toFixed(1)}% margin`}
          trend={trend(kpis.ebitda, kpis.ebitdaPrev)}
          alertLevel={alertLevel(kpis.ebitda, kpis.ebitdaPrev, "ebitda")}
          alertMessage={kpis.ebitda < kpis.ebitdaPrev ? "Margen comprimido por aumento de OPEX" : undefined}
          sparklineData={ebitdaSparkline}
          detailRows={[
            { label: "Margen Actual", value: `${kpis.ebitdaMargin.toFixed(1)}%`, trend: kpis.ebitdaMargin >= kpis.ebitdaMarginPrev ? "up" : "down" },
            { label: "Margen Anterior", value: `${kpis.ebitdaMarginPrev.toFixed(1)}%`, trend: kpis.ebitdaMargin >= kpis.ebitdaMarginPrev ? "down" : "up" },
            { label: "Variación", value: `${(kpis.ebitdaMargin - kpis.ebitdaMarginPrev).toFixed(1)}pp`, trend: kpis.ebitdaMargin >= kpis.ebitdaMarginPrev ? "up" : "down" },
          ]}
        />
        <KPICard
          label="Free Cash Flow"
          value={`$${(kpis.freeCashFlow / 1e9).toFixed(1)}B`}
          change={pct(kpis.freeCashFlow, kpis.fcfPrev)}
          trend={trend(kpis.freeCashFlow, kpis.fcfPrev)}
          alertLevel="normal"
          sparklineData={fcfSparkline}
          detailRows={[
            { label: "Operating CF", value: `${(kpis.operatingCashFlow / 1e9).toFixed(1)}B`, trend: "up" },
            { label: "CAPEX", value: `${(kpis.capex / 1e9).toFixed(1)}B`, trend: "down" },
          ]}
        />
        <KPICard
          label="Cash & Investments"
          value={`$${(kpis.cashAndInvestments / 1e9).toFixed(1)}B`}
          change={pct(kpis.cashAndInvestments, kpis.cashPrev)}
          trend={trend(kpis.cashAndInvestments, kpis.cashPrev)}
          alertLevel="normal"
          sparklineData={cashSparkline}
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-surface-200">Alertas</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 rounded-lg p-3 ${
                alert.severity === "critical" ? "bg-danger/5 border border-danger/20" :
                alert.severity === "warning" ? "bg-warning/5 border border-warning/20" :
                "bg-surface-900/50"
              }`}>
                <span className={`mt-0.5 flex h-2 w-2 rounded-full ${
                  alert.severity === "critical" ? "bg-danger" :
                  alert.severity === "warning" ? "bg-warning" :
                  "bg-success"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200">{alert.metric}</p>
                  <p className="text-xs text-surface-400">{alert.message}</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">
                    Valor: {alert.value.toLocaleString()} · Umbral: {alert.threshold.toLocaleString()}
                  </p>
                </div>
                <span className="text-[10px] text-surface-500 shrink-0">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-surface-200">Actividad Reciente</h3>
          <div className="space-y-1">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-800 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-surface-500">{item.type}</span>
                  <p className="text-sm text-surface-300 truncate">{item.description}</p>
                </div>
                <span className="text-[10px] text-surface-500 shrink-0 ml-4">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {whatIf && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-warning/30 bg-warning/5 p-4"
        >
          <p className="mb-2 text-sm font-medium text-warning">✏️ Modo What-If — Ajusta parámetros y ve el impacto</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { key: "revenue", label: "Revenue Growth", value: kpis.revenueGrowth, min: -10, max: 15 },
              { key: "margin", label: "Margen Bruto", value: kpis.grossMargin, min: 5, max: 30 },
              { key: "opex", label: "OPEX / Revenue", value: (kpis.opex / kpis.revenue) * 100, min: 5, max: 25 },
              { key: "fcf", label: "FCF Conversion", value: (kpis.freeCashFlow / kpis.ebitda) * 100, min: 0, max: 80 },
            ].map((s) => (
              <div key={s.key}>
                <label className="text-xs text-surface-400">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={s.min} max={s.max} step={0.1} defaultValue={s.value} className="w-full accent-warning" />
                  <span className="font-mono text-xs text-warning">{s.value.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <DraggableGrid
        storageKey="dashboard-widgets"
        widgets={[
          {
            id: "waterfall",
            title: "Waterfall P&L",
            content: (
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-surface-200">Puente de Resultados (Waterfall)</h3>
                <WaterfallChart items={waterfallData} height={300} />
              </div>
            ),
          },
          {
            id: "trend",
            title: "Tendencia",
            content: (
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-surface-200">Tendencia</h3>
                <AreaTrendChart
                  data={[
                    { label: "Anterior", Revenue: kpis.revenuePrev / 1e9, EBITDA: kpis.ebitdaPrev / 1e9 },
                    { label: "Actual", Revenue: kpis.revenue / 1e9, EBITDA: kpis.ebitda / 1e9 },
                  ]}
                  areas={[
                    { key: "Revenue", color: "#3b82f6", label: "Revenue ($B)" },
                    { key: "EBITDA", color: "#10b981", label: "EBITDA ($B)" },
                  ]}
                  height={180}
                />
              </div>
            ),
          },
          {
            id: "insights",
            title: "Insight Engine",
            content: (
              <FinancialNarrative metrics={narrativeMetrics} companyName="Compañía" />
            ),
          },
          {
            id: "health",
            title: "Salud Financiera",
            content: (
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
                <h3 className="mb-4 text-sm font-semibold text-surface-200">🏥 Salud Financiera</h3>
                <HeatmapGrid cells={healthCells} />
              </div>
            ),
          },
          {
            id: "pnl",
            title: "P&L Mensual",
            content: (
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-surface-200">Estado de Resultados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-700/50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                        <th className="pb-3 pr-4">Concepto</th>
                        <th className="pb-3 pr-4 text-right">Actual</th>
                        <th className="pb-3 pr-4 text-right">Anterior</th>
                        <th className="pb-3 text-right">Variación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-700/50">
                      {[
                        { concept: "Revenue", c: Math.round(kpis.revenue / 1e6), p: Math.round(kpis.revenuePrev / 1e6) },
                        { concept: "EBITDA", c: Math.round(kpis.ebitda / 1e6), p: Math.round(kpis.ebitdaPrev / 1e6) },
                        { concept: "Net Income", c: Math.round(kpis.netIncome / 1e6), p: Math.round(kpis.netIncomePrev / 1e6) },
                        { concept: "OPEX", c: Math.round(kpis.opex / 1e6), p: Math.round(kpis.opexPrev / 1e6) },
                        { concept: "FCF", c: Math.round(kpis.freeCashFlow / 1e6), p: Math.round(kpis.fcfPrev / 1e6) },
                      ].map((row) => {
                        const chg = row.p !== 0 ? ((row.c - row.p) / row.p) * 100 : 0
                        return (
                          <tr key={row.concept} className="hover:bg-surface-800">
                            <td className="py-3 pr-4 font-medium text-surface-200">{row.concept}</td>
                            <td className="py-3 pr-4 text-right font-mono text-surface-300">${(row.c / 1000).toFixed(1)}M</td>
                            <td className="py-3 pr-4 text-right font-mono text-surface-400">${(row.p / 1000).toFixed(1)}M</td>
                            <td className={`py-3 text-right font-mono ${chg >= 0 ? "text-success" : "text-danger"}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
