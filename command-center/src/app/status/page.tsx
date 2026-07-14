'use client'

import { useState, useEffect, useCallback } from 'react'

interface Service {
  id: string
  name: string
  description: string
  status: 'operational' | 'degraded' | 'down'
  responseTime: number
  uptime: number
  children?: { name: string; status: 'operational' | 'degraded' | 'down' }[]
}

interface Incident {
  date: string
  title: string
  description: string
  status: 'resolved' | 'monitoring' | 'investigating'
}

const services: Service[] = [
  {
    id: 'tax-engine',
    name: 'Tax Engine',
    description: 'Cálculos tributarios',
    status: 'operational',
    responseTime: 145,
    uptime: 99.87,
    children: [
      { name: 'IVA', status: 'operational' },
      { name: 'Renta', status: 'operational' },
      { name: 'Retenciones', status: 'operational' },
      { name: 'ICE', status: 'operational' },
    ],
  },
  {
    id: 'ai-orchestrator',
    name: 'AI Orchestrator',
    description: 'Orquestación de agentes IA',
    status: 'operational',
    responseTime: 320,
    uptime: 99.72,
    children: [
      { name: 'Agentes', status: 'operational' },
      { name: 'Macroeconomía', status: 'degraded' },
      { name: 'Legal', status: 'operational' },
    ],
  },
  {
    id: 'data-platform',
    name: 'Data Platform',
    description: 'Almacenamiento y procesamiento',
    status: 'operational',
    responseTime: 85,
    uptime: 99.95,
    children: [
      { name: 'Almacenamiento', status: 'operational' },
      { name: 'Procesamiento', status: 'operational' },
    ],
  },
  {
    id: 'bi-service',
    name: 'BI Service',
    description: 'Reportes y dashboards',
    status: 'operational',
    responseTime: 210,
    uptime: 99.63,
    children: [
      { name: 'Reportes', status: 'operational' },
      { name: 'Dashboards', status: 'operational' },
    ],
  },
  {
    id: 'security-service',
    name: 'Security Service',
    description: 'Autenticación y permisos',
    status: 'operational',
    responseTime: 55,
    uptime: 99.99,
    children: [
      { name: 'Autenticación', status: 'operational' },
      { name: 'Permisos', status: 'operational' },
    ],
  },
  {
    id: 'command-center',
    name: 'Command Center',
    description: 'Web App y API',
    status: 'operational',
    responseTime: 42,
    uptime: 99.97,
    children: [
      { name: 'Web App', status: 'operational' },
      { name: 'API', status: 'operational' },
    ],
  },
  {
    id: 'dr-service',
    name: 'DR Service',
    description: 'Backups y failover',
    status: 'operational',
    responseTime: 180,
    uptime: 99.91,
    children: [
      { name: 'Backups', status: 'operational' },
      { name: 'Failover', status: 'operational' },
    ],
  },
  {
    id: 'plugin-registry',
    name: 'Plugin Registry',
    description: 'Marketplace y plugins',
    status: 'operational',
    responseTime: 95,
    uptime: 99.88,
    children: [
      { name: 'Marketplace', status: 'operational' },
      { name: 'Plugins', status: 'operational' },
    ],
  },
]

const incidents: Incident[] = [
  {
    date: '2026-07-08',
    title: 'Latencia elevada en Tax Engine durante proceso masivo de declaraciones',
    description:
      'El servicio de Tax Engine experimentó latencia de hasta 4s durante el procesamiento masivo de declaraciones mensuales. Se escalaron los workers de procesamiento y se optimizaron las consultas a base de datos. El servicio se recuperó completamente a las 14:30 UTC.',
    status: 'resolved',
  },
  {
    date: '2026-07-05',
    title: 'Caída temporal del servicio SRI por mantenimiento externo',
    description:
      'El proveedor externo SRI realizó mantenimiento no anunciado en sus servicios de autenticación, afectando la validación de RUCs y la consulta de comprobantes electrónicos. Se activaron los mecanismos de failover y caché local. Servicio restaurado una vez finalizado el mantenimiento externo.',
    status: 'resolved',
  },
  {
    date: '2026-07-01',
    title: 'Degradación en AI Orchestrator — Módulo Macroeconomía',
    description:
      'El módulo de Macroeconomía en AI Orchestrator presentó respuestas parciales debido a un error en el pipeline de datos del BCE. Se corrigió la fuente de datos y se purgaron los resultados inconsistentes. El servicio opera con normalidad desde las 11:00 UTC.',
    status: 'resolved',
  },
  {
    date: '2026-06-25',
    title: 'Interrupción breve en BI Service — Generación de reportes',
    description:
      'La generación de reportes programados falló debido a una migración de esquema en la base de datos analítica. Se restauró desde backup y se reprogramaron los reportes afectados. Tiempo de resolución: 12 minutos.',
    status: 'resolved',
  },
]

type SystemStatus = 'operational' | 'degraded' | 'down'

function getSystemStatus(services: Service[]): SystemStatus {
  const statuses = services.map((s) => s.status)
  if (statuses.some((s) => s === 'down')) return 'down'
  if (statuses.some((s) => s === 'degraded')) return 'degraded'
  return 'operational'
}

function statusConfig(status: SystemStatus) {
  switch (status) {
    case 'operational':
      return {
        label: 'Todos los sistemas operativos',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'text-emerald-800',
      }
    case 'degraded':
      return {
        label: 'Rendimiento degradado',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        text: 'text-amber-800',
      }
    case 'down':
      return {
        label: 'Interrupción detectada',
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
        text: 'text-red-800',
      }
  }
}

function serviceStatusDot(status: Service['status']) {
  switch (status) {
    case 'operational':
      return 'bg-emerald-500'
    case 'degraded':
      return 'bg-amber-500'
    case 'down':
      return 'bg-red-500'
  }
}

function childStatusDot(status: string) {
  switch (status) {
    case 'operational':
      return 'bg-emerald-400'
    case 'degraded':
      return 'bg-amber-400'
    case 'down':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
  }
}

function incidentStatusBadge(status: Incident['status']) {
  switch (status) {
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700'
    case 'monitoring':
      return 'bg-blue-100 text-blue-700'
    case 'investigating':
      return 'bg-red-100 text-red-700'
  }
}

function incidentStatusLabel(status: Incident['status']) {
  switch (status) {
    case 'resolved':
      return 'Resuelto'
    case 'monitoring':
      return 'Monitoreando'
    case 'investigating':
      return 'Investigando'
  }
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${serviceStatusDot(service.status)}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{service.name}</p>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-700">{service.responseTime}ms</p>
          <p className="text-xs text-gray-400">{service.uptime}% uptime</p>
        </div>
      </div>
      {service.children && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {service.children.map((child) => (
            <div key={child.name} className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1">
              <div className={`h-2 w-2 rounded-full ${childStatusDot(child.status)}`} />
              <span className="text-xs text-gray-600">{child.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${incidentStatusBadge(incident.status)}`}>
              {incidentStatusLabel(incident.status)}
            </span>
            <p className="truncate text-sm font-medium text-gray-900">{incident.title}</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{incident.description}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{incident.date}</span>
      </div>
    </div>
  )
}

export default function StatusPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(getSystemStatus(services))
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error('Health check failed')
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    checkHealth().finally(() => setLoading(false))
    const interval = setInterval(() => {
      checkHealth()
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  if (loading) return null

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Error al cargar el estado</h2>
          <p className="mt-1 text-sm text-gray-500">No se pudo conectar con el servicio de monitoreo.</p>
          <button
            onClick={() => {
              setError(false)
              setLoading(true)
              checkHealth().finally(() => setLoading(false))
            }}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const config = statusConfig(systemStatus)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className={`mb-8 rounded-lg border p-4 ${config.bg} ${config.border}`}>
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${config.dot}`} />
            <p className={`text-sm font-semibold ${config.text}`}>{config.label}</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Servicios</h2>
            <span className="text-xs text-gray-400">
              Última actualización: {lastUpdated.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Historial de incidentes</h2>
          <div className="space-y-3">
            {incidents.map((incident, i) => (
              <IncidentCard key={i} incident={incident} />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          Últimos 90 días &middot;{' '}
          <a href="https://status.cos.ec" className="underline hover:text-gray-600">
            status.cos.ec
          </a>
        </div>
      </div>
    </div>
  )
}
