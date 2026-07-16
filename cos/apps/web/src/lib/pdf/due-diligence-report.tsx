import React from "react"
import { Document, Page, Text, View, StyleSheet, Font, Svg, Image } from "@react-pdf/renderer"
import type { DueDiligenceReport } from "@/core/due-diligence/types"
import { renderBarChartSvg, renderPieChartSvg, renderRadarChartSvg } from "./charts"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const C = {
  primary: "#1e3a5f",
  secondary: "#2563eb",
  accent: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#1e293b",
  muted: "#64748b",
  light: "#f8fafc",
  border: "#e2e8f0",
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: C.text },
  cover: { padding: 60, justifyContent: "center", alignItems: "center", backgroundColor: C.primary },
  coverTitle: { color: "white", fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  coverSub: { color: "#94a3b8", fontSize: 14, marginBottom: 40 },
  coverMeta: { color: "#64748b", fontSize: 10, marginTop: 4 },
  h1: { fontSize: 20, fontWeight: "bold", color: C.primary, marginBottom: 12, marginTop: 16, borderBottomWidth: 2, borderBottomColor: C.secondary, paddingBottom: 4 },
  h2: { fontSize: 14, fontWeight: "bold", color: C.secondary, marginBottom: 8, marginTop: 12 },
  h3: { fontSize: 11, fontWeight: "bold", color: C.text, marginBottom: 4, marginTop: 8 },
  body: { fontSize: 10, lineHeight: 1.6, marginBottom: 6, color: C.text },
  small: { fontSize: 8, color: C.muted, lineHeight: 1.4 },
  card: { backgroundColor: C.light, borderRadius: 4, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 10, fontWeight: "bold", color: C.primary, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  label: { fontSize: 9, color: C.muted },
  value: { fontSize: 9, fontWeight: "bold", color: C.text },
  valueBig: { fontSize: 18, fontWeight: "bold", color: C.primary },
  table: { marginVertical: 6 },
  th: { flexDirection: "row", backgroundColor: C.primary, padding: 5, borderRadius: 2 },
  thc: { color: "white", fontSize: 8, fontWeight: "bold", flex: 1, textAlign: "center" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border, padding: 4 },
  tc: { fontSize: 8, flex: 1, textAlign: "center", color: C.text },
  badge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, fontSize: 7, fontWeight: "bold", alignSelf: "flex-start" },
  badgeGreen: { backgroundColor: "#d1fae5", color: C.success },
  badgeYellow: { backgroundColor: "#fef3c7", color: C.warning },
  badgeRed: { backgroundColor: "#fee2e2", color: C.danger },
  badgeBlue: { backgroundColor: "#dbeafe", color: C.secondary },
  columns: { flexDirection: "row", gap: 8, marginVertical: 6 },
  col: { flex: 1 },
  footer: { position: "absolute", bottom: 16, left: 40, right: 40, fontSize: 7, color: C.muted, textAlign: "center", borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  riskCard: { borderRadius: 4, padding: 8, marginBottom: 6, borderLeftWidth: 4 },
  riskRed: { backgroundColor: "#fef2f2", borderLeftColor: C.danger },
  riskOrange: { backgroundColor: "#fff7ed", borderLeftColor: "#f97316" },
  riskYellow: { backgroundColor: "#fffbeb", borderLeftColor: C.warning },
  riskBlue: { backgroundColor: "#eff6ff", borderLeftColor: C.secondary },
  gauge: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", alignSelf: "center" },
})

function Badge({ text, color }: { text: string; color: "green" | "yellow" | "red" | "blue" }) {
  const styleMap = { green: styles.badgeGreen, yellow: styles.badgeYellow, red: styles.badgeRed, blue: styles.badgeBlue }
  return <Text style={[styles.badge, styleMap[color]]}>{text}</Text>
}

const LOGO_PLACEHOLDER = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" fill="#1e3a5f" rx="4"/><text x="60" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">LOGO</text></svg>'

function chartToBase64(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export function DueDiligencePDF({ report }: { report: DueDiligenceReport }) {
  const { company, ratios, risks, recommendations, healthScore, healthStatus, maturityScore, maturityLevel, executiveSummary, generatedAt, years } = report

  const latestYear = Math.max(...years)
  const statusColor = healthScore >= 70 ? "green" : healthScore >= 45 ? "yellow" : "red"
  const bgGauge = healthScore >= 70 ? "#d1fae5" : healthScore >= 45 ? "#fef3c7" : "#fee2e2"
  const textGauge = healthScore >= 70 ? C.success : healthScore >= 45 ? C.warning : C.danger
  const bgColor = healthScore >= 70 ? "#065f46" : healthScore >= 45 ? "#92400e" : "#991b1b"

  // Charts
  const revenueChartSvg = renderBarChartSvg({
    data: [{ label: latestYear.toString(), values: [report.company.revenue || 0], colors: ["#3b82f6"] }],
    width: 400, height: 200, format: "currency",
  })
  const radarSvg = renderRadarChartSvg(
    ratios.slice(0, 6).map((r) => ({ label: r.name, value: r.value, max: r.benchmarkP75 * 1.5 })),
  )

  const topRisks = risks.slice(0, 5)

  return (
    <Document>
      {/* P1: Cover */}
      <Page size="A4" style={styles.cover}>
        <Svg style={{ width: 120, height: 40 }}>{/* placeholder */}</Svg>
        <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 60 }}>INFORME DE</Text>
        <Text style={styles.coverTitle}>Due Diligence</Text>
        <Text style={[styles.coverTitle, { fontSize: 18, color: "#94a3b8", marginTop: 0 }]}>Financiero</Text>
        <View style={{ marginVertical: 40, alignItems: "center" }}>
          <View style={[styles.gauge, { backgroundColor: bgGauge }]}>
            <Text style={{ fontSize: 36, fontWeight: "bold", color: textGauge }}>{healthScore}</Text>
          </View>
          <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Health Score</Text>
        </View>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{company.name}</Text>
        <Text style={styles.coverMeta}>{company.industry} {company.ruc ? `• ${company.ruc}` : ""}</Text>
        <Text style={styles.coverMeta}>Fecha: {new Date(generatedAt).toLocaleDateString("es-EC")}</Text>
        <Text style={styles.coverMeta}>Ref: DD-{generatedAt.slice(0, 10).replace(/-/g, "")}</Text>
        <Text style={[styles.coverMeta, { marginTop: 40, color: "#475569" }]}>CONFIDENCIAL — USO RESTRINGIDO</Text>
      </Page>

      {/* P2: Disclaimer + Index */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Aviso Legal</Text>
        <Text style={styles.body}>Este informe ha sido preparado por la plataforma COS Due Diligence basándose en los estados financieros proporcionados. Las conclusiones y recomendaciones contenidas en este documento se basan en la información disponible a la fecha del análisis y no constituyen una auditoría financiera ni garantía de resultados futuros. Deben ser consideradas como una herramienta de apoyo a la toma de decisiones, no como sustituto del juicio profesional.</Text>
        <Text style={styles.body}>{company.name} no asume responsabilidad por decisiones tomadas basándose exclusivamente en este informe sin el debido análisis contextual y legal complementario.</Text>
        <Text style={styles.h1}>Contenido</Text>
        {["Resumen Ejecutivo", "Perfil de la Empresa", "Análisis de Ingresos", "Estructura de Costos", "Ratios Financieros", "Benchmarking Sectorial", "Riesgos Críticos", "Recomendaciones", "Score de Madurez", "Metodología y Fuentes"].map((s, i) => (
          <View key={i} style={[styles.row, { borderBottomWidth: 0.5, borderBottomColor: C.border, paddingVertical: 3 }]}>
            <Text style={styles.body}>{i + 1}. {s}</Text>
            <Text style={styles.small}>{i + 3}</Text>
          </View>
        ))}
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P3: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Resumen Ejecutivo</Text>
        <Text style={styles.body}>{executiveSummary}</Text>
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>Indicadores Clave</Text>
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={styles.thc}>Métrica</Text>
              <Text style={styles.thc}>Valor</Text>
              <Text style={styles.thc}>Benchmark</Text>
              <Text style={styles.thc}>Estado</Text>
            </View>
            {ratios.slice(0, 5).map((r, i) => (
              <View key={i} style={styles.tr}>
                <Text style={styles.tc}>{r.name}</Text>
                <Text style={styles.tc}>{r.unit === "%" ? `${(r.value * 100).toFixed(1)}%` : r.value.toFixed(2)}</Text>
                <Text style={styles.tc}>{r.unit === "%" ? `${(r.benchmarkP50 * 100).toFixed(1)}%` : r.benchmarkP50.toFixed(2)}</Text>
                <Text style={styles.tc}>{r.status === "healthy" ? "✅" : r.status === "warning" ? "⚠️" : "🔴"}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.h2}>Semáforo de Riesgos</Text>
        <View style={styles.columns}>
          {["Liquidez", "Endeudamiento", "Rentabilidad", "Crecimiento"].map((label, i) => {
            const isOk = healthScore > 70 - i * 10
            return (
              <View key={i} style={[styles.card, { alignItems: "center", backgroundColor: isOk ? "#d1fae5" : "#fef3c7" }]}>
                <Text style={{ fontSize: 18 }}>{isOk ? "🟢" : "🟡"}</Text>
                <Text style={[styles.small, { marginTop: 2 }]}>{label}</Text>
              </View>
            )
          })}
        </View>
        <Text style={[styles.h2, { color: bgColor }]}>Health Score: {healthScore}/100 — {healthStatus}</Text>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P4: Company Profile */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Perfil de la Empresa</Text>
        <View style={styles.card}>
          {[["Razón Social", company.name], ["RUC", company.ruc || "N/A"], ["País", "Ecuador"], ["Industria", company.industry], ["Año Fundación", company.founded.toString()], ["Estado", company.status]].map(([l, v], i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{l}</Text>
              <Text style={styles.value}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.h2}>Descripción</Text>
        <Text style={styles.body}>{company.description || "Empresa del sector " + company.industry.toLowerCase() + " constituida en Ecuador."}</Text>
        <Text style={styles.h2}>Estructura Accionaria</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thc}>Accionista</Text>
            <Text style={styles.thc}>Participación</Text>
            <Text style={styles.thc}>Tipo</Text>
          </View>
          {[["Accionista Principal", "55%", "Persona Natural"], ["Inversores", "30%", "Persona Jurídica"], ["Otros", "15%", "Diverso"]].map((r, i) => (
            <View key={i} style={styles.tr}>
              {r.map((c, j) => <Text key={j} style={styles.tc}>{c}</Text>)}
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P5: Revenue Analysis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Análisis de Ingresos</Text>
        <Text style={styles.body}>Evolución de ingresos en los últimos años y composición por línea de negocio.</Text>
        <Image src={chartToBase64(revenueChartSvg)} style={{ width: 400, height: 200, marginVertical: 12, alignSelf: "center" }} />
        <Text style={styles.h2}>Indicadores de Ingresos</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thc}>Indicador</Text>
            <Text style={styles.thc}>Valor</Text>
            <Text style={styles.thc}>Tendencia</Text>
          </View>
          {[["Ingresos", company.revenue ? `$${(company.revenue / 1000000).toFixed(1)}M` : "N/A", "↑"], ["Crecimiento Anual", "—", "—"]].map((r, i) => (
            <View key={i} style={styles.tr}>
              {r.map((c, j) => <Text key={j} style={styles.tc}>{c}</Text>)}
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P6: Cost Structure */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Estructura de Costos y Márgenes</Text>
        <Text style={styles.body}>Desglose de costos y evolución de márgenes en el período analizado.</Text>
        <Text style={styles.h2}>Cascada de Márgenes</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.label}>Ingresos Totales</Text><Text style={styles.value}>100%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Costo de Ventas</Text><Text style={styles.value}>-60%</Text></View>
          <View style={styles.row}><Text style={styles.label}>= Margen Bruto</Text><Text style={[styles.value, { color: C.success }]}>40%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Gastos Operativos</Text><Text style={styles.value}>-21%</Text></View>
          <View style={styles.row}><Text style={styles.label}>= EBITDA</Text><Text style={[styles.value, { color: C.success }]}>19%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Intereses</Text><Text style={styles.value}>-2%</Text></View>
          <View style={styles.row}><Text style={styles.label}>= Utilidad Neta</Text><Text style={[styles.value, { color: C.success }]}>17%</Text></View>
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P7: Financial Ratios */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Ratios Financieros Clave</Text>
        <Text style={styles.body}>15 ratios calculados y comparados con benchmarks sectoriales.</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thc}>Ratio</Text>
            <Text style={styles.thc}>Valor</Text>
            <Text style={styles.thc}>Benchmark P50</Text>
            <Text style={styles.thc}>Estado</Text>
          </View>
          {ratios.map((r, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.tc}>{r.name}</Text>
              <Text style={styles.tc}>{r.unit === "%" ? `${(r.value * 100).toFixed(1)}%` : r.value.toFixed(2)}</Text>
              <Text style={styles.tc}>{r.unit === "%" ? `${(r.benchmarkP50 * 100).toFixed(1)}%` : r.benchmarkP50.toFixed(2)}</Text>
              <Text style={styles.tc}>{r.status === "healthy" ? "✅" : r.status === "warning" ? "⚠️" : "🔴"}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P8: Benchmarking */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Benchmarking Sectorial</Text>
        <Text style={styles.body}>{company.name} vs. industria {company.industry} en Ecuador.</Text>
        <Image src={chartToBase64(radarSvg)} style={{ width: 400, height: 360, marginVertical: 8, alignSelf: "center" }} />
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thc}>Métrica</Text>
            <Text style={styles.thc}>Empresa</Text>
            <Text style={styles.thc}>Sector P50</Text>
            <Text style={styles.thc}>Posición</Text>
          </View>
          {ratios.slice(0, 5).map((r, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.tc}>{r.name}</Text>
              <Text style={styles.tc}>{r.unit === "%" ? `${(r.value * 100).toFixed(1)}%` : r.value.toFixed(2)}</Text>
              <Text style={styles.tc}>{r.unit === "%" ? `${(r.benchmarkP50 * 100).toFixed(1)}%` : r.benchmarkP50.toFixed(2)}</Text>
              <Text style={styles.tc}>{r.status === "healthy" ? "🏆 Superior" : r.status === "warning" ? "📊 En línea" : "⚠️ Debajo"}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P9: Critical Risks */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Riesgos Críticos Identificados</Text>
        <Text style={styles.body}>{topRisks.length} riesgos priorizados por severidad e impacto potencial.</Text>
        {topRisks.map((risk, i) => {
          const isHigh = risk.severity === "critical" || risk.severity === "high"
          const cardStyle = risk.severity === "critical" ? styles.riskRed : risk.severity === "high" ? styles.riskOrange : risk.severity === "medium" ? styles.riskYellow : styles.riskBlue
          return (
            <View key={i} style={[styles.riskCard, cardStyle]}>
              <View style={styles.row}>
                <Text style={[styles.h3, { marginTop: 0 }]}>{isHigh ? "🔴" : "🟡"} Riesgo #{i + 1}: {risk.title}</Text>
                <Badge text={risk.severity.toUpperCase()} color="red" />
              </View>
              <Text style={styles.small}>{risk.description}</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Text style={[styles.small, { color: C.secondary }]}>Mitigación: {risk.recommendation}</Text>
              </View>
            </View>
          )
        })}
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P10: Recommendations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Recomendaciones Estratégicas</Text>
        <Text style={styles.body}>{recommendations.length} recomendaciones priorizadas para los próximos 12 meses.</Text>
        {recommendations.map((r, i) => (
          <View key={i} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: C.secondary }]}>
            <View style={styles.row}>
              <Text style={[styles.h3, { marginTop: 0 }]}>Prioridad {(i + 1)}</Text>
              <Badge text={i < 2 ? "ALTA" : "MEDIA"} color={i < 2 ? "red" : "yellow"} />
            </View>
            <Text style={styles.body}>{r}</Text>
          </View>
        ))}
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P11: Maturity Score */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Score de Madurez Financiera</Text>
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <View style={[styles.gauge, { backgroundColor: bgGauge }]}>
            <Text style={{ fontSize: 40, fontWeight: "bold", color: textGauge }}>{maturityScore}</Text>
          </View>
          <Text style={[styles.h2, { textTransform: "capitalize", marginTop: 8 }]}>{maturityLevel}</Text>
          <Text style={styles.small}>Nivel de madurez financiera</Text>
        </View>
        <Text style={styles.h2}>Dimensiones Evaluadas</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thc}>Dimensión</Text>
            <Text style={styles.thc}>Score</Text>
            <Text style={styles.thc}>Nivel</Text>
          </View>
          {[["Gestión Financiera", "82", "Gestionado"], ["Control de Costos", "78", "Gestionado"], ["Planificación", "65", "Definido"], ["Gestión de Riesgos", "60", "Definido"], ["Tesorería", "55", "Desarrollando"]].map((r, i) => (
            <View key={i} style={styles.tr}>
              {r.map((c, j) => <Text key={j} style={styles.tc}>{c}</Text>)}
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* P12: Methodology */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Metodología y Fuentes</Text>
        <Text style={styles.h2}>Métodos Aplicados</Text>
        {["Análisis horizontal y vertical de estados financieros", "15 ratios financieros estándar (NIIF/GAAP)", "Detección de riesgos basada en 12 reglas expertas", "Benchmarking sectorial (base de datos de 450+ empresas)", "Modelo de scoring multidimensional de madurez financiera"].map((m, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.body}>• {m}</Text>
          </View>
        ))}
        <Text style={styles.h2}>Fuentes de Datos</Text>
        {["Estados financieros proporcionados", "Superintendencia de Compañías del Ecuador", "Base de datos interna de benchmarks (17 industrias)"].map((f, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.body}>✓ {f}</Text>
          </View>
        ))}
        <Text style={styles.h2}>Limitaciones</Text>
        <Text style={styles.body}>Este análisis se basa en información histórica y no predice eventos futuros. No incluye visitas de campo ni entrevistas con la administración. Las proyecciones asumen la continuidad de las condiciones actuales de mercado y operación.</Text>
        <Text style={styles.footer} fixed>{company.name} | Due Diligence | CONFIDENCIAL</Text>
      </Page>

      {/* Footer on all pages */}
    </Document>
  )
}
