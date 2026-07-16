"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import CopilotPanel from "@/components/CopilotPanel"
import StrategicPlanView from "@/components/StrategicPlanView"

interface ClientDetail {
  id: string; name: string; email: string | null; phone: string | null
  taxId: string | null; industry: string | null; segment: string | null
  score: number; status: string; createdAt: string
  contacts: { id: string; firstName: string; lastName: string; email: string | null; isPrimary: boolean }[]
  documents: { id: string; title: string; documentType: string; status: string; createdAt: string }[]
}

interface AnalysisResult {
  ratios: any; healthScore: number; healthStatus: string
  alerts: string[]; recommendations: string[]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const companyId = typeof window !== "undefined" ? localStorage.getItem("cos_company_id") : null
  const router = useRouter()

  useEffect(() => { params.then((p) => setClientId(p.id)) }, [params])

  useEffect(() => {
    if (!clientId || !companyId) return
    fetch(`/api/clients/${clientId}`).then((r) => r.json()).then(setClient).finally(() => setLoading(false))
  }, [clientId, companyId])

  const runAnalysis = useCallback(async () => {
    if (!clientId) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/consulting/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, financialStatementIds: [] }),
      })
      const data = await res.json()
      if (res.ok) setAnalysis(data)
    } finally { setAnalyzing(false) }
  }, [clientId])

  const handleUpload = useCallback(async () => {
    if (uploadFiles.length === 0 || !clientId || !companyId) return
    setUploading(true)
    try {
      for (const file of uploadFiles) {
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId, title: file.name, documentType: "financial_statement",
            fileUrl: URL.createObjectURL(file), status: "pending",
          }),
        })
      }
      setShowUpload(false)
      setUploadFiles([])
      // Refresh client to show new docs
      const res = await fetch(`/api/clients/${clientId}`)
      setClient(await res.json())
    } finally { setUploading(false) }
  }, [uploadFiles, clientId, companyId])

  const scoreColor = (s: number) => s >= 70 ? "text-emerald-400" : s >= 40 ? "text-amber-400" : "text-rose-400"
  const scoreRing = (s: number) => {
    const r = 54; const c = 2 * Math.PI * r; const offset = c - (s / 100) * c
    return { strokeDasharray: c, strokeDashoffset: offset }
  }

  if (loading) return <div className="p-8 text-surface-400">Cargando...</div>
  if (!client) return <div className="p-8 text-surface-400">Cliente no encontrado</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">{client.name}</h1>
          <p className="text-sm text-surface-400">{client.email} {client.taxId && `· ${client.taxId}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-500">
            {showUpload ? "Cancelar" : "Subir Documentos"}
          </button>
          <button onClick={runAnalysis} disabled={analyzing}
            className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-xs font-medium text-surface-200 hover:bg-surface-700 disabled:opacity-50">
            {analyzing ? "Analizando..." : "Analizar"}
          </button>
          <button onClick={async () => {
            try {
              const res = await fetch(`/api/clients/${clientId}/report`, { method: "POST" })
              if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url; a.download = `informe-${client?.name?.replace(/\s+/g, "-").toLowerCase() || "cliente"}.pdf`
                a.click(); URL.revokeObjectURL(url)
              }
            } catch {}
          }}
            className="rounded-lg border border-accent-600/30 bg-accent-600/10 px-4 py-2 text-xs font-medium text-accent-400 hover:bg-accent-600/20">
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="rounded-xl border border-dashed border-surface-700 bg-surface-800/30 p-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-surface-400">Selecciona archivos financieros (PDF, Excel)</p>
            <input type="file" multiple accept=".pdf,.xls,.xlsx,.csv"
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
              className="text-sm text-surface-400 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-600 file:px-3 file:py-1.5 file:text-xs file:text-white" />
            {uploadFiles.length > 0 && (
              <button onClick={handleUpload} disabled={uploading}
                className="rounded-lg bg-accent-600 px-6 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50">
                {uploading ? "Subiendo..." : `Subir ${uploadFiles.length} archivo(s)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Health Score Gauge */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-700/50 bg-surface-800/50 p-8">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-700" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
              className={scoreColor(client.score)} style={scoreRing(client.score)} />
          </svg>
          <p className={`mt-3 text-3xl font-bold ${scoreColor(client.score)}`}>{client.score}/100</p>
          <p className="text-sm text-surface-400">Health Score</p>
          {analysis && (
            <p className={`mt-2 rounded-full px-3 py-1 text-xs font-medium ${scoreColor(analysis.healthScore)} ${scoreRing(analysis.healthScore).strokeDasharray}`}>
              {analysis.healthStatus}
            </p>
          )}
        </div>

        {/* Key Info */}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Información</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-surface-400">Industria</span><span className="text-surface-200">{client.industry || "—"}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Segmento</span><span className="text-surface-200">{client.segment || "—"}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Estado</span><span className="text-surface-200 capitalize">{client.status}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Contactos</span><span className="text-surface-200">{client.contacts.length}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Documentos</span><span className="text-surface-200">{client.documents.length}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Creado</span><span className="text-surface-200">{new Date(client.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Alerts / Recommendations */}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Alertas</h3>
          {analysis ? (
            <div className="space-y-2">
              {analysis.alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  <p className="text-xs text-surface-300">{a}</p>
                </div>
              ))}
              {analysis.alerts.length === 0 && (
                <p className="text-xs text-surface-500">Sin alertas — cliente saludable</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-surface-500">Ejecuta un análisis para ver alertas</p>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Análisis Financiero</h3>
          <div className="space-y-4">
            {/* Ratios */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Liquidez", value: analysis.ratios?.liquidity?.current?.toFixed(2) || "—" },
                { label: "Endeudamiento", value: analysis.ratios?.solvency?.debtToEquity?.toFixed(2) || "—" },
                { label: "Margen Neto", value: analysis.ratios?.profitability?.netMargin ? `${(analysis.ratios.profitability.netMargin * 100).toFixed(1)}%` : "—" },
                { label: "ROE", value: analysis.ratios?.profitability?.roe ? `${(analysis.ratios.profitability.roe * 100).toFixed(1)}%` : "—" },
              ].map((r) => (
                <div key={r.label} className="rounded-lg bg-surface-900/50 p-3 text-center">
                  <p className="text-xs text-surface-500">{r.label}</p>
                  <p className="mt-1 text-lg font-bold text-surface-50">{r.value}</p>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Recomendaciones</h4>
              <div className="space-y-2">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-surface-900/30 p-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <p className="text-sm text-surface-300">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Plan */}
      <StrategicPlanView clientId={client.id} clientName={client.name} />

      {/* Documents */}
      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">Documentos</h3>
        {client.documents.length > 0 ? (
          <div className="space-y-2">
            {client.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-surface-900/30 p-3">
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm text-surface-300">{d.title}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                  d.status === "rejected" ? "bg-rose-500/10 text-rose-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>{d.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-surface-500">Sube documentos para comenzar el análisis</p>
        )}
      </div>
      <CopilotPanel clientId={client.id} clientName={client.name} />
    </div>
  )
}
