'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, AlertTriangle, CheckCircle2, XCircle, ArrowUpDown, Scale, FileText, Receipt } from 'lucide-react'

type Validacion = {
  id: string
  nombre: string
  status: 'ok' | 'warning' | 'error'
  declarado: number
  registrado: number
  diferencia: number
  detalle: string
}

const validaciones: Validacion[] = [
  {
    id: 'iva-ventas',
    nombre: 'IVA Ventas vs ATS Ventas',
    status: 'ok',
    declarado: 4280.50,
    registrado: 4280.50,
    diferencia: 0,
    detalle: 'Coincidencia perfecta',
  },
  {
    id: 'iva-compras',
    nombre: 'IVA Compras vs ATS Compras',
    status: 'warning',
    declarado: 3150.00,
    registrado: 3100.00,
    diferencia: 50.00,
    detalle: 'Diferencia de $50 en compras de julio',
  },
  {
    id: 'retenciones-emitidas',
    nombre: 'Retenciones Emitidas vs Declaradas',
    status: 'ok',
    declarado: 890.00,
    registrado: 890.00,
    diferencia: 0,
    detalle: 'Coincidencia perfecta',
  },
  {
    id: 'retenciones-recibidas',
    nombre: 'Retenciones Recibidas vs ATS',
    status: 'error',
    declarado: 450.00,
    registrado: 380.00,
    diferencia: 70.00,
    detalle: 'Falta registrar 2 retenciones en ATS',
  },
  {
    id: 'ventas-declaradas',
    nombre: 'Ventas Declaradas vs ATS',
    status: 'ok',
    declarado: 28500.00,
    registrado: 28500.00,
    diferencia: 0,
    detalle: 'Coincidencia perfecta',
  },
  {
    id: 'ice-declarado',
    nombre: 'ICE Declarado vs Form. 105',
    status: 'warning',
    declarado: 1230.00,
    registrado: 1180.00,
    diferencia: 50.00,
    detalle: 'Diferencia mínima en cálculo ad-valorem',
  },
]

const resumenStatus = {
  ok: validaciones.filter(v => v.status === 'ok').length,
  warning: validaciones.filter(v => v.status === 'warning').length,
  error: validaciones.filter(v => v.status === 'error').length,
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

const statusIcon = (status: string) => {
  switch (status) {
    case 'ok': return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />
    case 'error': return <XCircle className="h-5 w-5 text-red-500" />
    default: return null
  }
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    ok: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
  }
  const labels: Record<string, string> = {
    ok: 'Correcto',
    warning: 'Advertencia',
    error: 'Error',
  }
  return (
    <Badge variant="outline" className={styles[status] || ''}>
      {statusIcon(status)}
      {labels[status] || status}
    </Badge>
  )
}

export default function CrucesPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Validación Cruzada
        </h1>
        <p className="text-muted-foreground mt-1">Comparación de valores declarados vs registros en ATS y otros anexos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{resumenStatus.ok}</p>
              <p className="text-xs text-muted-foreground">Coincidencias correctas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{resumenStatus.warning}</p>
              <p className="text-xs text-muted-foreground">Advertencias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{resumenStatus.error}</p>
              <p className="text-xs text-muted-foreground">Discrepancias encontradas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Comparación Detallada
          </CardTitle>
          <CardDescription>Validación de valores declarados vs registrados en anexos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Validación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Declarado</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead>Diferencia</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validaciones.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {v.id.includes('iva') && <Receipt className="h-4 w-4 text-blue-500" />}
                      {v.id.includes('retencion') && <ArrowUpDown className="h-4 w-4 text-purple-500" />}
                      {v.id.includes('ventas') && <FileText className="h-4 w-4 text-green-500" />}
                      {v.id.includes('ice') && <BarChart3 className="h-4 w-4 text-orange-500" />}
                      {v.nombre}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(v.status)}</TableCell>
                  <TableCell className="font-mono">{formatUSD(v.declarado)}</TableCell>
                  <TableCell className="font-mono">{formatUSD(v.registrado)}</TableCell>
                  <TableCell>
                    <span className={`font-mono font-medium ${
                      v.diferencia === 0 ? 'text-green-600' :
                      v.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {v.diferencia === 0 ? '-' : formatUSD(v.diferencia)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">{v.detalle}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              IVA Ventas vs IVA Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-40">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${(4280.50 / 4500) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(4280.50)}</p>
                <p className="text-xs text-muted-foreground">IVA Ventas</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-green-500 rounded-t-md" style={{ height: `${(3150 / 4500) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(3150)}</p>
                <p className="text-xs text-muted-foreground">IVA Compras</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-500 rounded-t-md" style={{ height: `${(1130.50 / 4500) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(1130.50)}</p>
                <p className="text-xs text-muted-foreground">Diferencia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4" />
              Retenciones Emitidas vs Recibidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-40">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-500 rounded-t-md" style={{ height: `${(890 / 900) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(890)}</p>
                <p className="text-xs text-muted-foreground">Emitidas</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-amber-500 rounded-t-md" style={{ height: `${(450 / 900) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(450)}</p>
                <p className="text-xs text-muted-foreground">Recibidas</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-green-500 rounded-t-md" style={{ height: `${(440 / 900) * 100}%` }} />
                <p className="text-xs mt-1 font-mono">{formatUSD(440)}</p>
                <p className="text-xs text-muted-foreground">Neto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
