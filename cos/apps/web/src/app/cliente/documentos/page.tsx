"use client"

import { useState } from "react"
import { DocumentUpload } from "@/components/documents/DocumentUpload"

type DocStatus = "Todos" | "Balance" | "ER" | "SRI" | "Legal" | "Financiero"
interface Doc { id: string; name: string; type: string; date: string; size: string; status: string }

const initialDocs: Doc[] = [
  { id: "1", name: "Balance General Q2 2026.pdf", type: "Balance", date: "15 Jun 2026", size: "2.4 MB", status: "Revisado" },
  { id: "2", name: "Estado Resultados Junio.xlsx", type: "ER", date: "14 Jun 2026", size: "1.1 MB", status: "Revisado" },
  { id: "3", name: "Declaración IVA Junio.xml", type: "SRI", date: "14 Jun 2026", size: "0.3 MB", status: "Pendiente" },
  { id: "4", name: "Contrato Arrendamiento.pdf", type: "Legal", date: "10 Jun 2026", size: "4.2 MB", status: "Revisado" },
  { id: "5", name: "Acta Junta Directiva Mayo.pdf", type: "Legal", date: "05 Jun 2026", size: "1.8 MB", status: "Revisado" },
  { id: "6", name: "Anexo Retenciones Mayo.xml", type: "SRI", date: "03 Jun 2026", size: "0.5 MB", status: "Pendiente" },
  { id: "7", name: "Flujo Caja Proyectado.xlsx", type: "Financiero", date: "01 Jun 2026", size: "0.9 MB", status: "Revisado" },
]

export default function DocumentosPage() {
  const [filter, setFilter] = useState<DocStatus>("Todos")
  const [showUpload, setShowUpload] = useState(false)
  const [docs, setDocs] = useState(initialDocs)

  const types: DocStatus[] = ["Todos", ...new Set(docs.map((d) => d.type as DocStatus))]
  const filtered = filter === "Todos" ? docs : docs.filter((d) => d.type === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Documentos</h1>
          <p className="text-sm text-surface-400">Sube, revisa y gestiona tus documentos financieros</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors"
        >
          {showUpload ? "Cancelar" : "+ Subir Documento"}
        </button>
      </div>

      {showUpload && (
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-surface-200">Subir nuevos documentos</h2>
          <DocumentUpload onUploadComplete={(files) => {
            const newDocs: Doc[] = files.map((f, i) => ({
              id: `new-${Date.now()}-${i}`,
              name: f.name,
              type: "Balance",
              date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
              size: "—",
              status: "Procesado",
            }))
            setDocs((prev) => [...newDocs, ...prev])
            setShowUpload(false)
          }} />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "text-surface-400 hover:text-surface-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Tamaño</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr key={doc.id} className="border-b border-surface-800 last:border-0 hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3 text-surface-200">{doc.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-surface-800 px-2 py-0.5 text-xs text-surface-400">{doc.type}</span>
                </td>
                <td className="px-4 py-3 text-surface-400">{doc.date}</td>
                <td className="px-4 py-3 text-surface-400">{doc.size}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${doc.status === "Revisado" || doc.status === "Procesado" ? "text-success" : "text-warning"}`}>
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
