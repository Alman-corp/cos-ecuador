import type { TaxProfile, TaxAnalysis, TaxObligation, TaxRegime } from "./types"
import { calculateVAT, calculateIncomeTax, calculateWithholding } from "./calculator"
import { getObligations, getNextDeadlines } from "./calendar"
import { validateRUC, validateCedula } from "./validators"
import { IVA_RATES, IR_SOCIEDADES_RATE, IR_PERSONAS_BRACKETS, WITHHOLDING_RATES, ICE_RATES, IESS_RATES } from "./rates"
import { analyzeTaxRisks } from "./integration/dd-adapter"

export * from "./types"
export * from "./rates"
export * from "./calculator"
export * from "./calendar"
export * from "./validators"

class TaxEngine {
  get rates() {
    return {
      iva: IVA_RATES,
      irSociedades: IR_SOCIEDADES_RATE,
      irPersonas: IR_PERSONAS_BRACKETS,
      retenciones: WITHHOLDING_RATES,
      ice: ICE_RATES,
      iess: IESS_RATES,
    }
  }

  calculateVAT = calculateVAT
  calculateIncomeTax = calculateIncomeTax
  calculateWithholding = calculateWithholding

  getObligations = getObligations
  getNextDeadlines = getNextDeadlines

  validateRUC = validateRUC
  validateCedula = validateCedula

  analyzeProfile(profile: TaxProfile): TaxAnalysis {
    const risks = analyzeTaxRisks(profile)
    const taxBurden = profile.annualRevenue > 0 ? (profile.annualRevenue * 0.25 * 0.15) / profile.annualRevenue : 0
    const effectiveRate = 0.15

    return {
      taxBurden,
      effectiveRate,
      alerts: risks.map((r) => ({
        type: r.level === "critical" ? "critical" : r.level === "high" ? "warning" : "info",
        message: r.description,
      })),
      risks,
    }
  }

  getSummary(): string {
    return `## Tax Engine Ecuador\n\n` +
      `- IVA: ${IVA_RATES.map((r) => `${r.label} ${(r.rate * 100).toFixed(0)}%`).join(" / ")}\n` +
      `- IR Sociedades: ${(IR_SOCIEDADES_RATE * 100).toFixed(0)}%\n` +
      `- IR Personas: tabla progresiva (${IR_PERSONAS_BRACKETS.length} rangos, hasta 37%)\n` +
      `- Retenciones: ${WITHHOLDING_RATES.map((r) => `${r.tipo} ${(r.rate * 100).toFixed(0)}%`).join(", ")}\n` +
      `- ICE: ${ICE_RATES.map((r) => `${r.category} ${(r.rateMin * 100).toFixed(0)}-${(r.rateMax * 100).toFixed(0)}%`).join(", ")}\n` +
      `- IESS: patronal ${(IESS_RATES.patronal * 100).toFixed(2)}%, personal ${(IESS_RATES.personal * 100).toFixed(2)}%\n` +
      `- RUC/Cédula validation, calendario tributario, análisis de riesgos`
  }
}

export const taxEngine = new TaxEngine()
export default taxEngine
