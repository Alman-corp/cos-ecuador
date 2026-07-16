interface KPICardProps {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
}

export function KPICard({ label, value, change, trend }: KPICardProps) {
  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
        {label}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-surface-50">{value}</span>

        {change && trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend === "up"
                ? "text-success"
                : trend === "down"
                ? "text-danger"
                : "text-surface-400"
            }`}
          >
            {trend === "up" ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            ) : trend === "down" ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            ) : null}
            {change}
          </span>
        )}
      </div>
    </div>
  )
}
