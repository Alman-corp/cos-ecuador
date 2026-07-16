"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, AlertTriangle } from "lucide-react"

interface Props {
  clientId: string | null
}

export function IvaCalculatorFull({ clientId }: Props) {
  const [period, setPeriod] = useState("2026-07")
  const [ventas12, setVentas12] = useState("")
  const [ventas15, setVentas15] = useState("")
  const [ventas0, setVentas0] = useState("")
  const [compras12, setCompras12] = useState("")
  const [compras15, setCompras15] = useState("")

  const { mutate: calcular, data, isPending, error } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/iva/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: clientId || "demo",
          client_ruc: "1790000002001",
          fiscal_period: period,
          sales: [
            { invoice_number: "V-001", date: `${period}-15`, ruc_supplier: "1790000002001",
              base_12: ventas12 || "0", base_15: ventas15 || "0", base_0: ventas0 || "0" },
          ],
          purchases: [
            { invoice_number: "C-001", date: `${period}-10`, ruc_supplier: "1790056789001",
              base_12: compras12 || "0", base_15: compras15 || "0" },
          ],
        }),
      })
      if (!res.ok) throw new Error("Error calculando IVA")
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora IVA Completa (Formulario 104)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Periodo</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Ventas (IVA Cobrado)</h3>
              <div><label className="text-xs">Base 12%</label><Input value={ventas12} onChange={(e) => setVentas12(e.target.value)} placeholder="0.00" /></div>
              <div><label className="text-xs">Base 15%</label><Input value={ventas15} onChange={(e) => setVentas15(e.target.value)} placeholder="0.00" /></div>
              <div><label className="text-xs">Base 0%</label><Input value={ventas0} onChange={(e) => setVentas0(e.target.value)} placeholder="0.00" /></div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Compras (Credito Tributario)</h3>
              <div><label className="text-xs">Base 12%</label><Input value={compras12} onChange={(e) => setCompras12(e.target.value)} placeholder="0.00" /></div>
              <div><label className="text-xs">Base 15%</label><Input value={compras15} onChange={(e) => setCompras15(e.target.value)} placeholder="0.00" /></div>
            </div>
          </div>

          <Button onClick={() => calcular()} disabled={isPending || !clientId}>
            {isPending ? "Calculando..." : "Calcular IVA Mensual"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado Formulario 104</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Casilla</TableHead><TableHead>Descripcion</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.lineas_formulario).map(([key, val]) => (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs">{key}</TableCell>
                    <TableCell className="text-sm">{key.replace("casilla_", "Linea ")}</TableCell>
                    <TableCell className="text-right font-semibold">${String(val)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.warnings.map((w: string, i: number) => (
                  <Alert key={i} className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">{w}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
