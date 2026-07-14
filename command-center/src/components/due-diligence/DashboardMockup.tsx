"use client"

import { ArrowRight, TrendingUp, Shield, DollarSign, Activity } from "lucide-react"
import { motion } from "framer-motion"

export function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-accent-500/10 via-transparent to-transparent blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative rounded-2xl border border-surface-700/50 bg-surface-900/90 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-surface-700/50 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-600/10 ring-1 ring-accent-500/20">
              <div className="h-3 w-3 rounded-full bg-accent-400" />
            </div>
            <span className="text-xs font-semibold text-surface-200">
              Centro de Comandos
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-danger" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning" />
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Ingresos", value: "$45.2M", change: "+14.7%" },
              { label: "EBITDA", value: "$12.8M", change: "+9.3%" },
              { label: "Deuda", value: "$18.5M", change: "-5.2%" },
              { label: "Rating", value: "BBB+", change: "+1" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-surface-800/50 p-2.5">
                <p className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-sm font-semibold text-surface-50 mt-0.5">
                  {kpi.value}
                </p>
                <span
                  className={`text-[10px] font-medium ${
                    kpi.change.startsWith("+") ? "text-success" : "text-danger"
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-surface-800 bg-surface-800/30 p-3">
              <p className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider mb-2">
                Proyección
              </p>
              <svg viewBox="0 0 200 60" className="w-full h-12">
                <path
                  d="M0,50 Q25,45 50,30 T100,20 T150,10 T200,15"
                  fill="none"
                  stroke="rgb(59,130,246)"
                  strokeWidth="2"
                />
                <path
                  d="M0,50 Q25,45 50,30 T100,20 T150,10 T200,15 L200,60 L0,60Z"
                  fill="url(#grad)"
                  opacity="0.15"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59,130,246)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="rounded-lg border border-surface-800 bg-surface-800/30 p-3">
              <p className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider mb-2">
                Riesgos
              </p>
              <div className="space-y-1.5">
                {["Operacional", "Mercado", "Crédito"].map((r) => (
                  <div key={r} className="flex items-center justify-between text-xs">
                    <span className="text-surface-400">{r}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-surface-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r === "Operacional"
                              ? "w-3/4 bg-warning"
                              : r === "Mercado"
                                ? "w-1/2 bg-success"
                                : "w-2/3 bg-accent-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 py-2 text-xs font-medium text-white hover:bg-accent-500 transition-colors">
              Nueva DD
              <ArrowRight className="h-3 w-3" />
            </button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-700 px-3 py-2 text-xs font-medium text-surface-300 hover:bg-surface-800 transition-colors">
              Reportes
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute -left-16 top-1/3 hidden rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success lg:block"
      >
        ● En vivo
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute -right-20 top-1/2 hidden rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-400 lg:block"
      >
        IA activa
      </motion.div>
    </div>
  )
}
