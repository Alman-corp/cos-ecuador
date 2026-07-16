"use client"

import { useEffect, useState } from "react"

interface TelemetryData {
  registration: string
  firstClient: string | null
  firstAnalysis: string | null
  firstReport: string | null
  firstPayment: string | null
  daysToFirstClient: number | null
  daysToFirstAnalysis: number | null
  daysToFirstReport: number | null
  daysToFirstPayment: number | null
}

export default function TelemetryPage() {
  const [data, setData] = useState<TelemetryData | null>(null)

  useEffect(() => {
    fetch("/api/system/telemetry").then((r) => r.json()).then(setData)
  }, [])

  const metrics = data ? [
    { label: "Registro", date: data.registration, days: 0, icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { label: "1er Cliente", date: data.firstClient, days: data.daysToFirstClient, icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { label: "1er Analisis", date: data.firstAnalysis, days: data.daysToFirstAnalysis, icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    { label: "1er Informe", date: data.firstReport, days: data.daysToFirstReport, icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { label: "1er Pago", date: data.firstPayment, days: data.daysToFirstPayment, icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  ] : []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-surface-50">Telemetria de Negocio</h1>
      <p className="text-sm text-surface-400">Mide el tiempo que toma cada hito desde el registro de la empresa.</p>

      {!data ? (
        <p className="text-sm text-surface-500">Cargando metricas...</p>
      ) : (
        <div className="space-y-4">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[23px] top-0 h-full w-0.5 bg-surface-700" />
            <div className="space-y-6">
              {metrics.map((m, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className={`z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    m.date ? "bg-accent-600/20 text-accent-400" : "bg-surface-800 text-surface-600"
                  }`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-surface-200">{m.label}</p>
                      {m.days !== null ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          m.days === 0 ? "bg-emerald-500/10 text-emerald-400" :
                          m.days <= 7 ? "bg-accent-500/10 text-accent-400" :
                          m.days <= 30 ? "bg-amber-500/10 text-amber-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>{m.days}d</span>
                      ) : (
                        <span className="rounded-full bg-surface-700/30 px-2.5 py-0.5 text-xs text-surface-500">Pendiente</span>
                      )}
                    </div>
                    {m.date && <p className="text-xs text-surface-500">{new Date(m.date).toLocaleDateString("es-EC")}</p>}
                    {m.days !== null && (
                      <p className="mt-2 text-xs text-surface-400">
                        {m.days === 0 ? "Dia 0 (registro)" : `+${m.days} dias desde registro`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Tiempo a 1er Cliente", value: data.daysToFirstClient, target: 7, unit: "dias" },
              { label: "Tiempo a 1er Analisis", value: data.daysToFirstAnalysis, target: 14, unit: "dias" },
              { label: "Tiempo a 1er Informe", value: data.daysToFirstReport, target: 21, unit: "dias" },
              { label: "Tiempo a 1er Pago", value: data.daysToFirstPayment, target: 30, unit: "dias" },
            ].map((s) => {
              const ok = s.value !== null && s.value <= s.target
              return (
                <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
                  <p className="text-xs text-surface-500 mb-1">{s.label}</p>
                  {s.value !== null ? (
                    <>
                      <p className={`text-2xl font-bold ${ok ? "text-emerald-400" : "text-amber-400"}`}>{s.value}{s.unit === "dias" ? "d" : s.unit}</p>
                      <p className={`mt-1 text-xs ${ok ? "text-emerald-400" : "text-rose-400"}`}>
                        Meta: {s.target}d {ok ? "(ok)" : "(excedido)"}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-surface-500">---</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
