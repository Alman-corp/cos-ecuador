"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface ClientRow {
  id: string; name: string; industry: string | null; segment: string | null
  email: string | null; phone: string | null; score: number; status: string
  createdAt: string
}

export default function ClientesGlobalPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const companyId = typeof window !== "undefined" ? localStorage.getItem("cos_company_id") : null

  useEffect(() => {
    if (!companyId) return
    fetch(`/api/clients?companyId=${companyId}`)
      .then((r) => r.json()).then((d) => setClients(d.data || [])).finally(() => setLoading(false))
  }, [companyId])

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const scoreColor = (s: number) => s >= 70 ? "bg-emerald-500" : s >= 40 ? "bg-amber-500" : "bg-rose-500"
  const riskLabel = (s: number) => s >= 70 ? "Bajo" : s >= 40 ? "Medio" : "Alto"
  const riskColor = (s: number) => s >= 70 ? "text-emerald-400" : s >= 40 ? "text-amber-400" : "text-rose-400"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Clientes</h1>
          <p className="text-sm text-surface-400">{clients.length} clientes activos</p>
        </div>
        <Link href="/director/clientes/crear"
          className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-500">
          + Nuevo Cliente
        </Link>
      </div>

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar cliente..."
        className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />

      {loading ? (
        <p className="text-sm text-surface-500">Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-700/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700/50 bg-surface-950">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Industria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Contacto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Riesgo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-surface-700/30 transition-colors hover:bg-surface-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/director/clientes/${c.id}`} className="text-sm font-medium text-accent-400 hover:text-accent-300">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">{c.industry || "—"}</td>
                  <td className="px-4 py-3 text-sm text-surface-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${riskColor(c.score)}`}>{riskLabel(c.score)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-700">
                        <div className={`h-full rounded-full ${scoreColor(c.score)}`} style={{ width: `${c.score}%` }} />
                      </div>
                      <span className="text-xs text-surface-400">{c.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-surface-500">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
