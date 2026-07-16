"use client"

import type { DueDiligenceReport } from "@/core/due-diligence/types"
import type { Locale } from "@/lib/i18n"
import { t } from "@/lib/i18n"

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
}

const statusColors = {
  healthy: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
}

export function DueDiligenceReportView({ report, locale = "es" }: { report: DueDiligenceReport; locale?: Locale }) {
  const tr = (path: string) => t(locale, path)
  const severityLabel = (s: string) => {
    const map: Record<string, string> = { critical: tr("report.criticalLabel"), high: tr("report.high"), medium: tr("report.medium"), low: tr("report.low") }
    return map[s] || s
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{report.company.name}</h3>
            <p className="text-sm text-gray-500">{report.company.industry} {report.company.ruc ? `• RUC ${report.company.ruc}` : ""}</p>
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ${report.healthScore >= 60 ? "bg-green-500" : report.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}>
              {report.healthScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">{tr("report.healthScore")}</div>
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{report.executiveSummary}</p>
        <div className="flex gap-4 mt-4 text-sm text-gray-500">
          <span>{tr("report.generated")}: {new Date(report.generatedAt).toLocaleDateString(locale === "es" ? "es-EC" : "en-US")}</span>
          <span>{tr("report.maturity")}: {report.maturityLevel}</span>
        </div>
      </section>

      {/* Key Ratios */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tr("report.ratioAnalysis")}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.ratios.map((r) => (
            <div key={r.name} className="border border-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-500">{r.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[r.status]}`}>
                  {r.status === "healthy" ? tr("report.healthy") : r.status === "warning" ? tr("report.warning") : tr("report.critical")}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {r.unit === "%" ? `${(r.value * 100).toFixed(1)}%` : r.value.toFixed(2)}
                <span className="text-sm font-normal text-gray-400 ml-1">{r.unit}</span>
              </div>
              <div className="text-xs text-gray-400">
                {tr("report.benchmark")}: P50={r.unit === "%" ? `${(r.benchmarkP50 * 100).toFixed(1)}%` : r.benchmarkP50.toFixed(2)}
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${r.status === "healthy" ? "bg-green-500" : r.status === "warning" ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, (r.value / (r.benchmarkP75 || 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Risks */}
      {report.risks.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tr("report.risks")} ({report.risks.length})</h3>
          <div className="space-y-4">
            {report.risks.map((risk) => (
              <div key={risk.id} className={`border rounded-lg p-4 ${severityColors[risk.severity]?.split(" ").slice(2).join(" ") || ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[risk.severity]?.split(" ").slice(0, 2).join(" ") || ""}`}>
                    {severityLabel(risk.severity)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{risk.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded p-2">
                      <span className="text-xs font-medium text-blue-700">{tr("report.recommendation")}: </span>
                      <span className="text-xs text-blue-600">{risk.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tr("report.recommendations")}</h3>
        <ol className="list-decimal list-inside space-y-2">
          {report.recommendations.map((r, i) => (
            <li key={i} className="text-sm text-gray-700 leading-relaxed">{r}</li>
          ))}
        </ol>
      </section>

      {/* Maturity */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tr("report.maturity")}</h3>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${report.maturityScore >= 70 ? "bg-green-100 text-green-700" : report.maturityScore >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {report.maturityScore}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 capitalize">{report.maturityLevel}</div>
            <div className="text-sm text-gray-500">{tr("report.maturityLevel")}</div>
            <div className="mt-2 w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${report.maturityScore >= 70 ? "bg-green-500" : report.maturityScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${report.maturityScore}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
