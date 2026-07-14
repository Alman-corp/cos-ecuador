"use client"

import { useState, useRef } from "react"
import { ArrowRight, Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadStepProps {
  data: { name?: string }
  setData: (d: { files?: File[] }) => void
  onNext: () => void
}

export function UploadStep({ data, setData, onNext }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|xlsx?|csv)$/i.test(f.name)
    )
    setFiles((prev) => [...prev, ...dropped])
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter((f) =>
      /\.(pdf|xlsx?|csv)$/i.test(f.name)
    )
    setFiles((prev) => [...prev, ...picked])
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const years = files.length > 0
    ? [...new Set(files.map((f) => {
        const m = f.name.match(/(20\d{2})/)
        return m ? m[1] : null
      }).filter(Boolean))].sort()
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-surface-50 mb-2">
          Sube los estados financieros
        </h1>
        <p className="text-surface-400">
          Formatos aceptados: PDF, Excel (.xlsx), CSV. Detectamos años
          automáticamente.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
          dragging
            ? "border-accent-500 bg-accent-500/5"
            : "border-surface-700 bg-surface-900/50 hover:border-surface-600"
        }`}
      >
        <Upload className="mb-4 h-8 w-8 text-surface-400" />
        <p className="text-sm font-medium text-surface-300">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-surface-500">
          PDF · XLSX · CSV
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFilePick}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-surface-200">
            {files.length} archivo{files.length > 1 ? "s" : ""} seleccionado
            {files.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-3"
              >
                <FileText className="h-5 w-5 text-accent-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{f.name}</p>
                  <p className="text-[10px] text-surface-500">
                    {(f.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  aria-label={`Remover ${f.name}`}
                  className="rounded p-1 text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {years.length > 0 && (
            <div className="rounded-xl border border-surface-800 bg-surface-900/30 p-4">
              <p className="text-xs font-medium text-surface-400 mb-2">
                Años detectados
              </p>
              <div className="flex gap-2">
                {years.map((y) => (
                  <span
                    key={y}
                    className="rounded-lg bg-accent-500/10 px-3 py-1 text-xs font-mono text-accent-400"
                  >
                    {y}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={onNext}
          disabled={files.length === 0}
          className="flex-1"
        >
          Validar archivos
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
