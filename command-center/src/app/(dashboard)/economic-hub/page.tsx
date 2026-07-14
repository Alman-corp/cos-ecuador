"use client"

import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useEconomicIndicators } from "@/lib/hooks/use-economic-indicators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`
}

function IndicatorCard({ label, value, subtitle, badge }: { label: string; value: string; subtitle?: string; badge?: { text: string; variant: "default" | "secondary" | "destructive" | "outline" } }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</CardTitle>
        {badge && <Badge variant={badge.variant} className="w-fit">{badge.text}</Badge>}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-surface-50">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-surface-400">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EconomicHubPage() {
  const { data, isLoading, isError, error } = useEconomicIndicators()

  if (isLoading) return <LoadingSkeleton />

  if (isError || !data) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg className="h-7 w-7 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-surface-50">Error al cargar indicadores económicos</h2>
        <p className="text-sm text-surface-400 max-w-md text-center">
          {error?.message ?? "No se pudieron obtener los datos del BCE / INEC."}
        </p>
        <p className="text-xs text-surface-500">Verifica la conexión e intenta nuevamente.</p>
      </div>
    )
  }

  const {
    tasaActiva, tasaPasiva, riesgoPais,
    inflacionINPC, canastaBasica, sbu,
  } = data

  const canastaCoverage = canastaBasica.ingresoFamiliar > 0
    ? ((canastaBasica.ingresoFamiliar / canastaBasica.value) * 100).toFixed(1)
    : "—"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Economic Hub</h1>
        <p className="text-sm text-surface-400">
          Indicadores macroeconómicos del Ecuador · BCE, INEC y Ministerio del Trabajo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="Tasa Activa"
          value={formatPercent(tasaActiva.value)}
          subtitle={tasaActiva.fuente}
          badge={{ text: tasaActiva.fecha, variant: "outline" }}
        />
        <IndicatorCard
          label="Tasa Pasiva"
          value={formatPercent(tasaPasiva.value)}
          subtitle={tasaPasiva.fuente}
          badge={{ text: tasaPasiva.fecha, variant: "outline" }}
        />
        <IndicatorCard
          label="Riesgo País (EMBI)"
          value={`${riesgoPais.value} pts`}
          subtitle={riesgoPais.fuente}
          badge={{ text: riesgoPais.fecha, variant: riesgoPais.value > 1000 ? "destructive" : "secondary" }}
        />
        <IndicatorCard
          label="Inflación INPC (anual)"
          value={formatPercent(inflacionINPC.value)}
          subtitle={inflacionINPC.fuente}
          badge={{ text: inflacionINPC.periodo, variant: "outline" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-surface-500">Canasta Básica Familiar</CardTitle>
            <Badge variant="outline" className="w-fit">{canastaBasica.periodo}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-surface-400">Valor canasta</p>
              <p className="text-2xl font-bold text-surface-50">{formatCurrency(canastaBasica.value)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-surface-400">Ingreso familiar</p>
                <p className="text-lg font-semibold text-surface-200">{formatCurrency(canastaBasica.ingresoFamiliar)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Canasta vital</p>
                <p className="text-lg font-semibold text-surface-200">{formatCurrency(canastaBasica.canastaVital)}</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs text-surface-400">Cobertura (ingreso / canasta)</p>
              <p className={`text-lg font-bold ${Number(canastaCoverage) >= 80 ? "text-success" : "text-warning"}`}>
                {canastaCoverage}%
              </p>
            </div>
            <p className="text-[10px] text-surface-500">{canastaBasica.fuente}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-surface-500">Salario Básico Unificado</CardTitle>
            <Badge variant="outline" className="w-fit">{sbu.vigencia}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-surface-50">{formatCurrency(sbu.value)}</p>
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs text-surface-400">Relación SBU / Canasta</p>
              <p className="text-lg font-bold text-danger">
                {((sbu.value / canastaBasica.value) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-surface-500 mt-1">El SBU cubre {((sbu.value / canastaBasica.value) * 100).toFixed(1)}% de la canasta básica</p>
            </div>
            <p className="text-[10px] text-surface-500">{sbu.fuente}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
        <p className="text-xs text-surface-500">
          Fuentes: Banco Central del Ecuador (BCE), Instituto Nacional de Estadística y Censos (INEC),
          Ministerio del Trabajo. Datos actualizados al momento de la consulta.
        </p>
      </div>
    </div>
  )
}
