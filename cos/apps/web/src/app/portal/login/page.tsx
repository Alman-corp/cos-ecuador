'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'login' | 'change-password' | 'error'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState('')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Credenciales inv\u00e1lidas')
        setStep('error')
        return
      }

      setJobId(data.jobId)

      if (data.isFirstLogin) {
        setStep('change-password')
      } else {
        router.push('/portal')
      }
    } catch {
      setError('Error de conexi\u00f3n')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword: password, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cambiar contrase\u00f1a')
        return
      }

      router.push('/portal')
    } catch {
      setError('Error de conexi\u00f3n')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'change-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cambiar contrase\u00f1a</h1>
          <p className="text-sm text-gray-500 mb-6">Es tu primer acceso. Por favor, establece una nueva contrase\u00f1a.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contrase\u00f1a</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={8}
                required
                placeholder="M\u00ednimo 8 caracteres"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
            >
              {loading ? 'Guardando...' : 'Cambiar contrase\u00f1a y acceder'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Portal de Due Diligence</h1>
          <p className="text-sm text-gray-500">Accede a tus informes financieros</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electr\u00f3nico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="cliente@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrase\u00f1a</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Contrase\u00f1a temporal"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">
          Las credenciales fueron enviadas al correo electr\u00f3nico registrado.
        </p>
      </div>
    </div>
  )
}
