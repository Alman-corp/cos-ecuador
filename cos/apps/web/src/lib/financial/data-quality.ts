export interface QualityDetail {
  type: "success" | "warning" | "error"
  message: string
}

export interface DataQualityScore {
  score: number
  level: "excellent" | "good" | "needs_review"
  details: QualityDetail[]
}

export function calculateDataQuality(
  years: number,
  warnings: any[],
  ratios: Record<string, number>,
): DataQualityScore {
  let score = 100
  const details: QualityDetail[] = []

  if (years < 3) {
    const penalty = (3 - years) * 10
    score -= penalty
    details.push({ type: "warning", message: `Solo ${years} años de datos. Recomendamos 3 para mejor precisión.` })
  } else {
    details.push({ type: "success", message: `${years} años completos de datos financieros.` })
  }

  if (warnings.length > 0) {
    const penalty = Math.min(warnings.length * 5, 30)
    score -= penalty
    warnings.forEach((w) => details.push({ type: w.type === "error" ? "error" : "warning", message: w.message }))
  }

  const validRatios = Object.values(ratios).filter((r) => r > -10 && r < 100).length
  const totalRatios = Object.keys(ratios).length
  if (totalRatios > 0) {
    const ratioScore = (validRatios / totalRatios) * 20
    score = Math.min(100, score + ratioScore)
    details.push({ type: validRatios === totalRatios ? "success" : "warning", message: `${validRatios}/${totalRatios} ratios dentro de rangos esperados.` })
  }

  score = Math.max(0, Math.round(score))

  const level = score >= 85 ? "excellent" : score >= 65 ? "good" : "needs_review"

  return { score, level, details }
}
