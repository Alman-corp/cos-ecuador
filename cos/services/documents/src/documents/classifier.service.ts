import { Injectable } from "@nestjs/common"

const DOCUMENT_PATTERNS: Record<string, RegExp[]> = {
  financial_statement: [/balance sheet/i, /income statement/i, /financial statement/i, /estado financiero/i, /balance general/i],
  tax_return: [/tax return/i, /declaraci.n de impuestos/i, /dian/i, /formulario.*(?:\d{3})/i],
  contract: [/contrato/i, /contract agreement/i, /service agreement/i, /acuerdo/i, /t.rminos y condiciones/i],
  invoice: [/factura/i, /invoice/i, /recibo/i, /receipt/i, /bill/i],
  legal: [/poder.*legal/i, /legal.*power/i, /constitution/i, /estatutos/i, /escritura/i, /notarial/i],
  identity: [/(?:c.c|c.d|nit|n.i|rfc|dni|passport|identificaci.n)/i, /c.dula/i, /identity/i],
  report: [/report/i, /informe/i, /analysis/i, /an.lisis/i, /diagn.stico/i, /evaluaci.n/i],
  corporate_document: [/acta/i, /minute/i, /resoluci.n/i, /resolution/i, /certificado/i, /certificate/i],
}

@Injectable()
export class DocumentClassifier {
  classify(fileName: string, extractedText: string): string {
    const content = `${fileName} ${extractedText}`

    const scores: { type: string; score: number }[] = []

    for (const [docType, patterns] of Object.entries(DOCUMENT_PATTERNS)) {
      let score = 0
      for (const pattern of patterns) {
        const matches = content.match(pattern)
        if (matches) {
          score += matches.length * 10
        }
      }
      if (score > 0) scores.push({ type: docType, score })
    }

    scores.sort((a, b) => b.score - a.score)

    if (scores.length === 0) {
      const extension = fileName.split(".").pop()?.toLowerCase()
      if (extension === "pdf") return "document"
      if (["xls", "xlsx"].includes(extension || "")) return "financial_statement"
      if (["doc", "docx"].includes(extension || "")) return "document"
      return "other"
    }

    return scores[0].type
  }

  getConfidence(fileName: string, extractedText: string): { type: string; confidence: number } {
    const content = `${fileName} ${extractedText}`
    let maxScore = 0
    let bestType = "other"

    for (const [docType, patterns] of Object.entries(DOCUMENT_PATTERNS)) {
      let score = 0
      for (const pattern of patterns) {
        const matches = content.match(pattern)
        if (matches) score += matches.length * 10
      }
      if (score > maxScore) {
        maxScore = score
        bestType = docType
      }
    }

    const confidence = Math.min(maxScore / 20, 1)
    return { type: bestType, confidence }
  }
}
