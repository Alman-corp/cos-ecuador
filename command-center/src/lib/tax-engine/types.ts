export type TaxRegime = "general" | "rimpe_popular" | "rimpe_emprendedor" | "special"
export type TaxObligationStatus = "pending" | "filed" | "overdue" | "exempt"

export interface TaxProfile {
  ruc: string
  businessName: string
  regime: TaxRegime
  annualRevenue: number
  employees: number
  sector: string
}

export interface TaxObligation {
  id: string
  name: string
  formCode: string
  dueDate: string
  status: TaxObligationStatus
  regime: TaxRegime
  period: string
}

export interface TaxAnalysis {
  taxBurden: number
  effectiveRate: number
  alerts: TaxAlert[]
  risks: TaxRisk[]
}

export interface TaxAlert {
  type: "info" | "warning" | "critical"
  message: string
  dueDate?: string
}

export interface TaxRisk {
  level: "low" | "medium" | "high" | "critical"
  category: string
  description: string
}
