"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react"

interface Props {
  clientId: string | null
}

export function CrucesDashboard({ clientId }: Props) {
  const [period, setPeriod] = useState("2026-07")

  const { mutate: ejecutar, data, isPending, error } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cruces/ejecutar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: clientId || "demo", client_ruc: "1790000002001", fiscal_period: period }),
      })
      if (!res.ok) throw new Error("Error ejecutando cruces")
      return res.json()
    },
  })

  const severidadColor = (s: string) => {
    if (s === "ALTA") return "bg-red-100 text-red-700"
    if (s === "MEDIA") return "bg-amber-100 text-amber-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cruces de Informacion SRI
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Validacion cruzada: Compras vs Ventas, ATS vs Facturas, RUCs, montos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Periodo</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 w-40" />
            </div>
            <Button onClick={() => ejecutar()} disabled={isPending || !clientId}>
              {isPending ? "Ejecutando..." : "Ejecutar Cruces"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Cruces", value: data.total_cruces, color: "text-blue-600" },
              { label: "Alta Severidad", value: data.resumen.alta, color: "text-red-600" },
              { label: "Media Severidad", value: data.resumen.media, color: "text-amber-600" },
              { label: "Baja Severidad", value: data.resumen.baja, color: "text-gray-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.inconsistencias.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">Sin inconsistencias detectadas</p>
                <p className="text-sm text-muted-foreground">Todos los cruces pasaron correctamente</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inconsistencias ({data.inconsistencias.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Comprobante</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Sugerencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inconsistencias.map((inc: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{inc.tipo}</TableCell>
                        <TableCell>
                          <Badge className={severidadColor(inc.severidad)}>{inc.severidad}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{inc.comprobante}</TableCell>
                        <TableCell className="text-sm">{inc.descripcion}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inc.sugerencia}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
