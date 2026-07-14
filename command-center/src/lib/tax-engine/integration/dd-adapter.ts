import type { TaxProfile, TaxRisk } from "../types"

export function analyzeTaxRisks(profile: TaxProfile): TaxRisk[] {
  const risks: TaxRisk[] = []

  if (profile.annualRevenue > 0 && profile.annualRevenue < 300000 && profile.regime === "general") {
    risks.push({
      level: "medium",
      category: "estructural",
      description: `Ingresos de $${profile.annualRevenue.toLocaleString()} en régimen general. Evalúe si corresponde RIMPE Emprendedor (ingresos < $300,000).`,
    })
  }

  if (profile.annualRevenue >= 300000 && (profile.regime === "rimpe_popular" || profile.regime === "rimpe_emprendedor")) {
    risks.push({
      level: "critical",
      category: "estructural",
      description: `Régimen RIMPE con ingresos de $${profile.annualRevenue.toLocaleString()}. Según normativa, supera el umbral de $300,000 para RIMPE. Riesgo de exclusión del régimen.`,
    })
  }

  if (profile.employees <= 0 && profile.annualRevenue > 100000) {
    risks.push({
      level: "high",
      category: "laboral",
      description: "No reporta empleados con ingresos significativos. Posible uso de facturas de terceros o personal no declarado.",
    })
  }

  if (profile.annualRevenue < 50000 && profile.regime !== "rimpe_popular") {
    risks.push({
      level: "low",
      category: "concentracion",
      description: "Ingresos bajos. Evalúe acogerse al régimen RIMPE Popular (ingresos < $50,000).",
    })
  }

  return risks
}
