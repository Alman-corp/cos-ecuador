"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react"

interface Props {
  clientId: string | null
}

export function ATSGenerator({ clientId }: Props) {
  const [period, setPeriod] = useState("202607")
  const [ambiente, setAmbiente] = useState("1")

  const { mutate: generar, data, isPending, error } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/anexos/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period, ambiente: parseInt(ambiente) }),
      })
      if (!res.ok) throw new Error("Error generando ATS")
      return res.json()
    },
  })

  const descargarXML = async () => {
    const res = await fetch("/api/anexos/ats/xml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, period, ambiente: parseInt(ambiente) }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ATS_${period}.xml`
    a.click()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de Anexos ATS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Genera el Anexo Transaccional Simplificado en formato XML oficial del SRI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Periodo Fiscal</label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="202607"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: YYYYMM</p>
            </div>
            <div>
              <label className="text-sm font-medium">Ambiente</label>
              <Select value={ambiente} onValueChange={(v) => v && setAmbiente(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Pruebas</SelectItem>
                  <SelectItem value="2">Produccion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => generar()} disabled={isPending || !clientId}>
              {isPending ? "Generando..." : "Generar ATS"}
            </Button>
            {data && (
              <Button variant="outline" onClick={descargarXML}>
                <Download className="h-4 w-4 mr-2" /> Descargar XML
              </Button>
            )}
          </div>

          {ambiente === "2" && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>Produccion:</strong> Este XML esta listo para cargar al portal del SRI.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total compras:</div>
                <div className="font-semibold">${data.resumen.total_compras}</div>
                <div>IVA en compras:</div>
                <div className="font-semibold">${data.resumen.total_iva_compras}</div>
                <div>Total ventas:</div>
                <div className="font-semibold">${data.resumen.total_ventas}</div>
                <div>IVA en ventas:</div>
                <div className="font-semibold">${data.resumen.total_iva_ventas}</div>
                <div>Compras:</div>
                <div className="font-semibold">{data.resumen.num_compras}</div>
                <div>Ventas:</div>
                <div className="font-semibold">{data.resumen.num_ventas}</div>
                <div>Diferencia IVA:</div>
                <div className="font-semibold">${data.resumen.iva_cobrado_menos_pagado}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Validaciones ({data.validaciones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.validaciones.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Todas las validaciones pasaron</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.validaciones.map((v: string, i: number) => (
                    <div key={i} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
