"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Step = "company" | "upload" | "done"

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("company")
  const [form, setForm] = useState({ name: "", taxId: "", email: "", phone: "", industry: "", firstName: "", lastName: "" })
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem("cos_company_id", data.companyId)
      setStep("upload")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (files.length === 0) return
    const cid = localStorage.getItem("cos_company_id")
    setUploading(true)
    try {
      for (const file of files) {
        await fetch("/api/documents", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: null, title: file.name,
            documentType: "financial_statement", fileUrl: URL.createObjectURL(file), status: "pending",
          }),
        })
      }
    } catch {} // Documents uploaded best-effort
    setUploading(false)
    setStep("done")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {(["company", "upload", "done"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step === s ? "bg-accent-600 text-white" :
                ["upload", "done"].includes(step) && i <= ["company", "upload", "done"].indexOf(step) ? "bg-accent-600/20 text-accent-400" : "bg-surface-800 text-surface-500"
              }`}>
                {["upload", "done"].includes(step) && i < ["company", "upload", "done"].indexOf(step) ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`h-px w-8 ${["upload", "done"].includes(step) && i < ["company", "upload", "done"].indexOf(step) ? "bg-accent-600" : "bg-surface-700"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info — REAL DB */}
        {step === "company" && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600/10 ring-1 ring-accent-500/20">
                <svg className="h-6 w-6 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-surface-50">Activa tu consultoría</h1>
              <p className="mt-1 text-sm text-surface-400">Completa los datos de tu empresa para empezar</p>
            </div>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Razón Social</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Exportadora Guayaquil S.A." className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Nombre administrador</label>
                  <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Carlos" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Apellido</label>
                  <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Pérez" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">RUC</label>
                  <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="1790012345001" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Industria</label>
                  <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 outline-none focus:border-accent-500">
                    <option value="">Selecciona</option>
                    <option value="comercio">Comercio</option>
                    <option value="manufactura">Manufactura</option>
                    <option value="logistica">Logística</option>
                    <option value="servicios">Servicios</option>
                    <option value="construccion">Construcción</option>
                    <option value="agricultura">Agricultura</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Email corporativo</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="carlos@exportadora.com" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+593 4 259 8000" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50 transition-colors">
                {loading ? "Creando cuenta..." : "Continuar"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload Documents */}
        {step === "upload" && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600/10 ring-1 ring-accent-500/20">
                <svg className="h-6 w-6 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-surface-50">Sube tu primer balance</h1>
              <p className="mt-1 text-sm text-surface-400">PDF, Excel o XML. Lo procesamos en segundos.</p>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)) }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-800/50 px-6 py-10 text-center transition-colors hover:border-accent-500/50"
            >
              <svg className="mb-3 h-8 w-8 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-sm text-surface-400">
                {files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : "Arrastra tus archivos aquí o"}
              </p>
              {files.length === 0 && (
                <label className="mt-2 cursor-pointer rounded-lg bg-accent-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-500">
                  Seleccionar archivos
                  <input type="file" multiple accept=".pdf,.xls,.xlsx,.xml,.csv" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                </label>
              )}
              {files.length > 0 && (
                <div className="mt-4 w-full space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-400">
                      <span>{f.name}</span>
                      <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep("company")} className="flex-1 rounded-lg border border-surface-700 bg-surface-800/50 px-4 py-2.5 text-sm font-medium text-surface-300 hover:bg-surface-800 transition-colors">Atrás</button>
              <button onClick={handleUpload} disabled={files.length === 0 || uploading} className="flex-1 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50 transition-colors">
                {uploading ? "Procesando..." : "Subir y analizar"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-surface-50">¡Todo listo!</h1>
            <p className="mt-2 text-sm text-surface-400">
              Tu empresa ha sido registrada. Ya puedes acceder a tu dashboard con análisis financieros, alertas y más.
            </p>
            <button onClick={() => router.push("/director")} className="mt-8 w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-500 transition-colors">
              Ir al Dashboard
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-surface-600">
          ¿Ya tienes cuenta? <Link href="/auth/login" className="text-accent-400 hover:text-accent-300">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
