'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle,
  BarChart3, LineChart, DollarSign, Droplets, Factory,
  Globe, Building, Banknote, Percent, ShieldAlert,
} from 'lucide-react'
import {
  LineChart as ReLineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

/* ─── Types ─── */

interface GDPDataPoint {
  trimestre: string
  actual: number | null
  pronostico: number | null
}

interface PredictorCard {
  titulo: string
  valor: string
  cambio: string
  tendencia: 'up' | 'down'
  icon: React.ElementType
  color: string
  sparkline: number[]
}

interface FeatureImportance {
  variable: string
  importancia: number
  signo: 'positivo' | 'negativo'
  rezago: string
}

interface Escenario {
  id: string
  nombre: string
  color: string
  pib: string
  supuestos: string[]
  descripcion: string
}

interface IndicadorFrecuente {
  indicador: string
  valor: string
  variacion: string
  fuente: string
  frecuencia: string
  ultimaActualizacion: string
  unidad: string
}

interface Alerta {
  id: string
  titulo: string
  descripcion: string
  severidad: 'critical' | 'high' | 'medium' | 'low'
  fecha: string
}

/* ─── Mock Data ─── */

const gdpNowcast = { valor: '2.8', ci: '[1.9 – 3.7]', r2: 0.87, calidad: 'Alta' as const }

const gdpHistory: GDPDataPoint[] = [
  { trimestre: '2023-Q1', actual: 4.2, pronostico: null },
  { trimestre: '2023-Q2', actual: 3.8, pronostico: null },
  { trimestre: '2023-Q3', actual: 3.1, pronostico: null },
  { trimestre: '2023-Q4', actual: 2.5, pronostico: null },
  { trimestre: '2024-Q1', actual: 2.2, pronostico: null },
  { trimestre: '2024-Q2', actual: 1.8, pronostico: null },
  { trimestre: '2024-Q3', actual: 2.0, pronostico: null },
  { trimestre: '2024-Q4', actual: 2.4, pronostico: null },
  { trimestre: '2025-Q1', actual: 2.6, pronostico: null },
  { trimestre: '2025-Q2', actual: null, pronostico: 2.7 },
  { trimestre: '2025-Q3', actual: null, pronostico: 2.9 },
  { trimestre: '2025-Q4', actual: null, pronostico: 3.1 },
]

const predictores: PredictorCard[] = [
  { titulo: 'Precio Petróleo', valor: '$68.50', cambio: '+2.3%', tendencia: 'up', icon: Droplets, color: 'text-amber-400', sparkline: [62, 64, 63, 66, 65, 68, 67, 69, 68, 70, 69, 68.5] },
  { titulo: 'Recaudación Tributaria', valor: '$4,280M', cambio: '+5.1%', tendencia: 'up', icon: Building, color: 'text-emerald-400', sparkline: [3800, 3900, 3850, 4000, 4100, 4050, 4150, 4200, 4180, 4250, 4270, 4280] },
  { titulo: 'Remesas', valor: '$1,320M', cambio: '+3.7%', tendencia: 'up', icon: Banknote, color: 'text-blue-400', sparkline: [1150, 1180, 1200, 1220, 1240, 1230, 1260, 1280, 1270, 1300, 1310, 1320] },
  { titulo: 'Tasa de Interés', valor: '11.25%', cambio: '-0.50pp', tendencia: 'down', icon: Percent, color: 'text-red-400', sparkline: [12.5, 12.25, 12.0, 11.75, 11.75, 11.5, 11.5, 11.25, 11.25, 11.25, 11.25, 11.25] },
]

const featureImportance: FeatureImportance[] = [
  { variable: 'Precio Petróleo (t-1)', importancia: 0.32, signo: 'positivo', rezago: '1 trimestre' },
  { variable: 'Recaudación IVA (t-0)', importancia: 0.28, signo: 'positivo', rezago: 'Contemporáneo' },
  { variable: 'Remesas (t-2)', importancia: 0.18, signo: 'positivo', rezago: '2 trimestres' },
  { variable: 'Tasa Activa (t-1)', importancia: 0.14, signo: 'negativo', rezago: '1 trimestre' },
  { variable: 'IPC Alimentos (t-0)', importancia: 0.08, signo: 'negativo', rezago: 'Contemporáneo' },
]

const escenarios: Escenario[] = [
  { id: 'base', nombre: 'Base', color: 'text-blue-400', pib: '2.8%', supuestos: ['Petróleo $65-70', 'Crecimiento EEUU 2.0%', 'Inflación <3%'], descripcion: 'Escenario más probable basado en condiciones actuales' },
  { id: 'optimista', nombre: 'Optimista', color: 'text-emerald-400', pib: '3.5%', supuestos: ['Petróleo >$75', 'Inversión pública +15%', 'Reformas estructurales'], descripcion: 'Mejora en términos de intercambio y confianza' },
  { id: 'pesimista', nombre: 'Pesimista', color: 'text-amber-400', pib: '1.2%', supuestos: ['Petróleo <$55', 'Evento climático severo', 'Inestabilidad política'], descripcion: 'Shock externo negativo y condiciones adversas' },
  { id: 'estres', nombre: 'Estrés', color: 'text-red-400', pib: '-0.8%', supuestos: ['Default soberano', 'Petróleo <$40', 'Crisis bancaria regional'], descripcion: 'Escenario extremo de crisis sistémica' },
]

const indicadoresAltaFrecuencia: IndicadorFrecuente[] = [
  { indicador: 'Precio Petróleo WTI', valor: '$68.50', variacion: '+2.3%', fuente: 'BCE / EIA', frecuencia: 'Diaria', ultimaActualizacion: '12/07/2026', unidad: 'USD/barril' },
  { indicador: 'Recaudación IVA', valor: '$1,240M', variacion: '+4.8%', fuente: 'SRI', frecuencia: 'Mensual', ultimaActualizacion: '10/07/2026', unidad: 'USD' },
  { indicador: 'Remesas Familiares', valor: '$1,320M', variacion: '+3.7%', fuente: 'BCE', frecuencia: 'Mensual', ultimaActualizacion: '05/07/2026', unidad: 'USD' },
  { indicador: 'Tasa Activa Referencial', valor: '11.25%', variacion: '-0.25pp', fuente: 'BCE', frecuencia: 'Semanal', ultimaActualizacion: '11/07/2026', unidad: '%' },
  { indicador: 'IPC General', valor: '2.15%', variacion: '+0.12pp', fuente: 'INEC', frecuencia: 'Mensual', ultimaActualizacion: '08/07/2026', unidad: '% anual' },
  { indicador: 'RIN (Reservas)', valor: '$5,280M', variacion: '+2.1%', fuente: 'BCE', frecuencia: 'Semanal', ultimaActualizacion: '11/07/2026', unidad: 'USD' },
]

const indicadoresBajaFrecuencia: IndicadorFrecuente[] = [
  { indicador: 'PIB Real (variación anual)', valor: '2.4%', variacion: '+0.4pp', fuente: 'BCE', frecuencia: 'Trimestral', ultimaActualizacion: '30/06/2026', unidad: '%' },
  { indicador: 'Tasa de Desempleo', valor: '8.2%', variacion: '-0.3pp', fuente: 'INEC', frecuencia: 'Trimestral', ultimaActualizacion: '15/06/2026', unidad: '%' },
  { indicador: 'PIB Petrolero', valor: '1.8%', variacion: '+0.6pp', fuente: 'BCE', frecuencia: 'Trimestral', ultimaActualizacion: '30/06/2026', unidad: '%' },
  { indicador: 'PIB No Petrolero', valor: '2.6%', variacion: '+0.3pp', fuente: 'BCE', frecuencia: 'Trimestral', ultimaActualizacion: '30/06/2026', unidad: '%' },
]

const alertas: Alerta[] = [
  { id: 'a1', titulo: 'Caída abrupta en recaudación', descripcion: 'La recaudación de IVA cayó 8% en la última semana vs proyección', severidad: 'high', fecha: '12/07/2026' },
  { id: 'a2', titulo: 'Volatilidad petróleo', descripcion: 'Precio del petróleo superó desviación estándar de 2σ en la última sesión', severidad: 'medium', fecha: '11/07/2026' },
  { id: 'a3', titulo: 'Incremento en tasa de interés', descripcion: 'Tasa activa superó umbral de alerta establecido en 11%', severidad: 'low', fecha: '10/07/2026' },
  { id: 'a4', titulo: 'Desviación PIB Nowcast', descripcion: 'El nowcast de PIB se desvió más de 0.5pp del pronóstico del BCE', severidad: 'critical', fecha: '09/07/2026' },
  { id: 'a5', titulo: 'Riesgo inflacionario', descripcion: 'IPC de alimentos superó 5% anual, monitorear transmisión a inflación general', severidad: 'high', fecha: '08/07/2026' },
  { id: 'a6', titulo: 'Remesas por debajo de esperado', descripcion: 'Flujo de remesas del mes está 12% por debajo del promedio estacional', severidad: 'medium', fecha: '07/07/2026' },
]

/* ─── Helpers ─── */

const severityBadge = (s: Alerta['severidad']) => {
  const map = {
    critical: { label: 'Crítica', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
    high: { label: 'Alta', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    medium: { label: 'Media', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    low: { label: 'Baja', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  }
  const m = map[s]
  return <Badge variant="outline" className={cn('border text-[10px]', m.classes)}>{m.label}</Badge>
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={`M${points.join(' L')}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Main Page ─── */

export default function CentroInteligenciaPage() {
  const [activeTab, setActiveTab] = useState('nowcasting')

  const qualityBadgeColor =
    gdpNowcast.calidad === 'Alta' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
    gdpNowcast.calidad === 'Media' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
    'bg-red-500/10 text-red-400 border-red-500/30'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Centro de Inteligencia</h1>
        <p className="text-sm text-surface-400">Análisis macroeconómico y nowcasting · Datos simulados</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-800">
          <TabsTrigger value="nowcasting" className="data-[active]:bg-surface-700">Nowcasting</TabsTrigger>
          <TabsTrigger value="escenarios" className="data-[active]:bg-surface-700">Escenarios</TabsTrigger>
          <TabsTrigger value="indicadores" className="data-[active]:bg-surface-700">Indicadores</TabsTrigger>
          <TabsTrigger value="alertas" className="data-[active]:bg-surface-700">Alertas</TabsTrigger>
        </TabsList>

        {/* ── Nowcasting ── */}
        <TabsContent value="nowcasting" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-surface-700/50 bg-surface-800/50 lg:col-span-1">
              <CardContent className="p-5">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500">PIB Nowcast</p>
                  <Badge variant="outline" className={cn('border text-[10px]', qualityBadgeColor)}>
                    R²: {gdpNowcast.r2}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-surface-50">{gdpNowcast.valor}%</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-surface-400">IC 90%: {gdpNowcast.ci}</span>
                  <Badge variant="outline" className={cn('border text-[10px]', qualityBadgeColor)}>
                    Calidad {gdpNowcast.calidad}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {predictores.map((p) => (
              <Card key={p.titulo} className="border-surface-700/50 bg-surface-800/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{p.titulo}</p>
                      <p className="mt-1 text-lg font-bold text-surface-50">{p.valor}</p>
                      <p className={cn('flex items-center gap-0.5 text-xs font-medium', p.tendencia === 'up' ? 'text-emerald-400' : 'text-red-400')}>
                        {p.tendencia === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {p.cambio}
                      </p>
                    </div>
                    <Sparkline data={p.sparkline} color={p.tendencia === 'up' ? '#10b981' : '#ef4444'} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">PIB Histórico y Proyección</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={gdpHistory}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="trimestre" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 5]} />
                  <Tooltip
                    formatter={(v) => [v != null ? `${Number(v).toFixed(1)}%` : '—%']}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fill="url(#actualGrad)" name="PIB Real" connectNulls />
                  <Area type="monotone" dataKey="pronostico" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" name="Pronóstico" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">Importancia de Predictores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-surface-700/50">
                    <TableHead className="text-surface-500">Variable</TableHead>
                    <TableHead className="text-surface-500">Importancia</TableHead>
                    <TableHead className="text-surface-500">Signo</TableHead>
                    <TableHead className="text-surface-500">Rezago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureImportance.map((f) => (
                    <TableRow key={f.variable} className="border-surface-700/30">
                      <TableCell className="font-medium text-surface-200">{f.variable}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-surface-300">{(f.importancia * 100).toFixed(0)}%</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-700">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${f.importancia * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('flex items-center gap-1 text-xs', f.signo === 'positivo' ? 'text-emerald-400' : 'text-red-400')}>
                          {f.signo === 'positivo' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {f.signo === 'positivo' ? 'Positivo' : 'Negativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-surface-400">{f.rezago}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Escenarios ── */}
        <TabsContent value="escenarios" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {escenarios.map((esc) => (
              <Card key={esc.id} className="border-surface-700/50 bg-surface-800/50">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={cn('text-lg font-bold', esc.color)}>{esc.nombre}</h3>
                    <span className={cn('text-2xl font-bold', esc.color)}>{esc.pib}</span>
                  </div>
                  <p className="mb-3 text-xs text-surface-400">{esc.descripcion}</p>
                  <div className="space-y-1">
                    {esc.supuestos.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-surface-500" />
                        <span className="text-xs text-surface-300">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          esc.id === 'base' ? 'bg-blue-500' :
                          esc.id === 'optimista' ? 'bg-emerald-500' :
                          esc.id === 'pesimista' ? 'bg-amber-500' : 'bg-red-500',
                        )}
                        style={{ width: `${parseFloat(esc.pib) * 10 + 50}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-surface-500">Impacto relativo vs tendencia</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-surface-200">Comparación de Escenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ReLineChart
                  data={[
                    { trimestre: '2025-Q3', base: 2.9, optimista: 3.4, pesimista: 1.8, estres: 0.5 },
                    { trimestre: '2025-Q4', base: 3.1, optimista: 3.8, pesimista: 1.5, estres: 0.0 },
                    { trimestre: '2026-Q1', base: 3.0, optimista: 3.9, pesimista: 1.2, estres: -0.3 },
                    { trimestre: '2026-Q2', base: 2.8, optimista: 3.5, pesimista: 1.2, estres: -0.8 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="trimestre" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[-2, 5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Line type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} name="Base" />
                  <Line type="monotone" dataKey="optimista" stroke="#10b981" strokeWidth={2} name="Optimista" />
                  <Line type="monotone" dataKey="pesimista" stroke="#f59e0b" strokeWidth={2} name="Pesimista" />
                  <Line type="monotone" dataKey="estres" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" name="Estrés" />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Indicadores ── */}
        <TabsContent value="indicadores" className="mt-4 space-y-4">
          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-200">
                <Activity className="h-4 w-4 text-blue-400" />
                Indicadores de Alta Frecuencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-surface-700/50">
                    <TableHead className="text-surface-500">Indicador</TableHead>
                    <TableHead className="text-right text-surface-500">Valor</TableHead>
                    <TableHead className="text-right text-surface-500">Variación</TableHead>
                    <TableHead className="text-surface-500">Fuente</TableHead>
                    <TableHead className="text-surface-500">Frecuencia</TableHead>
                    <TableHead className="text-surface-500">Última Actualización</TableHead>
                    <TableHead className="text-surface-500">Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicadoresAltaFrecuencia.map((ind) => (
                    <TableRow key={ind.indicador} className="border-surface-700/30">
                      <TableCell className="font-medium text-surface-200">{ind.indicador}</TableCell>
                      <TableCell className="text-right font-mono text-surface-50">{ind.valor}</TableCell>
                      <TableCell className={cn('text-right font-mono', ind.variacion.startsWith('+') ? 'text-emerald-400' : ind.variacion.startsWith('-') ? 'text-red-400' : 'text-surface-400')}>
                        {ind.variacion}
                      </TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.fuente}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.frecuencia}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.ultimaActualizacion}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.unidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-200">
                <BarChart3 className="h-4 w-4 text-violet-400" />
                Indicadores de Baja Frecuencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-surface-700/50">
                    <TableHead className="text-surface-500">Indicador</TableHead>
                    <TableHead className="text-right text-surface-500">Valor</TableHead>
                    <TableHead className="text-right text-surface-500">Variación</TableHead>
                    <TableHead className="text-surface-500">Fuente</TableHead>
                    <TableHead className="text-surface-500">Frecuencia</TableHead>
                    <TableHead className="text-surface-500">Última Actualización</TableHead>
                    <TableHead className="text-surface-500">Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicadoresBajaFrecuencia.map((ind) => (
                    <TableRow key={ind.indicador} className="border-surface-700/30">
                      <TableCell className="font-medium text-surface-200">{ind.indicador}</TableCell>
                      <TableCell className="text-right font-mono text-surface-50">{ind.valor}</TableCell>
                      <TableCell className={cn('text-right font-mono', ind.variacion.startsWith('+') ? 'text-emerald-400' : ind.variacion.startsWith('-') ? 'text-red-400' : 'text-surface-400')}>
                        {ind.variacion}
                      </TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.fuente}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.frecuencia}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.ultimaActualizacion}</TableCell>
                      <TableCell className="text-xs text-surface-400">{ind.unidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Alertas ── */}
        <TabsContent value="alertas" className="mt-4">
          <Card className="border-surface-700/50 bg-surface-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-200">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                Alertas de Anomalías Económicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      alerta.severidad === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                      alerta.severidad === 'high' ? 'border-orange-500/20 bg-orange-500/5' :
                      alerta.severidad === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
                      'border-blue-500/20 bg-blue-500/5',
                    )}
                  >
                    <AlertTriangle className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      alerta.severidad === 'critical' ? 'text-red-400' :
                      alerta.severidad === 'high' ? 'text-orange-400' :
                      alerta.severidad === 'medium' ? 'text-yellow-400' : 'text-blue-400',
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-surface-200">{alerta.titulo}</p>
                        {severityBadge(alerta.severidad)}
                      </div>
                      <p className="mt-0.5 text-xs text-surface-400">{alerta.descripcion}</p>
                      <p className="mt-1 text-[10px] text-surface-500">{alerta.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
