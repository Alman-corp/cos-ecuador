"use client"

import type { SimulationResult } from "@/types/simulation"
import { KpiCard } from "./KpiCard"
import { AlertTriangle, TrendingDown, DollarSign, BarChart3 } from "lucide-react"

interface KpiGridProps {
  result: SimulationResult
}

export function KpiGrid({ result }: KpiGridProps) {
  const runwayVariant =
    result.runway >= 99 || result.runway > 6
      ? "success"
      : result.runway > 3
      ? "warning"
      : "danger"

  const balanceVariant = result.finalBalance > 0 ? "success" : "danger"
  const netCashVariant = result.netCash > 0 ? "success" : "danger"

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Cash Runway"
        value={result.runway >= 99 ? "∞" : `${result.runway.toFixed(1)} meses`}
        subvalue={result.runway < 6 ? "Requiere acción" : "Saludable"}
        icon={<AlertTriangle size={16} />}
        variant={runwayVariant}
        trend={result.runway > 6 ? "up" : "down"}
        trendLabel={result.runway > 6 ? "Estable" : `${result.runway.toFixed(1)}m`}
      />

      <KpiCard
        label="Saldo Final (M6)"
        value={`$${(result.finalBalance / 1000).toFixed(0)}k`}
        subvalue={result.isHealthy ? "≥ 50% inicial" : "< 50% inicial"}
        icon={<DollarSign size={16} />}
        variant={balanceVariant}
      />

      <KpiCard
        label="Flujo Neto Mensual"
        value={`$${(result.netCash / 1000).toFixed(0)}k`}
        subvalue={result.netCash > 0 ? "Positivo" : "Negativo"}
        icon={<TrendingDown size={16} />}
        variant={netCashVariant}
        trend={result.netCash > 0 ? "up" : "down"}
        trendLabel={result.netCash > 0 ? "+" : ""}
      />

      <KpiCard
        label="Prob. Caja Positiva (M6)"
        value={`${(result.probPositiveCash * 100).toFixed(0)}%`}
        subvalue={
          result.probPositiveCash > 0.8
            ? "Alta confianza"
            : result.probPositiveCash > 0.5
            ? "Moderada"
            : "Baja confianza"
        }
        icon={<BarChart3 size={16} />}
        variant={
          result.probPositiveCash > 0.8
            ? "success"
            : result.probPositiveCash > 0.5
            ? "warning"
            : "danger"
        }
      />
    </div>
  )
}
