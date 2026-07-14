"use client"

import { CheckCircle2 } from "lucide-react"
import type { ReactNode } from "react"

export interface Step {
  id: string
  label: string
  icon: ReactNode
}

export function WizardSteps({
  steps,
  current,
}: {
  steps: Step[]
  current: number
}) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((s, i) => {
        const isActive = i === current
        const isDone = i < current
        return (
          <div key={s.id} className="flex items-center gap-3 flex-1">
            <div
              className={`flex items-center gap-3 ${
                isActive
                  ? "text-surface-50"
                  : isDone
                    ? "text-success"
                    : "text-surface-600"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-accent-500 bg-accent-500/10"
                    : isDone
                      ? "border-success bg-success/10"
                      : "border-surface-700"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{s.icon}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider">
                  Paso {i + 1}
                </p>
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`hidden sm:block flex-1 h-px mx-4 ${
                  isDone ? "bg-success/40" : "bg-surface-800"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
