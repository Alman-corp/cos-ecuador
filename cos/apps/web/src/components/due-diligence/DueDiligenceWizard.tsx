"use client"

import { useState, useEffect, useRef } from "react"
import type { CompanyProfile, FinancialYear, DueDiligenceReport } from "@/core/due-diligence/types"
import { DueDiligenceReportView } from "./DueDiligenceReportView"
import { t, type Locale } from "@/lib/i18n"

type Step = "select" | "upload" | "review" | "analyzing" | "report"

const STEPS: Step[] = ["select", "upload", "review", "analyzing", "report"]

export function DueDiligenceWizard() {
  const [locale, setLocale] = useState<Locale>("es")
  const [step, setStep] = useState<Step>("select")
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null)
  const [uploadedFinancials, setUploadedFinancials] = useState<FinancialYear[] | null>(null)
  const [report, setReport] = useState<DueDiligenceReport | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [mode, setMode] = useState<"seed" | "upload" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/due-diligence/companies")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies))
      .catch(() => setError("Error al cargar empresas"))
  }, [])

  function handleSelect(company: CompanyProfile) {
    setSelectedCompany(company)
    setMode("seed")
    setStep("review")
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    fetch("/api/due-diligence/parse", { method: "POST", body: formData })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setUploadedFinancials(d.financials)
        setSelectedCompany({ id: "uploaded", ruc: "", name: d.companyName || "Empresa subida", industry: "", sector: "", description: "Datos subidos por el usuario", founded: d.financials[0]?.year || 2024, status: "activa" })
        setMode("upload")
        setStep("review")
      })
      .catch((e) => setError(e.message || "Error al procesar archivo"))
      .finally(() => setLoading(false))
  }

  async function handleAnalyze() {
    if (!selectedCompany) return
    setLoading(true)
    setStep("analyzing")
    try {
      const body = mode === "upload" && uploadedFinancials
        ? { companyId: null, financials: uploadedFinancials, companyName: selectedCompany.name, industry: selectedCompany.industry }
        : { companyId: selectedCompany.id }
      const res = await fetch("/api/due-diligence/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report)
      setJobId(data.jobId || null)
      setStep("report")
    } catch (e: any) {
      setError(e.message || "Error al generar el informe")
      setStep("review")
    } finally { setLoading(false) }
  }

  async function handleDownloadPdf() {
    if (!report || !jobId) return
    window.open(`/api/reports/${jobId}/pdf`, "_blank")
    setPdfLoading(false)
  }

  async function handleDownloadPdfFallback() {
    if (!report) return
    setPdfLoading(true)
    try {
      const res = await fetch("/api/due-diligence/pdf-legacy", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report }),
      })
      if (!res.ok) throw new Error("Error generando PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `due-diligence-${report.company.name.toLowerCase().replace(/\s+/g, "-")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message || "Error al descargar PDF")
    } finally { setPdfLoading(false) }
  }

  function reset() {
    setStep("select"); setSelectedCompany(null); setReport(null); setError(null); setUploadedFinancials(null); setMode(null)
  }

  const tr = (path: string) => t(locale, path)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tr("wizard.title")}</h1>
            <p className="text-gray-500 mt-1">{tr("wizard.subtitle")}</p>
          </div>
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-blue-600 text-white" : STEPS.indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                {STEPS.indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span className={`hidden sm:inline ${step === s ? "text-blue-600 font-medium" : "text-gray-400"}`}>{tr(`wizard.steps.${i}`)}</span>
              {i < 4 && <div className="w-8 h-px bg-gray-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline">Cerrar</button>
          </div>
        )}

        {/* Step 1: Select */}
        {step === "select" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{tr("wizard.selectTitle")}</h2>

            {/* Seed companies */}
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Empresas de ejemplo</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {companies.map((c) => (
                <button key={c.id} onClick={() => handleSelect(c)} className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{c.industry}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>RUC: {c.ruc}</span>
                    <span>Desde {c.founded}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Upload */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">{tr("wizard.uploadTitle")}</h3>
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors">
                <p className="text-gray-500 mb-4">{tr("wizard.uploadDesc")}</p>
                <div className="flex gap-3 justify-center">
                  <a href="/api/due-diligence/template" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">{tr("wizard.downloadTemplate")}</a>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    {loading ? "Subiendo..." : "Subir archivo"}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === "review" && selectedCompany && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{tr("wizard.reviewTitle")} — {selectedCompany.name}</h2>
            <p className="text-gray-500 text-sm mb-6">{tr("wizard.reviewDesc")}</p>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">{tr("wizard.changeCompany")}</button>
              <button onClick={handleAnalyze} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{tr("wizard.generateAnalysis")}</button>
            </div>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === "analyzing" && (
          <div className="text-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{tr("wizard.analyzing")}</h3>
            <p className="text-sm text-gray-500">{tr("wizard.analyzingDesc")}</p>
          </div>
        )}

        {/* Step 4: Report */}
        {step === "report" && report && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{tr("wizard.reportTitle")}</h2>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">{tr("wizard.newAnalysis")}</button>
                <button onClick={handleDownloadPdf} disabled={pdfLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  {pdfLoading ? "Generando PDF..." : tr("wizard.downloadPdf")}
                </button>
              </div>
            </div>
            <DueDiligenceReportView report={report} locale={locale} />
          </div>
        )}
      </div>
    </div>
  )
}
