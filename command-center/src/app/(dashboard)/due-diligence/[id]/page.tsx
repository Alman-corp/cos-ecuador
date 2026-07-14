"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowRight, FileText, DollarSign, Shield } from "lucide-react"
import { KPICard } from "@/components/shared/KPICard"
import { TrendChart, PieChartView } from "@/components/shared/Charts"
import { DDChatPanel } from "@/components/due-diligence/DDChatPanel"

export default function ClientDashboardPage() {
  const params = useParams()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-surface-700/50 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-50">
            Dashboard - {params.id as string}
          </h1>
          <p className="text-xs text-surface-500">
            Resumen ejecutivo · Última actualización: hoy 14:32
          </p>
        </div>
        <button
          onClick={() => router.push(`/due-diligence/${params.id}/analysis`)}
          className="flex items-center gap-2 rounded-xl bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors"
        >
          Ver análisis completo
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Revenue TTM"
            value="$45.2M"
            change="+14.7%"
          />
          <KPICard
            label="EBITDA"
            value="$12.8M"
            change="+9.3%"
          />
          <KPICard
            label="Deuda Neta"
            value="$18.5M"
            change="-5.2%"
          />
          <KPICard
            label="Rating"
            value="BBB+"
            change="+1"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-surface-800 bg-surface-900/50 p-5">
            <h3 className="mb-4 text-sm font-medium text-surface-200">
              Revenue & EBITDA
            </h3>
            <TrendChart
              data={[
                { label: "2021", revenue: 32.5, ebitda: 9.2 },
                { label: "2022", revenue: 36.1, ebitda: 10.5 },
                { label: "2023", revenue: 40.8, ebitda: 11.8 },
                { label: "2024", revenue: 45.2, ebitda: 12.8 },
              ]}
              lines={[
                { key: "revenue", color: "#3b82f6", label: "Revenue (M)" },
                { key: "ebitda", color: "#10b981", label: "EBITDA (M)" },
              ]}
            />
          </div>
          <div className="rounded-2xl border border-surface-800 bg-surface-900/50 p-5">
            <h3 className="mb-4 text-sm font-medium text-surface-200">
              Composición del Revenue
            </h3>
            <PieChartView
              data={[
                { name: "Producto A", value: 42, color: "#3b82f6" },
                { name: "Producto B", value: 28, color: "#10b981" },
                { name: "Producto C", value: 18, color: "#f59e0b" },
                { name: "Otros", value: 12, color: "#64748b" },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Informe Ejecutivo", desc: "Resumen de hallazgos clave", icon: FileText },
            { title: "Valuación", desc: "DCF y múltiplos de mercado", icon: DollarSign },
            { title: "Matriz de Riesgos", desc: "17 riesgos identificados", icon: Shield },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-surface-800 bg-surface-900/50 p-5 hover:border-surface-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10">
                  <card.icon className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-200">
                    {card.title}
                  </p>
                  <p className="text-xs text-surface-500">{card.desc}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/due-diligence/${params.id}/analysis`)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors"
              >
                Ver detalle
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </main>

      <DDChatPanel clientId={params.id as string} />
    </div>
  )
}
