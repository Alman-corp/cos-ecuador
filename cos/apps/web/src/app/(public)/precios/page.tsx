"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Starter",
    tagline: "Para consultores independientes",
    price: 497,
    features: [
      "Hasta 3 clientes activos",
      "Dashboard financiero básico",
      "Subida de documentos (PDF/Excel)",
      "Ratios financieros automáticos",
      "Portal cliente básico",
      "Soporte por email",
    ],
    tier: "starter" as const,
  },
  {
    name: "Professional",
    tagline: "Para consultoras en crecimiento",
    price: 1297,
    popular: true,
    features: [
      "Hasta 15 clientes activos",
      "Dashboard completo + Sala de Guerra",
      "Procesamiento automático de balances",
      "DCF, WACC, Monte Carlo",
      "Alertas predictivas de liquidez",
      "Portal cliente completo",
      "Simulador de estrés financiero",
      "Soporte prioritario 24/7",
    ],
    tier: "professional" as const,
  },
  {
    name: "Enterprise",
    tagline: "Para firmas con operaciones complejas",
    price: 3497,
    features: [
      "Clientes ilimitados",
      "Todos los módulos (15/15)",
      "Agentes IA especializados",
      "API completa + Webhooks",
      "Onboarding dedicado",
      "White label (marca propia)",
      "SLA 99.9% uptime",
      "Gerente de cuenta asignado",
    ],
    tier: "enterprise" as const,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe(tier: string) {
    setLoading(tier)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 text-surface-100">
      {/* Nav */}
      <header className="border-b border-surface-800 bg-surface-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600/10 ring-1 ring-accent-500/20">
              <svg className="h-4 w-4 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-surface-50">Consulting OS</span>
          </Link>
        </div>
      </header>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold text-surface-50">Invierte en tu eficiencia</h1>
            <p className="mt-4 text-lg text-surface-400">
              El ROI se mide en horas recuperadas y clientes retenidos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition-all ${
                  plan.popular
                    ? "border-accent-500 bg-accent-600/5 shadow-lg shadow-accent-600/10"
                    : "border-surface-800 bg-surface-900 hover:border-surface-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-600 px-4 py-1 text-xs font-semibold text-white">
                    Más popular
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-surface-200">{plan.name}</h2>
                  <p className="mt-1 text-xs text-surface-500">{plan.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-surface-50">${plan.price}</span>
                    <span className="text-sm text-surface-500">/mes</span>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-surface-400">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loading === plan.tier}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-accent-600 text-white hover:bg-accent-500"
                      : "border border-surface-700 bg-surface-800 text-surface-200 hover:bg-surface-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {loading === plan.tier ? "Procesando..." : "Suscribirse"}
                </button>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-xs text-surface-600">
            ¿Ya tienes una suscripción?{" "}
            <Link href="/auth/login" className="text-accent-400 hover:text-accent-300">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
