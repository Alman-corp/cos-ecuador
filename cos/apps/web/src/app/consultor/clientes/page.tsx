"use client"

import { useState } from "react"

interface Client {
  id: string; name: string; industry: string; segment: string; status: string; score: number; lastContact: string
}

const mockClients: Client[] = [
  { id: "1", name: "Exportadora Guayaquil S.A.", industry: "Logística", segment: "Grande", status: "active", score: 72, lastContact: "Hoy" },
  { id: "2", name: "Manufacturas del Sur Cía.", industry: "Manufactura", segment: "Mediana", status: "active", score: 68, lastContact: "Ayer" },
  { id: "3", name: "TechSolutions EC", industry: "Tecnología", segment: "Mediana", status: "active", score: 85, lastContact: "2 días" },
  { id: "4", name: "AgroExport S.A.", industry: "Agroindustria", segment: "Grande", status: "active", score: 71, lastContact: "3 días" },
  { id: "5", name: "Constructora del Pacífico", industry: "Construcción", segment: "Grande", status: "active", score: 55, lastContact: "1 semana" },
  { id: "6", name: "Servicios Logísticos EC", industry: "Logística", segment: "Pequeña", status: "prospect", score: 42, lastContact: "2 semanas" },
  { id: "7", name: "Grupo Inmobiliario del Sol", industry: "Inmobiliario", segment: "Mediana", status: "inactive", score: 38, lastContact: "1 mes" },
]

export default function ClientesPage() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("Todos")

  const filtered = mockClients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === "Todos" || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const statuses = ["Todos", "active", "prospect", "inactive"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Clientes</h1>
          <p className="text-sm text-surface-400">{mockClients.length} empresas registradas</p>
        </div>
        <button className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          + Nuevo Cliente
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-surface-700/50 bg-surface-800 px-4 py-2 text-sm text-surface-200 placeholder-surface-500 focus:border-accent-500/50 focus:outline-none"
        />
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                  : "bg-surface-800 text-surface-400 hover:text-surface-200"
              }`}
            >
              {s === "Todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Industria</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Segmento</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Score</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{c.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{c.industry}</td>
                <td className="px-4 py-3 text-center text-sm text-surface-400">{c.segment}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${
                    c.status === "active" ? "text-success" : c.status === "prospect" ? "text-warning" : "text-surface-500"
                  }`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-700">
                      <div className={`h-full rounded-full ${c.score >= 70 ? "bg-success" : c.score >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${c.score}%` }} />
                    </div>
                    <span className="text-xs text-surface-400">{c.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-xs text-surface-400">{c.lastContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
