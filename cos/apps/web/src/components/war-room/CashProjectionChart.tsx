"use client"

import type { MonthProjection } from "@/types/simulation"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface CashProjectionChartProps {
  data: MonthProjection[]
}

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: "12px",
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`
}

export function CashProjectionChart({ data }: CashProjectionChartProps) {
  const minBalance = Math.min(...data.map((d) => d.balance))
  const isCrossingZero = minBalance <= 0

  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200">
          Proyección de Caja a 6 Meses
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-surface-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            Solvencia
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-danger" />
            Déficit
          </span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isCrossingZero ? "#ef4444" : "#10b981"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isCrossingZero ? "#ef4444" : "#10b981"} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip
              contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value) || 0), "Saldo de Caja"]}
              labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
            />

            <ReferenceLine
              y={0}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "LÍNEA DE INSOLVENCIA",
                fill: "#ef4444",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              stroke={isCrossingZero ? "#ef4444" : "#10b981"}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cashGradient)"
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-1">
        {data.map((m) => {
          const maxBalance = Math.max(...data.map((d) => d.balance), 1)
          const heightPct = (m.balance / maxBalance) * 100
          const barColor =
            m.balance > data[0].balance * 0.5
              ? "bg-success"
              : m.balance > 0
              ? "bg-warning"
              : "bg-danger"

          return (
            <div key={m.month} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${barColor}`}
                  style={{ height: `${Math.max(heightPct, 1.5)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-surface-500">{m.month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
