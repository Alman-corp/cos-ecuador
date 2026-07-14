'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Scale, Shield, Plus, Search, FileCheck, Clock, ArrowRight, AlertTriangle, Gavel, BookOpen } from 'lucide-react'
import type { ContractDocument, ContractStatus } from '@/lib/legal/contract-types'
import { getAllContracts } from '@/lib/legal/legal-service'

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Borrador',
  review: 'Revisión',
  approved: 'Aprobado',
  signed: 'Firmado',
  expired: 'Vencido',
  cancelled: 'Cancelado',
}

const statusColors: Record<ContractStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
  review: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  signed: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

const statsCards = [
  {
    title: 'Contratos Activos',
    icon: FileText,
    value: 0,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    title: 'Borradores',
    icon: Clock,
    value: 0,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/50',
  },
  {
    title: 'Cláusulas Analizadas',
    icon: Shield,
    value: 0,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/50',
  },
]

const quickActions = [
  {
    label: 'Nuevo Contrato',
    icon: Plus,
    href: '/consultor/legal/contratos',
    color: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  {
    label: 'Analizar Cláusula',
    icon: Gavel,
    href: '/consultor/legal/clausulas',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  {
    label: 'Plantillas',
    icon: BookOpen,
    href: '/consultor/legal/plantillas',
    color: 'bg-accent text-accent-foreground hover:bg-accent/80',
  },
]

const tabs = ['Todos', 'Borradores', 'Revisión', 'Firmados'] as const

function getTabFilter(tab: string): ContractStatus | undefined {
  const map: Record<string, ContractStatus> = {
    Borradores: 'draft',
    Revisión: 'review',
    Firmados: 'signed',
  }
  return map[tab]
}

const mockContracts: ContractDocument[] = [
  {
    id: 'mock-1',
    templateId: 'contrato-servicios-profesionales',
    title: 'Contrato Servicios Profesionales - María López',
    content: '',
    variables: { profesional_nombre: 'María López' },
    status: 'draft',
    version: 1,
    versions: [],
    parties: [
      { name: 'María López', role: 'recipient', documentType: 'cedula', documentNumber: '1712345678' },
      { name: 'TechSolutions SA', role: 'issuer', documentType: 'ruc', documentNumber: '1792345678001' },
    ],
    tags: ['servicios', 'profesionales'],
    notes: 'Pendiente revisión de honorarios',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-15T14:30:00Z',
  },
  {
    id: 'mock-2',
    templateId: 'contrato-confidencialidad-nda',
    title: 'NDA - Proyecto Alpha',
    content: '',
    variables: { parte_receptora: 'Consultoría XYZ' },
    status: 'review',
    version: 2,
    versions: [],
    parties: [
      { name: 'Consultoría XYZ', role: 'recipient', documentType: 'ruc', documentNumber: '1798765432001' },
      { name: 'Alpha Corp', role: 'issuer', documentType: 'ruc', documentNumber: '1791112233001' },
    ],
    tags: ['confidencialidad', 'nda'],
    notes: '',
    createdAt: '2026-05-20T09:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z',
  },
  {
    id: 'mock-3',
    templateId: 'contrato-arrendamiento',
    title: 'Arriendo Local Comercial Centro',
    content: '',
    variables: { arrendatario: 'Comercial del Sur' },
    status: 'signed',
    version: 3,
    versions: [],
    parties: [
      { name: 'Comercial del Sur', role: 'recipient', documentType: 'ruc', documentNumber: '1799988776001' },
      { name: 'Inmobiliaria Norte', role: 'issuer', documentType: 'ruc', documentNumber: '1795544332001' },
    ],
    tags: ['arrendamiento', 'comercial'],
    notes: '',
    signedAt: '2026-06-01T10:00:00Z',
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'mock-4',
    templateId: 'contrato-laboral',
    title: 'Contrato Laboral - Pedro Sánchez',
    content: '',
    variables: { trabajador: 'Pedro Sánchez' },
    status: 'draft',
    version: 1,
    versions: [],
    parties: [
      { name: 'Pedro Sánchez', role: 'recipient', documentType: 'cedula', documentNumber: '1722233445' },
      { name: 'Empresa Ejemplo SA', role: 'issuer', documentType: 'ruc', documentNumber: '1791122334001' },
    ],
    tags: ['laboral', 'indefinido'],
    notes: '',
    createdAt: '2026-06-12T15:00:00Z',
    updatedAt: '2026-06-12T15:00:00Z',
  },
  {
    id: 'mock-5',
    templateId: 'contrato-compraventa',
    title: 'Compraventa Vehículo - Juan Pérez',
    content: '',
    variables: { comprador: 'Juan Pérez' },
    status: 'approved',
    version: 2,
    versions: [],
    parties: [
      { name: 'Juan Pérez', role: 'recipient', documentType: 'cedula', documentNumber: '1711122334' },
      { name: 'Automotriz XYZ', role: 'issuer', documentType: 'ruc', documentNumber: '1793344556001' },
    ],
    tags: ['compraventa', 'vehículo'],
    notes: 'Pendiente firma notarial',
    createdAt: '2026-05-15T10:00:00Z',
    updatedAt: '2026-06-14T09:00:00Z',
  },
  {
    id: 'mock-6',
    templateId: 'contrato-consultoria',
    title: 'Consultoría Estratégica - Grupo Delta',
    content: '',
    variables: { consultor: 'Consultora Estratégica SA' },
    status: 'review',
    version: 1,
    versions: [],
    parties: [
      { name: 'Consultora Estratégica SA', role: 'issuer', documentType: 'ruc', documentNumber: '1795566778001' },
      { name: 'Grupo Delta', role: 'recipient', documentType: 'ruc', documentNumber: '1797788990001' },
    ],
    tags: ['consultoría', 'estratégica'],
    notes: 'Revisar cláusula de confidencialidad',
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-13T16:00:00Z',
  },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LegalHubPage() {
  const [activeTab, setActiveTab] = useState<string>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [contracts, setContracts] = useState<ContractDocument[]>([])

  useEffect(() => {
    const stored = getAllContracts()
    setContracts(stored.length > 0 ? stored : mockContracts)
  }, [])

  const filteredContracts = contracts.filter((c) => {
    const tabStatus = getTabFilter(activeTab)
    if (tabStatus && c.status !== tabStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.parties.some((p) => p.name.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const activeCount = contracts.filter((c) => c.status === 'signed' || c.status === 'approved').length
  const draftCount = contracts.filter((c) => c.status === 'draft').length
  const analysisCount = 12

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Legal Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de contratos, cláusulas y documentos legales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, i) => {
          const val = i === 0 ? activeCount : i === 1 ? draftCount : analysisCount
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{val}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {i === 0 ? 'En ejecución' : i === 1 ? 'Pendientes de revisión' : 'En este mes'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button className={`w-full h-20 text-base gap-3 ${action.color}`} variant={action.color.startsWith('bg-primary') ? 'default' : 'secondary'}>
              <action.icon className="h-6 w-6" />
              {action.label}
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contratos Recientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contratos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No se encontraron contratos</p>
              <Link href="/consultor/legal/contratos">
                <Button variant="outline" className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Crear nuevo contrato
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContracts.map((c) => (
                <Link key={c.id} href={`/consultor/legal/contratos/${c.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.parties.map((p) => p.name).join(', ')} · {formatDate(c.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`shrink-0 ${statusColors[c.status]}`} variant="outline">
                      {statusLabels[c.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas y Recordatorios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
              <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
              <p className="text-sm">3 contratos por vencer en los próximos 30 días</p>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <FileText className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm">2 borradores pendientes de completar variables</p>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm">Cláusula de penalidad con riesgo alto detectada en contrato NDA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
