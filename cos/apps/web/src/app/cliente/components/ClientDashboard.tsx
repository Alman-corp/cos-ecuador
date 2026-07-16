import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialLineChart } from "@/components/charts"
import { TrendingUp, DollarSign, Briefcase, Calendar } from "lucide-react"

interface Props {
  financials: Array<{ year: number; revenue: number; netIncome: number }>
  projects: Array<{ id: string; name: string; status: string; startDate: Date }>
}

export function ClientDashboard({ financials, projects }: Props) {
  const latest = financials[0]
  const prev = financials[1]
  const revenueGrowth = prev ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : 0
  const netMargin = latest ? (latest.netIncome / latest.revenue) * 100 : 0

  const chartData = (financials ?? []).slice().reverse().map((f) => ({ period: String(f.year), value: f.revenue }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Ingresos (ultimo ano)" value={`$${((latest?.revenue ?? 0) / 1_000_000).toFixed(1)}M`} change={revenueGrowth} />
        <KPICard icon={TrendingUp} label="Margen Neto" value={`${netMargin.toFixed(1)}%`} />
        <KPICard icon={Briefcase} label="ROE" value={`${((latest?.netIncome ?? 0) / ((latest?.revenue ?? 1) * 0.5)) * 100}%`} />
        <KPICard icon={Calendar} label="Proyectos Activos" value={String(projects?.filter((p) => p.status === "active").length ?? 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Evolucion de Ingresos</CardTitle></CardHeader>
        <CardContent>
          <FinancialLineChart data={chartData} series={[{ key: "value", name: "Revenue", color: "#3b82f6" }]} height={300} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Proyectos Recientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(projects ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-slate-500">Iniciado: {new Date(p.startDate).toLocaleDateString("es-ES")}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({ icon: Icon, label, value, change }: { icon: any; label: string; value: string; change?: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-slate-400" />
          {change !== undefined && <span className={`text-xs font-medium ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}
