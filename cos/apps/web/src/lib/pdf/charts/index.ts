

interface BarData {
  label: string
  values: number[]
  colors: string[]
}

interface BarChartProps {
  data: BarData[]
  width?: number
  height?: number
  format?: string
}

export function renderBarChartSvg(props: BarChartProps): string {
  const { data, width = 500, height = 260, format = "number" } = props
  const padding = { top: 20, right: 20, bottom: 50, left: 70 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const allValues = data.flatMap((d) => d.values)
  const maxVal = Math.max(...allValues, 1)
  const bandWidth = chartW / Math.max(data.length, 1) / Math.max(data[0]?.values?.length || 1, 1)
  const groupWidth = bandWidth * (data[0]?.values?.length || 1)

  const formatVal = (v: number): string => {
    if (format === "currency") return `$${(v / 1000000).toFixed(1)}M`
    if (format === "percent") return `${v.toFixed(1)}%`
    return v.toLocaleString()
  }

  const lines: string[] = []
  const gridLines = 5
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i
    const val = maxVal - (maxVal / gridLines) * i
    lines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`)
    lines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#6b7280" font-size="10">${formatVal(val)}</text>`)
  }

  data.forEach((d, i) => {
    const x = padding.left + i * (groupWidth + 20) + (groupWidth - d.values.length * bandWidth) / 2
    d.values.forEach((v, j) => {
      const barH = (v / maxVal) * chartH
      const barY = padding.top + chartH - barH
      lines.push(`<rect x="${x + j * bandWidth + 2}" y="${barY}" width="${bandWidth - 4}" height="${Math.max(barH, 1)}" fill="${d.colors[j] || "#3b82f6"}" rx="2"/>`)
      if (barH > 20) {
        lines.push(`<text x="${x + j * bandWidth + bandWidth / 2}" y="${barY + 14}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${formatVal(v)}</text>`)
      }
    })
    lines.push(`<text x="${x + groupWidth / 2}" y="${height - 10}" text-anchor="middle" fill="#374151" font-size="11">${d.label}</text>`)
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${lines.join("")}</svg>`
}

export function renderPieChartSvg(values: { label: string; value: number; color: string }[]): string {
  const total = values.reduce((s, v) => s + v.value, 0) || 1
  const cx = 150, cy = 150, r = 120
  let currentAngle = -90
  const segments: string[] = []

  values.forEach((v) => {
    const angle = (v.value / total) * 360
    const startRad = (currentAngle * Math.PI) / 180
    const endRad = ((currentAngle + angle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    segments.push(`<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${v.color}" stroke="white" stroke-width="2"/>`)
    const midAngle = ((currentAngle + angle / 2) * Math.PI) / 180
    const labelR = r * 0.6
    const lx = cx + labelR * Math.cos(midAngle)
    const ly = cy + labelR * Math.sin(midAngle)
    if (v.value / total > 0.05) {
      segments.push(`<text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${((v.value / total) * 100).toFixed(0)}%</text>`)
    }
    currentAngle += angle
  })

  const legendY = 310
  const legendItems = values.map((v, i) =>
    `<rect x="40" y="${legendY + i * 22}" width="12" height="12" fill="${v.color}" rx="2"/><text x="58" y="${legendY + i * 22 + 10}" fill="#374151" font-size="11">${v.label}</text><text x="400" y="${legendY + i * 22 + 10}" text-anchor="end" fill="#6b7280" font-size="11">$${(v.value / 1000000).toFixed(1)}M</text>`,
  )

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${legendY + values.length * 22 + 20}" viewBox="0 0 500 ${legendY + values.length * 22 + 20}">${segments.join("")}${legendItems.join("")}</svg>`
}

export function renderRadarChartSvg(
  dimensions: { label: string; value: number; max: number }[],
  companyColor = "#2563eb",
  benchmarkColor = "#94a3b8",
): string {
  const cx = 250, cy = 220, r = 150
  const n = dimensions.length
  const points: string[] = []
  const benchPoints: string[] = []
  const labels: string[] = []

  dimensions.forEach((d, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const ratio = Math.min(d.value / d.max, 1)
    const benchRatio = Math.min(0.7, 1)
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    const dx = cx + r * ratio * Math.cos(angle)
    const dy = cy + r * ratio * Math.sin(angle)
    const bx = cx + r * benchRatio * Math.cos(angle)
    const by = cy + r * benchRatio * Math.sin(angle)

    points.push(`${dx},${dy}`)
    benchPoints.push(`${bx},${by}`)
    const lx = cx + (r + 30) * Math.cos(angle)
    const ly = cy + (r + 30) * Math.sin(angle)
    labels.push(`<text x="${lx}" y="${ly}" text-anchor="middle" fill="#374151" font-size="11" dominant-baseline="middle">${d.label}</text>`)
  })

  const grid = [0.25, 0.5, 0.75, 1].map((pct) => {
    const pts = dimensions.map((_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2
      const x = cx + r * pct * Math.cos(angle)
      const y = cy + r * pct * Math.sin(angle)
      return `${x},${y}`
    })
    return `<polygon points="${pts.join(" ")}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="440" viewBox="0 0 500 440">
    ${grid.join("")}
    <polygon points="${benchPoints.join(" ")}" fill="${benchmarkColor}33" stroke="${benchmarkColor}" stroke-width="2" stroke-dasharray="4,4"/>
    <polygon points="${points.join(" ")}" fill="${companyColor}33" stroke="${companyColor}" stroke-width="2"/>
    ${labels.join("")}
    <text x="490" y="420" text-anchor="end" fill="${benchmarkColor}" font-size="9">Benchmark</text>
    <line x1="460" y1="418" x2="480" y2="418" stroke="${benchmarkColor}" stroke-width="2" stroke-dasharray="4,4"/>
    <text x="490" y="435" text-anchor="end" fill="${companyColor}" font-size="9">Empresa</text>
    <line x1="460" y1="433" x2="480" y2="433" stroke="${companyColor}" stroke-width="2"/>
  </svg>`
}
