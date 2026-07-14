'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, User, Building2, Calculator, Info, AlertTriangle } from 'lucide-react'

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

const gastosTopes: Record<string, number> = {
  salud: 5289.60,
  educacion: 3512.88,
  vivienda: 4402.20,
  alimentacion: 2644.80,
  vestimenta: 2644.80,
}

const tarifasProgresivas = [
  { desde: 0, hasta: 11722, fraccionBasica: 0, excedente: 0 },
  { desde: 11722, hasta: 14930, fraccionBasica: 0, excedente: 0.05 },
  { desde: 14930, hasta: 19380, fraccionBasica: 160.40, excedente: 0.1 },
  { desde: 19380, hasta: 25640, fraccionBasica: 605.40, excedente: 0.12 },
  { desde: 25640, hasta: 33740, fraccionBasica: 1356.60, excedente: 0.15 },
  { desde: 33740, hasta: 44710, fraccionBasica: 2571.60, excedente: 0.2 },
  { desde: 44710, hasta: 59590, fraccionBasica: 4765.60, excedente: 0.25 },
  { desde: 59590, hasta: 79630, fraccionBasica: 8485.60, excedente: 0.3 },
  { desde: 79630, hasta: 105730, fraccionBasica: 14497.60, excedente: 0.35 },
  { desde: 105730, hasta: Infinity, fraccionBasica: 23632.60, excedente: 0.37 },
]

function calcularIRCausado(baseImponible: number) {
  for (const tramo of tarifasProgresivas) {
    if (baseImponible > tramo.desde && baseImponible <= tramo.hasta) {
      const excedente = baseImponible - tramo.desde
      return tramo.fraccionBasica + excedente * tramo.excedente
    }
  }
  return 0
}

function PersonasNaturalesTab() {
  const [ingresos, setIngresos] = useState({
    salarial: 24000,
    profesional: 12000,
    arriendos: 6000,
    inversiones: 3000,
  })
  const [gastos, setGastos] = useState({
    salud: 3000,
    educacion: 4000,
    vivienda: 5000,
    alimentacion: 2400,
    vestimenta: 1500,
  })
  const [aporteIESS, setAporteIESS] = useState(2880)
  const [gastosDiscapacidad, setGastosDiscapacidad] = useState(0)
  const [terceraEdad, setTerceraEdad] = useState(false)

  const updateIngreso = (field: string, value: number) => setIngresos({ ...ingresos, [field]: value })
  const updateGasto = (field: string, value: number) => setGastos({ ...gastos, [field]: value })

  const totalIngresos = useMemo(() => Object.values(ingresos).reduce((a, b) => a + b, 0), [ingresos])

  const gastosDeducibles = useMemo(() => {
    let total = 0
    for (const [key, valor] of Object.entries(gastos)) {
      total += Math.min(valor, gastosTopes[key])
    }
    total += aporteIESS
    total += gastosDiscapacidad
    if (terceraEdad) total += 6534
    return total
  }, [gastos, aporteIESS, gastosDiscapacidad, terceraEdad])

  const baseImponible = useMemo(() => Math.max(0, totalIngresos - gastosDeducibles - 11722), [totalIngresos, gastosDeducibles])
  const irCausado = useMemo(() => calcularIRCausado(baseImponible), [baseImponible])
  const anticipo = useMemo(() => irCausado * 0.03, [irCausado])
  const totalAPagar = useMemo(() => irCausado + anticipo, [irCausado])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingresos Anuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'salarial', label: 'Ingresos Salariales' },
              { key: 'profesional', label: 'Honorarios Profesionales' },
              { key: 'arriendos', label: 'Arriendos' },
              { key: 'inversiones', label: 'Inversiones / Otros' },
            ].map((item) => (
              <div key={item.key}>
                <Label>{item.label}</Label>
                <Input
                  type="number"
                  value={ingresos[item.key as keyof typeof ingresos] || ''}
                  onChange={(e) => updateIngreso(item.key, Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            ))}
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-medium">Total Ingresos</span>
              <span className="font-bold text-lg">{formatUSD(totalIngresos)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Gastos Personales y Deducciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'salud', label: 'Salud', tope: gastosTopes.salud },
              { key: 'educacion', label: 'Educación', tope: gastosTopes.educacion },
              { key: 'vivienda', label: 'Vivienda', tope: gastosTopes.vivienda },
              { key: 'alimentacion', label: 'Alimentación', tope: gastosTopes.alimentacion },
              { key: 'vestimenta', label: 'Vestimenta', tope: gastosTopes.vestimenta },
            ].map((item) => (
              <div key={item.key}>
                <Label>{item.label} (tope: {formatUSD(item.tope)})</Label>
                <Input
                  type="number"
                  value={gastos[item.key as keyof typeof gastos] || ''}
                  onChange={(e) => updateGasto(item.key, Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            ))}
            <div className="pt-3 border-t space-y-3">
              <div>
                <Label>Aporte IESS</Label>
                <Input type="number" value={aporteIESS} onChange={(e) => setAporteIESS(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Gastos Discapacidad</Label>
                <Input type="number" value={gastosDiscapacidad} onChange={(e) => setGastosDiscapacidad(Number(e.target.value))} className="mt-1" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={terceraEdad} onChange={(e) => setTerceraEdad(e.target.checked)} className="rounded" />
                Adulto mayor (65+ años) — deducción adicional: $6,534
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Ingresos</p>
              <p className="text-xl font-bold">{formatUSD(totalIngresos)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Gastos Deducibles</p>
              <p className="text-xl font-bold text-blue-600">{formatUSD(gastosDeducibles)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Base Imponible</p>
              <p className="text-xl font-bold text-purple-600">{formatUSD(baseImponible)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">IR Causado</p>
              <p className="text-xl font-bold text-green-600">{formatUSD(irCausado)}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Anticipo (3%)</p>
              <p className="text-lg font-bold text-amber-600">{formatUSD(anticipo)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">TOTAL A PAGAR</p>
              <p className="text-2xl font-bold text-red-600">{formatUSD(totalAPagar)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tabla de Tarifas Progresivas IR 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Fracción Básica</TableHead>
                <TableHead>% Excedente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarifasProgresivas.map((t, i) => (
                <TableRow key={i} className={baseImponible > t.desde && baseImponible <= t.hasta ? 'bg-blue-50' : ''}>
                  <TableCell>{formatUSD(t.desde)}</TableCell>
                  <TableCell>{t.hasta === Infinity ? 'En adelante' : formatUSD(t.hasta)}</TableCell>
                  <TableCell>{formatUSD(t.fraccionBasica)}</TableCell>
                  <TableCell>{t.excedente > 0 ? `${(t.excedente * 100)}%` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function PersonasJuridicasTab() {
  const [ingresos, setIngresos] = useState(500000)
  const [costos, setCostos] = useState(280000)
  const [gastosOperativos, setGastosOperativos] = useState(120000)
  const [gastosNoDeducibles, setGastosNoDeducibles] = useState(15000)

  const utilidad = useMemo(() => ingresos - costos - gastosOperativos, [ingresos, costos, gastosOperativos])
  const baseImponible = useMemo(() => utilidad + gastosNoDeducibles, [utilidad, gastosNoDeducibles])
  const irCausado = useMemo(() => Math.max(0, baseImponible * 0.28), [baseImponible])
  const anticipo = useMemo(() => irCausado * 0.03, [irCausado])
  const totalAPagar = useMemo(() => irCausado + anticipo, [irCausado])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Datos del Ejercicio Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ingresos Anuales</Label>
              <Input type="number" value={ingresos} onChange={(e) => setIngresos(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Costos y Gastos Directos</Label>
              <Input type="number" value={costos} onChange={(e) => setCostos(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Gastos Operativos</Label>
              <Input type="number" value={gastosOperativos} onChange={(e) => setGastosOperativos(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Gastos No Deducibles</Label>
              <Input type="number" value={gastosNoDeducibles} onChange={(e) => setGastosNoDeducibles(Number(e.target.value))} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo de Utilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span>Ingresos</span>
              <span className="font-mono">{formatUSD(ingresos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-red-600">
              <span>Costos y Gastos</span>
              <span className="font-mono">-{formatUSD(costos + gastosOperativos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b font-medium">
              <span>Utilidad</span>
              <span className="font-mono">{formatUSD(utilidad)}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-amber-600">
              <span>+ Gastos No Deducibles</span>
              <span className="font-mono">+{formatUSD(gastosNoDeducibles)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Base Imponible</span>
              <span className="font-mono">{formatUSD(baseImponible)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Base Imponible</p>
              <p className="text-xl font-bold">{formatUSD(baseImponible)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">IR 28%</p>
              <p className="text-xl font-bold text-purple-600">{formatUSD(irCausado)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Anticipo (3%)</p>
              <p className="text-xl font-bold text-amber-600">{formatUSD(anticipo)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">TOTAL A PAGAR</p>
              <p className="text-xl font-bold text-red-600">{formatUSD(totalAPagar)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Referencia:</strong> IR personas jurídicas: 28% sobre utilidad gravable. 
          Anticipo del 3% para el siguiente ejercicio. LRTI Arts. 37-41.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default function RentaPage() {
  const [tab, setTab] = useState('naturales')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Simulador de Impuesto a la Renta
        </h1>
        <p className="text-muted-foreground mt-1">Cálculo del IR para personas naturales y jurídicas según tarifas 2025</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="naturales">
            <User className="h-4 w-4" />
            Personas Naturales
          </TabsTrigger>
          <TabsTrigger value="juridicas">
            <Building2 className="h-4 w-4" />
            Personas Jurídicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="naturales">
          <PersonasNaturalesTab />
        </TabsContent>

        <TabsContent value="juridicas">
          <PersonasJuridicasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
