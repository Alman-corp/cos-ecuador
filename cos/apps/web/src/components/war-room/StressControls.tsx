"use client"

import type { SimParams } from "@/types/simulation"
import { DollarSign, Percent, Clock, TrendingUp, TrendingDown, Banknote } from "lucide-react"

interface SliderDef {
  key: keyof SimParams
  label: string
  icon: React.ReactNode
  min: number
  max: number
  step: number
  unit: string
  display: (v: number) => string
  toRaw: (v: number) => number
  fromRaw: (v: number) => number
}

const SLIDERS: SliderDef[] = [
  {
    key: "daysReceivable",
    label: "Días de cobro (DSO)",
    icon: <Clock size={14} />,
    min: 15, max: 120, step: 5, unit: "días",
    display: (v) => `${v}`,
    toRaw: (v) => v,
    fromRaw: (v) => v,
  },
  {
    key: "daysPayable",
    label: "Días de pago (DPO)",
    icon: <Banknote size={14} />,
    min: 15, max: 90, step: 5, unit: "días",
    display: (v) => `${v}`,
    toRaw: (v) => v,
    fromRaw: (v) => v,
  },
  {
    key: "interestRate",
    label: "Costo de deuda",
    icon: <Percent size={14} />,
    min: 0, max: 30, step: 0.5, unit: "%",
    display: (v) => `${v}%`,
    toRaw: (v) => v / 100,
    fromRaw: (v) => v * 100,
  },
  {
    key: "revenueGrowth",
    label: "Crecimiento ingresos",
    icon: <TrendingUp size={14} />,
    min: -20, max: 30, step: 1, unit: "%",
    display: (v) => `${v > 0 ? "+" : ""}${v}%`,
    toRaw: (v) => v / 100,
    fromRaw: (v) => v * 100,
  },
  {
    key: "opexGrowth",
    label: "Crecimiento OPEX",
    icon: <TrendingDown size={14} />,
    min: -10, max: 20, step: 1, unit: "%",
    display: (v) => `${v > 0 ? "+" : ""}${v}%`,
    toRaw: (v) => v / 100,
    fromRaw: (v) => v * 100,
  },
  {
    key: "initialCash",
    label: "Caja inicial",
    icon: <DollarSign size={14} />,
    min: 50, max: 5000, step: 50, unit: "$k",
    display: (v) => `$${(v / 1000).toFixed(0)}k`,
    toRaw: (v) => v,
    fromRaw: (v) => v,
  },
]

interface StressControlsProps {
  params: SimParams
  onChange: (key: keyof SimParams, value: number) => void
  onReset: () => void
}

export function StressControls({ params, onChange, onReset }: StressControlsProps) {
  return (
    <div className="space-y-5 rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Variables de estrés
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-surface-500 underline underline-offset-2 transition-colors hover:text-surface-300"
          type="button"
        >
          Restablecer
        </button>
      </div>

      {SLIDERS.map((slider) => {
        const displayValue = slider.fromRaw(params[slider.key])

        return (
          <div key={slider.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor={`slider-${slider.key}`}
                className="flex items-center gap-1.5 text-xs font-medium text-surface-300"
              >
                {slider.icon}
                {slider.label}
              </label>
              <span className="font-mono text-xs tabular-nums text-surface-400">
                {slider.display(displayValue)}
              </span>
            </div>

            <div className="relative h-1.5 rounded-full bg-surface-700">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-accent-500 transition-all duration-150"
                style={{ width: `${((displayValue - slider.min) / (slider.max - slider.min)) * 100}%` }}
              />
              <input
                id={`slider-${slider.key}`}
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={displayValue}
                onChange={(e) => onChange(slider.key, slider.toRaw(Number(e.target.value)))}
                aria-label={slider.label}
                aria-valuemin={slider.min}
                aria-valuemax={slider.max}
                aria-valuenow={displayValue}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
