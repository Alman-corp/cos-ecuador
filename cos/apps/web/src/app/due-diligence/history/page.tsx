"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface HistoryJob {
  id: string
  companyName: string
  industry: string
  status: "pending" | "processing" | "completed" | "failed"
  startedAt: string
  completedAt?: string
  error?: string
  report?: any
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<HistoryJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/due-diligence/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    processing: "bg-blue-100 text-blue-700",
    pending: "bg-gray-100 text-gray-600",
  }

  function downloadPdf(job: HistoryJob) {
    window.open(`/api/reports/${job.id}/pdf`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historial de Análisis</h1>
            <p className="text-gray-500 mt-1">Análisis de Due Diligence realizados</p>
          </div>
          <Link href="/due-diligence" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Nuevo Análisis
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Cargando historial...</p>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No hay análisis realizados</p>
            <p className="text-gray-400 text-sm mb-6">Los análisis aparecerán aquí una vez completados.</p>
            <Link href="/due-diligence" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Iniciar Primer Análisis
            </Link>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{job.companyName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status] || ""}`}>
                        {job.status === "completed" ? "Completado" : job.status === "failed" ? "Fallido" : job.status === "processing" ? "Procesando" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{job.industry}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Inicio: {new Date(job.startedAt).toLocaleDateString("es-EC")} {new Date(job.startedAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</span>
                      {job.completedAt && <span>Fin: {new Date(job.completedAt).toLocaleDateString("es-EC")} {new Date(job.completedAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</span>}
                    </div>
                    {job.error && <p className="text-xs text-red-500 mt-1">{job.error}</p>}
                  </div>
                  {job.status === "completed" && (
                    <button onClick={() => downloadPdf(job)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
                      PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
