'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Send, Search, CheckCircle2, Clock, XCircle, Info, Shield, RefreshCw } from 'lucide-react'

type Receipt = {
  id: string
  tipo: string
  clave: string
  fecha: string
  estado: 'authorized' | 'pending' | 'rejected'
  monto: number
}

const mockReceipts: Receipt[] = [
  { id: '1', tipo: 'Factura', clave: '0010010001234567890123456789012345678901234567890', fecha: '15/07/2026', estado: 'authorized', monto: 5000 },
  { id: '2', tipo: 'Retención', clave: '0020020009876543210987654321098765432109876543210', fecha: '14/07/2026', estado: 'pending', monto: 450 },
  { id: '3', tipo: 'Nota Crédito', clave: '0030030005554443332221110009998887776665554443', fecha: '12/07/2026', estado: 'rejected', monto: 1200 },
]

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

export default function SRIPage() {
  const [activeTab, setActiveTab] = useState('enviar')
  const [comprobanteTipo, setComprobanteTipo] = useState('factura')
  const [xmlContent, setXmlContent] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<factura id="0010010001234567890123456789012345678901234567890">
  <infoTributaria>
    <ruc>1790000002001</ruc>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>0001234</secuencial>
  </infoTributaria>
</factura>`)
  const [authMethod, setAuthMethod] = useState('token')
  const [ambiente, setAmbiente] = useState('test')
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [claveAcceso, setClaveAcceso] = useState('')
  const [statusCheck, setStatusCheck] = useState<{ found: boolean; estado: string } | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const handleSend = () => {
    setTimeout(() => {
      setSendResult({
        success: Math.random() > 0.3,
        message: Math.random() > 0.3
          ? 'Comprobante recibido por el SRI. Número de autorización: 1234567890'
          : 'Error: La estructura del XML no es válida. Verifique los campos obligatorios.',
      })
    }, 1500)
  }

  const handleCheckStatus = () => {
    if (!claveAcceso.trim()) return
    setStatusLoading(true)
    setTimeout(() => {
      const found = Math.random() > 0.3
      setStatusCheck({
        found,
        estado: found ? 'AUTORIZADO' : 'NO REGISTRADO',
      })
      setStatusLoading(false)
    }, 1200)
  }

  const estadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      authorized: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    }
    const labels: Record<string, string> = {
      authorized: 'Autorizado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
    }
    return (
      <Badge variant="outline" className={styles[estado] || ''}>
        {estado === 'authorized' && <CheckCircle2 className="h-3 w-3" />}
        {estado === 'pending' && <Clock className="h-3 w-3" />}
        {estado === 'rejected' && <XCircle className="h-3 w-3" />}
        {labels[estado] || estado}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Send className="h-8 w-8" />
          SRI — Envío de Comprobantes
        </h1>
        <p className="text-muted-foreground mt-1">Envío, validación y consulta de comprobantes electrónicos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="enviar">
            <Send className="h-4 w-4" />
            Enviar Comprobante
          </TabsTrigger>
          <TabsTrigger value="estado">
            <Search className="h-4 w-4" />
            Consultar Estado
          </TabsTrigger>
          <TabsTrigger value="historial">
            <RefreshCw className="h-4 w-4" />
            Historial Envíos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enviar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Comprobante</CardTitle>
                <CardDescription>Seleccione el tipo y pegue el XML</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Comprobante</Label>
                  <select
                    value={comprobanteTipo}
                    onChange={(e) => setComprobanteTipo(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm mt-1"
                  >
                    <option value="factura">Factura</option>
                    <option value="retencion">Comprobante de Retención</option>
                    <option value="notaCredito">Nota de Crédito</option>
                    <option value="notaDebito">Nota de Débito</option>
                    <option value="guiaRemision">Guía de Remisión</option>
                  </select>
                </div>

                <div>
                  <Label>Método de Autenticación</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={authMethod === 'token' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthMethod('token')}
                    >
                      Token
                    </Button>
                    <Button
                      variant={authMethod === 'password' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthMethod('password')}
                    >
                      Contraseña
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Ambiente</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={ambiente === 'test' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAmbiente('test')}
                    >
                      <Shield className="h-3 w-3" />
                      PRUEBAS
                    </Button>
                    <Button
                      variant={ambiente === 'produccion' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAmbiente('produccion')}
                    >
                      <Send className="h-3 w-3" />
                      PRODUCCIÓN
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>XML del Comprobante</Label>
                  <textarea
                    value={xmlContent}
                    onChange={(e) => setXmlContent(e.target.value)}
                    rows={12}
                    className="w-full rounded-lg border border-input bg-transparent p-3 text-xs font-mono mt-1"
                  />
                </div>

                <Button onClick={handleSend} className="w-full" disabled={!xmlContent.trim()}>
                  <Send className="h-4 w-4" />
                  Enviar a SRI ({ambiente === 'test' ? 'PRUEBAS' : 'PRODUCCIÓN'})
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado del Envío</CardTitle>
                <CardDescription>Respuesta del SRI</CardDescription>
              </CardHeader>
              <CardContent>
                {!sendResult ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Complete los datos y presione "Enviar a SRI"</p>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      {sendResult.success
                        ? <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                        : <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                      }
                      <div>
                        <p className={`font-medium ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          {sendResult.success ? 'Comprobante Enviado' : 'Error'}
                        </p>
                        <p className={`text-sm mt-1 ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {sendResult.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Información del envío</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Ambiente: <strong>{ambiente === 'test' ? 'PRUEBAS' : 'PRODUCCIÓN'}</strong></p>
                    <p>Tipo: <strong>{comprobanteTipo.charAt(0).toUpperCase() + comprobanteTipo.slice(1)}</strong></p>
                    <p>Autenticación: <strong>{authMethod === 'token' ? 'Token API' : 'Contraseña'}</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle>Consultar Estado de Comprobante</CardTitle>
              <CardDescription>Ingrese la clave de acceso de 49 dígitos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Clave de Acceso (49 dígitos)</Label>
                  <Input
                    value={claveAcceso}
                    onChange={(e) => setClaveAcceso(e.target.value)}
                    placeholder="0010010001234567890123456789012345678901234567890"
                    maxLength={49}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <Button onClick={handleCheckStatus} disabled={claveAcceso.length < 40 || statusLoading}>
                  {statusLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {statusLoading ? 'Consultando...' : 'Consultar'}
                </Button>
              </div>

              {statusCheck && (
                <div className={`p-4 rounded-lg ${statusCheck.found ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center gap-3">
                    {statusCheck.found
                      ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                      : <Clock className="h-6 w-6 text-yellow-600" />
                    }
                    <div>
                      <p className={`font-medium ${statusCheck.found ? 'text-green-700' : 'text-yellow-700'}`}>
                        {statusCheck.found ? 'Comprobante Autorizado' : 'No registrado en el SRI'}
                      </p>
                      <p className={`text-sm ${statusCheck.found ? 'text-green-600' : 'text-yellow-600'}`}>
                        {statusCheck.found
                          ? `Estado: ${statusCheck.estado} · Autorización válida`
                          : 'El comprobante no ha sido registrado o la clave es incorrecta'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Envíos</CardTitle>
              <CardDescription>Últimos comprobantes enviados al SRI</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Clave de Acceso</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReceipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tipo}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={r.clave}>
                        {r.clave.slice(0, 20)}...
                      </TableCell>
                      <TableCell className="text-xs">{r.fecha}</TableCell>
                      <TableCell>{formatUSD(r.monto)}</TableCell>
                      <TableCell>{estadoBadge(r.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
