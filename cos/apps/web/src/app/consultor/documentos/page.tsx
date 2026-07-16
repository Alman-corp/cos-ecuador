"use client"

import { useState } from "react"

const docs = [
  { id: "1", name: "Balance General Q2 2026.pdf", client: "Exportadora Guayaquil", type: "Balance", date: "15 Jun 2026", status: "Revisado" },
  { id: "2", name: "Estado Resultados Junio.xlsx", client: "Exportadora Guayaquil", type: "ER", date: "14 Jun 2026", status: "Revisado" },
  { id: "3", name: "Declaración IVA Junio.xml", client: "Manufacturas del Sur", type: "SRI", date: "14 Jun 2026", status: "Pendiente" },
  { id: "4", name: "Contrato Arrendamiento.pdf", client: "TechSolutions EC", type: "Legal", date: "10 Jun 2026", status: "Procesando" },
  { id: "5", name: "Anexo Retenciones Mayo.xml", client: "Exportadora Guayaquil", type: "SRI", date: "03 Jun 2026", status: "Revisado" },
  { id: "6", name: "Flujo Caja Proyectado.xlsx", client: "Constructora Pacífico", type: "Financiero", date: "01 Jun 2026", status: "Pendiente" },
  { id: "7", name: "Escritura Constitución.pdf", client: "TechSolutions EC", type: "Legal", date: "28 May 2026", status: "Revisado" },
  { id: "8", name: "Acta Junta Directiva.pdf", client: "Exportadora Guayaquil", type: "Legal", date: "25 May 2026", status: "Revisado" },
]

export default function DocumentosPage() {
  const [filter, setFilter] = useState("Todos")

  const filtered = filter === "Todos" ? docs : docs.filter((d) => d.type === filter)
  const types = ["Todos", ...new Set(docs.map((d) => d.type))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Documentos</h1>
          <p className="text-sm text-surface-400">Gestión documental de todos los clientes</p>
        </div>
        <button className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          + Subir Documento
        </button>
      </div>

      <div className="flex gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "bg-surface-800 text-surface-400 hover:text-surface-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{d.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{d.client}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{d.type}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{d.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${
                    d.status === "Revisado" ? "text-success" : d.status === "Pendiente" ? "text-warning" : "text-accent-400"
                  }`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
