'use client'

import { useState } from 'react'
import { PRICES } from '@/lib/stripe/client'

const PLANS = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: '$497',
    period: '/mes',
    credits: 3,
    description: 'Para consultores independientes que realizan evaluaciones ocasionalmente.',
    features: ['3 Due Diligence por mes', 'Informe PDF de 20 p\u00e1ginas', 'Panel de resultados', 'Soporte por email'],
    highlight: false,
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    price: '$1,497',
    period: '/mes',
    credits: 15,
    description: 'Para firmas peque\u00f1as con m\u00faltiples clientes activos.',
    features: ['15 Due Diligence por mes', 'Todo lo de Starter', 'Portal para clientes', 'Prioridad en procesamiento'],
    highlight: true,
  },
  {
    key: 'FIRM',
    name: 'Firm',
    price: '$3,497',
    period: '/mes',
    credits: 999,
    description: 'Para firmas de consultor\u00eda con alto volumen de an\u00e1lisis.',
    features: ['Due Diligence ilimitados', 'Todo lo de Growth', 'API de integraci\u00f3n', 'Soporte prioritario 24/7', 'Consultor dedicado'],
    highlight: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error al iniciar el pago. Intente de nuevo.')
      }
    } catch {
      alert('Error de conexi\u00f3n.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Planes de Due Diligence</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte al volumen de an&aacute;lisis de tu firma. Todos los planes incluyen nuestro informe PDF de 20 p&aacute;ginas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-white ring-2 ring-blue-600 shadow-lg scale-105'
                  : 'bg-white shadow'
              }`}
            >
              {plan.highlight && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full self-start mb-3">
                  M&Aacute;S POPULAR
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                <strong className="text-blue-600">{plan.credits === 999 ? 'Ilimitados' : `${plan.credits} cr\u00e9ditos`}</strong> por mes
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2 mt-0.5">&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(PRICES[plan.key as keyof typeof PRICES])}
                disabled={loading === PRICES[plan.key as keyof typeof PRICES]}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-100'
                }`}
              >
                {loading === PRICES[plan.key as keyof typeof PRICES] ? 'Redirigiendo...' : 'Seleccionar plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-8 max-w-lg mx-auto text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Compra individual</h3>
          <p className="text-sm text-gray-500 mb-4">Un solo Due Diligence sin compromiso mensual.</p>
          <div className="text-2xl font-bold text-gray-900 mb-4">$3,000 <span className="text-sm font-normal text-gray-500">por an&aacute;lisis</span></div>
          <button
            onClick={() => handleCheckout(PRICES.DD_SINGLE)}
            disabled={loading === PRICES.DD_SINGLE}
            className="w-full py-3 rounded-lg font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-600 transition"
          >
            {loading === PRICES.DD_SINGLE ? 'Redirigiendo...' : 'Comprar Due Diligence'}
          </button>
        </div>
      </div>
    </div>
  )
}
