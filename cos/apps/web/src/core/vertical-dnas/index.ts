import { financialDNA } from "./financial-dna"
import { accountingDNA } from "./accounting-dna"
import { legalDNA } from "./legal-dna"
import { investmentDNA } from "./investment-dna"
import { consultingDna } from "@/core/consulting-dna"

const consultingDNAWrapper = {
  name: "Consulting Intelligence DNA",
  version: consultingDna.getDnaSummary().version,
  lastUpdated: consultingDna.getDnaSummary().lastUpdated,
  description: "12 reglas de evaluación, 14 umbrales de riesgo, 15 patrones de recomendación, 5 escalas de madurez, 14 entradas de knowledge base con normativa ecuatoriana.",
  modules: consultingDna.getDnaSummary().categories,
  rules: consultingDna.getRules,
  riskThresholds: consultingDna.getThresholds,
  recommendationPatterns: consultingDna.getPatterns,
  maturityScales: consultingDna.getScales,
  knowledgeBase: consultingDna.getKnowledge,
}

export const verticalDNAs = {
  consulting: consultingDNAWrapper,
  financial: financialDNA,
  accounting: accountingDNA,
  legal: legalDNA,
  investment: investmentDNA,
}

export function getVerticalDNA(packId: string) {
  const map: Record<string, any> = {
    "vip-consulting": consultingDNAWrapper,
    "vip-financial": financialDNA,
    "vip-accounting": accountingDNA,
    "vip-legal": legalDNA,
    "vip-investment": investmentDNA,
  }
  return map[packId] || null
}

export function getAllVerticalDNASummary() {
  return Object.entries(verticalDNAs).map(([key, dna]) => ({
    id: key,
    name: dna.name,
    version: dna.version,
    description: dna.description,
  }))
}
