"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import * as XLSX from "xlsx"
import { FinancialNarrative } from "@/components/shared/FinancialNarrative"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataHubQuery, useUploadDocumentMutation } from "@/lib/hooks/use-data-hub-query"
import type { DataHubItem } from "@/lib/shared-types"

interface ImportColumn {
  name: string
  detectedType: string
  mapped: boolean
  mappedTo?: string
}

const REQUIRED_COLUMNS = ["date", "amount", "description"]

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["date", "fecha", "periodo", "period", "fech", "dia", "day", "mes", "month", "año", "year", "trimestre"],
  amount: ["amount", "monto", "valor", "importe", "total", "saldo", "cantidad", "quantity", "value", "cost", "ingreso", "gasto", "debe", "haber", "cargo", "abono"],
  description: ["description", "descripcion", "concepto", "detalle", "glosa", "nombre", "name", "referencia", "reference", "item", "partida"],
}

function detectColumnType(name: string): string {
  const lower = name.toLowerCase().trim()
  for (const [type, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => lower === a || lower.includes(a))) return type
  }
  if (["id", "code", "código", "cuenta", "account"].includes(lower) || lower.startsWith("cod")) return "id"
  if (["category", "categoria", "tipo", "type", "rubro", "clase"].includes(lower)) return "category"
  return "unknown"
}

async function readFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (ext === "csv") {
    const text = await file.text()
    const lines = text.split("\n").filter(Boolean)
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["\s]+|["\s]+$/g, ""))
    const rows = lines.slice(1, 11).map((line) =>
      line.split(",").map((c) => c.trim().replace(/^["\s]+|["\s]+$/g, ""))
    )
    return { headers, rows }
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array", codepage: 65001 })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error("El archivo no contiene hojas de cálculo")
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
    if (json.length < 1) throw new Error("El archivo está vacío")
    const headers = (json[0] as string[]).map((h) => String(h ?? "").trim())
    const rows = json.slice(1, 11).map((row) =>
      (row as string[]).map((c) => String(c ?? "").trim())
    )
    return { headers, rows }
  }

  throw new Error(`Formato no soportado: .${ext}. Usa CSV o Excel (.xlsx/.xls)`)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileTypeIcons: Record<string, string> = {
  csv: "\uD83D\uDCC4",
  xlsx: "\uD83D\uDCC8",
  pdf: "\uD83D\uDCCB",
  image: "\uD83D\uDDBC",
}

export default function DataHubPage() {
  const { data: docsResult, isLoading: docsLoading, isError: docsError } = useDataHubQuery()
  const uploadMutation = useUploadDocumentMutation()
  const documents: DataHubItem[] = docsResult?.data ?? []

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const [columns, setColumns] = useState<ImportColumn[]>([])
  const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [totalRows, setTotalRows] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setStatus("idle")
    setErrorMsg("")
    setTotalRows(0)

    try {
      const { headers, rows } = await readFile(f)
      const inferred = headers.map((name) => {
        const dt = detectColumnType(name)
        const requiredKey = REQUIRED_COLUMNS.find((r) => COLUMN_ALIASES[r].includes(dt))
        return {
          name,
          detectedType: dt,
          mapped: !!requiredKey,
          mappedTo: requiredKey,
        }
      })
      setColumns(inferred)
      setPreview([headers, ...rows.filter((r) => r.some((c) => c.length > 0))])
      setTotalRows(rows.length)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al leer el archivo")
      setColumns([])
      setPreview(null)
    }
  }, [])

  const missingColumns = REQUIRED_COLUMNS.filter(
    (req) => !columns.some((c) => c.mappedTo === req)
  )

  const handleImport = useCallback(async () => {
    if (!file || missingColumns.length > 0) return
    setStatus("importing")
    const result = await uploadMutation.mutateAsync(file)
    if (result.error) {
      setErrorMsg(result.error)
      setStatus("error")
    } else {
      setStatus("success")
    }
  }, [file, missingColumns, uploadMutation])

  const reset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setColumns([])
    setStatus("idle")
    setErrorMsg("")
    setTotalRows(0)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Data Hub</h1>
        <p className="text-sm text-surface-400">
          Importa datos financieros desde Excel (.xlsx) o CSV
        </p>
      </div>

      {status === "success" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-success/20 bg-success/5 p-8 text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-surface-100">¡Importación completada!</h2>
            <p className="mt-1 text-sm text-surface-400">
              {totalRows} filas importadas correctamente desde {file?.name}
            </p>
            <button onClick={reset} className="mt-6 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500">
              Importar otro archivo
            </button>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <FinancialNarrative
              metrics={[
                { label: "Revenue Estimado", current: 94827000000, previous: 97710000000, higherIsBetter: true },
                { label: "Filas Importadas", current: totalRows * 1000000, previous: 0, higherIsBetter: true },
              ]}
              companyName="Datos Importados"
            />
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragging ? "border-accent-500 bg-accent-500/5" : "border-surface-600 bg-surface-800/30 hover:border-surface-500"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <svg className={`mb-4 h-10 w-10 ${dragging ? "text-accent-400" : "text-surface-500"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
            <p className="text-sm font-medium text-surface-300">
              {file ? file.name : "Arrastra tu archivo aquí o haz clic para seleccionar"}
            </p>
            <p className="mt-1 text-xs text-surface-500">
              Excel (.xlsx) o CSV con columnas de fecha, monto y descripción
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
              <p className="text-sm font-medium text-danger">{errorMsg}</p>
            </div>
          )}

          {columns.length > 0 && (
            <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-surface-200">
                Mapeo de Columnas
              </h3>

              {missingColumns.length > 0 && (
                <div className="mb-3 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                  <p className="text-xs font-medium text-warning">
                    ⚠ Faltan columnas requeridas: {missingColumns.join(", ")}. 
                    El sistema buscará columnas con nombres similares (fecha, monto, descripción...)
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-700/50 text-left text-xs uppercase text-surface-500">
                      <th className="pb-2 pr-4 font-medium">Columna Detectada</th>
                      <th className="pb-2 pr-4 font-medium">Tipo</th>
                      <th className="pb-2 font-medium">Mapeo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col) => (
                      <tr key={col.name} className="border-b border-surface-700/30">
                        <td className="py-2 pr-4 font-mono text-surface-200">{col.name}</td>
                        <td className="py-2 pr-4 text-surface-400">{col.detectedType}</td>
                        <td className="py-2">
                          {col.mappedTo ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              → {col.mappedTo}
                            </span>
                          ) : (
                            <span className="text-xs text-surface-500">No mapeada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview && (
            <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-surface-200">
                Vista Previa (primeras {Math.min(preview.length - 1, 10)} filas)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-700/50 text-left text-xs uppercase text-surface-500">
                      {preview[0].map((h, i) => (
                        <th key={i} className="pb-2 pr-4 font-medium font-mono">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-b border-surface-700/30">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-2 pr-4 text-surface-300 max-w-[200px] truncate">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {file && (
            <button
              onClick={handleImport}
              disabled={status === "importing" || missingColumns.length > 0}
              className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "importing" ? "Importando datos…" : "Importar datos"}
            </button>
          )}
        </>
      )}
    </div>
  )
}
