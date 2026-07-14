import { taxEngine } from "../tax-engine"
import type { TaxRegime } from "../tax-engine/types"

export interface DDSlashCommand {
  id: string
  command: string
  description: string
  category: "analysis" | "scenario" | "risk" | "export"
  handler: (args: string, ctx: { clientId: string; companyId: string; userId: string }) => Promise<{
    content: string
    component?: string
    componentProps?: Record<string, unknown>
  }>
}

export const DD_COMMANDS: DDSlashCommand[] = [
  {
    id: "scenario",
    command: "/scenario",
    description: "Simular escenario (ej: /scenario revenue -10%, opex +15%)",
    category: "scenario",
    handler: async (args) => {
      const revenueImpact = args.match(/revenue\s*([+-]\d+%)/)?.[1] ?? "0%"
      const opexImpact = args.match(/opex\s*([+-]\d+%)/)?.[1] ?? "0%"
      return {
        content: `Simulación completada: revenue ${revenueImpact}, opex ${opexImpact}`,
        component: "ScenarioResultCard",
        componentProps: {
          result: {
            meanRevenue: 9.3,
            var95: 7.8,
            survivalProb: 85,
            scenario: args,
          },
        },
      }
    },
  },
  {
    id: "risk",
    command: "/risk",
    description: "Listar riesgos por categoría (ej: /risk concentration)",
    category: "risk",
    handler: async (args) => {
      return {
        content: `Riesgos filtrados por: ${args || "todos"}`,
        component: "RiskResultCard",
        componentProps: {
          risks: [
            { level: "critical", title: "Concentración de clientes", detail: "Top 2 = 65% del revenue" },
            { level: "warning", title: "Dependencia de proveedor único", detail: "80% de COGS" },
          ],
        },
      }
    },
  },
  {
    id: "forecast",
    command: "/forecast",
    description: "Pronosticar métrica a N meses (ej: /forecast revenue 12)",
    category: "analysis",
    handler: async (args) => {
      return {
        content: `Pronóstico generado: ${args || "revenue 12 meses"}`,
        component: "ForecastResultCard",
        componentProps: {
          metric: args || "revenue",
          horizon: 12,
        },
      }
    },
  },
  {
    id: "export",
    command: "/export",
    description: "Exportar sección del DD (ej: /export pdf completo)",
    category: "export",
    handler: async (args) => {
      return {
        content: `Exportando: ${args || "reporte completo"}`,
        component: "ExportResultCard",
        componentProps: {
          format: args || "pdf",
          sections: ["resumen", "estados-financieros", "riesgos", "valuacion"],
        },
      }
    },
  },
  {
    id: "tax",
    command: "/tax",
    description: "Análisis tributario Ecuador (ej: /tax profile, /tax risk, /tax calendar, /tax simulate revenue=500000)",
    category: "risk",
    handler: async (args) => {
      const trimmed = args.trim().toLowerCase()
      const subcommand = trimmed.split(/\s+/)[0]

      switch (subcommand) {
        case "profile": {
          const profile = {
            ruc: "1790012345001",
            businessName: "Empresa Ejemplo S.A.",
            regime: "general" as TaxRegime,
            annualRevenue: 500000,
            employees: 15,
            sector: "Comercio",
          }
          const analysis = taxEngine.analyzeProfile(profile)
          return {
            content: `## Perfil Tributario\n\n` +
              `RUC: ${profile.ruc}\n` +
              `Régimen: ${profile.regime}\n` +
              `Carga tributaria: ${(analysis.taxBurden * 100).toFixed(2)}%\n` +
              `Tasa efectiva: ${(analysis.effectiveRate * 100).toFixed(2)}%\n` +
              `Alertas: ${analysis.alerts.length} | Riesgos: ${analysis.risks.length}`,
            component: "RiskResultCard",
            componentProps: { risks: analysis.risks },
          }
        }
        case "risk": {
          const profile = { ruc: "1790012345001", businessName: "Empresa Ejemplo S.A.", regime: "general" as TaxRegime, annualRevenue: 500000, employees: 15, sector: "Comercio" }
          const risks = (await import("../tax-engine/integration/dd-adapter")).analyzeTaxRisks(profile)
          return {
            content: `## Riesgos Tributarios\n\n${risks.map((r) => `- [${r.level.toUpperCase()}] ${r.category}: ${r.description}`).join("\n")}`,
            component: "RiskResultCard",
            componentProps: { risks },
          }
        }
        case "calendar": {
          const regime = (trimmed.match(/regime=(\w+)/)?.[1] || "general") as TaxRegime
          const obligations = taxEngine.getObligations(regime, new Date().getFullYear())
          const pending = obligations.filter((o) => o.status === "pending").slice(0, 10)
          return {
            content: `## Calendario Tributario ${new Date().getFullYear()}\n\n` +
              `Régimen: ${regime}\n` +
              `Próximas obligaciones:\n${pending.map((o) => `- ${o.name}: ${o.dueDate} (${o.formCode})`).join("\n")}`,
          }
        }
        case "simulate": {
          const revenue = parseFloat(trimmed.match(/revenue=(\d+)/)?.[1] || "0")
          const vat = taxEngine.calculateVAT(revenue * 0.7, revenue * 0.7 * 0.15)
          const ir = taxEngine.calculateIncomeTax(revenue * 0.15, "sociedad")
          return {
            content: `## Simulación Tributaria\n\n` +
              `Ingresos: $${revenue.toLocaleString()}\n\n` +
              `**IVA:**\n` +
              `- Generado: $${vat.ivaGenerado.toFixed(2)}\n` +
              `- Crédito: $${vat.ivaCredito.toFixed(2)}\n` +
              `- A pagar: $${vat.ivaAPagar.toFixed(2)}\n\n` +
              `**IR Sociedades:**\n` +
              `- Base imponible: $${ir.baseImponible.toFixed(2)}\n` +
              `- Tarifa: ${(ir.tarifa * 100).toFixed(0)}%\n` +
              `- Impuesto: $${ir.impuestoCasilla.toFixed(2)}`,
          }
        }
        default: {
          return {
            content: `## Tax Engine Ecuador\n\n` +
              taxEngine.getSummary() +
              `\n\n**Subcomandos:**\n` +
              `- \`/tax profile\` — perfil tributario estimado\n` +
              `- \`/tax risk\` — riesgos tributarios\n` +
              `- \`/tax calendar\` — calendario de obligaciones\n` +
              `- \`/tax calendar regime=rimpe_emprendedor\` — filtrar por régimen\n` +
              `- \`/tax simulate revenue=500000\` — simular IVA + IR`,
          }
        }
      }
    },
  },
]

export function parseDDCommand(input: string): { command: DDSlashCommand; args: string } | null {
  for (const cmd of DD_COMMANDS) {
    if (input.startsWith(cmd.command)) {
      const args = input.slice(cmd.command.length).trim()
      return { command: cmd, args }
    }
  }
  return null
}

export function filterDDCommands(prefix: string): DDSlashCommand[] {
  const lower = prefix.toLowerCase()
  return DD_COMMANDS.filter(
    (c) =>
      c.command.startsWith(lower) ||
      c.description.toLowerCase().includes(lower) ||
      c.category.startsWith(lower)
  )
}
