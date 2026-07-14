"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { SectionHeading } from "./SectionHeading"

const plans = [
  {
    name: "Starter",
    monthly: 2997,
    yearly: 2497,
    description: "Para firmas pequeñas que quieren profesionalizar su operación.",
    features: [
      "Hasta 3 usuarios",
      "1 proyecto activo",
      "Dashboards básicos",
      "RAG con ISD (500 docs/mes)",
      "Soporte por email",
      "Reportes básicos PDF",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    monthly: 5997,
    yearly: 4997,
    description: "Para firmas en expansión que necesitan escalar sin fricción.",
    features: [
      "Hasta 15 usuarios",
      "Proyectos ilimitados",
      "Dashboards avanzados + KPIs",
      "RAG con ISD (5000 docs/mes)",
      "7 agentes IA especializados",
      "Memoria institucional completa",
      "Portal cliente white-label",
      "Soporte prioritario 24/7",
      "Excel export con fórmulas vivas",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    description: "Para organizaciones que requieren control total y personalización.",
    features: [
      "Usuarios ilimitados",
      "Todo lo de Growth +",
      "AI agents personalizados",
      "On-premise deployment",
      "SLA 99.99%",
      "Customer Success dedicado",
      "Integraciones custom",
      "Auditoría de seguridad",
      "Training y certificación",
    ],
    highlighted: false,
    custom: true,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="relative py-32" id="pricing">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.05),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4">
        <SectionHeading
          label="Pricing"
          title="Inversión clara, sin sorpresas"
          description="Todo lo que necesitas para transformar tu firma. Precios en USD."
        />

        <div className="mb-10 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium ${!annual ? "text-surface-200" : "text-surface-500"}`}
          >
            Mensual
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? "bg-accent-600" : "bg-surface-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                annual                 ? "translate-x-[1.375rem]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${annual ? "text-surface-200" : "text-surface-500"}`}
          >
            Anual{" "}
            <span className="ml-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-bold text-accent-400">
              2 meses gratis
            </span>
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.highlighted
                  ? "border-accent-500/30 bg-accent-500/5 shadow-xl shadow-accent-500/5"
                  : "border-surface-800 bg-surface-900/50 hover:border-surface-700"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-600 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                  Más Popular
                </div>
              )}

              {plan.highlighted && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-50 blur-sm"
                  style={{
                    background:
                      "radial-gradient(400px at 50% 0%, rgba(59,130,246,0.15), transparent)",
                  }}
                />
              )}

              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-surface-100">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-surface-400">
                  {plan.description}
                </p>

                <div className="mt-6 mb-8">
                  {plan.custom ? (
                    <p className="text-2xl font-bold text-surface-50">
                      A la medida
                    </p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-surface-50">
                        $
                        {(annual ? plan.yearly! : plan.monthly!).toLocaleString()}
                      </span>
                      <span className="text-sm text-surface-500">/mes</span>
                    </div>
                  )}
                  {!plan.custom && annual && (
                    <p className="mt-1 text-xs text-success">
                      ${(plan.yearly! * 10).toLocaleString()} facturado
                      anualmente
                    </p>
                  )}
                </div>

                <Link
                  href={plan.custom ? "#" : "/auth/login"}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-accent-600 text-white shadow-lg shadow-accent-600/25 hover:bg-accent-500"
                      : "border border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-surface-100"
                  }`}
                >
                  {plan.custom ? "Contactar Ventas" : "Ir al Dashboard"}
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-surface-400"
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.highlighted
                            ? "text-accent-400"
                            : "text-surface-600"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
