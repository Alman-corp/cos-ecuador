import React from "react"
import {
  Document, Page, Text, View, StyleSheet, Font, Image, Svg, Circle,
} from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const colors = {
  primary: "#1a237e",
  secondary: "#283593",
  accent: "#0d47a1",
  success: "#2e7d32",
  warning: "#f57f17",
  danger: "#c62828",
  text: "#1a1a2e",
  muted: "#666",
  light: "#f5f5f5",
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: colors.text },
  // Cover
  coverPage: { padding: 60, justifyContent: "center", alignItems: "center", backgroundColor: colors.primary },
  coverTitle: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  coverSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginBottom: 40 },
  coverMeta: { color: "rgba(255,255,255,0.6)", fontSize: 10, textAlign: "center", marginTop: 8 },

  // Section headers
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.primary, marginBottom: 12, marginTop: 20, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 4 },
  subsectionTitle: { fontSize: 12, fontWeight: "bold", color: colors.secondary, marginBottom: 8, marginTop: 12 },

  // Text content
  bodyText: { fontSize: 10, lineHeight: 1.6, marginBottom: 8, color: colors.text },
  boldText: { fontWeight: "bold" },

  // Score gauge
  gaugeContainer: { alignItems: "center", marginVertical: 20 },
  gaugeValue: { fontSize: 48, fontWeight: "bold", color: colors.primary, marginTop: 8 },
  gaugeLabel: { fontSize: 12, color: colors.muted },

  // Cards / boxes
  card: { backgroundColor: colors.light, borderRadius: 4, padding: 12, marginBottom: 8 },
  cardTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 4, color: colors.primary },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  cardLabel: { fontSize: 9, color: colors.muted },
  cardValue: { fontSize: 9, fontWeight: "bold" },

  // Tables
  table: { marginVertical: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: colors.primary, padding: 6, borderRadius: 2 },
  tableHeaderCell: { color: "white", fontSize: 9, fontWeight: "bold", flex: 1 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", padding: 5 },
  tableCell: { fontSize: 9, flex: 1, color: colors.text },

  // Status badges
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 8, fontWeight: "bold", alignSelf: "flex-start", marginTop: 4 },
  badgeSuccess: { backgroundColor: "#e8f5e9", color: colors.success },
  badgeWarning: { backgroundColor: "#fff8e1", color: colors.warning },
  badgeDanger: { backgroundColor: "#ffebee", color: colors.danger },

  // Two column
  columns: { flexDirection: "row", gap: 12, marginVertical: 8 },
  column: { flex: 1 },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: colors.muted, textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 8 },
  pageNumber: { textAlign: "center", marginTop: 4, fontSize: 8, color: colors.muted },

  // Timeline
  timelineItem: { flexDirection: "row", marginBottom: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.primary },
  timelinePhase: { fontSize: 10, fontWeight: "bold", color: colors.primary, width: 120 },
  timelineDesc: { fontSize: 9, color: colors.text, flex: 1 },
})

function ScoreBadge({ score }: { score: number }) {
  const status = score >= 70 ? "SALUDABLE" : score >= 40 ? "ATENCIÓN" : "RIESGO"
  const badgeStyle = score >= 70 ? styles.badgeSuccess : score >= 40 ? styles.badgeWarning : styles.badgeDanger
  return <Text style={[styles.badge, badgeStyle]}>{status}</Text>
}

export interface ReportData {
  client: { name: string; industry?: string; segment?: string; status: string; score: number }
  analysis: {
    healthScore: number; healthStatus: string
    ratios: { liquidity?: { current?: number }; solvency?: { debtToEquity?: number }; profitability?: { netMargin?: number; roe?: number } }
    alerts: string[]; recommendations: string[]
  }
  compliance?: { score: number; status: string; checks: { name: string; passed: boolean }[] }
  strategicPlan?: { objectives: { title: string; category: string; currentValue: number; targetValue: number }[]; timeline: { phase: string; actions: string[] }[] }
  documents?: { title: string; status: string }[]
  generatedAt: string
  generatedBy: string
}

export function ReportDocument({ data }: { data: ReportData }) {
  const d = data
  const statusColor = d.client.score >= 70 ? colors.success : d.client.score >= 40 ? colors.warning : colors.danger

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>Informe de Diagnóstico</Text>
        <Text style={styles.coverSubtitle}>Empresarial Estratégico</Text>
        <View style={{ marginVertical: 30, alignItems: "center" }}>
          <Svg width="80" height="80" viewBox="0 0 120 120">
            <Circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
            <Circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeWidth="8" strokeDasharray={`${(d.client.score / 100) * 339.292} 339.292`} />
          </Svg>
          <Text style={{ color: "white", fontSize: 32, fontWeight: "bold", marginTop: 8 }}>{d.client.score}/100</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Health Score</Text>
        </View>
        <Text style={styles.coverMeta}>Cliente: {d.client.name}</Text>
        <Text style={styles.coverMeta}>Generado: {new Date(d.generatedAt).toLocaleDateString("es-EC")}</Text>
        <Text style={styles.coverMeta}>Consultor: {d.generatedBy}</Text>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
        <Text style={styles.bodyText}>
          El presente informe presenta un análisis integral de la situación financiera y estratégica de {d.client.name},
          evaluando su desempeño en indicadores clave de liquidez, solvencia, rentabilidad y eficiencia operativa.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ficha del Cliente</Text>
          {[
            ["Empresa", d.client.name],
            ["Industria", d.client.industry || "N/A"],
            ["Segmento", d.client.segment || "N/A"],
            ["Estado", d.client.status],
            ["Health Score", `${d.client.score}/100`],
            ["Fecha del Informe", new Date(d.generatedAt).toLocaleDateString("es-EC")],
          ].map(([label, value], i) => (
            <View key={i} style={styles.cardRow}>
              <Text style={styles.cardLabel}>{label}</Text>
              <Text style={styles.cardValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Health Score */}
        <Text style={styles.subsectionTitle}>Health Score</Text>
        <View style={styles.gaugeContainer}>
          <ScoreBadge score={d.client.score} />
          <Text style={styles.gaugeValue}>{d.client.score}</Text>
          <Text style={styles.gaugeLabel}>de 100 puntos</Text>
          <Text style={[styles.bodyText, { textAlign: "center", marginTop: 8 }]}>
            {d.analysis.healthStatus}
          </Text>
        </View>

        {/* KPIs */}
        <Text style={styles.subsectionTitle}>Indicadores Clave (KPIs)</Text>
        <View style={styles.columns}>
          <View style={styles.column}>
            {[
              ["Liquidez Corriente", d.analysis.ratios?.liquidity?.current?.toFixed(2) || "N/A"],
              ["Endeudamiento", d.analysis.ratios?.solvency?.debtToEquity?.toFixed(2) || "N/A"],
            ].map(([label, val], i) => (
              <View key={i} style={[styles.card, { marginBottom: 6 }]}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>{val}</Text>
              </View>
            ))}
          </View>
          <View style={styles.column}>
            {[
              ["Margen Neto", d.analysis.ratios?.profitability?.netMargin != null ? `${(d.analysis.ratios.profitability.netMargin * 100).toFixed(1)}%` : "N/A"],
              ["ROE", d.analysis.ratios?.profitability?.roe != null ? `${(d.analysis.ratios.profitability.roe * 100).toFixed(1)}%` : "N/A"],
            ].map(([label, val], i) => (
              <View key={i} style={[styles.card, { marginBottom: 6 }]}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>{val}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Risks & Findings */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Alertas y Riesgos</Text>
        {d.analysis.alerts.map((a, i) => (
          <View key={i} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
            <Text style={{ fontSize: 9, color: colors.text }}>{a}</Text>
          </View>
        ))}
        {d.analysis.alerts.length === 0 && (
          <Text style={styles.bodyText}>Sin alertas detectadas — la empresa presenta una situación saludable.</Text>
        )}

        <Text style={styles.sectionTitle}>Hallazgos y Recomendaciones</Text>
        {d.analysis.recommendations.map((r, i) => (
          <View key={i} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
            <Text style={{ fontSize: 9, color: colors.text }}>{r}</Text>
          </View>
        ))}

        {d.compliance && (
          <>
            <Text style={styles.sectionTitle}>Cumplimiento</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Score de Cumplimiento</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: d.compliance.score >= 70 ? colors.success : colors.warning }}>{d.compliance.score}%</Text>
              </View>
            </View>
            {d.compliance.checks.filter((c) => !c.passed).length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Brechas Detectadas</Text>
                {d.compliance.checks.filter((c) => !c.passed).map((c, i) => (
                  <View key={i} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
                    <Text style={{ fontSize: 9 }}>{c.name}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </Page>

      {/* Strategic Plan */}
      {d.strategicPlan && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Plan Estratégico</Text>
          <Text style={styles.bodyText}>
            A continuación se presentan los objetivos estratégicos definidos y el cronograma de implementación.
          </Text>

          <Text style={styles.subsectionTitle}>Objetivos</Text>
          {d.strategicPlan.objectives.map((obj, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{obj.title}</Text>
                <Text style={{ fontSize: 8, color: colors.muted, textTransform: "capitalize" }}>{obj.category}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Progreso</Text>
                <Text style={styles.cardValue}>{obj.currentValue} / {obj.targetValue}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.subsectionTitle}>Cronograma</Text>
          {d.strategicPlan.timeline.map((phase, i) => (
            <View key={i} style={styles.timelineItem}>
              <Text style={styles.timelinePhase}>{phase.phase}</Text>
              <View style={{ flex: 1 }}>
                {phase.actions.map((action, j) => (
                  <Text key={j} style={styles.timelineDesc}>• {action}</Text>
                ))}
              </View>
            </View>
          ))}
        </Page>
      )}

      {/* Documents */}
      {d.documents && d.documents.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Documentos Revisados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Documento</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Estado</Text>
            </View>
            {d.documents.map((doc, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{doc.title}</Text>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{doc.status}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* Footer on all pages */}
      <Text style={styles.footer} fixed>
        Infinity Command Center — Informe generado por AI Copilot — {new Date(d.generatedAt).toLocaleDateString("es-EC")}
      </Text>
    </Document>
  )
}
