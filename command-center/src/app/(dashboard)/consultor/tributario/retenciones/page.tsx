'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, Calculator, Plus, Trash2, FileDown, Info } from 'lucide-react'

type TipoRetencion = 'IVA' | 'IR'
type RetencionRegistro = {
  id: number
  tipo: TipoRetencion
  concepto: string
  porcentaje: number
  base: number
  valor: number
  fecha: string
}

const catalogosIR = [
  { porcentaje: 1, concepto: 'Honorarios profesionales', codigo: '303' },
  { porcentaje: 1.75, concepto: 'Servicios técnicos administrativos', codigo: '304' },
  { porcentaje: 2, concepto: 'Arrendamiento bienes inmuebles', codigo: '307' },
  { porcentaje: 2, concepto: 'Servicios predomina intelecto', codigo: '308' },
  { porcentaje: 8, concepto: 'Comisiones (intermediación)', codigo: '309' },
  { porcentaje: 8, concepto: 'Servicios técnicos del exterior', codigo: '310' },
  { porcentaje: 10, concepto: 'Dividendos personas naturales', codigo: '311' },
  { porcentaje: 25, concepto: 'Pagos al exterior sin convenio', codigo: '312' },
]

const catalogosIVA = [
  { porcentaje: 30, concepto: 'Retención IVA 30% (bienes)', codigo: '10%' },
  { porcentaje: 70, concepto: 'Retención IVA 70% (servicios)', codigo: '20%' },
  { porcentaje: 100, concepto: 'Retención IVA 100%', codigo: '30%' },
]

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

export default function RetencionesPage() {
  const [tipo, setTipo] = useState<TipoRetencion>('IR')
  const [conceptoIdx, setConceptoIdx] = useState(0)
  const [base, setBase] = useState(1000)
  const [retenciones, setRetenciones] = useState<RetencionRegistro[]>([
    { id: 1, tipo: 'IR', concepto: 'Honorarios profesionales', porcentaje: 1, base: 5000, valor: 50, fecha: '10/07/2026' },
    { id: 2, tipo: 'IVA', concepto: 'Retención IVA 70% (servicios)', porcentaje: 70, base: 1200, valor: 126, fecha: '08/07/2026' },
  ])

  const catalogo = tipo === 'IR' ? catalogosIR : catalogosIVA
  const conceptoActual = catalogo[conceptoIdx]

  const valorRetencion = useMemo(() => {
    if (tipo === 'IR') return base * (conceptoActual.porcentaje / 100)
    return base * (15 / 100) * (conceptoActual.porcentaje / 100)
  }, [tipo, base, conceptoActual])

  const agregarRetencion = () => {
    const newId = Math.max(...retenciones.map(r => r.id), 0) + 1
    setRetenciones([
      ...retenciones,
      {
        id: newId,
        tipo,
        concepto: conceptoActual.concepto,
        porcentaje: conceptoActual.porcentaje,
        base,
        valor: valorRetencion,
        fecha: new Date().toLocaleDateString('es-EC'),
      },
    ])
  }

  const eliminarRetencion = (id: number) => {
    setRetenciones(retenciones.filter(r => r.id !== id))
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Retenciones en la Fuente
        </h1>
        <p className="text-muted-foreground mt-1">Cálculo de retenciones de IVA e Impuesto a la Renta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Calcular Retención</CardTitle>
            <CardDescription>Ingrese los datos de la transacción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Retención</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={tipo === 'IR' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTipo('IR'); setConceptoIdx(0) }}
                >
                  Impuesto a la Renta
                </Button>
                <Button
                  variant={tipo === 'IVA' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTipo('IVA'); setConceptoIdx(0) }}
                >
                  IVA
                </Button>
              </div>
            </div>

            <div>
              <Label>Concepto</Label>
              <select
                value={conceptoIdx}
                onChange={(e) => setConceptoIdx(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm mt-1"
              >
                {catalogo.map((c, i) => (
                  <option key={i} value={i}>
                    {c.porcentaje}{tipo === 'IR' ? '%' : '% de IVA'} - {c.concepto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Base Imponible</Label>
              <Input type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} className="mt-1" />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {tipo === 'IR'
                  ? `${conceptoActual.porcentaje}% de ${formatUSD(base)}`
                  : `15% IVA × ${conceptoActual.porcentaje}% de ${formatUSD(base)}`
                }
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{formatUSD(valorRetencion)}</p>
            </div>

            <Button onClick={agregarRetencion} className="w-full">
              <Plus className="h-4 w-4" />
              Agregar Retención
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retenciones Registradas</CardTitle>
            <CardDescription>Últimas retenciones calculadas</CardDescription>
          </CardHeader>
          <CardContent>
            {retenciones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay retenciones registradas</p>
            ) : (
              <div className="space-y-2">
                {retenciones.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.tipo === 'IR' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.tipo}
                        </Badge>
                        <span className="text-sm font-medium">{r.concepto}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Base: {formatUSD(r.base)} · {r.porcentaje}{r.tipo === 'IR' ? '%' : '% IVA'} · {r.fecha}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm">{formatUSD(r.valor)}</span>
                      <Button variant="ghost" size="icon-xs" onClick={() => eliminarRetencion(r.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {retenciones.length > 0 && (
              <div className="mt-4 pt-3 border-t flex justify-between items-center font-medium">
                <span>Total Retenciones</span>
                <span className="font-mono font-bold">
                  {formatUSD(retenciones.reduce((s, r) => s + r.valor, 0))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Retenciones</CardTitle>
          <CardDescription>Porcentajes de retención vigentes según LRTI y Reglamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Impuesto a la Renta</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogosIR.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                      <TableCell className="text-xs">{c.concepto}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.porcentaje}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">IVA</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogosIVA.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                      <TableCell className="text-xs">{c.concepto}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.porcentaje}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" disabled>
          <FileDown className="h-4 w-4" />
          Generar Comprobante de Retención
        </Button>
      </div>
    </div>
  )
}
