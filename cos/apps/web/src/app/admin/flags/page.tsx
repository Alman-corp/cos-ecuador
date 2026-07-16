"use client"

import { useState, useEffect } from "react"

interface Flag {
  id: string
  flag: string
  isEnabled: boolean
  companyId?: string
}

export default function FlagsAdminPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { loadFlags() }, [])

  async function loadFlags() {
    setLoading(true)
    const res = await fetch("/api/admin/flags")
    const data = await res.json()
    setFlags(data.flags)
    setLoading(false)
  }

  async function toggleFlag(flag: string, current: boolean) {
    setMessage(null)
    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag, isEnabled: !current }),
    })
    if (!res.ok) { setMessage("Error al actualizar"); return }
    setMessage(`Flag "${flag}" actualizado a ${!current ? "ON" : "OFF"}`)
    loadFlags()
  }

  const killSwitches = flags.filter((f) => !f.isEnabled)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Flags</h1>
        <p className="text-gray-500 mb-6">Control de funcionalidades del sistema. Los flags desactivados actúan como kill switches.</p>

        {killSwitches.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-1">Kill Switches Activos ({killSwitches.length})</h3>
            <p className="text-sm text-red-600">Las siguientes funcionalidades están desactivadas: {killSwitches.map((f) => f.flag).join(", ")}</p>
          </div>
        )}

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">{message}</div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Flag</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Alcance</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Acción</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">{f.flag}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${f.isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {f.isEnabled ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{f.companyId || "Global"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleFlag(f.flag, f.isEnabled)} className={`px-3 py-1 text-xs rounded font-medium ${f.isEnabled ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        {f.isEnabled ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
