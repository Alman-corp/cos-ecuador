export interface TaxInput {
  revenue: number
  cogs: number
  opex: number
  depreciation: number
  nonDeductibleExpenses: number
  taxCredits: number
  previousYearLoss: number
}

export interface TaxResult {
  taxableIncome: number
  incomeTax: number
  surchargeTax: number
  totalTax: number
  effectiveRate: number
  breakdown: { concept: string; amount: number }[]
}

export class TaxCalculationService {
  calculateEcuadorianIncomeTax(input: TaxInput): TaxResult {
    const grossIncome = input.revenue - input.cogs
    const netIncome = grossIncome - input.opex - input.depreciation + input.nonDeductibleExpenses
    const taxableIncome = Math.max(0, netIncome - input.previousYearLoss)

    const baseRate = 0.25
    const incomeTax = taxableIncome * baseRate

    const surchargeThreshold = 1000000
    const surcharge = taxableIncome > surchargeThreshold
      ? (taxableIncome - surchargeThreshold) * 0.03
      : 0

    const totalTax = Math.max(0, incomeTax + surcharge - input.taxCredits)
    const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0

    return {
      taxableIncome,
      incomeTax,
      surchargeTax: surcharge,
      totalTax,
      effectiveRate,
      breakdown: [
        { concept: "Ingreso Bruto", amount: grossIncome },
        { concept: "Base Imponible", amount: taxableIncome },
        { concept: "Impuesto a la Renta (25%)", amount: incomeTax },
        { concept: "Recargo 3% (si corresponde)", amount: surcharge },
        { concept: "Créditos Tributarios", amount: -input.taxCredits },
        { concept: "Total a Pagar", amount: totalTax },
      ],
    }
  }
}

export const taxCalculationService = new TaxCalculationService()
