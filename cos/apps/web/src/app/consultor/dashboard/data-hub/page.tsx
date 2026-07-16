"use client"

import { useState, useRef, type DragEvent } from "react"

interface ImportColumn {
  name: string
  detectedType: string
  mapped: boolean
}

const REQUIRED_COLUMNS = ["date", "amount", "description"]

export default function DataHubPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const [columns, setColumns] = useState<ImportColumn[]>([])
  const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setStatus("idle")

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter(Boolean)
      const headers = lines[0].split(",").map((h) => h.trim())
      const rows = lines.slice(1, 6).map((line) => line.split(",").map((c) => c.trim()))

      setColumns(
        headers.map((name) => ({
          name,
          detectedType: inferType(name),
          mapped: REQUIRED_COLUMNS.includes(name.toLowerCase()),
        }))
      )
      setPreview([headers, ...rows])
    }
    reader.readAsText(f)
  }

  function inferType(name: string): string {
    const lower = name.toLowerCase()
    if (["date", "fecha", "periodo"].includes(lower)) return "date"
    if (["amount", "monto", "valor", "importe"].includes(lower)) return "numeric"
    if (["description", "descripcion", "concepto"].includes(lower)) return "text"
    if (["category", "categoria", "tipo"].includes(lower)) return "text"
    if (["id", "reference", "referencia"].includes(lower)) return "text"
    return "unknown"
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file) return
    setStatus("importing")

    // Simulate import delay
    await new Promise((r) => setTimeout(r, 1500))
    setStatus("success")
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (req) => !columns.some((c) => c.name.toLowerCase() === req)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Data Hub</h1>
        <p className="text-sm text-surface-400">
          Importa tus datos financieros desde CSV o Excel
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragging
            ? "border-accent-500 bg-accent-500/5"
            : "border-surface-600 bg-surface-800/30 hover:border-surface-500"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        <svg
          className={`mb-4 h-10 w-10 ${dragging ? "text-accent-400" : "text-surface-500"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          />
        </svg>
        <p className="text-sm font-medium text-surface-300">
          {file ? file.name : "Arrastra tu archivo aquí o haz clic para seleccionar"}
        </p>
        <p className="mt-1 text-xs text-surface-500">
          CSV o Excel con columnas: date, amount, description
        </p>
      </div>

      {/* Column mapping */}
      {columns.length > 0 && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-surface-200">
            Mapeo de Columnas
          </h3>

          {missingColumns.length > 0 && (
            <div className="mb-3 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
              <p className="text-xs font-medium text-warning">
                Faltan columnas requeridas: {missingColumns.join(", ")}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50 text-left text-xs uppercase text-surface-500">
                  <th className="pb-2 pr-4 font-medium">Columna Detectada</th>
                  <th className="pb-2 pr-4 font-medium">Tipo Inferido</th>
                  <th className="pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr key={col.name} className="border-b border-surface-700/30">
                    <td className="py-2 pr-4 font-mono text-surface-200">
                      {col.name}
                    </td>
                    <td className="py-2 pr-4 text-surface-400">
                      {col.detectedType}
                    </td>
                    <td className="py-2">
                      {col.mapped ? (
                        <span className="text-xs font-medium text-success">
                          Mapeada
                        </span>
                      ) : (
                        <span className="text-xs text-surface-500">
                          No mapeada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-surface-200">
            Vista Previa (primeras 5 filas)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50 text-left text-xs uppercase text-surface-500">
                  {preview[0].map((h, i) => (
                    <th key={i} className="pb-2 pr-4 font-medium font-mono">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-surface-700/30">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 pr-4 text-surface-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import button */}
      {file && (
        <button
          onClick={handleImport}
          disabled={status === "importing" || missingColumns.length > 0}
          className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "importing"
            ? "Importando datos…"
            : status === "success"
            ? "¡Importación completada!"
            : "Importar datos"}
        </button>
      )}
    </div>
  )
}
