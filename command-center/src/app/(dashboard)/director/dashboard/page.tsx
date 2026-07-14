'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp, TrendingDown, Users, DollarSign, Activity,
  Target, AlertTriangle, CheckCircle, ArrowRight, Clock,
  UserCheck, PhoneCall, MessageSquare, FileText, Handshake,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

/* ─── Types ─── */

interface KPI {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: string
  subtitle: string
}

interface MonthlyMRR {
  month: string
  value: number
}

interface RevenueByService {
  service: string
  value: number
}

interface IndustryRevenue {
  industry: string
  revenue: number
  pct: number
}

interface CohortRow {
  cohort: string
  months: number[]
}

interface PipelineColumn {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  items: PipelineItem[]
}

interface PipelineItem {
  id: string
  name: string
  value: number
  probability: number
}

interface ConsultantUtil {
  name: string
  utilization: number
  billable: number
  nonBillable: number
  status: 'over' | 'target' | 'below'
}

/* ─── Mock Data ─── */

const kpis: KPI[] = [
  { title: 'MRR', value: '$284,500', change: '+12.3%', trend: 'up', icon: DollarSign, color: 'text-emerald-400', subtitle: 'vs mes anterior' },
  { title: 'Clientes Activos', value: '48', change: '+6.7%', trend: 'up', icon: Users, color: 'text-blue-400', subtitle: 'vs trimestre anterior' },
  { title: 'ARPU', value: '$5,927', change: '+4.2%', trend: 'up', icon: Activity, color: 'text-violet-400', subtitle: 'ingreso promedio por cliente' },
  { title: 'Utilización', value: '82%', change: '-3.1%', trend: 'down', icon: Target, color: 'text-amber-400', subtitle: 'capacidad facturable' },
]

const mrrHistory: MonthlyMRR[] = [
  { month: 'Ago', value: 210000 },
  { month: 'Sep', value: 218000 },
  { month: 'Oct', value: 225000 },
  { month: 'Nov', value: 232000 },
  { month: 'Dic', value: 228000 },
  { month: 'Ene', value: 240000 },
  { month: 'Feb', value: 248000 },
  { month: 'Mar', value: 255000 },
  { month: 'Abr', value: 262000 },
  { month: 'May', value: 270000 },
  { month: 'Jun', value: 278000 },
  { month: 'Jul', value: 284500 },
]

const revenueByService: RevenueByService[] = [
  { service: 'Consultoría Tributaria', value: 98000 },
  { service: 'Auditoría Financiera', value: 72000 },
  { service: 'Due Diligence', value: 45000 },
  { service: 'Planificación Fiscal', value: 38000 },
  { service: 'Cumplimiento Legal', value: 31500 },
]

const industryRevenue: IndustryRevenue[] = [
  { industry: 'Servicios Financieros', revenue: 89000, pct: 31 },
  { industry: 'Comercio', revenue: 62000, pct: 22 },
  { industry: 'Manufactura', revenue: 48000, pct: 17 },
  { industry: 'Tecnología', revenue: 41000, pct: 14 },
  { industry: 'Construcción', revenue: 26500, pct: 9 },
  { industry: 'Otros', revenue: 18000, pct: 6 },
]

const cohortData: CohortRow[] = [
  { cohort: 'Ene 2025', months: [100, 85, 78, 72, 68, 64] },
  { cohort: 'Feb 2025', months: [100, 82, 74, 69, 65, 62] },
  { cohort: 'Mar 2025', months: [100, 88, 80, 74, 70, 66] },
  { cohort: 'Abr 2025', months: [100, 84, 76, 71, 67, 63] },
  { cohort: 'May 2025', months: [100, 86, 79, 73, 69, 65] },
  { cohort: 'Jun 2025', months: [100, 83, 75, 70, 66, 62] },
]

const clientMetrics = {
  churnRate: '4.2%',
  ltv: '$42,800',
  ltvCac: '5.8x',
  activeClients: 48,
  newClients: 5,
  lostClients: 2,
}

const pipelineData: PipelineColumn[] = [
  { id: 'lead', title: 'Lead', icon: PhoneCall, color: 'text-slate-400', items: [
    { id: 'p1', name: 'Grupo Financiero Pichincha', value: 120000, probability: 10 },
    { id: 'p2', name: 'Corporación Favorita', value: 85000, probability: 15 },
    { id: 'p3', name: 'Banco de Guayaquil', value: 95000, probability: 12 },
  ]},
  { id: 'contacted', title: 'Contactado', icon: MessageSquare, color: 'text-blue-400', items: [
    { id: 'p4', name: 'Industrias Ales', value: 65000, probability: 25 },
    { id: 'p5', name: 'Pronaca', value: 140000, probability: 30 },
  ]},
  { id: 'qualified', title: 'Calificado', icon: UserCheck, color: 'text-cyan-400', items: [
    { id: 'p6', name: 'Tía S.A.', value: 110000, probability: 50 },
    { id: 'p7', name: 'Nestlé Ecuador', value: 200000, probability: 45 },
    { id: 'p8', name: 'Corporación El Rosado', value: 78000, probability: 55 },
  ]},
  { id: 'proposal', title: 'Propuesta', icon: FileText, color: 'text-yellow-400', items: [
    { id: 'p9', name: 'Cervecería Nacional', value: 180000, probability: 70 },
    { id: 'p10', name: 'Holcim Ecuador', value: 95000, probability: 65 },
  ]},
  { id: 'negotiation', title: 'Negociación', icon: Handshake, color: 'text-emerald-400', items: [
    { id: 'p11', name: 'Banco Central', value: 250000, probability: 85 },
  ]},
]

const consultants: ConsultantUtil[] = [
  { name: 'Ana Martínez', utilization: 92, billable: 147, nonBillable: 13, status: 'over' },
  { name: 'Carlos López', utilization: 88, billable: 141, nonBillable: 19, status: 'target' },
  { name: 'María García', utilization: 78, billable: 125, nonBillable: 35, status: 'below' },
  { name: 'José Rodríguez', utilization: 95, billable: 152, nonBillable: 8, status: 'over' },
  { name: 'Laura Fernández', utilization: 72, billable: 115, nonBillable: 45, status: 'below' },
  { name: 'Pedro Sánchez', utilization: 85, billable: 136, nonBillable: 24, status: 'target' },
  { name: 'Diana Torres', utilization: 90, billable: 144, nonBillable: 16, status: 'target' },
  { name: 'Miguel Ángel', utilization: 68, billable: 109, nonBillable: 51, status: 'below' },
]

const formatCurrency = (v: number) => `$${v.toLocaleString('en-US')}`

/* ─── Subcomponents ─── */

function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <Card className="border-surface-700/50 bg-surface-800/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{kpi.title}</p>
          <kpi.icon className={cn('h-4 w-4', kpi.color)} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-surface-50">{kpi.value}</span>
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400',
          )}>
            {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {kpi.change}
          </span>
        </div>
        <p className="mt-1 text-xs text-surface-500">{kpi.subtitle}</p>
      </CardContent>
    </Card>
  )
}

function CohortRetentionHeatmap({ data }: { data: CohortRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-700/50">
            <th className="pb-2 pr-3 text-left font-medium text-surface-500">Cohorte</th>
            {[1, 2, 3, 4, 5, 6].map((m) => (
              <th key={m} className="pb-2 px-2 text-right font-medium text-surface-500">Mes {m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohort} className="border-b border-surface-700/30">
              <td className="py-2 pr-3 font-medium text-surface-300">{row.cohort}</td>
              {row.months.map((val, i) => {
                const intensity = Math.round(((val - 60) / 40) * 100)
                return (
                  <td key={i} className="px-2 py-2 text-right">
                    <span
                      className="inline-block w-full rounded px-1.5 py-0.5 font-mono text-surface-200"
                      style={{ backgroundColor: `hsla(142, 60%, 40%, ${intensity / 100})` }}
                    >
                      {val}%
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72 bg-surface-700/50" />
          <Skeleton className="h-4 w-48 bg-surface-700/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <Skeleton className="mb-3 h-4 w-24 bg-surface-700/50" />
            <Skeleton className="mb-2 h-8 w-32 bg-surface-700/50" />
            <Skeleton className="h-4 w-20 bg-surface-700/50" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl bg-surface-800/50" />
    </div>
  )
}

/* ─── Main Page ─── */

export default function DirectorDashboardPage() {
  const [loading] = useState(false)
  const [activeTab, setActiveTab] = useState('revenue')

  if (loading) return <DashboardSkeleton />

  const pipelineTotal = pipelineData.reduce((sum, col) =>
    sum + col.items.reduce((s, it) => s + it.value, 0), 0
  )
  const weightedTotal = pipelineData.reduce((sum, col) =>
    sum + col.items.reduce((s, it) => s + it.value * (it.probability / 100), 0), 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Panel de Dirección</h1>
        <p className="text-sm text-surface-400">Indicadores clave de negocio · Datos simulados</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => <KPICard key={kpi.title} kpi={kpi} />)}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-800">
          <TabsTrigger value="revenue" className="data-[active]:bg-surface-700">Ingresos</TabsTrigger>
          <TabsTrigger value="clients" className="data-[active]:bg-surface-700">Clientes</TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[active]:bg-surface-700">Pipeline</TabsTrigger>
          <TabsTrigger value="team" className="data-[active]:bg-surface-700">Equipo</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">MRR Histórico (12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mrrHistory}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), 'MRR']}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Ingresos por Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueByService} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="service" stroke="#64748b" fontSize={11} width={140} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), 'Ingreso']}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-surface-200">Ingresos por Industria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {industryRevenue.map((item) => (
                    <div key={item.industry}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-surface-300">{item.industry}</span>
                        <span className="font-mono text-surface-400">
                          {formatCurrency(item.revenue)} <span className="text-surface-500">({item.pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Churn Rate</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">{clientMetrics.churnRate}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <TrendingDown className="h-3 w-3" /> -0.8 pp vs trimestre
                </p>
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">LTV Promedio</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">{clientMetrics.ltv}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" /> +8.3% vs trimestre
                </p>
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">LTV / CAC</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">{clientMetrics.ltvCac}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" /> +0.4x vs trimestre
                </p>
              </CardContent>
            </Card>
            <Card className="border-surface-700/50 bg-surface-800/50">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Clientes</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">{clientMetrics.activeClients}</p>
                <p className="mt-1 text-xs text-surface-400">
                  <span className="text-emerald-400">+{clientMetrics.newClients}</span> nuevos / <span className="text-red-400">-{clientMetrics.lostClients}</span> perdidos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">Retención por Cohortes</CardTitle>
            </CardHeader>
            <CardContent>
              <CohortRetentionHeatmap data={cohortData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-lg border border-surface-700/50 bg-surface-800/50 px-4 py-2">
              <p className="text-xs text-surface-500">Pipeline Total</p>
              <p className="text-lg font-bold text-surface-50">{formatCurrency(pipelineTotal)}</p>
            </div>
            <div className="rounded-lg border border-surface-700/50 bg-surface-800/50 px-4 py-2">
              <p className="text-xs text-surface-500">Valor Ponderado</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(Math.round(weightedTotal))}</p>
            </div>
            <div className="rounded-lg border border-surface-700/50 bg-surface-800/50 px-4 py-2">
              <p className="text-xs text-surface-500">Oportunidades</p>
              <p className="text-lg font-bold text-surface-50">
                {pipelineData.reduce((s, c) => s + c.items.length, 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {pipelineData.map((col) => (
              <div key={col.id} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <col.icon className={cn('h-4 w-4', col.color)} />
                  <span className="text-xs font-medium text-surface-300">{col.title}</span>
                  <Badge variant="outline" className="ml-auto border-surface-600 text-[10px] text-surface-400">
                    {col.items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {col.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-surface-700/30 bg-surface-900/50 p-2.5">
                      <p className="truncate text-xs font-medium text-surface-200">{item.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-surface-400">
                          {formatCurrency(item.value)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'border-transparent text-[10px]',
                            item.probability >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                            item.probability >= 40 ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-slate-500/10 text-slate-400',
                          )}
                        >
                          {item.probability}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">Tasas de Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { stage: 'Lead → Contactado', from: 9, to: 6, rate: 67 },
                  { stage: 'Contactado → Calificado', from: 6, to: 4, rate: 67 },
                  { stage: 'Calificado → Propuesta', from: 4, to: 3, rate: 75 },
                  { stage: 'Propuesta → Negociación', from: 3, to: 2, rate: 67 },
                  { stage: 'Negociación → Cerrado', from: 2, to: 1, rate: 50 },
                ].map((conv) => (
                  <div key={conv.stage} className="flex items-center gap-3">
                    <span className="w-44 text-xs text-surface-300">{conv.stage}</span>
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-700">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${conv.rate}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs text-surface-400">
                      {conv.from}→{conv.to}
                    </span>
                    <span className="w-12 text-right text-xs font-medium text-emerald-400">{conv.rate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-4">
          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">Utilización por Consultor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultants.map((c) => {
                  const barColor =
                    c.status === 'over' ? 'bg-emerald-500' :
                    c.status === 'target' ? 'bg-blue-500' : 'bg-amber-500'
                  return (
                    <div key={c.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-surface-200">{c.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'border-transparent text-[10px]',
                              c.status === 'over' ? 'bg-emerald-500/10 text-emerald-400' :
                              c.status === 'target' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-amber-500/10 text-amber-400',
                            )}
                          >
                            {c.status === 'over' ? 'Sobre' : c.status === 'target' ? 'Meta' : 'Bajo'}
                          </Badge>
                        </div>
                        <span className="font-mono text-xs text-surface-400">{c.utilization}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-700">
                        <div
                          className={cn('h-full rounded-full transition-all', barColor)}
                          style={{ width: `${c.utilization}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex justify-between text-[10px] text-surface-500">
                        <span>Facturable: {c.billable}h</span>
                        <span>No facturable: {c.nonBillable}h</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-emerald-400">Sobre Meta (&gt;90%)</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">
                  {consultants.filter((c) => c.status === 'over').length}
                </p>
                <p className="text-xs text-surface-400">consultores</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-blue-400">En Meta (80-90%)</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">
                  {consultants.filter((c) => c.status === 'target').length}
                </p>
                <p className="text-xs text-surface-400">consultores</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-amber-400">Bajo Meta (&lt;80%)</p>
                <p className="mt-1 text-2xl font-bold text-surface-50">
                  {consultants.filter((c) => c.status === 'below').length}
                </p>
                <p className="text-xs text-surface-400">consultores</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
