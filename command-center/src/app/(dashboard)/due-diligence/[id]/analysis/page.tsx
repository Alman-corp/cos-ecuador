"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Download } from "lucide-react"
import { KPICard } from "@/components/shared/KPICard"
import { TrendChart, BarChartView } from "@/components/shared/Charts"
import { DDChatPanel } from "@/components/due-diligence/DDChatPanel"

const MODULES = [
  { id: "dcf", label: "DCF", color: "bg-blue-500" },
  { id: "comparables", label: "Comparables", color: "bg-emerald-500" },
  { id: "stress", label: "Stress", color: "bg-amber-500" },
  { id: "margins", label: "Márgenes", color: "bg-violet-500" },
]

export default function AnalysisPage() {
  const params = useParams()
  const [progress, setProgress] = useState(0)
  const [activeModule, setActiveModule] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          return 100
        }
        return p + Math.random() * 8 + 1
      })
    }, 800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-surface-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-surface-50">
              Due Diligence en vivo
            </h1>
            <p className="text-xs text-surface-500">
              Cliente: {params.id as string} · Análisis en curso
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-surface-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              {Math.round(progress)}% completado
            </span>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-surface-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mt-4 flex gap-2">
          {MODULES.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(i)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeModule === i
                  ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                  : "border-surface-700 text-surface-500 hover:text-surface-300"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${m.color}`} />
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Revenue"
            value="$12.4M"
            change="+12.3%"
          />
          <KPICard
            label="EBITDA"
            value="$3.8M"
            change="+8.1%"
          />
          <KPICard
            label="Riesgo País"
            value="8.2%"
            change="-2.4%"
          />
          <KPICard
            label="WACC"
            value="11.4%"
            change="+0.3%"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-surface-800 bg-surface-900/50 p-5">
            <h3 className="mb-4 text-sm font-medium text-surface-200">
              Proyección de Revenue
            </h3>
            <TrendChart
              data={[
                { label: "Ene", revenue: 10.2, ebitda: 3.1 },
                { label: "Feb", revenue: 10.8, ebitda: 3.3 },
                { label: "Mar", revenue: 11.1, ebitda: 3.4 },
                { label: "Abr", revenue: 11.5, ebitda: 3.5 },
                { label: "May", revenue: 12.0, ebitda: 3.7 },
                { label: "Jun", revenue: 12.4, ebitda: 3.8 },
              ]}
              lines={[
                { key: "revenue", color: "#3b82f6", label: "Revenue" },
                { key: "ebitda", color: "#10b981", label: "EBITDA" },
              ]}
            />
          </div>
          <div className="rounded-2xl border border-surface-800 bg-surface-900/50 p-5">
            <h3 className="mb-4 text-sm font-medium text-surface-200">
              Comparación de Márgenes
            </h3>
            <BarChartView
              data={[
                { label: "Bruto", actual: 42, target: 45 },
                { label: "Operativo", actual: 28, target: 30 },
                { label: "Neto", actual: 18, target: 20 },
              ]}
              bars={[
                { key: "actual", color: "#3b82f6", label: "Actual" },
                { key: "target", color: "#64748b", label: "Target" },
              ]}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-surface-800 bg-surface-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-surface-200">
              Stress Testing
            </h3>
            <button className="flex items-center gap-1.5 rounded-lg border border-surface-700 px-2.5 py-1 text-[10px] font-medium text-surface-400 hover:text-surface-200 transition-colors">
              <Download className="h-3 w-3" />
              Exportar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pesimista", revenue: "-15.2%", ebitda: "-22.1%", color: "text-danger" },
              { label: "Base", revenue: "+8.4%", ebitda: "+12.3%", color: "text-warning" },
              { label: "Optimista", revenue: "+24.7%", ebitda: "+35.9%", color: "text-success" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-surface-800 bg-surface-900/30 p-4 text-center"
              >
                <p className="text-xs font-medium text-surface-500 mb-1">
                  {s.label}
                </p>
                <p className={`text-lg font-semibold ${s.color}`}>
                  {s.revenue}
                </p>
                <p className="text-xs text-surface-500">
                  EBITDA: {s.ebitda}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <DDChatPanel clientId={params.id as string} />
    </div>
  )
}
