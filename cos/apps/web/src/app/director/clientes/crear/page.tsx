"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateClientPage() {
  const [form, setForm] = useState({
    name: "", taxId: "", email: "", phone: "", industry: "",
    contactFirstName: "", contactLastName: "", contactEmail: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, contactEmail: form.contactEmail || form.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/director/clientes/${data.clientId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: "Razón Social", key: "name", required: true, placeholder: "Exportadora Guayaquil S.A." },
    { label: "RUC", key: "taxId", placeholder: "1790012345001" },
    { label: "Email", key: "email", type: "email", placeholder: "contacto@empresa.ec" },
    { label: "Teléfono", key: "phone", type: "tel", placeholder: "+593 4 259 8000" },
    { label: "Industria", key: "industry", type: "select",
      options: [{ value: "", label: "Selecciona" }, { value: "comercio", label: "Comercio" }, { value: "manufactura", label: "Manufactura" }, { value: "logistica", label: "Logística" }, { value: "servicios", label: "Servicios" }, { value: "construccion", label: "Construcción" }, { value: "agricultura", label: "Agricultura" }] },
    { label: "Nombre Contacto", key: "contactFirstName", required: true, placeholder: "Carlos" },
    { label: "Apellido Contacto", key: "contactLastName", required: true, placeholder: "Pérez" },
    { label: "Email Contacto", key: "contactEmail", type: "email", placeholder: "carlos@empresa.ec" },
  ]

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-50">Nuevo Cliente</h1>
        <p className="text-sm text-surface-400">Ingresa los datos de la empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">
              {f.label} {f.required && <span className="text-rose-500">*</span>}
            </label>
            {f.type === "select" ? (
              <select value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 outline-none focus:border-accent-500">
                {f.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type || "text"} required={f.required} value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-accent-500" />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50 transition-colors">
          {loading ? "Creando..." : "Crear Cliente"}
        </button>
      </form>
    </div>
  )
}
