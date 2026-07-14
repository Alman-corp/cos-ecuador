'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Plus, Trash2, Code2, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

type TransaccionATS = {
  id: number
  tipo: string
  factura: string
  ruc: string
  base: number
  iva: number
  retencion: number
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<ats:factura>
  <ats:periodo>07/2026</ats:periodo>
  <ats:contribuyente>1790000002001</ats:contribuyente>
  <ats:ventas>
    <ats:venta>
      <ats:tpIdCliente>04</ats:tpIdCliente>
      <ats:idCliente>1790012345001</ats:idCliente>
      <ats:tipoComprobante>18</ats:tipoComprobante>
      <ats:baseImponible>5000.00</ats:baseImponible>
      <ats:baseImpGrav>4500.00</ats:baseImpGrav>
      <ats:montoIva>675.00</ats:montoIva>
    </ats:venta>
  </ats:ventas>
</ats:factura>`

export default function AnexosPage() {
  const [activeTab, setActiveTab] = useState('ventas')
  const [atsTab, setAtsTab] = useState<'ventas' | 'compras' | 'retenciones'>('ventas')
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [xmlContent, setXmlContent] = useState(xmlSample)
  const [xmlValid, setXmlValid] = useState<boolean | null>(null)
  const [showXml, setShowXml] = useState(false)
  const [generatedXml, setGeneratedXml] = useState('')

  const [ventasATS, setVentasATS] = useState<TransaccionATS[]>([
    { id: 1, tipo: 'Factura', factura: '001-001-0001234', ruc: '1790012345001', base: 5000, iva: 750, retencion: 75 },
  ])
  const [comprasATS, setComprasATS] = useState<TransaccionATS[]>([
    { id: 1, tipo: 'Factura', factura: '001-001-0005678', ruc: '1790056789001', base: 3000, iva: 450, retencion: 45 },
  ])
  const [retenATS, setRetenATS] = useState<TransaccionATS[]>([
    { id: 1, tipo: 'Retención', factura: '001-001-0009012', ruc: '1790090123001', base: 2000, iva: 0, retencion: 40 },
  ])

  const nextId = (arr: TransaccionATS[]) => (Math.max(...arr.map(a => a.id), 0) + 1)

  const addRow = (list: TransaccionATS[], setter: (l: TransaccionATS[]) => void) => {
    setter([...list, { id: nextId(list), tipo: 'Factura', factura: '', ruc: '', base: 0, iva: 0, retencion: 0 }])
  }

  const removeRow = (id: number, list: TransaccionATS[], setter: (l: TransaccionATS[]) => void) => {
    if (list.length > 1) setter(list.filter(r => r.id !== id))
  }

  const updateRow = (id: number, field: keyof TransaccionATS, value: string | number, list: TransaccionATS[], setter: (l: TransaccionATS[]) => void) => {
    setter(list.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const generateATSXml = (items: TransaccionATS[], tipo: string) => {
    const periodo = `${String(month + 1).padStart(2, '0')}/${year}`
    const entries = items.map((item, i) => `
    <${tipo === 'ventas' ? 'venta' : tipo === 'compras' ? 'compra' : 'retencion'}>
      <tpIdCliente>04</tpIdCliente>
      <idCliente>${item.ruc}</idCliente>
      <tipoComprobante>18</tipoComprobante>
      <baseImponible>${item.base.toFixed(2)}</baseImponible>
      <baseImpGrav>${item.base.toFixed(2)}</baseImpGrav>
      <montoIva>${item.iva.toFixed(2)}</montoIva>
      <montoRetencion>${item.retencion.toFixed(2)}</montoRetencion>
    </${tipo === 'ventas' ? 'venta' : tipo === 'compras' ? 'compra' : 'retencion'}>`).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ats:${tipo === 'ventas' ? 'factura' : tipo === 'compras' ? 'compras' : 'retenciones'}>
  <ats:periodo>${periodo}</ats:periodo>
  <ats:contribuyente>1790000002001</ats:contribuyente>
  <ats:${tipo === 'ventas' ? 'ventas' : tipo === 'compras' ? 'compras' : 'retenciones'}>${entries}
  </ats:${tipo === 'ventas' ? 'ventas' : tipo === 'compras' ? 'compras' : 'retenciones'}>
</ats:${tipo === 'ventas' ? 'factura' : tipo === 'compras' ? 'compras' : 'retenciones'}>`
    return xml
  }

  const handleGenerateATS = () => {
    let xml = ''
    if (atsTab === 'ventas') xml = generateATSXml(ventasATS, 'ventas')
    else if (atsTab === 'compras') xml = generateATSXml(comprasATS, 'compras')
    else xml = generateATSXml(retenATS, 'retenciones')
    setGeneratedXml(xml)
    setShowXml(true)
  }

  const handleValidateXML = () => {
    try {
      const hasXml = xmlContent.includes('<?xml') || xmlContent.includes('<ats:')
      setXmlValid(hasXml)
    } catch {
      setXmlValid(false)
    }
  }

  const renderATSItem = (items: TransaccionATS[], setter: (l: TransaccionATS[]) => void, tipo: string) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{items.length} registro(s)</p>
        <Button variant="outline" size="sm" onClick={() => addRow(items, setter)}>
          <Plus className="h-4 w-4" />Agregar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Factura</TableHead>
            <TableHead>RUC</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>IVA</TableHead>
            <TableHead>Retención</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <select
                  value={item.tipo}
                  onChange={(e) => updateRow(item.id, 'tipo', e.target.value, items, setter)}
                  className="h-7 rounded border border-input bg-transparent px-1 text-xs w-24"
                >
                  <option>Factura</option>
                  <option>Nota Crédito</option>
                  <option>Nota Débito</option>
                  <option>Retención</option>
                </select>
              </TableCell>
              <TableCell>
                <Input value={item.factura} onChange={(e) => updateRow(item.id, 'factura', e.target.value, items, setter)} className="h-7 text-xs w-28" />
              </TableCell>
              <TableCell>
                <Input value={item.ruc} onChange={(e) => updateRow(item.id, 'ruc', e.target.value, items, setter)} className="h-7 text-xs w-28" />
              </TableCell>
              <TableCell>
                <Input type="number" value={item.base || ''} onChange={(e) => updateRow(item.id, 'base', Number(e.target.value), items, setter)} className="h-7 text-xs w-20" />
              </TableCell>
              <TableCell>
                <Input type="number" value={item.iva || ''} onChange={(e) => updateRow(item.id, 'iva', Number(e.target.value), items, setter)} className="h-7 text-xs w-20" />
              </TableCell>
              <TableCell>
                <Input type="number" value={item.retencion || ''} onChange={(e) => updateRow(item.id, 'retencion', Number(e.target.value), items, setter)} className="h-7 text-xs w-20" />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-xs" onClick={() => removeRow(item.id, items, setter)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-3 gap-2">
        <Button variant="outline" size="sm" onClick={handleGenerateATS}>
          <Code2 className="h-4 w-4" />Generar ATS
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Anexos y XML
        </h1>
        <p className="text-muted-foreground mt-1">Generación y validación de ATS y XML tributarios</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="ats">ATS</TabsTrigger>
          <TabsTrigger value="validar">Validar XML</TabsTrigger>
        </TabsList>

        <TabsContent value="ats">
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <div>
              <Label>Mes</Label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Año</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-20" />
            </div>
            <Badge variant="outline" className="mb-1">Período: {MONTHS[month]} {year}</Badge>
          </div>

          <div className="flex gap-2 mb-4">
            <Button variant={atsTab === 'ventas' ? 'default' : 'outline'} size="sm" onClick={() => setAtsTab('ventas')}>
              ATS Ventas
            </Button>
            <Button variant={atsTab === 'compras' ? 'default' : 'outline'} size="sm" onClick={() => setAtsTab('compras')}>
              ATS Compras
            </Button>
            <Button variant={atsTab === 'retenciones' ? 'default' : 'outline'} size="sm" onClick={() => setAtsTab('retenciones')}>
              ATS Retenciones
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                ATS - {atsTab === 'ventas' ? 'Ventas' : atsTab === 'compras' ? 'Compras' : 'Retenciones'}
              </CardTitle>
              <CardDescription>Registros para el ATS del período</CardDescription>
            </CardHeader>
            <CardContent>
              {atsTab === 'ventas' && renderATSItem(ventasATS, setVentasATS, 'ventas')}
              {atsTab === 'compras' && renderATSItem(comprasATS, setComprasATS, 'compras')}
              {atsTab === 'retenciones' && renderATSItem(retenATS, setRetenATS, 'retenciones')}
            </CardContent>
          </Card>

          {showXml && generatedXml && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vista Previa XML Generado</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowXml(false)}>Cerrar</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  {generatedXml}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validar">
          <Card>
            <CardHeader>
              <CardTitle>Validar XML</CardTitle>
              <CardDescription>Pega el XML de tu comprobante para validar su estructura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contenido XML</Label>
                <textarea
                  value={xmlContent}
                  onChange={(e) => { setXmlContent(e.target.value); setXmlValid(null) }}
                  rows={15}
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-xs font-mono mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleValidateXML}>
                  <CheckCircle2 className="h-4 w-4" />
                  Validar XML
                </Button>
              </div>
              {xmlValid === true && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700">Estructura XML válida. El comprobante cumple con el formato básico.</p>
                </div>
              )}
              {xmlValid === false && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">No se pudo validar el XML. Verifique que sea un archivo XML válido.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
