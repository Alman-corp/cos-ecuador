export function numericalAccuracy(answer: string, groundTruthContexts: string[]): number | null {
  const answerNums = extractNumbers(answer)
  if (answerNums.length === 0) return null
  const contextNums = groundTruthContexts.flatMap(extractNumbers)
  if (contextNums.length === 0) return null

  let correct = 0
  for (const an of answerNums) {
    const match = contextNums.some((cn) => {
      const diff = Math.abs(cn.value - an.value)
      const tolerance = Math.max(Math.abs(cn.value) * 0.05, 0.01)
      const unitMatch = an.unit === cn.unit || !an.unit || !cn.unit
      return diff <= tolerance && unitMatch
    })
    if (match) correct++
  }
  return correct / answerNums.length
}

interface NumberWithUnit {
  value: number
  unit: string | null
}

function extractNumbers(text: string): NumberWithUnit[] {
  const results: NumberWithUnit[] = []
  const multipliers: Record<string, number> = { million: 1e6, billions: 1e9, billion: 1e9, "B": 1e9, "M": 1e6, K: 1e3, thousand: 1e3, trillions: 1e12, trillion: 1e12, "T": 1e12 }
  const unitPatterns = /(million|billions|billion|trillions|trillion|B|M|K|thousand|%|\$|USD|EUR|GBP)/gi
  const numRegex = /-?\$?\d+(?:,\d{3})*(?:\.\d+)?%?/g

  let match
  while ((match = numRegex.exec(text)) !== null) {
    let raw = match[0]
    let unit: string | null = null
    if (raw.startsWith("$")) { unit = "USD"; raw = raw.slice(1) }
    if (raw.endsWith("%")) { unit = "%"; raw = raw.slice(0, -1) }
    let value = parseFloat(raw.replace(/,/g, ""))
    if (isNaN(value)) continue
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 20)
    const unitMatch = after.match(unitPatterns)
    if (unitMatch) {
      const mult = multipliers[unitMatch[0].toLowerCase()]
      if (mult) { value *= mult; unit = "USD" }
    }
    results.push({ value, unit })
  }
  return results
}
