'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Search, AlertTriangle } from 'lucide-react'
import { getClientCalendar, validateRUCEcuador, type ClientCalendar } from '@/lib/tax/sri-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FiscalCalendar } from '../components/FiscalCalendar'

export default function CalendarioSRI() {
  const [ruc, setRuc] = useState('')
  const [calendar, setCalendar] = useState<ClientCalendar | null>(null)
  const [error, setError] = useState('')

  const handleSearch = () => {
    setError('')
    const validation = validateRUCEcuador(ruc)
    if (!validation.valid) {
      setError('RUC inválido. Debe tener 13 dígitos y cumplir el módulo 10.')
      setCalendar(null)
      return
    }
    const cal = getClientCalendar(ruc, `Cliente ${ruc.slice(0, 3)}***`, validation.ninthDigit!)
    setCalendar(cal)
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      OVERDUE: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-green-100 text-green-700',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${styles[status] || 'bg-gray-100'}`}>
        {status === 'PENDING' ? 'Pendiente' : status === 'OVERDUE' ? 'Vencido' : 'Completado'}
      </span>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Calendario SRI
        </h1>
        <p className="text-muted-foreground mt-2">
          Calendario de vencimientos tributarios según noveno dígito del RUC
        </p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api">Calendario Oficial SRI</TabsTrigger>
          <TabsTrigger value="ruc">Buscar por RUC</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="mt-6">
          <FiscalCalendar />
        </TabsContent>

        <TabsContent value="ruc" className="mt-6">
          <Card className="mb-6">
            <CardHeader><CardTitle>Buscar por RUC</CardTitle></CardHeader>
            <CardContent className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>RUC del cliente (13 dígitos)</Label>
                <Input
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="1790000002001"
                  maxLength={13}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSearch} disabled={ruc.length !== 13}>
                <Search className="h-4 w-4 mr-2" />Consultar
              </Button>
            </CardContent>
            {error && (
              <CardContent><Alert className="bg-red-50 border-red-200"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert></CardContent>
            )}
          </Card>

          {calendar && (
            <>
              <Card className="mb-6">
                <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{calendar.summary.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">{calendar.summary.pending}</p>
                      <p className="text-xs text-muted-foreground">Pendientes</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{calendar.summary.overdue}</p>
                      <p className="text-xs text-muted-foreground">Vencidos</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{calendar.summary.completed}</p>
                      <p className="text-xs text-muted-foreground">Completados</p>
                    </div>
                  </div>
                  <p className="text-sm mt-4">
                    RUC: {calendar.company.ruc} | Noveno dígito: <strong>{calendar.company.ninthDigit}</strong>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Obligaciones {calendar.year}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Obligación</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Formulario</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calendar.obligations.map((ob, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{ob.period}</TableCell>
                          <TableCell className="text-sm">{ob.description}</TableCell>
                          <TableCell className="text-xs">{new Date(ob.dueDate).toLocaleDateString('es-EC')}</TableCell>
                          <TableCell className="text-xs">{ob.sriForm}</TableCell>
                          <TableCell>{statusBadge(ob.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
