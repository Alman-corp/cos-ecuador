"use client"

import { useState, useCallback } from "react"

interface DocumentUploadProps {
  onUploadComplete?: (files: { name: string; status: string }[]) => void
  multiple?: boolean
  maxFiles?: number
}

export function DocumentUpload({ onUploadComplete, multiple = true, maxFiles = 10 }: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{ name: string; status: string }[]>([])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    setFiles((prev) => [...prev, ...arr].slice(0, maxFiles))
  }, [maxFiles])

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    // Simulate upload - replace with real API call
    await new Promise((r) => setTimeout(r, 2000))
    const uploaded = files.map((f) => ({ name: f.name, status: "processing" }))
    // Simulate processing
    await new Promise((r) => setTimeout(r, 1500))
    const processed = uploaded.map((f) => ({ ...f, status: "ready" }))
    setResults(processed)
    setFiles([])
    setUploading(false)
    onUploadComplete?.(processed)
  }

  if (results.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-surface-300">Archivos procesados</p>
        {results.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-surface-300">{r.name}</span>
            </div>
            <span className="text-xs text-success">Listo</span>
          </div>
        ))}
        <button onClick={() => setResults([])} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
          Subir más archivos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-800/50 px-6 py-8 text-center transition-colors hover:border-accent-500/50"
      >
        <svg className="mb-3 h-8 w-8 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-surface-400">
          {files.length > 0 ? `${files.length} archivo(s)` : "Arrastra archivos aquí"}
        </p>
        <label className="mt-2 cursor-pointer rounded-lg bg-accent-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-500 transition-colors">
          Seleccionar
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.xls,.xlsx,.xml,.csv,.jpg,.png"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm text-surface-300">{f.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-surface-500 hover:text-danger transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : (
              `Subir ${files.length} archivo(s)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
