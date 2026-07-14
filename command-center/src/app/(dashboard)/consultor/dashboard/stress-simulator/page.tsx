'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, formatUSD } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'

interface StressParams {
  companyId: string
  daysReceivable: number
  daysPayable: number
  interestRate: number
  revenueGrowth: number
  opexGrowth: number
  capexIncrease: number
}

interface PresetValues {
  daysReceivable: number; daysPayable: number; interestRate: number
  revenueGrowth: number; opexGrowth: number; capexIncrease: number
}

export default function StressSimulatorPage() {
  const [companyId, setCompanyId] = useState<string>('')
  const [scenario, setScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base')

  const [params, setParams] = useState<StressParams>({
    companyId: '', daysReceivable: 45, daysPayable: 30, interestRate: 12,
    revenueGrowth: 5, opexGrowth: 3, capexIncrease: 0,
  })

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/v1/clients/companies'),
  })

  const { data: projection } = useQuery({
    queryKey: ['cash-projection', params],
    queryFn: () => api.post('/api/v1/financial/stress-test', params),
    enabled: !!params.companyId,
  })

  const applyScenario = (s: 'base' | 'optimistic' | 'pessimistic') => {
    setScenario(s)
    const presets: Record<string, PresetValues> = {
      optimistic: { daysReceivable: 30, daysPayable: 45, interestRate: 10, revenueGrowth: 15, opexGrowth: 2, capexIncrease: 0 },
      base: { daysReceivable: 45, daysPayable: 30, interestRate: 12, revenueGrowth: 5, opexGrowth: 3, capexIncrease: 0 },
      pessimistic: { daysReceivable: 90, daysPayable: 15, interestRate: 18, revenueGrowth: -10, opexGrowth: 8, capexIncrease: 20 },
    }
    const vals = presets[s]
    if (vals) setParams(p => ({ ...p, ...vals }))
  }

  const chartData = useMemo(() => {
    if (!projection || !Array.isArray(projection)) return []
    return projection as Array<{ month: string; cashBalance: number; inflows: number; outflows: number; deficit: boolean }>
  }, [projection])

  const metrics = useMemo(() => {
    if (chartData.length === 0) return null
    const balances = chartData.map(p => p.cashBalance)
    const minCash = Math.min(...balances)
    const initialCash = balances[0]
    const finalCash = balances[balances.length - 1]
    const monthsInDeficit = chartData.filter(p => p.deficit).length
    const runwayIndex = balances.findIndex(b => b < 0)
    return {
      minCash, finalCash, initialCash, monthsInDeficit,
      runwayMonths: runwayIndex === -1 ? 12 : runwayIndex,
      changePct: ((finalCash - initialCash) / Math.abs(initialCash || 1)) * 100,
    }
  }, [chartData])

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Sala de Guerra — Simulador de Estrés
          </h1>
          <p className="text-muted-foreground mt-1">Simule escenarios financieros y visualice el impacto en caja a 12 meses</p>
        </div>
        <Select value={scenario} onValueChange={(v) => applyScenario(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="optimistic">Optimista</SelectItem>
            <SelectItem value="base">Caso Base</SelectItem>
            <SelectItem value="pessimistic">Pesimista</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <label className="text-sm font-medium mb-2 block">Cliente a Simular</label>
          <Select value={params.companyId} onValueChange={(v) => setParams(p => ({ ...p, companyId: v ?? '' }))}>
            <SelectTrigger><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger>
            <SelectContent>
              {companies.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.ruc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">Parámetros del Escenario</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <SliderControl label="Días de Cobro" value={params.daysReceivable} min={15} max={120} step={5} unit=" días" onChange={(v) => setParams(p => ({ ...p, daysReceivable: v }))} />
            <SliderControl label="Días de Pago" value={params.daysPayable} min={15} max={90} step={5} unit=" días" onChange={(v) => setParams(p => ({ ...p, daysPayable: v }))} />
            <SliderControl label="Tasa de Interés" value={params.interestRate} min={5} max={25} step={0.5} unit="%" onChange={(v) => setParams(p => ({ ...p, interestRate: v }))} />
            <SliderControl label="Crecimiento Ventas" value={params.revenueGrowth} min={-30} max={30} step={1} unit="%" onChange={(v) => setParams(p => ({ ...p, revenueGrowth: v }))} color={params.revenueGrowth >= 0 ? 'green' : 'red'} />
            <SliderControl label="Crecimiento OPEX" value={params.opexGrowth} min={-10} max={20} step={1} unit="%" onChange={(v) => setParams(p => ({ ...p, opexGrowth: v }))} />
            <SliderControl label="Aumento CAPEX" value={params.capexIncrease} min={0} max={100} step={5} unit="%" onChange={(v) => setParams(p => ({ ...p, capexIncrease: v }))} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Proyección de Caja — 12 Meses</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatUSD(Number(v))} labelStyle={{ fontWeight: 'bold' }} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label="Cero" />
                  <Area type="monotone" dataKey="cashBalance" fill="url(#cashGradient)" stroke="#3b82f6" strokeWidth={3} />
                  <Line type="monotone" dataKey="inflows" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Ingresos" />
                  <Line type="monotone" dataKey="outflows" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Egresos" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Seleccione un cliente para ver la proyección</div>
            )}
          </CardContent>
        </Card>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Caja Mínima" value={formatUSD(metrics.minCash)} icon={DollarSign} color={metrics.minCash < 0 ? 'red' : 'blue'} description="Punto más bajo en 12 meses" />
          <MetricCard title="Caja Final" value={formatUSD(metrics.finalCash)} icon={metrics.changePct >= 0 ? TrendingUp : TrendingDown} color={metrics.changePct >= 0 ? 'green' : 'red'} description={`${metrics.changePct >= 0 ? '+' : ''}${metrics.changePct.toFixed(1)}% vs inicio`} />
          <MetricCard title="Runway" value={`${metrics.runwayMonths} meses`} icon={Activity} color={metrics.runwayMonths < 3 ? 'red' : metrics.runwayMonths < 6 ? 'yellow' : 'green'} description="Meses hasta caja cero" />
          <MetricCard title="Meses en Déficit" value={`${metrics.monthsInDeficit} / 12`} icon={AlertTriangle} color={metrics.monthsInDeficit > 0 ? 'red' : 'green'} description="Meses con caja negativa" />
        </div>
      )}

      {metrics && metrics.runwayMonths < 6 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            La caja se agota en <strong>{metrics.runwayMonths} meses</strong>. Recomendado: acelerar cobranzas, negociar plazos, asegurar línea de crédito de {formatUSD(Math.abs(metrics.minCash || 0) * 1.2)}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function SliderControl({ label, value, min, max, step, unit, onChange, color }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; color?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className={`text-sm font-semibold ${color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-blue-600'}`}>{value}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, description }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  }
  return (
    <Card className={colorClasses[color] || colorClasses.blue}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium uppercase">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs opacity-80 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
