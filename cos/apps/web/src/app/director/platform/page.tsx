"use client"

import { useEffect, useState } from "react"

export default function PlatformPage() {
  const [data, setData] = useState<any>(null)
  const [certifying, setCertifying] = useState<string | null>(null)
  const [certReports, setCertReports] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch("/api/platform").then((r) => r.json()).then(setData)
  }, [])

  const runCertification = async (productId: string) => {
    setCertifying(productId)
    const res = await fetch("/api/platform/certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
    const report = await res.json()
    setCertReports((prev) => ({ ...prev, [productId]: report }))
    setCertifying(null)
  }

  if (!data) return <div className="min-h-screen bg-surface-900 p-6"><p className="text-surface-400">Cargando plataforma...</p></div>

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Business Intelligence OS Core</h1>
            <p className="text-sm text-surface-400 mt-1">
              v{data.version.core} · SDK v{data.version.sdk} · Built {data.version.builtAt}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">Health: {data.health}</span>
            <span className="rounded-full bg-surface-700/30 px-3 py-1 text-xs font-medium text-surface-300">Compatibilidad: {data.version.compatibility}</span>
          </div>
        </div>
      </div>

      {/* Platform Status Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-2xl font-bold text-surface-100">{data.products.total}</p>
          <p className="text-xs text-surface-400">Productos registrados</p>
        </div>
        <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-4">
          <p className="text-2xl font-bold text-emerald-400">{data.certification.certified}</p>
          <p className="text-xs text-surface-400">Certificados</p>
        </div>
        {data.certification.failed > 0 && (
          <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-4">
            <p className="text-2xl font-bold text-red-400">{data.certification.failed}</p>
            <p className="text-xs text-surface-400">No certificados</p>
          </div>
        )}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-2xl font-bold text-surface-100">{data.products.running}</p>
          <p className="text-xs text-surface-400">Productos activos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SDK Reference */}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h2 className="text-sm font-semibold text-surface-200 mb-4">SDK Reference</h2>
          <p className="text-xs text-surface-400 mb-4">
            El SDK oficial para crear productos verticales. Nunca importes fuera de esta superficie.
          </p>
          <div className="space-y-3">
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">Import base</p>
              <code className="text-[11px] text-surface-300">import {"{ createManifest, createAgent, createKPI }"} from "@/core/platform/sdk"</code>
            </div>
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">Event bus</p>
              <code className="text-[11px] text-surface-300">import {"{ CoreEvent, platformEvents }"} from "@/core/platform"</code>
            </div>
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">Core contracts</p>
              <code className="text-[11px] text-surface-300">import {"{ CORE_VERSION, CORE_COMPATIBILITY_RANGE, type CoreClient }"} from "@/core/platform"</code>
            </div>
            <div className="rounded-lg bg-surface-900/50 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">CLI scaffold</p>
              <code className="text-[11px] text-surface-300">node scripts/create-product.mjs &lt;id&gt; "Name" &lt;price&gt;</code>
            </div>
          </div>
        </div>

        {/* Certification */}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h2 className="text-sm font-semibold text-surface-200 mb-4">Certification Suite</h2>
          <p className="text-xs text-surface-400 mb-4">
            {data.certification.details.length} tests de certificación. Cada producto debe pasar todos para ser certificado.
          </p>
          <div className="space-y-2">
            {data.certification.details.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface-900/50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${c.certified ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div>
                    <p className="text-sm text-surface-200">{c.name}</p>
                    <p className="text-xs text-surface-500">{c.passed}/{c.total} tests</p>
                  </div>
                </div>
                <button
                  onClick={() => runCertification(c.id)}
                  disabled={certifying === c.id}
                  className="rounded-lg bg-surface-700/50 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-600 disabled:opacity-50"
                >
                  {certifying === c.id ? "..." : "Certificar"}
                </button>
              </div>
            ))}
          </div>

          {/* Certification Report Detail */}
          {Object.entries(certReports).map(([id, report]: [string, any]) => (
            <div key={id} className="mt-4 rounded-lg bg-surface-900/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-surface-200">
                  {report.certified ? "✓ Certificado" : "✗ No certificado"} — {report.productName}
                </p>
                <span className="text-xs text-surface-500">Core v{report.coreVersion}</span>
              </div>
              <div className="space-y-1">
                {report.results.map((r: any) => (
                  <div key={r.testId} className="flex items-center gap-2 text-xs">
                    <span className={r.passed ? "text-emerald-400" : "text-red-400"}>{r.passed ? "✓" : "✗"}</span>
                    <span className="text-surface-300">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Contracts */}
      <div className="mt-6 rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h2 className="text-sm font-semibold text-surface-200 mb-4">Core Contracts — API Surface Estable</h2>
        <p className="text-xs text-surface-400 mb-4">
          Los siguientes servicios son la superficie estable del Core. Un producto vertical puede usar estos tipos e interfaces sin modificar el núcleo.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "CoreIdentityService", desc: "Usuarios, roles, permisos, multiempresa" },
            { name: "CoreCrmService", desc: "Clientes, contactos, empresas" },
            { name: "CoreDocumentService", desc: "OCR, PDF, Word, Excel, versionado" },
            { name: "CoreAiService", desc: "Evaluación, diagnóstico, recomendación" },
            { name: "CoreReportingService", desc: "Reportes PDF profesionales" },
            { name: "CoreWorkflowService", desc: "BPM, automatización, procesos" },
            { name: "CoreKnowledgeService", desc: "Knowledge base, búsqueda semántica" },
          ].map((svc) => (
            <div key={svc.name} className="rounded-lg bg-surface-900/30 p-3">
              <p className="text-sm font-medium text-accent-400">{svc.name}</p>
              <p className="text-xs text-surface-400 mt-0.5">{svc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
