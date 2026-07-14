'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Calculator, FileDown, FileText, Info } from 'lucide-react'

type VentaRow = {
  id: number
  concepto: string
  base: number
  tarifa: number
}

type CompraRow = {
  id: number
  concepto: string
  base: number
  tarifa: number
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const getCurrentRate = (): number => {
  return 15
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

export default function SimuladorIVAPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [ivaRate, setIvaRate] = useState(getCurrentRate())
  const [ventas, setVentas] = useState<VentaRow[]>([
    { id: 1, concepto: 'Ventas Tarifa 0%', base: 0, tarifa: 0 },
    { id: 2, concepto: `Ventas Tarifa ${ivaRate}%`, base: 0, tarifa: ivaRate },
    { id: 3, concepto: 'Exportaciones', base: 0, tarifa: 0 },
  ])
  const [compras, setCompras] = useState<CompraRow[]>([
    { id: 1, concepto: `Compras Tarifa ${ivaRate}%`, base: 0, tarifa: ivaRate },
    { id: 2, concepto: 'Compras Tarifa 0%', base: 0, tarifa: 0 },
  ])
  const [showPreview, setShowPreview] = useState(false)

  const nextVentaId = useMemo(() => Math.max(...ventas.map(v => v.id), 0) + 1, [ventas])
  const nextCompraId = useMemo(() => Math.max(...compras.map(c => c.id), 0) + 1, [compras])

  const addVentaRow = () => {
    setVentas([...ventas, { id: nextVentaId, concepto: '', base: 0, tarifa: ivaRate }])
  }

  const removeVentaRow = (id: number) => {
    if (ventas.length > 1) setVentas(ventas.filter(v => v.id !== id))
  }

  const updateVenta = (id: number, field: keyof VentaRow, value: number | string) => {
    setVentas(ventas.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const addCompraRow = () => {
    setCompras([...compras, { id: nextCompraId, concepto: '', base: 0, tarifa: ivaRate }])
  }

  const removeCompraRow = (id: number) => {
    if (compras.length > 1) setCompras(compras.filter(c => c.id !== id))
  }

  const updateCompra = (id: number, field: keyof CompraRow, value: number | string) => {
    setCompras(compras.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const totalVentas = useMemo(() => ventas.reduce((sum, v) => sum + v.base, 0), [ventas])
  const totalIVAVentas = useMemo(() => ventas.reduce((sum, v) => sum + v.base * (v.tarifa / 100), 0), [ventas])
  const totalCompras = useMemo(() => compras.reduce((sum, c) => sum + c.base, 0), [compras])
  const totalIVACompras = useMemo(() => compras.reduce((sum, c) => sum + c.base * (c.tarifa / 100), 0), [compras])
  const ivaAPagar = useMemo(() => Math.max(0, totalIVAVentas - totalIVACompras), [totalIVAVentas, totalIVACompras])
  const ivaAFavor = useMemo(() => Math.max(0, totalIVACompras - totalIVAVentas), [totalIVACompras, totalIVAVentas])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          Simulador de IVA — Formulario 104
        </h1>
        <p className="text-muted-foreground mt-1">Simula tu declaración mensual de IVA según ventas y compras gravadas</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <Label>Mes</Label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label>Año</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-20" />
        </div>
        <div>
          <Label>Tasa de IVA</Label>
          <div className="flex gap-1 mt-1">
            {[0, 12, 15].map((rate) => (
              <button key={rate} onClick={() => setIvaRate(rate)}
                className={`px-3 py-1 text-sm rounded-md border ${ivaRate === rate ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'}`}>
                {rate}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>IVA Ventas</span>
              <Button variant="ghost" size="icon-xs" onClick={addVentaRow}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Concepto</TableHead>
                  <TableHead>Base Imponible</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Input
                        value={v.concepto}
                        onChange={(e) => updateVenta(v.id, 'concepto', e.target.value)}
                        placeholder="Concepto"
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={v.base || ''}
                        onChange={(e) => updateVenta(v.id, 'base', Number(e.target.value))}
                        className="h-7 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={v.tarifa}
                        onChange={(e) => updateVenta(v.id, 'tarifa', Number(e.target.value))}
                        className="h-7 rounded border border-input bg-transparent px-1 text-xs w-16"
                      >
                        <option value={0}>0%</option>
                        <option value={12}>12%</option>
                        <option value={15}>15%</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{formatUSD(v.base * (v.tarifa / 100))}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeVentaRow(v.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
              <span className="font-medium">Total Ventas</span>
              <span className="font-mono font-bold">{formatUSD(totalVentas)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total IVA Ventas</span>
              <span className="font-mono font-bold text-blue-600">{formatUSD(totalIVAVentas)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>IVA Compras (Crédito Tributario)</span>
              <Button variant="ghost" size="icon-xs" onClick={addCompraRow}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Concepto</TableHead>
                  <TableHead>Base Imponible</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Input
                        value={c.concepto}
                        onChange={(e) => updateCompra(c.id, 'concepto', e.target.value)}
                        placeholder="Concepto"
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={c.base || ''}
                        onChange={(e) => updateCompra(c.id, 'base', Number(e.target.value))}
                        className="h-7 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={c.tarifa}
                        onChange={(e) => updateCompra(c.id, 'tarifa', Number(e.target.value))}
                        className="h-7 rounded border border-input bg-transparent px-1 text-xs w-16"
                      >
                        <option value={0}>0%</option>
                        <option value={12}>12%</option>
                        <option value={15}>15%</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{formatUSD(c.base * (c.tarifa / 100))}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCompraRow(c.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
              <span className="font-medium">Total Compras</span>
              <span className="font-mono font-bold">{formatUSD(totalCompras)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total IVA Compras</span>
              <span className="font-mono font-bold text-green-600">{formatUSD(totalIVACompras)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total IVA Ventas</p>
              <p className="text-2xl font-bold text-blue-600">{formatUSD(totalIVAVentas)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total IVA Compras</p>
              <p className="text-2xl font-bold text-green-600">{formatUSD(totalIVACompras)}</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${ivaAPagar > 0 ? 'bg-purple-50' : 'bg-emerald-50'}`}>
              <p className="text-sm text-muted-foreground">
                {ivaAPagar > 0 ? 'IVA a Pagar' : 'IVA a Favor'}
              </p>
              <p className={`text-3xl font-bold ${ivaAPagar > 0 ? 'text-purple-600' : 'text-emerald-600'}`}>
                {formatUSD(ivaAPagar > 0 ? ivaAPagar : ivaAFavor)}
              </p>
            </div>
          </div>
          {ivaAFavor > 0 && (
            <Alert className="mt-4 bg-emerald-50 border-emerald-200">
              <Info className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                Tienes IVA a Favor por {formatUSD(ivaAFavor)}. Este saldo puede ser utilizado como crédito tributario en el siguiente mes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
          <FileText className="h-4 w-4" />
          {showPreview ? 'Ocultar' : 'Vista Previa'} Formulario 104
        </Button>
        <Button variant="outline" disabled>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {showPreview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formulario 104 — Declaración de IVA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs space-y-1">
              <p>FORMULARIO 104 - DECLARACIÓN MENSUAL DE IVA</p>
              <p>Período: {MONTHS[month]} {year}</p>
              <p>RUC: 1790000002001</p>
              <p>Razón Social: CONSULTORÍA DEMO S.A.</p>
              <p>─────────────────────────────</p>
              <p>Casilla 401: Ventas Tarifa 0%   {formatUSD(ventas.filter(v => v.tarifa === 0).reduce((s, v) => s + v.base, 0))}</p>
              <p>Casilla 402: Ventas Tarifa {ivaRate}%   {formatUSD(ventas.filter(v => v.tarifa === ivaRate).reduce((s, v) => s + v.base, 0))}</p>
              <p>Casilla 403: Exportaciones   {formatUSD(ventas.filter(v => v.concepto.toLowerCase().includes('export')).reduce((s, v) => s + v.base, 0))}</p>
              <p>Casilla 407: Total Ventas   {formatUSD(totalVentas)}</p>
              <p>Casilla 408: IVA en Ventas   {formatUSD(totalIVAVentas)}</p>
              <p>─────────────────────────────</p>
              <p>Casilla 501: Compras Tarifa 0%   {formatUSD(compras.filter(c => c.tarifa === 0).reduce((s, c) => s + c.base, 0))}</p>
              <p>Casilla 502: Compras Tarifa {ivaRate}%   {formatUSD(compras.filter(c => c.tarifa === ivaRate).reduce((s, c) => s + c.base, 0))}</p>
              <p>Casilla 507: Total Compras   {formatUSD(totalCompras)}</p>
              <p>Casilla 508: IVA en Compras   {formatUSD(totalIVACompras)}</p>
              <p>─────────────────────────────</p>
              <p>Casilla 601: IVA a Pagar   {formatUSD(ivaAPagar)}</p>
              <p>Casilla 602: IVA a Favor   {formatUSD(ivaAFavor)}</p>
              <p>─────────────────────────────</p>
              <p className="text-primary font-bold">TOTAL A PAGAR: {formatUSD(ivaAPagar)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Base legal:</strong> LRTI Arts. 54-57. IVA 15% vigente desde abril 2024 (Ley 1089). 
          Los valores calculados son referenciales. Siempre consulte con su contador.
        </AlertDescription>
      </Alert>
    </div>
  )
}
