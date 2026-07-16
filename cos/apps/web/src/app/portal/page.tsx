'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PortalData {
  companyName: string
  reportUrl: string
  completedAt: string
  consultantName: string
  consultantFirm: string
  expiresAt: string
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal/reports', { credentials: 'include' })
        if (res.status === 401) {
          router.push('/portal/login')
          return
        }
        if (!res.ok) {
          setError('Error al cargar informaci\u00f3n')
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Error de conexi\u00f3n')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/portal/logout', { method: 'POST' })
    router.push('/portal/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/portal/login')} className="text-blue-600 underline">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Portal de Due Diligence</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{data.consultantFirm}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
              Cerrar sesi\u00f3n
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-8">
            <h2 className="text-2xl font-bold text-white mb-1">{data.companyName}</h2>
            <p className="text-blue-100">Informe de Due Diligence Financiero</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Preparado por:</span>
                <p className="font-medium text-gray-900">{data.consultantName}</p>
              </div>
              <div>
                <span className="text-gray-500">Firma:</span>
                <p className="font-medium text-gray-900">{data.consultantFirm}</p>
              </div>
              <div>
                <span className="text-gray-500">Fecha de finalizaci&oacute;n:</span>
                <p className="font-medium text-gray-900">
                  {new Date(data.completedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Acceso v&aacute;lido hasta:</span>
                <p className="font-medium text-gray-900">
                  {new Date(data.expiresAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <a
                href={data.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Informe PDF
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
