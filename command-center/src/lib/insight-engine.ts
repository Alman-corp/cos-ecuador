export interface MetricInput {
  label: string
  current: number
  previous: number
  higherIsBetter: boolean
  history?: number[]
}

export interface Finding {
  type: "insight" | "alert" | "positive" | "negative" | "recommendation"
  title: string
  description: string
  severity?: "low" | "medium" | "high" | "critical"
  metric?: string
  value?: string
}

export interface DriverResult {
  metric: string
  absoluteImpact: number
  percentageImpact: number
  direction: "up" | "down"
  description: string
}

export interface InsightReport {
  findings: Finding[]
  drivers: DriverResult[]
  zScores: { metric: string; zScore: number; anomalous: boolean; direction: "high" | "low" | "normal" }[]
}

function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0
  return (value - mean) / std
}

function computeMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function computeStd(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
}

export function computeZScores(metrics: MetricInput[]): InsightReport["zScores"] {
  return metrics.map((m) => {
    if (!m.history || m.history.length < 3) {
      return { metric: m.label, zScore: 0, anomalous: false, direction: "normal" as const }
    }
    const mean = computeMean(m.history)
    const std = computeStd(m.history, mean)
    const z = zScore(m.current, mean, std)
    const anomalous = Math.abs(z) > 1.5
    let direction: "high" | "low" | "normal" = "normal"
    if (z > 1.5) direction = "high"
    else if (z < -1.5) direction = "low"
    return { metric: m.label, zScore: z, anomalous, direction }
  })
}

export function detectDrivers(
  baseMetric: string,
  components: { label: string; current: number; previous: number; higherIsBetter: boolean }[],
  baseCurrent: number,
  basePrevious: number
): DriverResult[] {
  const baseChange = baseCurrent - basePrevious
  if (Math.abs(baseChange) < 1) return []

  const drivers: DriverResult[] = components.map((c) => {
    const change = c.current - c.previous
    const impactContrib = baseChange !== 0 ? (change / Math.abs(baseChange)) * 100 : 0
    return {
      metric: c.label,
      absoluteImpact: change,
      percentageImpact: impactContrib,
      direction: (change >= 0 ? "up" : "down") as "up" | "down",
      description: `${c.label} contribuyó ${impactContrib >= 0 ? "+" : ""}${impactContrib.toFixed(0)}% del cambio en EBITDA`,
    }
  })

  return drivers.sort((a, b) => Math.abs(b.percentageImpact) - Math.abs(a.percentageImpact))
}

export function generateFindings(metrics: MetricInput[], zScores: InsightReport["zScores"]): Finding[] {
  const findings: Finding[] = []

  for (const m of metrics) {
    const pctChange = m.previous !== 0 ? ((m.current - m.previous) / m.previous) * 100 : 0
    const absChange = m.current - m.previous
    const zResult = zScores.find((z) => z.metric === m.label)
    const isAnomalous = zResult?.anomalous ?? false
    const isPositive = m.higherIsBetter ? pctChange > 0 : pctChange < 0
    const magnitude = Math.abs(pctChange)

    if (magnitude > 20) {
      findings.push({
        type: isPositive ? "positive" : "alert",
        title: `${m.label} ${isPositive ? "mejora" : "deterioro"} significativo`,
        description: `${m.label} ${isPositive ? "aumentó" : "cayó"} ${fmtPct(pctChange)} a ${fmt(m.current)} (vs ${fmt(m.previous)}). Esta magnitud requiere atención inmediata.`,
        severity: magnitude > 30 ? "critical" : "high",
        metric: m.label,
        value: fmt(m.current),
      })
    } else if (magnitude > 10) {
      findings.push({
        type: isPositive ? "insight" : "negative",
        title: `${m.label}: variación relevante`,
        description: `${m.label} registró ${fmtPct(pctChange)} (${fmt(absChange)}), pasando de ${fmt(m.previous)} a ${fmt(m.current)}.`,
        severity: magnitude > 15 ? "high" : "medium",
        metric: m.label,
        value: fmt(m.current),
      })
    } else if (magnitude > 3) {
      findings.push({
        type: "insight",
        title: `${m.label}: ${isPositive ? "leve mejora" : "leve contracción"}`,
        description: `${m.label} varió ${fmtPct(pctChange)} a ${fmt(m.current)}. ${isPositive ? "Tendencia favorable." : "Monitorear evolución."}`,
        severity: "low",
        metric: m.label,
        value: fmt(m.current),
      })
    }

    if (isAnomalous && zResult) {
      findings.push({
        type: "alert",
        title: `Anomalía detectada en ${m.label}`,
        description: `${m.label} tiene un z-score de ${zResult.zScore.toFixed(2)} (${zResult.direction === "high" ? "significativamente alto" : "significativamente bajo"} vs su histórico). Esto puede indicar un cambio estructural o error en datos.`,
        severity: "high",
        metric: m.label,
      })
    }
  }

  return findings
}

export function generateAlert(metrics: MetricInput[], findings: Finding[]): Finding | null {
  const criticalAlerts = findings.filter((f) => f.severity === "critical" || f.type === "alert")
  if (criticalAlerts.length > 0) {
    const top = criticalAlerts[0]
    return {
      type: "alert",
      title: `🔴 Alerta prioritaria: ${top.metric ?? top.title}`,
      description: top.description,
      severity: "critical",
      metric: top.metric,
    }
  }

  const worstMetric = metrics
    .filter((m) => !m.higherIsBetter ? m.current > m.previous : m.current < m.previous)
    .sort((a, b) => {
      const pctA = a.previous !== 0 ? (a.current - a.previous) / a.previous : 0
      const pctB = b.previous !== 0 ? (b.current - b.previous) / b.previous : 0
      return Math.abs(pctA) - Math.abs(pctB)
    })
    .pop()

  if (worstMetric) {
    const pct = worstMetric.previous !== 0 ? ((worstMetric.current - worstMetric.previous) / worstMetric.previous) * 100 : 0
    return {
      type: "alert",
      title: `⚠ Atención: ${worstMetric.label} en ${pct > 0 ? "aumento" : "descenso"}`,
      description: `${worstMetric.label} pasó de ${fmt(worstMetric.previous)} a ${fmt(worstMetric.current)} (${fmtPct(pct)}). ${worstMetric.higherIsBetter ? "Requiere revisión de causas." : "Aunque es positivo, verificar sostenibilidad."}`,
      severity: "high",
      metric: worstMetric.label,
      value: fmt(worstMetric.current),
    }
  }

  return null
}

export function generateRecommendation(metrics: MetricInput[], findings: Finding[], drivers: DriverResult[]): Finding {
  const worst = [...metrics]
    .filter((m) => (m.higherIsBetter ? m.current < m.previous : m.current > m.previous))
    .sort((a, b) => {
      const pctA = a.previous !== 0 ? Math.abs((a.current - a.previous) / a.previous) : 0
      const pctB = b.previous !== 0 ? Math.abs((b.current - b.previous) / b.previous) : 0
      return pctB - pctA
    })[0]

  const best = [...metrics]
    .filter((m) => (m.higherIsBetter ? m.current > m.previous : m.current < m.previous))
    .sort((a, b) => {
      const pctA = a.previous !== 0 ? Math.abs((a.current - a.previous) / a.previous) : 0
      const pctB = b.previous !== 0 ? Math.abs((b.current - b.previous) / b.previous) : 0
      return pctB - pctA
    })[0]

  const parts: string[] = []

  if (worst) {
    const pct = worst.previous !== 0 ? ((worst.current - worst.previous) / worst.previous) * 100 : 0
    parts.push(`Priorizar ${worst.label} (${fmtPct(pct)}) — investigar causas raíz y definir plan de acción correctivo`)
  }

  if (best) {
    const pct = best.previous !== 0 ? ((best.current - best.previous) / best.previous) * 100 : 0
    parts.push(`Apalancar ${best.label} (${fmtPct(pct)}) — identificar qué lo impulsó y replicar en otras áreas`)
  }

  if (drivers.length > 0) {
    const topDriver = drivers[0]
    parts.push(`Atención en ${topDriver.metric} — es el factor que más impacta los resultados (${topDriver.percentageImpact.toFixed(0)}% del cambio total)`)
  }

  if (parts.length === 0) {
    parts.push("Monitorear KPIs semanalmente con alertas automáticas para detectar desviaciones tempranas")
  }

  const criticalFindings = findings.filter((f) => f.severity === "critical")
  if (criticalFindings.length > 0) {
    parts.unshift(`⚠ ${criticalFindings.length} hallazgo(s) crítico(s) detectado(s) — requieren acción inmediata`)
  }

  return {
    type: "recommendation",
    title: "Recomendación Estratégica",
    description: parts.join(". ") + ".",
    severity: "high",
  }
}

export function generateInsightReport(metrics: MetricInput[], companyName: string): InsightReport {
  const zScores = computeZScores(metrics)
  const findings = generateFindings(metrics, zScores)
  const alert = generateAlert(metrics, findings)

  const revenueMetric = metrics.find((m) => m.label.toLowerCase().includes("revenue") || m.label.toLowerCase().includes("ingres"))
  const ebitdaMetric = metrics.find((m) => m.label.toLowerCase().includes("ebitda"))
  const opexMetric = metrics.find((m) => m.label.toLowerCase().includes("opex"))
  const netIncomeMetric = metrics.find((m) => m.label.toLowerCase().includes("net income") || m.label.toLowerCase().includes("utilidad neta"))

  const driverComponents = [
    { label: "Revenue", higherIsBetter: true, current: revenueMetric?.current ?? 0, previous: revenueMetric?.previous ?? 0 },
    { label: "OPEX", higherIsBetter: false, current: -(opexMetric?.current ?? 0), previous: -(opexMetric?.previous ?? 0) },
    { label: "Net Income", higherIsBetter: true, current: netIncomeMetric?.current ?? 0, previous: netIncomeMetric?.previous ?? 0 },
  ]

  const drivers = ebitdaMetric
    ? detectDrivers("EBITDA", driverComponents, ebitdaMetric.current, ebitdaMetric.previous)
    : []

  const finalFindings = [...findings]
  if (alert) finalFindings.unshift(alert)
  finalFindings.push(generateRecommendation(metrics, finalFindings, drivers))

  return { findings: finalFindings, drivers, zScores }
}
