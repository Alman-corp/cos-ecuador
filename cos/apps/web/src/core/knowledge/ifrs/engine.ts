import { ifrsConcepts, ifrsConceptMap, getTree, getChildren } from "./concepts"
import { ifrsValidator, validationRules, type ValidationReport } from "./validator"
import type { IFRSConcept } from "./concepts"

export interface IFRSKnowledgeResponse {
  totalConcepts: number
  totalStatements: number
  concept?: IFRSConcept
  children?: IFRSConcept[]
  parents?: IFRSConcept[]
  validation?: ValidationReport
  ratios?: Record<string, number>
  contextSummary: string
}

class IFRSKnowledgeEngine {
  getSummary(): string {
    const balance = getTree("ifrs-full:Assets").length + getTree("ifrs-full:Liabilities").length + getTree("ifrs-full:Equity").length
    const income = getTree("ifrs-full:ProfitLoss").length
    const cashflow = ifrsConcepts.filter((c) => c.code.includes("CashFlow") || c.code.includes("NetCash")).length
    return `## IFRS/XBRL Taxonomy Knowledge Engine\n\n` +
      `**${ifrsConcepts.length}** conceptos financieros oficiales IFRS\n` +
      `- Balance General: **${balance}** conceptos (Activos, Pasivos, Patrimonio)\n` +
      `- Estado de Resultados: **${income}** conceptos\n` +
      `- Flujo de Efectivo: **${cashflow}** conceptos\n` +
      `- **${validationRules.length}** reglas de validación automática\n` +
      `- Referencias: NIC 1, NIC 2, NIC 7, NIC 12, NIC 16, NIC 28, NIC 33, NIC 37, NIC 38, NIC 40, NIIF 3, NIIF 5, NIIF 7, NIIF 9, NIIF 10, NIIF 15\n\n` +
      `12 razones financieras calculables automáticamente desde conceptos IFRS`
  }

  evaluate(conceptCode: string): IFRSKnowledgeResponse {
    const concept = ifrsConceptMap.get(conceptCode)
    const children = concept ? getChildren(conceptCode) : []
    const parent = concept?.parentCode ? ifrsConceptMap.get(concept.parentCode) : undefined

    return {
      totalConcepts: ifrsConcepts.length,
      totalStatements: 3,
      concept,
      children: children.length > 0 ? children : undefined,
      parents: parent ? [parent] : undefined,
      contextSummary: concept
        ? `Concepto IFRS: ${concept.name} (${concept.code})\n` +
          `Definición: ${concept.definition}\n` +
          `Tipo: ${concept.type} | Balance: ${concept.balance} | Período: ${concept.periodType}\n` +
          `Referencias: ${concept.references.join(", ")}\n` +
          `${children.length > 0 ? `Hijos: ${children.map((c) => c.name).join(", ")}` : ""}`
        : `Concepto ${conceptCode} no encontrado en taxonomía IFRS`,
    }
  }

  validateFinancialStatement(data: Record<string, number>, companyId: string, period: string): ValidationReport {
    return ifrsValidator.validate(companyId, data, period)
  }

  computeRatios(data: Record<string, number>): Record<string, number> {
    return ifrsValidator.computeRatios(data)
  }

  search(query: string): IFRSConcept[] {
    return ifrsValidator.searchConcepts(query)
  }
}

export const ifrsEngine = new IFRSKnowledgeEngine()
