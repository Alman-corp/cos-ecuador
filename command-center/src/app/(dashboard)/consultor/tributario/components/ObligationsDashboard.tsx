"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  RefreshCw,
  Building2,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Obligation {
  id: string
  company_id: string
  period: string
  status: string
  filed_at: string | null
  amount: number | null
  notes: string | null
}

interface Summary {
  total: number
  pending: number
  filed: number
  overdue: number
  exempt: number
  upcomingDeadlines: Obligation[]
  overdueItems: Obligation[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
  filed: { label: "Presentada", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  overdue: { label: "Vencida", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  exempt: { label: "Exenta", color: "bg-gray-100 text-gray-700", icon: FileText },
}

const OBLIGATION_TYPES = [
  { type: "IVA", form: "104", desc: "Impuesto al Valor Agregado" },
  { type: "RETENCIONES", form: "106", desc: "Retenciones en la Fuente" },
  { type: "ATS", form: "ATS", desc: "Anexo de Transacciones SRI" },
  { type: "RENTA", form: "101", desc: "Impuesto a la Renta" },
  { type: "ICE", form: "105", desc: "Impuesto a los Consumos Especiales" },
  { type: "RIMPE", form: "RIMPE", desc: "Régimen Simplificado" },
]

export function ObligationsDashboard({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string | undefined>()

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ["tax-obligations-summary", companyId],
    queryFn: () =>
      fetch(`/api/tax/obligations?companyId=${companyId}&summary=true`).then(
        (r) => r.json()
      ),
    refetchInterval: 30000,
  })

  const { data: obligationsData, isLoading: obligationsLoading } = useQuery({
    queryKey: ["tax-obligations", companyId, filter],
    queryFn: () => {
      const params = new URLSearchParams({ companyId })
      if (filter) params.set("status", filter)
      return fetch(`/api/tax/obligations?${params}`).then((r) => r.json())
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { obligationId: string; status: string; filedAt?: string; amount?: number; notes?: string }) =>
      fetch("/api/tax/obligations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-obligations"] })
      queryClient.invalidateQueries({ queryKey: ["tax-obligations-summary"] })
    },
  })

  const obligations: Obligation[] = obligationsData?.obligations || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Panel de Obligaciones Tributarias
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["tax-obligations"] })
            queryClient.invalidateQueries({ queryKey: ["tax-obligations-summary"] })
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: summary?.total || 0, color: "text-blue-600" },
          { label: "Pendientes", value: summary?.pending || 0, color: "text-amber-600" },
          { label: "Presentadas", value: summary?.filed || 0, color: "text-green-600" },
          { label: "Vencidas", value: summary?.overdue || 0, color: "text-red-600" },
          { label: "Exentas", value: summary?.exempt || 0, color: "text-gray-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary?.overdueItems && summary.overdueItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>{summary.overdueItems.length} obligación(es) vencida(s)</strong> — requieren atención inmediata
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Obligaciones por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {["pending", "filed", "overdue"].map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filter === s ? undefined : s)}
              >
                {STATUS_CONFIG[s].label}
              </Button>
            ))}
            {filter && (
              <Button variant="ghost" size="sm" onClick={() => setFilter(undefined)}>
                Limpiar
              </Button>
            )}
          </div>

          {obligationsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : obligations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay obligaciones registradas para esta empresa.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Formulario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Presentada</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map((obl) => {
                  const config = STATUS_CONFIG[obl.status] || STATUS_CONFIG.pending
                  const Icon = config.icon
                  return (
                    <TableRow key={obl.id}>
                      <TableCell className="font-medium">{obl.period}</TableCell>
                      <TableCell>
                        {OBLIGATION_TYPES.find((t) =>
                          obl.period.includes(t.type)
                        )?.type || "N/A"}
                      </TableCell>
                      <TableCell>
                        {OBLIGATION_TYPES.find((t) =>
                          obl.period.includes(t.type)
                        )?.form || "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {obl.filed_at
                          ? new Date(obl.filed_at).toLocaleDateString("es-EC")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {obl.amount != null
                          ? `$${obl.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {obl.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                updateMutation.mutate({
                                  obligationId: obl.id,
                                  status: "filed",
                                  filedAt: new Date().toISOString(),
                                })
                              }
                            >
                              Marcar Presentada
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-600"
                              onClick={() =>
                                updateMutation.mutate({
                                  obligationId: obl.id,
                                  status: "overdue",
                                })
                              }
                            >
                              Vencida
                            </Button>
                          </div>
                        )}
                        {obl.status === "filed" && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completada
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
