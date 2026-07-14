'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Receipt, Calculator, Info } from 'lucide-react'

type ProductoICE = {
  id: string
  nombre: string
  especifico: number
  adValorem: number
  unidad: string
}

const productos: ProductoICE[] = [
  { id: 'cigarros', nombre: 'Cigarros y Tabaco', especifico: 0.16, adValorem: 150, unidad: 'unidad' },
  { id: 'cerveza', nombre: 'Cerveza', especifico: 0.25, adValorem: 75, unidad: 'litro' },
  { id: 'licores', nombre: 'Licores Destilados', especifico: 0.50, adValorem: 75, unidad: 'litro' },
  { id: 'gaseosas', nombre: 'Gaseosas y Bebidas Azucaradas', especifico: 0.18, adValorem: 0, unidad: 'litro' },
  { id: 'vehiculos', nombre: 'Vehículos (>$35k USD)', especifico: 0, adValorem: 15, unidad: 'unidad' },
  { id: 'lujo', nombre: 'Bienes de Lujo (>$5k USD)', especifico: 0, adValorem: 10, unidad: 'unidad' },
]

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

export default function ICEPage() {
  const [productoIdx, setProductoIdx] = useState(0)
  const [cantidad, setCantidad] = useState(100)
  const [precioBase, setPrecioBase] = useState(10)

  const producto = productos[productoIdx]

  const iceEspecifico = useMemo(() => cantidad * producto.especifico, [cantidad, producto])
  const iceAdValorem = useMemo(() => (precioBase * cantidad) * (producto.adValorem / 100), [precioBase, cantidad, producto])
  const totalICE = useMemo(() => iceEspecifico + iceAdValorem, [iceEspecifico, iceAdValorem])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Calculadora ICE
        </h1>
        <p className="text-muted-foreground mt-1">Impuesto a los Consumos Especiales — Formulario 105</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parámetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Categoría de Producto</Label>
              <select
                value={productoIdx}
                onChange={(e) => setProductoIdx(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm mt-1"
              >
                {productos.map((p, i) => (
                  <option key={p.id} value={i}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cantidad ({producto.unidad})</Label>
                <Input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Precio Unitario</Label>
                <Input type="number" value={precioBase} onChange={(e) => setPrecioBase(Number(e.target.value))} className="mt-1" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base para Ad-Valorem</span>
                <span className="font-mono">{formatUSD(precioBase * cantidad)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ICE Específico ({producto.especifico > 0 ? `${formatUSD(producto.especifico)} / ${producto.unidad}` : 'N/A'})</span>
                <span className="font-mono">{producto.especifico > 0 ? formatUSD(iceEspecifico) : '$0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ICE Ad-Valorem ({producto.adValorem}%)</span>
                <span className="font-mono">{producto.adValorem > 0 ? formatUSD(iceAdValorem) : '$0.00'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total ICE</span>
                <span className="text-primary">{formatUSD(totalICE)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desglose del Producto</CardTitle>
            <CardDescription>Tasas vigentes para {producto.nombre}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">ICE Específico</p>
                <p className="text-xl font-bold text-blue-600">
                  {producto.especifico > 0 ? formatUSD(producto.especifico) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">por {producto.unidad}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">ICE Ad-Valorem</p>
                <p className="text-xl font-bold text-purple-600">
                  {producto.adValorem > 0 ? `${producto.adValorem}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">sobre precio</p>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">ICE Total a Pagar</p>
              <p className="text-3xl font-bold text-green-600">{formatUSD(totalICE)}</p>
              <p className="text-xs text-muted-foreground mt-1">Formulario 105</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Referencia — Tasas ICE Vigentes</CardTitle>
          <CardDescription>Según LRTI Arts. 76-82 y Reformas 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>ICE Específico</TableHead>
                <TableHead>ICE Ad-Valorem</TableHead>
                <TableHead>Unidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id} className={p.id === producto.id ? 'bg-blue-50' : ''}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.especifico > 0 ? formatUSD(p.especifico) : '-'}</TableCell>
                  <TableCell>{p.adValorem > 0 ? `${p.adValorem}%` : '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.unidad}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" disabled>
          <Receipt className="h-4 w-4" />
          Exportar Resultado
        </Button>
      </div>
    </div>
  )
}
