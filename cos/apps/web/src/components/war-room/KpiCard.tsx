import type { ReactNode } from "react"

interface KpiCardProps {
  label: string
  value: string
  subvalue?: string
  icon?: ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
}

const variantStyles: Record<string, string> = {
  default: "border-surface-700/50 bg-surface-800/50",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-danger/30 bg-danger/5",
}

const textStyles: Record<string, string> = {
  default: "text-surface-50",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

const trendIcons: Record<string, ReactNode> = {
  up: (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ),
  down: (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
}

export function KpiCard({
  label,
  value,
  subvalue,
  icon,
  variant = "default",
  trend,
  trendLabel,
}: KpiCardProps) {
  const bgStyle = variantStyles[variant]
  const textStyle = textStyles[variant]

  return (
    <div className={`rounded-xl border p-5 ${bgStyle} transition-colors duration-300`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
          {label}
        </p>
        {icon && <span className="text-surface-400">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${textStyle} transition-colors duration-300`}>
          {value}
        </span>
        {subvalue && (
          <span className="text-xs text-surface-500">{subvalue}</span>
        )}
      </div>

      {trend && trendLabel && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trend === "up"
              ? "text-success"
              : trend === "down"
              ? "text-danger"
              : "text-surface-400"
          }`}>
            {trendIcons[trend]}
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  )
}
