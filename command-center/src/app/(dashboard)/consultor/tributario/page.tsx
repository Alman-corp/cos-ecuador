'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  FileText,
  Send,
  BarChart3,
  Receipt,
  Scale,
  Shield,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileDown,
  Users,
  Building2,
} from 'lucide-react'

const summaryCards = [
  {
    title: 'IVA a Pagar este Mes',
    value: '$4,280.50',
    change: '+12% vs mes anterior',
    trend: 'up',
    icon: Calculator,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Retenciones Pendientes',
    value: '$1,150.00',
    change: '3 por vencer',
    trend: 'warning',
    icon: Shield,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Anexos por Entregar',
    value: '2',
    change: 'ATS Julio, REOC Julio',
    trend: 'warning',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'IR Anticipo 2025',
    value: '$12,300.00',
    change: '50% pagado',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
]

const recentDeclarations = [
  { type: 'IVA', period: 'Junio 2026', date: '15/07/2026', status: 'Enviado', form: '104', amount: '$4,280.50' },
  { type: 'ATS', period: 'Junio 2026', date: '14/07/2026', status: 'Pendiente', form: '-', amount: '- culmen' },
  { type: 'Ret. Fuente', period: 'Junio 2026', date: '12/07/2026', status: 'Aprobado', form: '106', amount: '$890.00' },
  { type: 'ICE', period: 'Junio 2026', date: '10/07/2026', status: 'Borrador', form: '105', amount: '$1,230.00' },
]

const quickActions = [
  { label: 'Nueva Declaración IVA', icon: Plus, href: '/consultor/tributario/simulador-iva', variant: 'default' as const },
  { label: 'Generar ATS', icon: FileDown, href: '/consultor/tributario/anexos', variant: 'outline' as const },
  { label: 'Enviar a SRI', icon: Send, href: '/consultor/tributario/sri', variant: 'secondary' as const },
  { label: 'Calcular Renta', icon: Calculator, href: '/consultor/tributario/renta', variant: 'ghost' as const },
]

export default function TributarioHubPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('resumen')

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Enviado': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'Aprobado': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'Pendiente': return <Clock className="h-4 w-4 text-amber-500" />
      case 'Borrador': return <AlertTriangle className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Tributario Ecuador
          </h1>
          <p className="text-muted-foreground mt-1">Dashboard de obligaciones tributarias y herramientas de cálculo</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">Julio 2026</Badge>
          <Badge variant="secondary" className="text-xs">RUC: 1790000002001</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
              <p className={`text-xs mt-1 ${
                card.trend === 'up' ? 'text-green-600' :
                card.trend === 'warning' ? 'text-amber-600' : 'text-muted-foreground'
              }`}>{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button variant={action.variant} size="sm">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="iva" onClick={() => router.push('/consultor/tributario/simulador-iva')}>IVA</TabsTrigger>
          <TabsTrigger value="renta" onClick={() => router.push('/consultor/tributario/renta')}>Renta</TabsTrigger>
          <TabsTrigger value="retenciones" onClick={() => router.push('/consultor/tributario/retenciones')}>Retenciones</TabsTrigger>
          <TabsTrigger value="ice" onClick={() => router.push('/consultor/tributario/ice')}>ICE</TabsTrigger>
          <TabsTrigger value="anexos" onClick={() => router.push('/consultor/tributario/anexos')}>Anexos</TabsTrigger>
          <TabsTrigger value="sri" onClick={() => router.push('/consultor/tributario/sri')}>SRI</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Declaraciones Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDeclarations.map((dec, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {statusIcon(dec.status)}
                        <div>
                          <p className="text-sm font-medium">{dec.type} - {dec.period}</p>
                          <p className="text-xs text-muted-foreground">Form. {dec.form} · {dec.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{dec.amount}</p>
                        <Badge variant={dec.status === 'Aprobado' ? 'default' : dec.status === 'Pendiente' ? 'outline' : 'secondary'} className="text-[10px]">
                          {dec.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Acceso Rápido por Módulo
                </CardTitle>
                <CardDescription>Herramientas tributarias del Ecuador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Simulador IVA Form 104', icon: Calculator, href: '/consultor/tributario/simulador-iva', desc: 'Calcula IVA mensual' },
                    { name: 'Calendario SRI', icon: Calendar, href: '/consultor/tributario/calendario', desc: 'Vencimientos por RUC', },
                    { name: 'Renta Anual', icon: TrendingUp, href: '/consultor/tributario/renta', desc: 'IR personas y empresas' },
                    { name: 'Retenciones', icon: Shield, href: '/consultor/tributario/retenciones', desc: 'IVA/IR retenciones' },
                    { name: 'ICE', icon: Receipt, href: '/consultor/tributario/ice', desc: 'Impuesto consumos' },
                    { name: 'Anexos / ATS', icon: FileText, href: '/consultor/tributario/anexos', desc: 'XML y validación' },
                    { name: 'SRI Envíos', icon: Send, href: '/consultor/tributario/sri', desc: 'Enviar comprobantes' },
                    { name: 'Cruces', icon: BarChart3, href: '/consultor/tributario/cruces', desc: 'Validación cruzada' },
                  ].map((mod) => (
                    <Link key={mod.href} href={mod.href}>
                      <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <mod.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{mod.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mod.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Próximos Vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                    <p className="text-sm font-medium text-red-700">IVA Junio 2026</p>
                    <p className="text-xs text-red-600">Vence: 20/07/2026</p>
                    <p className="text-xs text-red-500">Faltan 7 días</p>
                  </div>
                  <div className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg">
                    <p className="text-sm font-medium text-amber-700">ATS Junio 2026</p>
                    <p className="text-xs text-amber-600">Vence: 25/07/2026</p>
                    <p className="text-xs text-amber-500">Faltan 12 días</p>
                  </div>
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                    <p className="text-sm font-medium text-blue-700">Ret. Fuente Junio</p>
                    <p className="text-xs text-blue-600">Vence: 28/07/2026</p>
                    <p className="text-xs text-blue-500">Faltan 15 días</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
