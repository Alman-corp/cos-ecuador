import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { AuditReportData } from "./types"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20, textAlign: "center" },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#1e40af", marginBottom: 6 },
  finding: { padding: 8, marginBottom: 6, borderRadius: 4, borderLeftWidth: 4 },
  critical: { borderLeftColor: "#ef4444", backgroundColor: "#fef2f2" },
  high: { borderLeftColor: "#f97316", backgroundColor: "#fff7ed" },
  medium: { borderLeftColor: "#eab308", backgroundColor: "#fefce8" },
  low: { borderLeftColor: "#10b981", backgroundColor: "#f0fdf4" },
  dimensionCard: { width: "25%", textAlign: "center", padding: 6 },
  dimensionScore: { fontSize: 20, fontWeight: 700 },
  dimensionLabel: { fontSize: 9, color: "#64748b", marginTop: 2 },
})

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#3b82f6"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

export function AuditReportDocument({ data }: { data: AuditReportData }) {
  const allFindings = data.dimensions.flatMap((d) => d.findings)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Auditoria de Gobierno Corporativo</Text>
        <Text style={{ textAlign: "center", fontSize: 14, color: "#475569" }}>{data.companyName}</Text>
        <Text style={{ textAlign: "center", fontSize: 11, marginTop: 20 }}>Framework: {data.framework}</Text>
        <Text style={{ textAlign: "center", fontSize: 11 }}>Fecha: {data.auditDate}</Text>
        <View style={{ marginTop: 60, alignItems: "center" }}>
          <Text style={{ fontSize: 60, fontWeight: 700, color: scoreColor(data.overallScore) }}>{data.overallScore}</Text>
          <Text style={{ fontSize: 16, color: "#475569", marginTop: 8 }}>Score Global / 100</Text>
          <Text style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Nivel de Madurez: {data.maturityLevel}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Analisis por Dimension</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
          {data.dimensions.map((d) => (
            <View key={d.name} style={styles.dimensionCard}>
              <Text style={[styles.dimensionScore, { color: scoreColor(d.score) }]}>{d.score}</Text>
              <Text style={styles.dimensionLabel}>{d.name}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 30, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Resumen de Hallazgos</Text>
          <Text style={{ fontSize: 10, marginBottom: 8 }}>Se identificaron {allFindings.length} hallazgos:</Text>
          <Text>&bull; Criticos: {allFindings.filter((f) => f.severity === "critical").length}</Text>
          <Text>&bull; Altos: {allFindings.filter((f) => f.severity === "high").length}</Text>
          <Text>&bull; Medios: {allFindings.filter((f) => f.severity === "medium").length}</Text>
          <Text>&bull; Bajos: {allFindings.filter((f) => f.severity === "low").length}</Text>
        </View>
      </Page>

      {data.dimensions.map((dim) =>
        dim.findings.length > 0 ? (
          <Page key={dim.name} size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>{dim.name} &mdash; Score: {dim.score}/100</Text>
            {dim.findings.map((f, i) => (
              <View key={i} style={[styles.finding, styles[f.severity]]}>
                <Text style={{ fontWeight: 700, marginBottom: 4 }}>[{f.severity.toUpperCase()}] {f.title}</Text>
                <Text style={{ fontSize: 9, marginBottom: 4 }}>{f.description}</Text>
                <Text style={{ fontSize: 9, fontStyle: "italic", color: "#475569" }}>Recomendacion: {f.recommendation}</Text>
              </View>
            ))}
          </Page>
        ) : null,
      )}
    </Document>
  )
}
