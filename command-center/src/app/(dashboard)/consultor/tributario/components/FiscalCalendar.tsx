"use client"

import { useState } from "react"
import { useFiscalCalendar } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Search, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  IVA_MENSUAL: "IVA Mensual",
  RETENCIONES_MENSUALES: "Retenciones",
  ANEXO_ATS: "Anexo ATS",
  RENTA_ANUAL: "Renta Anual",
}

interface CalendarRecord {
  id: string
  obligationType: string
  fiscalPeriod: string
  ninthDigit: number
  dueDate: string
  description: string
  basePenalty: number
}

export function FiscalCalendar() {
  const [digit, setDigit] = useState<string>("")
  const [searchDigit, setSearchDigit] = useState<number | undefined>()

  const { data, isLoading, error } = useFiscalCalendar(searchDigit)

  const handleSearch = () => {
    const d = parseInt(digit)
    if (!isNaN(d) && d >= 0 && d <= 9) {
      setSearchDigit(d)
    }
  }

  const getUrgency = (dueDate: string) => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (days < 0)
      return { variant: "destructive" as const, label: `Vencida (${Math.abs(days)}d)`, icon: XCircle }
    if (days <= 5)
      return { variant: "destructive" as const, label: `${days}d`, icon: AlertTriangle }
    if (days <= 15)
      return { variant: "outline" as const, label: `${days}d`, icon: Clock }
    return { variant: "secondary" as const, label: `${days}d`, icon: CheckCircle }
  }

  const grouped: Record<string, CalendarRecord[]> = data?.grouped || {}

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario Fiscal SRI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Noveno dígito (0-9)"
              value={digit}
              onChange={(e) => setDigit(e.target.value)}
              className="w-48"
              maxLength={1}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={() => { setSearchDigit(undefined); setDigit("") }}>
              Todos
            </Button>
          </div>

          {searchDigit !== undefined && (
            <Alert className="mb-4">
              <AlertDescription>
                Mostrando obligaciones para noveno dígito: <strong>{searchDigit}</strong>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Cargando calendario fiscal...
            </div>
          )}

          {!isLoading && !error && Object.keys(grouped).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ingresa un noveno dígito para ver las fechas de vencimiento.
            </div>
          )}

          {Object.entries(grouped).map(([type, records]) => (
            <Card key={type} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{TYPE_LABELS[type] || type}</span>
                  <Badge>{records.length} períodos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>9no Dígito</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.slice(0, 12).map((r: CalendarRecord) => {
                      const urg = getUrgency(r.dueDate)
                      const Icon = urg.icon
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.fiscalPeriod}</TableCell>
                          <TableCell>{r.ninthDigit}</TableCell>
                          <TableCell>
                            {new Date(r.dueDate + "T00:00:00").toLocaleDateString("es-EC", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              urg.variant === "destructive" ? "bg-red-100 text-red-700" :
                              urg.variant === "outline" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              <Icon className="h-3 w-3" />
                              {urg.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
