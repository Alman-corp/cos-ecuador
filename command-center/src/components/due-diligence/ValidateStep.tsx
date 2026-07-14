"use client"

import { useState, useEffect } from "react"
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const CHECKS = [
  { id: "completeness", label: "Completitud", weight: 35 },
  { id: "consistency", label: "Consistencia", weight: 30 },
  { id: "outliers", label: "Valores atípicos", weight: 20 },
  { id: "coverage", label: "Cobertura temporal", weight: 15 },
]

interface CheckResult {
  id: string
  status: "pass" | "warn" | "fail"
  detail: string
  score: number
}

function runChecks(): CheckResult[] {
  return [
    { id: "completeness", status: "pass", detail: "Balance General, PyG y Cash Flow presentes", score: 100 },
    { id: "consistency", status: "pass", detail: "Assets = Liabilities + Equity en todos los periodos", score: 95 },
    { id: "outliers", status: "warn", detail: "Revenue 2025: +42% YoY — fuera del rango esperado (±30%)", score: 65 },
    { id: "coverage", status: "pass", detail: "3 años consecutivos detectados (2023-2025)", score: 100 },
  ]
}

export function ValidateStep({
  onNext,
}: {
  data: { name?: string }
  onNext: () => void
}) {
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(runChecks())
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const totalScore =
    results
      ? Math.round(
          results.reduce((a, r) => {
            const w = CHECKS.find((c) => c.id === r.id)?.weight ?? 0
            return a + (r.score * w) / 100
          }, 0)
        )
      : 0

  const statusIcon = (s: CheckResult["status"]) => {
    if (s === "pass") return <CheckCircle2 className="h-4 w-4 text-success" />
    if (s === "warn") return <AlertTriangle className="h-4 w-4 text-warning" />
    return <XCircle className="h-4 w-4 text-danger" />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-surface-50 mb-2">
          Validación de datos
        </h1>
        <p className="text-surface-400">
          Revisando integridad y consistencia de los archivos subidos.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Validando archivos">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <p className="mt-4 text-sm text-surface-500">Analizando datos...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-surface-800 bg-surface-900/50 p-6">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                totalScore >= 80
                  ? "bg-success/10 text-success"
                  : totalScore >= 50
                    ? "bg-warning/10 text-warning"
                    : "bg-danger/10 text-danger"
              }`}
            >
              {totalScore}
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-200">
                Calidad de Datos
              </p>
              <p className="text-xs text-surface-500">
                {totalScore >= 80
                  ? "Datos listos para análisis"
                  : totalScore >= 50
                    ? "Requiere revisión manual"
                    : "Datos insuficientes"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {results?.map((r) => {
              const check = CHECKS.find((c) => c.id === r.id)
              return (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    r.status === "pass"
                      ? "border-success/20 bg-success/5"
                      : r.status === "warn"
                        ? "border-warning/20 bg-warning/5"
                        : "border-danger/20 bg-danger/5"
                  }`}
                >
                  <span className="mt-0.5">{statusIcon(r.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-surface-200">
                        {check?.label}
                      </p>
                      <span className="text-xs font-mono text-surface-500">
                        {check?.weight}%
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {r.detail}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono font-medium ${
                      r.score >= 80
                        ? "text-success"
                        : r.score >= 50
                          ? "text-warning"
                          : "text-danger"
                    }`}
                  >
                    {r.score}%
                  </span>
                </div>
              )
            })}
          </div>

          <Button
            onClick={onNext}
            className="w-full"
          >
            Configurar análisis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
