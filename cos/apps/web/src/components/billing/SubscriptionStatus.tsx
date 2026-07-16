"use client"

import { useState, useEffect } from "react"

interface Subscription {
  id: string
  status: string
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  amount: number | null
  currency: string
}

export function SubscriptionStatus({ customerId }: { customerId?: string }) {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setLoading(false); return }
    fetch(`/api/stripe/subscription?customerId=${customerId}`)
      .then((r) => r.json())
      .then((data) => setSub(data))
      .finally(() => setLoading(false))
  }, [customerId])

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-surface-800" />
  }

  if (!sub || sub.status === "none") {
    return (
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6 text-center">
        <p className="text-sm text-surface-400">Sin suscripción activa</p>
        <a href="/precios" className="mt-3 inline-block rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          Ver planes
        </a>
      </div>
    )
  }

  const active = sub.status === "active" || sub.status === "trialing"
  const amount = sub.amount ? `$${(sub.amount / 100).toFixed(2)}` : "—"
  const endDate = new Date(sub.currentPeriodEnd * 1000).toLocaleDateString("es-EC")

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-surface-200">Suscripción</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}>
              {active ? "Activa" : sub.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-surface-500">{amount}/mes • Renueva el {endDate}</p>
          {sub.cancelAtPeriodEnd && (
            <p className="mt-1 text-xs text-warning">Cancelada • Expira el {endDate}</p>
          )}
        </div>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-300 hover:bg-surface-700 disabled:opacity-50 transition-colors"
        >
          {portalLoading ? "Abriendo..." : "Gestionar"}
        </button>
      </div>
    </div>
  )
}
