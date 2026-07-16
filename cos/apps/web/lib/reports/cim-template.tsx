import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CIMData } from "./types"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b" },
  coverPage: { padding: 60, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 32, fontWeight: 700, color: "#0f172a", textAlign: "center" },
  subtitle: { fontSize: 18, color: "#475569", textAlign: "center", marginTop: 12 },
  section: { marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#1e40af", borderBottomWidth: 2, borderBottomColor: "#1e40af", paddingBottom: 4, marginBottom: 12 },
  subsection: { fontSize: 14, fontWeight: 600, marginTop: 12, marginBottom: 6 },
  paragraph: { fontSize: 10, lineHeight: 1.6, marginBottom: 8, textAlign: "justify" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  tableHeader: { fontWeight: 700, backgroundColor: "#f1f5f9" },
  tableCell: { flex: 1, fontSize: 9, paddingHorizontal: 4 },
  confidential: { position: "absolute", top: 20, right: 40, fontSize: 8, color: "#ef4444", fontWeight: 700 },
  disclaimer: { fontSize: 8, color: "#64748b", marginTop: 40, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function CIMDocument({ data }: { data: CIMData }) {
  return (
    <Document title={`CIM - ${data.company.name}`} author={data.consultingFirm.name}>
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Text style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>{data.consultingFirm.name}</Text>
        <Text style={{ ...styles.title, marginTop: 80 }}>Confidential Information Memorandum</Text>
        <Text style={styles.subtitle}>{data.company.name}</Text>
        <Text style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 40 }}>{data.company.industry} &bull; {data.company.country}</Text>
        <Text style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 120 }}>Preparado: {data.preparedAt} &bull; Ref: {data.reference}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Section title="Resumen Ejecutivo">
          <Text style={styles.paragraph}>
            {data.company.name} es una empresa líder en {data.company.industry}, fundada en {data.company.foundedYear}, con {data.company.employees} empleados y operaciones en {data.company.country}. {data.company.description}
          </Text>
        </Section>
        <Text style={styles.subsection}>Investment Thesis</Text>
        <Text style={styles.paragraph}>{data.investment.thesis}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Section title="Historical Financial Performance">
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 4, backgroundColor: "#f1f5f8" }}>
            <Text style={[styles.tableCell, { fontWeight: 700 }]}>Metrica</Text>
            {data.financials.years.map((y) => <Text key={y.year} style={[styles.tableCell, { textAlign: "right" }]}>{y.year}</Text>)}
          </View>
          {["Revenue", "EBITDA", "Net Income", "Total Assets", "Total Equity"].map((label) => (
            <View key={label} style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>{label}</Text>
              {data.financials.years.map((y) => {
                const v = label === "Revenue" ? y.revenue : label === "EBITDA" ? y.ebitda : label === "Net Income" ? y.netIncome : label === "Total Assets" ? y.totalAssets : y.totalEquity
                return <Text key={y.year} style={[styles.tableCell, { textAlign: "right" }]}>{formatCurrency(v)}</Text>
              })}
            </View>
          ))}
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Section title="Valuation Analysis">
          <Text style={styles.paragraph}>Enterprise Value: {formatCurrency(data.valuation.enterpriseValue)}</Text>
          <Text style={styles.paragraph}>Equity Value: {formatCurrency(data.valuation.equityValue)}</Text>
          <Text style={styles.paragraph}>EV/EBITDA: {data.valuation.multiples.evEbitda}x</Text>
          <Text style={styles.paragraph}>P/E Ratio: {data.valuation.multiples.peRatio}x</Text>
          <Text style={styles.paragraph}>WACC: {data.valuation.dcf.wacc}% / Terminal Growth: {data.valuation.dcf.terminalGrowth}%</Text>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Section title="Risk Factors">
          {data.investment.risks.map((risk, i) => (
            <View key={i} style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 700 }}>{risk.title} [{risk.severity.toUpperCase()}]</Text>
              <Text style={styles.paragraph}>{risk.description}</Text>
            </View>
          ))}
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
        <Section title="Growth Opportunities">
          {data.investment.opportunities.map((opp, i) => (
            <View key={i} style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 700, color: "#059669" }}>{opp.title} &mdash; {formatCurrency(opp.value)}</Text>
              <Text style={styles.paragraph}>{opp.description}</Text>
            </View>
          ))}
        </Section>
        <View style={styles.disclaimer}>
          <Text>DISCLAIMERS: Este CIM ha sido preparado exclusivamente para uso de potenciales inversores calificados. La informacion contenida se basa en datos proporcionados por la empresa y fuentes consideradas confiables, pero no se garantiza su exactitud ni completitud. Este documento NO constituye una oferta de venta ni solicitud de oferta de compra de valores. &copy; {new Date().getFullYear()} {data.consultingFirm.name}.</Text>
        </View>
      </Page>
    </Document>
  )
}
