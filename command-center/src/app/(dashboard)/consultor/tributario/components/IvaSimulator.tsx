"use client"

import { useState, useCallback } from "react"
import { useIvaSimulator, type IvaSimulatorResult } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calculator } from "lucide-react"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

export function IvaSimulator() {
  const [input, setInput] = useState({
    ingresos0: 0,
    ingresos12: 50000,
    ingresos15: 20000,
    ivaCompras: 5000,
    retencionesRecibidas: 500,
  })

  const { mutate: simulate, data: result, isPending } = useIvaSimulator()

  const handleChange = useCallback(
    (field: string, value: number) => {
      const next = { ...input, [field]: value }
      setInput(next)
      simulate(next)
    },
    [input, simulate]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Parámetros del Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ingresos gravados 0%</Label>
              <Badge variant="outline">No grava IVA</Badge>
            </div>
            <Input
              type="number"
              value={input.ingresos0 || ""}
              onChange={(e) => handleChange("ingresos0", Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ingresos gravados 12%</Label>
              <span className="text-sm text-muted-foreground">
                {fmt(input.ingresos12 * 0.12)} IVA
              </span>
            </div>
            <Input
              type="number"
              value={input.ingresos12 || ""}
              onChange={(e) => handleChange("ingresos12", Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ingresos gravados 15%</Label>
              <Badge variant="secondary">LORTI 2024+</Badge>
            </div>
            <Input
              type="number"
              value={input.ingresos15 || ""}
              onChange={(e) => handleChange("ingresos15", Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Crédito Tributario (IVA compras)</Label>
            <Input
              type="number"
              value={input.ivaCompras || ""}
              onChange={(e) => handleChange("ivaCompras", Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Retenciones en la fuente recibidas</Label>
            <Input
              type="number"
              value={input.retencionesRecibidas || ""}
              onChange={(e) =>
                handleChange("retencionesRecibidas", Number(e.target.value) || 0)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          result
            ? result.saldoAPagar > 0
              ? "border-red-500/50"
              : "border-green-500/50"
            : ""
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resultado del Período</span>
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">IVA cobrado 12%</div>
                  <div className="text-lg font-semibold">{fmt(result.ivaCobrado12)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">IVA cobrado 15%</div>
                  <div className="text-lg font-semibold">{fmt(result.ivaCobrado15)}</div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total IVA Ventas</span>
                  <span className="font-semibold">{fmt(result.ivaVentas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) IVA Compras</span>
                  <span>-{fmt(result.ivaCompras)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Retenciones recibidas</span>
                  <span>-{fmt(result.retencionesRecibidas)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-muted-foreground text-sm">
                      {result.saldoAPagar > 0 ? "IVA a pagar" : "Saldo a favor"}
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        result.saldoAPagar > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {fmt(result.saldoAPagar || result.saldoAFavor)}
                    </div>
                  </div>
                  {result.saldoAPagar > 0 ? (
                    <TrendingUp className="h-12 w-12 text-red-500" />
                  ) : (
                    <TrendingDown className="h-12 w-12 text-green-500" />
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded mt-4">
                Tip: Modifica los valores para simular escenarios what-if.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
